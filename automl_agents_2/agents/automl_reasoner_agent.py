"""
agents/automl_reasoner_agent.py
Generates candidate AutoML plans and recommends the best one.
Maps to the "Reasoned AutoML Planner" node in the Flowise workflow.
"""

from __future__ import annotations

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from prompts.agent_prompts import AUTOML_REASONER_SYSTEM


def run_automl_reasoner(
    dataset_summary_text: str,
    task_type: str,
    target_column: str | None,
    priority: str,
    dataset_analysis: str,
) -> str:
    """
    Propose candidate ML plans and select the best one.

    Returns
    -------
    str
        Reasoned AutoML plan with recommended approach.
    """
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.5)

    user_content = f"""
Task Type     : {task_type}
Target Column : {target_column if target_column else 'N/A (clustering)'}
Priority      : {priority}

Dataset Statistics:
{dataset_summary_text}

Dataset Analysis:
{dataset_analysis}

Generate 2-3 candidate AutoML plans and recommend the best one.
"""

    response = llm.invoke([
        SystemMessage(content=AUTOML_REASONER_SYSTEM),
        HumanMessage(content=user_content),
    ])
    return response.content
