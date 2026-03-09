"""
agents/model_selector_agent.py
Selects the best ML algorithm from the full model library based on
task type, dataset characteristics, and user priority.
"""

from __future__ import annotations

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

_SYSTEM = """
You are the Model Selection Agent in an AutoML system.

Your job: select the single best ML algorithm given:
  - problem type (classification / regression / clustering)
  - dataset size (small <10k / medium 10k-100k / large >100k rows)
  - number of features
  - feature types (numeric vs categorical ratio)
  - user priority (accuracy / speed / training_time)

AVAILABLE MODELS
────────────────
Classification:
  Logistic Regression, Ridge Classifier, Passive Aggressive Classifier,
  Perceptron, Decision Tree Classifier, Random Forest Classifier,
  Extra Trees Classifier, Gradient Boosting Classifier, AdaBoost Classifier,
  XGBoost Classifier, LightGBM Classifier, CatBoost Classifier,
  Support Vector Machine (SVC), Linear SVM, K-Nearest Neighbors Classifier,
  Gaussian Naive Bayes, Bernoulli Naive Bayes, Multinomial Naive Bayes,
  Stochastic Gradient Descent Classifier, Quadratic Discriminant Analysis,
  Linear Discriminant Analysis, Bagging Classifier, Voting Classifier,
  Stacking Classifier, HistGradientBoostingClassifier

Regression:
  Linear Regression, Ridge Regression, Lasso Regression, ElasticNet Regression,
  Bayesian Ridge Regression, Passive Aggressive Regressor,
  Decision Tree Regressor, Random Forest Regressor, Extra Trees Regressor,
  Gradient Boosting Regressor, AdaBoost Regressor, XGBoost Regressor,
  LightGBM Regressor, CatBoost Regressor, Support Vector Regressor (SVR),
  Linear SVR, K-Nearest Neighbors Regressor,
  Stochastic Gradient Descent Regressor, Huber Regressor, Quantile Regressor,
  Theil-Sen Regressor, Bagging Regressor, Voting Regressor,
  Stacking Regressor, HistGradientBoostingRegressor

Clustering:
  K-Means, MiniBatch K-Means, DBSCAN, HDBSCAN, OPTICS,
  Agglomerative Clustering, Birch Clustering, Mean Shift,
  Spectral Clustering, Affinity Propagation,
  Gaussian Mixture Model, Bayesian Gaussian Mixture,
  Self Organizing Maps, Fuzzy C-Means

SELECTION RULES
───────────────
priority = accuracy → prefer: Random Forest, XGBoost, LightGBM, CatBoost, Stacking
priority = speed    → prefer: Logistic Regression, Naive Bayes, SGD, Linear SVM, Ridge
priority = cost     → prefer: Decision Tree, Logistic Regression, Naive Bayes, Ridge
                      (minimal compute, low memory, fast inference)

small  (<10k)      → SVM, KNN, Naive Bayes are good
medium (10k-100k)  → Random Forest, Gradient Boosting
large  (>100k)     → LightGBM, XGBoost

Respond with:
  Selected Model: <model name>
  Reason: <detailed justification covering all factors>
  Key Hyperparameters: <suggested starting hyperparameters>
  Alternative: <second-best choice and why>
"""


def run_model_selector(
    task_type: str,
    n_rows: int,
    n_features: int,
    n_numeric: int,
    n_categorical: int,
    priority: str,
    automl_plan: str,
) -> str:
    """
    Select the best model algorithm.

    Returns
    -------
    str
        Model selection report with reasoning.
    """
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.4)

    size_label = (
        "small (<10k)"
        if n_rows < 10_000
        else "medium (10k-100k)"
        if n_rows < 100_000
        else "large (>100k)"
    )

    user_content = f"""
Task Type        : {task_type}
Dataset Size     : {n_rows:,} rows → {size_label}
Number of Features: {n_features}
Numeric Features : {n_numeric}
Categorical Features: {n_categorical}
User Priority    : {priority}

AutoML Planner Recommendation:
{automl_plan}

Select the best model and explain your reasoning.
"""

    response = llm.invoke([
        SystemMessage(content=_SYSTEM),
        HumanMessage(content=user_content),
    ])
    return response.content
