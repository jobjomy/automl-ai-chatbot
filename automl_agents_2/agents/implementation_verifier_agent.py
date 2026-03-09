"""
agents/implementation_verifier_agent.py
Ensures the generated code is syntactically correct, logically consistent,
and ready for deployment.
Maps to the "Implementation Verifier" node in the Flowise workflow.
"""

from __future__ import annotations

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from prompts.agent_prompts import IMPLEMENTATION_VERIFIER_SYSTEM


def run_implementation_verifier(
    training_report: str,
    execution_verification: str,
) -> str:
    """
    Verify code quality and deployment readiness.

    Returns
    -------
    str
        Implementation verification report.
    """
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.6)

    user_content = f"""
Execution Verification Report:
{execution_verification}

Full Training Report (includes generated code):
{training_report}

Verify the implementation for correctness, consistency, and deployment readiness.
"""

    response = llm.invoke([
        SystemMessage(content=IMPLEMENTATION_VERIFIER_SYSTEM),
        HumanMessage(content=user_content),
    ])
    return response.content
