"""
agents/execution_verifier_agent.py
Verifies that the AutoML training execution meets technical and
resource constraints.
Maps to the "Execution Verifier" node in the Flowise workflow.
"""

from __future__ import annotations

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from prompts.agent_prompts import EXECUTION_VERIFIER_SYSTEM


def run_execution_verifier(
    training_report: str,
    pipeline_design: str,
    priority: str,
) -> str:
    """
    Verify that the training execution meets all requirements.

    Returns
    -------
    str
        Execution verification report with PASS / FAIL decision.
    """
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.6)

    user_content = f"""
User Priority: {priority}

Pipeline Design (expected):
{pipeline_design}

Training Report (actual):
{training_report}

Verify that the execution meets all technical and resource constraints.
"""

    response = llm.invoke([
        SystemMessage(content=EXECUTION_VERIFIER_SYSTEM),
        HumanMessage(content=user_content),
    ])
    return response.content
