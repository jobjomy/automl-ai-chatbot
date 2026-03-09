"""
agents/qa_engineer_agent.py
QA Engineer worker agent – evaluates model performance and efficiency.
No code blocks — text and numbers only.
"""

from __future__ import annotations

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from prompts.agent_prompts import QA_ENGINEER_SYSTEM


def run_qa_engineer(instructions: str, ml_output: str, priority: str = "") -> str:
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.6)

    priority_note = (
        f"\nUser's chosen priority: '{priority}' — reference this when "
        f"evaluating computational efficiency and trade-offs."
        if priority else ""
    )

    user_content = f"""
Supervisor Instructions:
{instructions}
{priority_note}

ML Engineer Output (metrics and plan):
{ml_output}

Evaluate:
1. Prediction quality (metrics, errors, misclassifications)
2. Model performance (overfitting / underfitting)
3. Computational efficiency relative to the user's priority
4. Deployment readiness and risks

DO NOT include any Python code blocks — text and numbers only.
"""

    response = llm.invoke([
        SystemMessage(content=QA_ENGINEER_SYSTEM),
        HumanMessage(content=user_content),
    ])
    return response.content
