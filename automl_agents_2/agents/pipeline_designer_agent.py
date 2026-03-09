"""
agents/pipeline_designer_agent.py
Converts the AutoML plan into a concrete pipeline design specification.
Maps to the "Pipeline Designer" node in the Flowise workflow.
"""

from __future__ import annotations

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from prompts.agent_prompts import PIPELINE_DESIGNER_SYSTEM


def run_pipeline_designer(
    automl_plan: str,
    model_selection: str,
    dataset_summary_text: str,
    task_type: str,
    target_column: str | None,
) -> str:
    """
    Design the full ML pipeline.

    Returns
    -------
    str
        Concrete pipeline design document.
    """
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.5)

    user_content = f"""
Task Type     : {task_type}
Target Column : {target_column if target_column else 'N/A'}

Dataset Summary:
{dataset_summary_text}

AutoML Planner Output:
{automl_plan}

Model Selection:
{model_selection}

Design the complete ML pipeline based on the above.
"""

    response = llm.invoke([
        SystemMessage(content=PIPELINE_DESIGNER_SYSTEM),
        HumanMessage(content=user_content),
    ])
    return response.content
