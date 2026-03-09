"""
validator.py
Pre-flight checks before starting the agent pipeline.
Raises ValueError with a descriptive message if anything is wrong.
"""

from __future__ import annotations

import os
import pandas as pd
from typing import Optional


def validate_inputs(
    csv_path: str,
    task_type: str,
    target_column: Optional[str],
    priority: str,
) -> pd.DataFrame:
    """
    Validate all user inputs and return the loaded DataFrame.

    Checks:
    - CSV file exists and is readable.
    - task_type is one of the accepted values.
    - target_column exists in the DataFrame (unless clustering).
    - priority is one of the accepted values.

    Returns
    -------
    pd.DataFrame
        The loaded dataset.

    Raises
    ------
    ValueError
        If any validation check fails.
    """
    # ── File checks ────────────────────────────────────────────────
    if not os.path.isfile(csv_path):
        raise ValueError(f"CSV file not found: {csv_path}")

    try:
        df = pd.read_csv(csv_path)
    except Exception as exc:
        raise ValueError(f"Failed to read CSV: {exc}") from exc

    if df.empty:
        raise ValueError("Dataset is empty.")

    # ── Task type ──────────────────────────────────────────────────
    valid_tasks = {"classification", "regression", "clustering"}
    if task_type not in valid_tasks:
        raise ValueError(
            f"Invalid task_type '{task_type}'. Must be one of {valid_tasks}."
        )

    # ── Target column ──────────────────────────────────────────────
    if task_type != "clustering":
        if not target_column:
            raise ValueError(
                "target_column is required for classification / regression tasks."
            )
        if target_column not in df.columns:
            available = ", ".join(df.columns.tolist())
            raise ValueError(
                f"Target column '{target_column}' not found in dataset.\n"
                f"Available columns: {available}"
            )

    # ── Priority ───────────────────────────────────────────────────
    valid_priorities = {"accuracy", "speed", "cost"}
    if priority not in valid_priorities:
        raise ValueError(
            f"Invalid priority '{priority}'. Must be one of {valid_priorities}."
        )

    return df
