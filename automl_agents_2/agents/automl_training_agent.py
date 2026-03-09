"""
agents/automl_training_agent.py
Trains, optimises, and evaluates the selected ML model.
Maps to the "AutoML Agent" node in the Flowise workflow.
"""

from __future__ import annotations

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from prompts.agent_prompts import AUTOML_AGENT_SYSTEM


def run_automl_training(
    pipeline_design: str,
    data_prep_summary: str,
    model_selection: str,
    task_type: str,
    target_column: str | None,
    priority: str,
    dataset_summary_text: str,
) -> str:
    """
    Train the selected model and return a full training report + code.

    Returns
    -------
    str
        Training report, metrics, and reproducible Python code.
    """
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.6)

    user_content = f"""
Task Type     : {task_type}
Target Column : {target_column if target_column else 'N/A'}
Priority      : {priority}

Dataset Summary:
{dataset_summary_text}

Pipeline Design:
{pipeline_design}

Data Preparation Summary:
{data_prep_summary}

Model Selection:
{model_selection}

Train the model.
Output:
1. Chosen algorithm + hyperparameters
2. Training and validation metrics
3. Feature importances (if available)
4. Complete reproducible Python training code (```python block)
5. JSON-like summary at the end with keys: model, metrics, artefacts
"""

    response = llm.invoke([
        SystemMessage(content=AUTOML_AGENT_SYSTEM),
        HumanMessage(content=user_content),
    ])
    return response.content
