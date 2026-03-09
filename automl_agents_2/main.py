"""
main.py
AutoML Multi-Agent Pipeline – Main Controller
=============================================
Orchestrates the full Flowise-equivalent pipeline:

  Stage 1 (Sequential Chain):
    Upload CSV → Request Validator → Instruction Parser →
    AutoML Reasoner → Pipeline Designer → Data-Prep Agent →
    AutoML Training Agent → Execution Verifier →
    Implementation Verifier → Code & Build Agent

  Stage 2 (Worker Loop via Project Lead):
    Project Lead ↔ [ML Engineer | QA Engineer | Technical Writer]
    ↓ (max 5 loops)
    Final Answer

Usage (pick ONE method to supply your API key):

  Method 1 – .env file (recommended, set once and forget):
    1. Copy .env.example to .env
    2. Fill in your key:  OPENAI_API_KEY="sk-..."
    3. Run:  python main.py

  Method 2 – export in terminal (current session only):
    export OPENAI_API_KEY="sk-..."
    python main.py
"""

from __future__ import annotations

import os
import sys
import time
from pathlib import Path

# ── Make sure the project root is on the Python path ──────────────
PROJECT_ROOT = Path(__file__).parent
sys.path.insert(0, str(PROJECT_ROOT))

# ── Load .env file if present (python-dotenv) ─────────────────────
# Put  OPENAI_API_KEY="sk-..."  in a .env file once; never export again.
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=PROJECT_ROOT / ".env", override=False)
    print("  ℹ  Loaded environment from .env file.")
except ImportError:
    pass  # dotenv not installed – fall back to env vars already set

import pandas as pd

# ── Project modules ────────────────────────────────────────────────
from input_handler import collect_user_inputs
from validator import validate_inputs
from utils.dataset_analyzer import analyze_dataset, format_summary_for_prompt

# Stage-1 agents
from agents.request_validator_agent import run_request_validator
from agents.instruction_parser_agent import run_instruction_parser
from agents.dataset_analyzer_agent import run_dataset_analyzer
from agents.automl_reasoner_agent import run_automl_reasoner
from agents.model_selector_agent import run_model_selector
from agents.pipeline_designer_agent import run_pipeline_designer
from agents.data_preprocessing_agent import run_data_preprocessing
from agents.automl_training_agent import run_automl_training
from agents.execution_verifier_agent import run_execution_verifier
from agents.implementation_verifier_agent import run_implementation_verifier
from agents.code_build_agent import run_code_build

# Stage-2 agents
from agents.project_lead_agent import run_project_lead
from agents.final_answer_agent import run_final_answer


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _banner(title: str) -> None:
    print(f"\n{'─' * 60}")
    print(f"  {title}")
    print(f"{'─' * 60}")


def _step(name: str, fn, *args, **kwargs):
    """Run a pipeline step with timing and status output."""
    print(f"\n  ▶  {name} ...", end="", flush=True)
    t0 = time.time()
    result = fn(*args, **kwargs)
    elapsed = time.time() - t0
    print(f"  ✓  ({elapsed:.1f}s)")
    return result


def save_output(content: str, path: str = "automl_report.md") -> None:
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(content)
    print(f"\n  📄  Report saved to: {os.path.abspath(path)}")


# ─────────────────────────────────────────────────────────────────────────────
# Main pipeline
# ─────────────────────────────────────────────────────────────────────────────

def run_pipeline() -> None:

    # ── Check API key ──────────────────────────────────────────────
    if not os.environ.get("OPENAI_API_KEY"):
        print("\nERROR: OPENAI_API_KEY is not set.")
        print("  Option 1 (recommended): add it to your .env file:")
        print("    OPENAI_API_KEY=\"sk-...\"")
        print("  Option 2: export in terminal:")
        print("    export OPENAI_API_KEY=\"sk-...\"")
        sys.exit(1)

    # ── Collect user inputs ────────────────────────────────────────
    inputs = collect_user_inputs()

    # ── Pre-flight validation ──────────────────────────────────────
    _banner("Validating Inputs")
    try:
        df = validate_inputs(
            csv_path=inputs.csv_path,
            task_type=inputs.task_type,
            target_column=inputs.target_column,
            priority=inputs.priority,
        )
    except ValueError as exc:
        print(f"\n  ✗  Validation failed: {exc}")
        sys.exit(1)
    print(f"  ✓  Dataset loaded: {df.shape[0]:,} rows × {df.shape[1]} columns")

    # ── Analyse dataset ────────────────────────────────────────────
    summary_dict = analyze_dataset(df, inputs.target_column)
    dataset_text = format_summary_for_prompt(summary_dict)
    columns_info = ", ".join(df.columns.tolist())

    # ══════════════════════════════════════════════════════════════
    #  STAGE 1  –  Sequential Chain
    # ══════════════════════════════════════════════════════════════
    _banner("Stage 1 – Sequential Chain")

    validation_result = _step(
        "Request Validator",
        run_request_validator,
        dataset_text, inputs.task_type,
        inputs.target_column, inputs.priority,
    )

    structured_instructions = _step(
        "Instruction Parser",
        run_instruction_parser,
        dataset_text, inputs.task_type,
        inputs.target_column, inputs.priority,
        inputs.extended_docs, validation_result,
    )

    dataset_analysis = _step(
        "Dataset Analyzer",
        run_dataset_analyzer,
        dataset_text, inputs.task_type,
    )

    automl_plan = _step(
        "AutoML Reasoner",
        run_automl_reasoner,
        dataset_text, inputs.task_type,
        inputs.target_column, inputs.priority,
        dataset_analysis,
    )

    model_selection = _step(
        "Model Selector",
        run_model_selector,
        inputs.task_type,
        summary_dict["n_rows"],
        summary_dict["n_cols"],
        len(summary_dict["numeric_columns"]),
        len(summary_dict["categorical_columns"]),
        inputs.priority,
        automl_plan,
    )

    pipeline_design = _step(
        "Pipeline Designer",
        run_pipeline_designer,
        automl_plan, model_selection,
        dataset_text, inputs.task_type,
        inputs.target_column,
    )

    data_prep_summary = _step(
        "Data Preprocessing Agent",
        run_data_preprocessing,
        pipeline_design, dataset_text,
        inputs.task_type, inputs.target_column,
    )

    training_report = _step(
        "AutoML Training Agent",
        run_automl_training,
        pipeline_design, data_prep_summary,
        model_selection, inputs.task_type,
        inputs.target_column, inputs.priority,
        dataset_text,
    )

    execution_verification = _step(
        "Execution Verifier",
        run_execution_verifier,
        training_report, pipeline_design,
        inputs.priority,
    )

    implementation_verification = _step(
        "Implementation Verifier",
        run_implementation_verifier,
        training_report, execution_verification,
    )

    code_build_output = _step(
        "Code & Build Agent",
        run_code_build,
        implementation_verification, training_report,
        inputs.task_type, inputs.priority,
    )

    # ══════════════════════════════════════════════════════════════
    #  STAGE 2  –  Project Lead Worker Loop
    # ══════════════════════════════════════════════════════════════
    _banner("Stage 2 – Project Lead Worker Loop")

    ml_output, qa_output, docs_output = run_project_lead(
        structured_instructions=structured_instructions,
        dataset_summary_text=dataset_text,
        code_build_output=code_build_output,
        columns_info=columns_info,
        target_column=inputs.target_column,
        task_type=inputs.task_type,
        priority=inputs.priority,
        extended_docs=inputs.extended_docs,
    )

    # Re-run Technical Writer with extended_docs flag if requested
    if inputs.extended_docs and docs_output:
        from agents.technical_writer_agent import run_technical_writer
        print("\n  ▶  Technical Writer (extended docs) ...", end="", flush=True)
        t0 = time.time()
        docs_output = run_technical_writer(
            instructions=structured_instructions,
            ml_output=ml_output,
            qa_output=qa_output,
            extended_docs=True,
            priority=inputs.priority,
        )
        print(f"  ✓  ({time.time() - t0:.1f}s)")

    # ══════════════════════════════════════════════════════════════
    #  Final Answer  –  Combine all outputs
    # ══════════════════════════════════════════════════════════════
    _banner("Generating Final Answer")
    final_output = _step(
        "Final Answer Agent",
        run_final_answer,
        ml_output, qa_output,
        docs_output, code_build_output,
        inputs.priority,
    )

    print("\n\n" + "=" * 60)
    print("  ===== FINAL DOCUMENTATION =====")
    print("=" * 60)
    print(final_output)

    save_output(final_output, "automl_report.md")
    print("\n✅  Pipeline complete.")


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    run_pipeline()
