"""
agents/technical_writer_agent.py
Technical Writer worker agent – generates comprehensive project documentation.
Maps to the "Technical Writer" node in the Flowise workflow.
"""

from __future__ import annotations

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from prompts.agent_prompts import TECHNICAL_WRITER_SYSTEM


def run_technical_writer(
    instructions: str,
    ml_output: str,
    qa_output: str,
    extended_docs: bool = False,
    priority: str = "",
) -> str:
    """
    Generate the full technical documentation report.

    Parameters
    ----------
    instructions : str
        Specific instructions from the Project Lead.
    ml_output : str
        ML Engineer's output.
    qa_output : str
        QA Engineer's evaluation.
    extended_docs : bool
        If True, request extended documentation sections 13-17.
    priority : str
        User's chosen optimisation priority (accuracy / speed / training_time).

    Returns
    -------
    str
        Full Markdown technical report with ONE code block only.
    """
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.6)

    extended_note = (
        "\nEXTENDED DOCUMENTATION REQUESTED: Include sections 13-17 "
        "(Feature Importance Analysis, Hyperparameter Reasoning, "
        "Model Limitations, Dataset Assumptions, Possible Future Improvements). "
        "All as text only — no additional code blocks."
        if extended_docs
        else ""
    )

    priority_note = (
        f"\nUSER PRIORITY: '{priority}' — every relevant section must explicitly "
        f"explain how this priority influenced decisions (model choice, "
        f"hyperparameters, training strategy, etc.)."
        if priority
        else ""
    )

    user_content = f"""
Supervisor Instructions:
{instructions}
{priority_note}

ML Engineer Output (metrics and plan — no code needed from here):
{ml_output}

QA Engineer Evaluation:
{qa_output}
{extended_note}

Generate the complete technical report in Markdown format.
REMEMBER:
- Sections 1–11 contain TEXT ONLY — no ```python blocks.
- Section 12 contains the ONE AND ONLY complete Python code block.
- No duplicate code. No second build summary after section 12.
- Every relevant section must reference the user's priority: '{priority}'.
"""

    response = llm.invoke([
        SystemMessage(content=TECHNICAL_WRITER_SYSTEM),
        HumanMessage(content=user_content),
    ])
    return response.content
