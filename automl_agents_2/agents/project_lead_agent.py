"""
agents/project_lead_agent.py
The Software Architect / Supervisor agent that orchestrates the worker loop
(ML Engineer → QA Engineer → Technical Writer → FINISH).
Maps to the "Project Lead" node + worker loop in the Flowise workflow.
"""

from __future__ import annotations

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from prompts.agent_prompts import PROJECT_LEAD_SYSTEM
from utils.flow_router import parse_project_lead_output

MAX_LOOPS = 5


def run_project_lead(
    structured_instructions: str,
    dataset_summary_text: str,
    code_build_output: str,
    columns_info: str,
    target_column: str | None,
    task_type: str,
    priority: str = "",
    extended_docs: bool = False,
) -> tuple[str, str, str]:
    """
    Run the Project Lead worker-delegation loop.
    Returns a tuple of (ml_output, qa_output, docs_output).
    """
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.6)

    history: list = [
        SystemMessage(content=PROJECT_LEAD_SYSTEM),
        HumanMessage(content=(
            f"Columns: {columns_info}\n"
            f"Target Column: {target_column if target_column else 'N/A'}\n"
            f"Problem Type: {task_type}\n"
            f"User Optimisation Priority: {priority}\n\n"
            f"Structured Instructions:\n{structured_instructions}\n\n"
            f"Code & Build Context:\n{code_build_output}"
        )),
    ]

    ml_output = ""
    qa_output = ""
    docs_output = ""

    for loop_count in range(MAX_LOOPS):
        lead_response = llm.invoke(history)
        history.append(AIMessage(content=lead_response.content))

        next_worker, instructions = parse_project_lead_output(lead_response.content)

        print(f"\n[Project Lead → {next_worker}]")

        if next_worker == "FINISH":
            break

        if next_worker == "WORKER1_ML":
            worker_result = _call_ml_engineer(instructions, code_build_output, priority)
            ml_output = worker_result
        elif next_worker == "WORKER2_QA":
            worker_result = _call_qa_engineer(instructions, ml_output, priority)
            qa_output = worker_result
        elif next_worker == "WORKER3_DOCS":
            worker_result = _call_technical_writer(
                instructions, ml_output, qa_output, extended_docs, priority
            )
            docs_output = worker_result
        else:
            break

        history.append(
            HumanMessage(content=f"Worker {next_worker} completed:\n\n{worker_result}")
        )

    return ml_output, qa_output, docs_output


def _call_ml_engineer(instructions: str, context: str, priority: str) -> str:
    from agents.ml_engineer_agent import run_ml_engineer
    return run_ml_engineer(instructions, context, priority)


def _call_qa_engineer(instructions: str, ml_output: str, priority: str) -> str:
    from agents.qa_engineer_agent import run_qa_engineer
    return run_qa_engineer(instructions, ml_output, priority)


def _call_technical_writer(
    instructions: str, ml_output: str, qa_output: str,
    extended_docs: bool, priority: str
) -> str:
    from agents.technical_writer_agent import run_technical_writer
    return run_technical_writer(instructions, ml_output, qa_output, extended_docs, priority)
