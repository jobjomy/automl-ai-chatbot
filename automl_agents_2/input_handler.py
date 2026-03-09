"""
input_handler.py
Collects all required user inputs interactively before the pipeline runs.
- Step 1  : Native file-picker dialog to select the CSV
- Step 1b : Shows a CSV preview + numbered column list
- Step 2  : ML problem type
- Step 3  : Target column picked by number from the list
- Step 4  : Optimisation priority
- Step 5  : Extended documentation
"""

from __future__ import annotations

import os
import sys
from dataclasses import dataclass
from typing import Optional

import pandas as pd


@dataclass
class UserInputs:
    csv_path: str
    task_type: str          # classification | regression | clustering
    target_column: Optional[str]
    priority: str           # accuracy | speed | training_time
    extended_docs: bool


def _open_file_dialog() -> str:
    """
    Open a native OS file-picker dialog and return the selected file path.
    Falls back to manual path input if tkinter is unavailable.
    """
    try:
        import tkinter as tk
        from tkinter import filedialog

        root = tk.Tk()
        root.withdraw()
        root.attributes("-topmost", True)

        file_path = filedialog.askopenfilename(
            title="Select your CSV dataset",
            filetypes=[("CSV files", "*.csv"), ("All files", "*.*")],
        )
        root.destroy()
        return file_path or ""
    except Exception:
        return ""


def _show_csv_preview(df: pd.DataFrame) -> None:
    """Print a 5-row preview and a numbered column list."""

    print("\n" + "=" * 60)
    print("  ===== CSV PREVIEW (first 5 rows) =====")
    print("=" * 60)
    # Use pandas to_string for a clean aligned table
    print(df.head().to_string(index=True))

    print("\n" + "=" * 60)
    print("  ===== AVAILABLE COLUMNS =====")
    print("=" * 60)
    for i, col in enumerate(df.columns):
        print(f"  {i}. {col}")
    print("=" * 60)


def collect_user_inputs() -> UserInputs:
    """
    Interactively collect all required pipeline inputs from the user.
    """
    print("\n" + "=" * 60)
    print("  AutoML Multi-Agent Pipeline  –  LangChain Edition")
    print("=" * 60)

    # ── 1. File picker ─────────────────────────────────────────────
    print("\n[Step 1] Dataset Upload")
    print("  A file picker window will open — select your CSV file.")
    print("  (If no window appears, type the path manually.)\n")

    df: Optional[pd.DataFrame] = None
    csv_path = ""

    while True:
        picked = _open_file_dialog()
        if picked:
            csv_path = picked
            print(f"  ✓  Selected: {csv_path}")
        else:
            csv_path = input("  Enter CSV file path manually: ").strip()

        if not csv_path:
            print("  ⚠  No file selected. Please try again.")
            continue
        if not os.path.isfile(csv_path):
            print(f"  ⚠  File not found: {csv_path}")
            csv_path = ""
            continue
        if not csv_path.lower().endswith(".csv"):
            print("  ⚠  File must be a .csv — please select a CSV file.")
            csv_path = ""
            continue

        # Try loading the CSV right away so we can show the preview
        try:
            df = pd.read_csv(csv_path)
            if df.empty:
                print("  ⚠  The CSV file is empty.")
                csv_path = ""
                continue
        except Exception as e:
            print(f"  ⚠  Could not read CSV: {e}")
            csv_path = ""
            continue

        break

    # ── 1b. CSV preview + column list ─────────────────────────────
    _show_csv_preview(df)

    # ── 2. ML problem type ─────────────────────────────────────────
    print("\n[Step 2] Machine Learning Problem Type")
    print("  1. Classification")
    print("  2. Regression")
    print("  3. Clustering")
    task_map = {"1": "classification", "2": "regression", "3": "clustering"}
    while True:
        choice = input("  Select (1/2/3): ").strip()
        if choice in task_map:
            task_type = task_map[choice]
            break
        print("  ⚠  Enter 1, 2, or 3.")

    # ── 3. Target column (pick by number) ─────────────────────────
    target_column: Optional[str] = None
    columns = df.columns.tolist()

    if task_type != "clustering":
        print("\n[Step 3] Target Column")
        print("  Enter the column NUMBER from the list above.")
        while True:
            choice = input(f"  Select target column (0–{len(columns)-1}): ").strip()
            if choice.isdigit() and 0 <= int(choice) < len(columns):
                target_column = columns[int(choice)]
                print(f"  ✓  Target column set to: '{target_column}'")
                break
            print(f"  ⚠  Enter a number between 0 and {len(columns)-1}.")
    else:
        print("\n[Step 3] Target Column – skipped (clustering task)")

    # ── 4. Optimisation priority ───────────────────────────────────
    print("\n[Step 4] Optimisation Priority")
    print("  What should the system prioritise?")
    print("  1. Speed    (fast training, lightweight models)")
    print("  2. Accuracy (best possible performance)")
    print("  3. Cost     (minimal compute / resource usage)")
    priority_map = {"1": "speed", "2": "accuracy", "3": "cost"}
    while True:
        choice = input("  Select (1/2/3): ").strip()
        if choice in priority_map:
            priority = priority_map[choice]
            break
        print("  ⚠  Enter 1, 2, or 3.")

    # ── 5. Extended documentation ──────────────────────────────────
    print("\n[Step 5] Extended Technical Documentation")
    print("  Do you want extended technical documentation?")
    print("  (Includes: feature importance, hyperparameter reasoning,")
    print("   model limitations, dataset assumptions, future improvements)")
    while True:
        choice = input("  Yes / No (y/n): ").strip().lower()
        if choice in {"y", "yes"}:
            extended_docs = True
            break
        elif choice in {"n", "no"}:
            extended_docs = False
            break
        print("  ⚠  Enter y or n.")

    # ── Summary ────────────────────────────────────────────────────
    print("\n" + "-" * 60)
    print("  Configuration Summary")
    print("-" * 60)
    print(f"  CSV File       : {csv_path}")
    print(f"  Task Type      : {task_type}")
    print(f"  Target Column  : {target_column if target_column else 'N/A'}")
    print(f"  Priority       : {priority}")
    print(f"  Extended Docs  : {'Yes' if extended_docs else 'No'}")
    print("-" * 60)

    confirm = input("\n  Proceed with these settings? (y/n): ").strip().lower()
    if confirm not in {"y", "yes"}:
        print("  Aborting. Please re-run and update your selections.")
        sys.exit(0)

    return UserInputs(
        csv_path=csv_path,
        task_type=task_type,
        target_column=target_column,
        priority=priority,
        extended_docs=extended_docs,
    )
