"""
agents/final_answer_agent.py
Final Reviewer – combines all team outputs into one polished final answer.
Maps to the "Final Answer" node in the Flowise workflow.
"""

from __future__ import annotations

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from prompts.agent_prompts import FINAL_ANSWER_SYSTEM


def run_final_answer(
    ml_output: str,
    qa_output: str,
    docs_output: str,
    code_build_output: str,
    priority: str = "",
) -> str:
    """
    Combine all agent outputs into the final polished answer.

    Returns
    -------
    str
        The final documentation report — clean, no duplicate code blocks.
    """
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.4)

    priority_note = (
        f"\nUSER PRIORITY WAS: '{priority}' — ensure this is referenced "
        f"in every relevant section of the final report."
        if priority
        else ""
    )

    user_content = f"""
{priority_note}

===== TECHNICAL WRITER REPORT (primary source — use this as the base) =====
{docs_output}

===== ML ENGINEER OUTPUT (for metrics / numbers reference only) =====
{ml_output}

===== QA ENGINEER OUTPUT (for evaluation reference only) =====
{qa_output}

===== BUILD SUMMARY (for deployment section reference only — NO code from here) =====
{code_build_output}

INSTRUCTIONS:
- Use the Technical Writer report as the base structure.
- Enrich sections with any missing metrics or insights from ML/QA outputs.
- The final output must have EXACTLY ONE ```python code block — in Section 12 only.
- Remove any duplicate code blocks, duplicate build summaries, or repeated sections.
- Every relevant section must reference the user's chosen priority: '{priority}'.
- End the report after the last section. Nothing after that.
"""

    response = llm.invoke([
        SystemMessage(content=FINAL_ANSWER_SYSTEM),
        HumanMessage(content=user_content),
    ])
    return response.content
