"""
agents/data_preprocessing_agent.py
Describes and performs (via LLM guidance + real pandas code) the data
preparation phase as specified in the pipeline design.
Maps to the "Data-Prep Agent" node in the Flowise workflow.
"""

from __future__ import annotations

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from prompts.agent_prompts import DATA_PREP_SYSTEM


def run_data_preprocessing(
    pipeline_design: str,
    dataset_summary_text: str,
    task_type: str,
    target_column: str | None,
) -> str:
    """
    Generate a data preparation plan and the corresponding Python code.

    Returns
    -------
    str
        Data preparation summary + Python preprocessing code.
    """
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.5)

    user_content = f"""
Task Type     : {task_type}
Target Column : {target_column if target_column else 'N/A'}

Pipeline Design:
{pipeline_design}

Dataset Summary:
{dataset_summary_text}

Implement the data preparation phase.
Include a Python code block (```python) with the full preprocessing logic.
"""

    response = llm.invoke([
        SystemMessage(content=DATA_PREP_SYSTEM),
        HumanMessage(content=user_content),
    ])
    return response.content
