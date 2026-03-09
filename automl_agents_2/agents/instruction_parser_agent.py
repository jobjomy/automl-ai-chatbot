"""
agents/instruction_parser_agent.py
Converts raw user inputs into a structured instruction set consumed by
downstream agents.
"""

from __future__ import annotations

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from prompts.agent_prompts import INSTRUCTION_PARSER_SYSTEM


def run_instruction_parser(
    dataset_summary_text: str,
    task_type: str,
    target_column: str | None,
    priority: str,
    extended_docs: bool,
    validation_result: str,
) -> str:
    """
    Parse and structure the user's instructions.

    Returns
    -------
    str
        Structured instruction block for downstream agents.
    """
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.5)

    user_content = f"""
Validation Result:
{validation_result}

--- User Inputs ---
Task Type     : {task_type}
Target Column : {target_column if target_column else 'N/A (clustering)'}
Priority      : {priority}
Extended Docs : {'yes' if extended_docs else 'no'}

Dataset Summary:
{dataset_summary_text}

Please parse and structure these instructions for the Project Lead.
"""

    response = llm.invoke([
        SystemMessage(content=INSTRUCTION_PARSER_SYSTEM),
        HumanMessage(content=user_content),
    ])
    return response.content
