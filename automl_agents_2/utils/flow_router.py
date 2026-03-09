"""
utils/flow_router.py
Routing helpers for the Project Lead → worker loop.
Maps the structured output from the Project Lead to the correct worker agent.
"""

from __future__ import annotations

import json
import re
from typing import Tuple


def parse_project_lead_output(raw: str) -> Tuple[str, str]:
    """
    Extract (next_worker, instructions) from the Project Lead's response.

    The lead is instructed to respond with JSON:
        {"next": "WORKER1_ML", "instructions": "..."}

    Falls back to regex extraction if the model adds extra prose.

    Returns
    -------
    next_worker : str
        One of WORKER1_ML, WORKER2_QA, WORKER3_DOCS, FINISH
    instructions : str
        The specific instructions for the chosen worker.
    """
    # Try direct JSON parse first (model may wrap in ```json ... ```)
    json_match = re.search(r"\{.*\}", raw, re.DOTALL)
    if json_match:
        try:
            data = json.loads(json_match.group())
            return data.get("next", "FINISH"), data.get("instructions", "")
        except json.JSONDecodeError:
            pass

    # Fallback: look for keywords
    raw_upper = raw.upper()
    if "WORKER1_ML" in raw_upper:
        next_worker = "WORKER1_ML"
    elif "WORKER2_QA" in raw_upper:
        next_worker = "WORKER2_QA"
    elif "WORKER3_DOCS" in raw_upper:
        next_worker = "WORKER3_DOCS"
    else:
        next_worker = "FINISH"

    return next_worker, raw


WORKER_LABELS = {
    "WORKER1_ML": "ML Engineer",
    "WORKER2_QA": "QA Engineer",
    "WORKER3_DOCS": "Technical Writer",
    "FINISH": "Final Answer",
}


def label_for_worker(worker_key: str) -> str:
    return WORKER_LABELS.get(worker_key, worker_key)
