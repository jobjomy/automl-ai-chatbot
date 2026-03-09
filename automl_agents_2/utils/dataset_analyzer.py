"""
utils/dataset_analyzer.py
Utility functions for analyzing a pandas DataFrame and returning a
human-readable + dict summary consumed by multiple agents.
"""

from __future__ import annotations

import pandas as pd
import numpy as np
from typing import Dict, Any


def analyze_dataset(df: pd.DataFrame, target_column: str | None = None) -> Dict[str, Any]:
    """
    Perform a comprehensive analysis of a DataFrame.

    Parameters
    ----------
    df : pd.DataFrame
        The loaded dataset.
    target_column : str | None
        The target / label column.  None for clustering.

    Returns
    -------
    dict
        A structured summary dictionary.
    """
    n_rows, n_cols = df.shape

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
    datetime_cols = df.select_dtypes(include=["datetime"]).columns.tolist()

    missing_counts = df.isnull().sum()
    missing_info = {
        col: int(cnt)
        for col, cnt in missing_counts.items()
        if cnt > 0
    }
    missing_pct = round(missing_counts.sum() / (n_rows * n_cols) * 100, 2)

    # Target column details
    target_info: Dict[str, Any] = {}
    if target_column and target_column in df.columns:
        target_series = df[target_column]
        target_info = {
            "name": target_column,
            "dtype": str(target_series.dtype),
            "unique_values": int(target_series.nunique()),
            "null_count": int(target_series.isnull().sum()),
            "sample_values": target_series.dropna().head(5).tolist(),
        }
        if pd.api.types.is_numeric_dtype(target_series):
            target_info.update({
                "min": float(target_series.min()),
                "max": float(target_series.max()),
                "mean": float(target_series.mean()),
            })
        else:
            target_info["class_distribution"] = target_series.value_counts().to_dict()

    # Dataset size category
    if n_rows < 10_000:
        size_category = "small"
    elif n_rows < 100_000:
        size_category = "medium"
    else:
        size_category = "large"

    summary = {
        "n_rows": n_rows,
        "n_cols": n_cols,
        "numeric_columns": numeric_cols,
        "categorical_columns": categorical_cols,
        "datetime_columns": datetime_cols,
        "missing_values": missing_info,
        "missing_percentage": missing_pct,
        "size_category": size_category,
        "columns": df.columns.tolist(),
        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "target": target_info,
    }
    return summary


def format_summary_for_prompt(summary: Dict[str, Any]) -> str:
    """Return a concise text representation of the dataset summary."""
    lines = [
        f"Rows: {summary['n_rows']:,}",
        f"Columns: {summary['n_cols']}",
        f"Size category: {summary['size_category']}",
        f"Numeric columns ({len(summary['numeric_columns'])}): "
        f"{', '.join(summary['numeric_columns'][:10])}{'...' if len(summary['numeric_columns']) > 10 else ''}",
        f"Categorical columns ({len(summary['categorical_columns'])}): "
        f"{', '.join(summary['categorical_columns'][:10])}{'...' if len(summary['categorical_columns']) > 10 else ''}",
        f"Missing values: {summary['missing_percentage']}% "
        f"({'columns: ' + ', '.join(summary['missing_values'].keys()) if summary['missing_values'] else 'none'})",
    ]
    if summary.get("target"):
        t = summary["target"]
        lines.append(
            f"Target column: {t['name']} | dtype: {t['dtype']} | "
            f"unique values: {t['unique_values']}"
        )
    return "\n".join(lines)
