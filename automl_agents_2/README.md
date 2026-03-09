# AutoML Multi-Agent Pipeline — LangChain Edition

A fully modular LangChain multi-agent system converted from the Flowise workflow.
It accepts a dataset, selects the best ML model, trains it, evaluates it, and
generates comprehensive documentation — all driven by collaborative AI agents.

---

## Architecture Overview

```
                          ┌─────────────────────────────────────────────────────────┐
                          │                 STAGE 1 — Sequential Chain               │
                          └─────────────────────────────────────────────────────────┘
  User Input
      │
      ▼
  Upload CSV ──► Request Validator ──► Instruction Parser ──► Dataset Analyzer
                                                                     │
                                                                     ▼
                                                           AutoML Reasoner
                                                                     │
                                                                     ▼
                                                           Model Selector
                                                                     │
                                                                     ▼
                                                           Pipeline Designer
                                                                     │
                                                                     ▼
                                                        Data Preprocessing Agent
                                                                     │
                                                                     ▼
                                                          AutoML Training Agent
                                                                     │
                                                                     ▼
                                                          Execution Verifier
                                                                     │
                                                                     ▼
                                                       Implementation Verifier
                                                                     │
                                                                     ▼
                                                           Code & Build Agent
                                                                     │
                          ┌─────────────────────────────────────────────────────────┐
                          │                 STAGE 2 — Worker Loop                    │
                          └─────────────────────────────────────────────────────────┘
                                                                     │
                                                                     ▼
                                                            Project Lead
                                                           ╱     │      ╲
                                                      ML Eng.  QA Eng.  Tech Writer
                                                           ╲     │      ╱
                                                      (loop up to 5x)
                                                                     │
                                                                     ▼
                                                            Final Answer
```

---

## Project Structure

```
automl_agents/
├── main.py                          # Main controller / pipeline entry point
├── input_handler.py                 # Interactive user input collection
├── validator.py                     # Pre-flight validation
├── requirements.txt
│
├── agents/
│   ├── request_validator_agent.py   # Validates CSV + parameters
│   ├── instruction_parser_agent.py  # Structures user inputs for pipeline
│   ├── dataset_analyzer_agent.py    # LLM dataset commentary
│   ├── automl_reasoner_agent.py     # Proposes candidate ML plans
│   ├── model_selector_agent.py      # Selects best algorithm from model library
│   ├── pipeline_designer_agent.py   # Designs full ML pipeline
│   ├── data_preprocessing_agent.py  # Preprocessing plan + code
│   ├── automl_training_agent.py     # Trains model, returns code + metrics
│   ├── execution_verifier_agent.py  # Verifies training execution
│   ├── implementation_verifier_agent.py # Verifies code quality
│   ├── code_build_agent.py          # Final deployable code package
│   ├── project_lead_agent.py        # Supervisor / worker-loop orchestrator
│   ├── ml_engineer_agent.py         # ML Engineer worker
│   ├── qa_engineer_agent.py         # QA Engineer worker
│   ├── technical_writer_agent.py    # Technical Writer worker
│   └── final_answer_agent.py        # Combines all outputs
│
├── prompts/
│   └── agent_prompts.py             # All system prompts (from Flowise nodes)
│
└── utils/
    ├── dataset_analyzer.py          # Pandas-based dataset statistics
    └── flow_router.py               # Worker routing helpers
```

---

## Installation

```bash
# 1. Clone / copy the project folder
cd automl_agents

# 2. Create a virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set your OpenAI API key
export OPENAI_API_KEY="sk-..."   # Windows: set OPENAI_API_KEY=sk-...
```

---

## Usage

```bash
python main.py
```

The system will interactively ask:

1. **CSV file path** — path to your dataset file
2. **ML task type** — Classification / Regression / Clustering
3. **Target column** — column to predict (skipped for clustering)
4. **Optimisation priority** — Accuracy / Speed / Training Time
5. **Extended documentation** — Yes / No

After answering, the full pipeline runs automatically and saves the final report
to `automl_report.md`.

---

## Available Models

### Classification (25 models)
Logistic Regression, Ridge Classifier, Random Forest, XGBoost, LightGBM,
CatBoost, SVM, KNN, Naive Bayes variants, Gradient Boosting, AdaBoost,
Extra Trees, Decision Tree, SGD, LDA, QDA, Bagging, Voting, Stacking,
HistGradientBoosting, Linear SVM, Perceptron, Passive Aggressive

### Regression (25 models)
Linear Regression, Ridge, Lasso, ElasticNet, Bayesian Ridge, Random Forest,
XGBoost, LightGBM, CatBoost, SVR, KNN, Gradient Boosting, AdaBoost,
Extra Trees, Decision Tree, SGD, Huber, Quantile, Theil-Sen, Bagging,
Voting, Stacking, HistGradientBoosting, Linear SVR, Passive Aggressive

### Clustering (14 models)
K-Means, MiniBatch K-Means, DBSCAN, HDBSCAN, OPTICS,
Agglomerative Clustering, Birch, Mean Shift, Spectral Clustering,
Affinity Propagation, Gaussian Mixture, Bayesian Gaussian Mixture,
Self Organizing Maps, Fuzzy C-Means

---

## Model Selection Logic

| Priority       | Preferred Models                              |
|----------------|-----------------------------------------------|
| Accuracy       | Random Forest, XGBoost, LightGBM, CatBoost   |
| Speed          | Logistic Regression, Naive Bayes, SGD         |
| Training Time  | Decision Tree, Ridge, Linear models           |

| Dataset Size   | Preferred Models                              |
|----------------|-----------------------------------------------|
| Small (<10k)   | SVM, KNN, Naive Bayes                         |
| Medium (10k-100k) | Random Forest, Gradient Boosting           |
| Large (>100k)  | LightGBM, XGBoost                             |

---

## Final Output Format

```
===== FINAL DOCUMENTATION =====

# Model Documentation

## 1. Overview
## 2. Problem Definition
## 3. Dataset Description
## 4. Model Selection Strategy
## 5. Why This Model Was Chosen
## 6. Data Preprocessing Steps
## 7. Training Configuration
## 8. Evaluation Metrics & Results
## 9. Performance Analysis
## 10. Business / Practical Impact
## 11. Final Conclusion
## 12. Complete Reproducible Python Code

# (if extended docs requested)
## 13. Feature Importance Analysis
## 14. Hyperparameter Reasoning
## 15. Model Limitations
## 16. Dataset Assumptions
## 17. Possible Future Improvements
```

---

## Environment Variables

| Variable         | Description                        |
|------------------|------------------------------------|
| `OPENAI_API_KEY` | Your OpenAI API key (required)     |

---

## Notes

- All agents use `gpt-4o-mini` by default (cost-efficient).
- The Project Lead loop runs for a maximum of **5 iterations**.
- The final Markdown report is saved as `automl_report.md`.
- The system is stateless between runs; all context is passed through
  the agent chain, mirroring the Flowise state variables.
