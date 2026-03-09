"""
agents/dataset_analyzer_agent.py
LLM-powered agent that interprets dataset statistics and provides a
rich analytical commentary.
"""

from __future__ import annotations

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

_SYSTEM = """
You are a Data Scientist specialising in dataset analysis.
Given dataset statistics, provide:
1. A summary of the data quality and structure.
2. Key challenges (high cardinality, class imbalance, missing data, etc.).
3. Recommendations for preprocessing.
4. Any red flags the ML pipeline should be aware of.
Be concise but thorough.
"""


def run_dataset_analyzer(dataset_summary_text: str, task_type: str) -> str:
    """
    Generate a rich analytical commentary about the dataset.

    Returns
    -------
    str
        Dataset analysis report.
    """
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.5)

    user_content = f"""
Task: {task_type}

Dataset Statistics:
{dataset_summary_text}

Provide a thorough dataset analysis.
"""

    response = llm.invoke([
        SystemMessage(content=_SYSTEM),
        HumanMessage(content=user_content),
    ])
    return response.content
