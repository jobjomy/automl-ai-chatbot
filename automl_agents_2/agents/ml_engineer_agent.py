"""
agents/ml_engineer_agent.py
ML Engineer worker agent – builds the full ML training plan with metrics.
No code blocks — code lives exclusively in Section 12 of the final report.
"""

from __future__ import annotations

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from prompts.agent_prompts import ML_ENGINEER_SYSTEM


def run_ml_engineer(instructions: str, pipeline_context: str, priority: str = "") -> str:
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.6)

    priority_note = (
        f"\nUser's chosen priority: '{priority}' — explicitly state how this "
        f"influenced model selection and hyperparameter choices."
        if priority else ""
    )

    user_content = f"""
Supervisor Instructions:
{instructions}
{priority_note}

Pipeline Context:
{pipeline_context}

Provide:
- Brief plan (bullets)
- Model choices and key hyperparameters with justification
- Metrics on validation/test split (accuracy, F1, ROC-AUC, RMSE etc.)
- Artefact paths (model.pkl, preprocessor.pkl)
- Repro steps

DO NOT include any Python code blocks — text and numbers only.
"""

    response = llm.invoke([
        SystemMessage(content=ML_ENGINEER_SYSTEM),
        HumanMessage(content=user_content),
    ])
    return response.content
