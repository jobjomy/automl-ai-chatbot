"""
agents/code_build_agent.py
Generates the final deployable code and build summary from the verified
implementation.
Maps to the "Code & Build Agent" node in the Flowise workflow.
"""

from __future__ import annotations

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from prompts.agent_prompts import CODE_BUILD_AGENT_SYSTEM


def run_code_build(
    implementation_verification: str,
    training_report: str,
    task_type: str,
    priority: str,
) -> str:
    """
    Generate the final deployable code package.

    Returns
    -------
    str
        Final build summary + complete reproducible Python code.
    """
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.6)

    user_content = f"""
Task Type : {task_type}
Priority  : {priority}

Implementation Verification:
{implementation_verification}

Training Report (for code reference):
{training_report}

Generate the final deployable code and build summary.
Include the COMPLETE Python code block at the end.
"""

    response = llm.invoke([
        SystemMessage(content=CODE_BUILD_AGENT_SYSTEM),
        HumanMessage(content=user_content),
    ])
    return response.content
