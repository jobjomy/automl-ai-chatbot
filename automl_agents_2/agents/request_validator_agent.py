"""
agents/request_validator_agent.py
Validates the uploaded CSV file and user-supplied parameters before the
pipeline is started.
"""

from __future__ import annotations

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from prompts.agent_prompts import REQUEST_VALIDATOR_SYSTEM


def run_request_validator(
    dataset_summary_text: str,
    task_type: str,
    target_column: str | None,
    priority: str,
) -> str:
    """
    Validate the incoming request.

    Parameters
    ----------
    dataset_summary_text : str
        Human-readable dataset statistics.
    task_type : str
        'classification', 'regression', or 'clustering'.
    target_column : str | None
        Name of the label column.  None when clustering.
    priority : str
        'accuracy', 'speed', or 'training_time'.

    Returns
    -------
    str
        Validation result message.
    """
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.5)

    user_content = f"""
Dataset Statistics:
{dataset_summary_text}

Task Type: {task_type}
Target Column: {target_column if target_column else 'N/A (clustering)'}
Optimization Priority: {priority}

Please validate this request.
"""

    response = llm.invoke([
        SystemMessage(content=REQUEST_VALIDATOR_SYSTEM),
        HumanMessage(content=user_content),
    ])
    return response.content
