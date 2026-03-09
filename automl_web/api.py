"""
api.py
FastAPI backend that bridges the React frontend to the LangChain AutoML pipeline.

Start with:
  python -m uvicorn api:app --reload --port 8000
"""

from __future__ import annotations

import os
import sys
import json
import uuid
import asyncio
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import pandas as pd

# ── Locate automl_agents_2 folder ─────────────────────────────────
# api.py lives in:  FINAL/automl_web/api.py
# agents live in:   FINAL/automl_agents_2/
AGENTS_ROOT = Path(__file__).parent.parent / "automl_agents_2"

# Fallback: also try "automl_agents" in case folder name differs
if not AGENTS_ROOT.exists():
    AGENTS_ROOT = Path(__file__).parent.parent / "automl_agents"

sys.path.insert(0, str(AGENTS_ROOT))

# ── Load .env from automl_agents_2 ────────────────────────────────
# Try multiple locations so the key is always found
_env_locations = [
    AGENTS_ROOT / ".env",                    # FINAL/automl_agents_2/.env
    Path(__file__).parent / ".env",          # FINAL/automl_web/.env
    Path(__file__).parent.parent / ".env",   # FINAL/.env
]

try:
    from dotenv import load_dotenv
    for _env_path in _env_locations:
        if _env_path.exists():
            load_dotenv(dotenv_path=_env_path, override=True)
            print(f"  ✓  Loaded .env from: {_env_path}")
            break
    else:
        print("  ⚠  No .env file found. Set OPENAI_API_KEY manually.")
except ImportError:
    print("  ⚠  python-dotenv not installed. Install with: pip install python-dotenv")

# ── Debug: confirm key loaded ──────────────────────────────────────
_key = os.environ.get("OPENAI_API_KEY", "")
if _key and _key != "sk-...":
    print(f"  ✓  OPENAI_API_KEY loaded ({_key[:8]}...)")
else:
    print("  ⚠  OPENAI_API_KEY not set or still placeholder!")
    print(f"      Searched in: {[str(p) for p in _env_locations]}")

app = FastAPI(title="AutoML Agent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

jobs: dict[str, dict] = {}


@app.get("/health")
def health():
    key = os.environ.get("OPENAI_API_KEY", "")
    key_ok = bool(key) and key != "sk-..." and len(key) > 10
    return {
        "status": "ok",
        "openai_key": key_ok,
        "agents_root": str(AGENTS_ROOT),
        "agents_root_exists": AGENTS_ROOT.exists(),
    }


@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(400, "Only CSV files are supported.")

    contents = await file.read()
    tmp_path = f"/tmp/{uuid.uuid4()}_{file.filename}"

    # Windows-safe temp path
    import tempfile
    tmp_dir = tempfile.gettempdir()
    tmp_path = str(Path(tmp_dir) / f"{uuid.uuid4()}_{file.filename}")

    with open(tmp_path, "wb") as f:
        f.write(contents)

    try:
        df = pd.read_csv(tmp_path)
    except Exception as e:
        raise HTTPException(400, f"Could not read CSV: {e}")

    preview = df.head(5).fillna("").to_dict(orient="records")
    columns = df.columns.tolist()
    dtypes = {col: str(dtype) for col, dtype in df.dtypes.items()}

    return {
        "file_path": tmp_path,
        "filename": file.filename,
        "rows": len(df),
        "cols": len(columns),
        "columns": columns,
        "dtypes": dtypes,
        "preview": preview,
    }


@app.post("/run")
async def run_pipeline(
    file_path: str = Form(...),
    task_type: str = Form(...),
    target_column: Optional[str] = Form(None),
    priority: str = Form(...),
    extended_docs: bool = Form(False),
):
    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "queued", "logs": [], "report": None}

    asyncio.create_task(_run_pipeline_task(
        job_id, file_path, task_type, target_column, priority, extended_docs
    ))

    return {"job_id": job_id}


@app.get("/status/{job_id}")
def get_status(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found.")
    return job


@app.get("/stream/{job_id}")
async def stream_logs(job_id: str):
    async def event_generator():
        last_idx = 0
        while True:
            job = jobs.get(job_id, {})
            logs = job.get("logs", [])
            for log in logs[last_idx:]:
                yield f"data: {json.dumps(log)}\n\n"
            last_idx = len(logs)
            if job.get("status") in ("done", "error"):
                yield f"data: {json.dumps({'type': 'done', 'status': job['status']})}\n\n"
                break
            await asyncio.sleep(0.5)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


async def _run_pipeline_task(
    job_id: str,
    file_path: str,
    task_type: str,
    target_column: Optional[str],
    priority: str,
    extended_docs: bool,
):
    def log(agent: str, message: str, status: str = "running"):
        jobs[job_id]["logs"].append({
            "agent": agent, "message": message, "status": status
        })

    try:
        jobs[job_id]["status"] = "running"

        from utils.dataset_analyzer import analyze_dataset, format_summary_for_prompt
        from validator import validate_inputs

        log("System", "Loading and validating dataset...")
        df = validate_inputs(file_path, task_type, target_column, priority)
        summary_dict = analyze_dataset(df, target_column)
        dataset_text = format_summary_for_prompt(summary_dict)
        columns_info = ", ".join(df.columns.tolist())
        log("System", f"Dataset loaded: {summary_dict['n_rows']:,} rows × {summary_dict['n_cols']} columns", "done")

        from agents.request_validator_agent import run_request_validator
        log("Request Validator", "Validating request...")
        validation_result = await asyncio.to_thread(
            run_request_validator, dataset_text, task_type, target_column, priority
        )
        log("Request Validator", "Validation complete", "done")

        from agents.instruction_parser_agent import run_instruction_parser
        log("Instruction Parser", "Parsing instructions...")
        structured_instructions = await asyncio.to_thread(
            run_instruction_parser, dataset_text, task_type, target_column,
            priority, extended_docs, validation_result
        )
        log("Instruction Parser", "Instructions structured", "done")

        from agents.dataset_analyzer_agent import run_dataset_analyzer
        log("Dataset Analyzer", "Analysing dataset...")
        dataset_analysis = await asyncio.to_thread(
            run_dataset_analyzer, dataset_text, task_type
        )
        log("Dataset Analyzer", "Analysis complete", "done")

        from agents.automl_reasoner_agent import run_automl_reasoner
        log("AutoML Reasoner", "Planning candidate models...")
        automl_plan = await asyncio.to_thread(
            run_automl_reasoner, dataset_text, task_type,
            target_column, priority, dataset_analysis
        )
        log("AutoML Reasoner", "Plans generated", "done")

        from agents.model_selector_agent import run_model_selector
        log("Model Selector", "Selecting best algorithm...")
        model_selection = await asyncio.to_thread(
            run_model_selector, task_type, summary_dict["n_rows"],
            summary_dict["n_cols"], len(summary_dict["numeric_columns"]),
            len(summary_dict["categorical_columns"]), priority, automl_plan
        )
        log("Model Selector", "Model selected", "done")

        from agents.pipeline_designer_agent import run_pipeline_designer
        log("Pipeline Designer", "Designing pipeline...")
        pipeline_design = await asyncio.to_thread(
            run_pipeline_designer, automl_plan, model_selection,
            dataset_text, task_type, target_column
        )
        log("Pipeline Designer", "Pipeline designed", "done")

        from agents.data_preprocessing_agent import run_data_preprocessing
        log("Data Preprocessing", "Planning preprocessing steps...")
        data_prep = await asyncio.to_thread(
            run_data_preprocessing, pipeline_design,
            dataset_text, task_type, target_column
        )
        log("Data Preprocessing", "Preprocessing plan ready", "done")

        from agents.automl_training_agent import run_automl_training
        log("AutoML Training", "Training model...")
        training_report = await asyncio.to_thread(
            run_automl_training, pipeline_design, data_prep, model_selection,
            task_type, target_column, priority, dataset_text
        )
        log("AutoML Training", "Model trained", "done")

        from agents.execution_verifier_agent import run_execution_verifier
        log("Execution Verifier", "Verifying execution...")
        exec_verification = await asyncio.to_thread(
            run_execution_verifier, training_report, pipeline_design, priority
        )
        log("Execution Verifier", "Execution verified", "done")

        from agents.implementation_verifier_agent import run_implementation_verifier
        log("Implementation Verifier", "Verifying implementation...")
        impl_verification = await asyncio.to_thread(
            run_implementation_verifier, training_report, exec_verification
        )
        log("Implementation Verifier", "Implementation verified", "done")

        from agents.code_build_agent import run_code_build
        log("Code Builder", "Building final code package...")
        code_build = await asyncio.to_thread(
            run_code_build, impl_verification, training_report, task_type, priority
        )
        log("Code Builder", "Code package ready", "done")

        from agents.project_lead_agent import run_project_lead
        log("Project Lead", "Orchestrating worker agents...")
        ml_output, qa_output, docs_output = await asyncio.to_thread(
            run_project_lead, structured_instructions, dataset_text,
            code_build, columns_info, target_column, task_type, priority, extended_docs
        )
        log("ML Engineer", "ML pipeline built", "done")
        log("QA Engineer", "Model evaluated", "done")
        log("Technical Writer", "Documentation generated", "done")

        if extended_docs:
            from agents.technical_writer_agent import run_technical_writer
            log("Technical Writer", "Generating extended documentation...")
            docs_output = await asyncio.to_thread(
                run_technical_writer, structured_instructions, ml_output,
                qa_output, True, priority
            )
            log("Technical Writer", "Extended docs complete", "done")

        from agents.final_answer_agent import run_final_answer
        log("Final Answer", "Compiling final report...")
        final_report = await asyncio.to_thread(
            run_final_answer, ml_output, qa_output, docs_output, code_build, priority
        )
        log("Final Answer", "Report ready!", "done")

        jobs[job_id]["status"] = "done"
        jobs[job_id]["report"] = final_report

    except Exception as e:
        import traceback
        err = traceback.format_exc()
        jobs[job_id]["status"] = "error"
        jobs[job_id]["error"] = str(e)
        jobs[job_id]["logs"].append({
            "agent": "System", "message": f"Error: {e}", "status": "error"
        })
        print(f"Pipeline error:\n{err}")
