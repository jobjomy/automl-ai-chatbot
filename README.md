# AutoML AI Chatbot

An AI-powered AutoML chatbot that allows users to upload a CSV dataset and automatically build machine learning models through a conversational interface.

The chatbot guides users step-by-step to:

- Upload a dataset
- Choose the machine learning task
- Select optimization priorities
- Train and evaluate models automatically
- Generate a detailed technical report

This project demonstrates an AI-driven workflow where multiple agents collaborate to analyze data, select models, run training pipelines, and produce reproducible results.

## Features

- CSV dataset upload
- Conversational chatbot interface
- Automated machine learning pipeline
- Model selection and evaluation
- Generated documentation and report

## Setup and Run (Windows PowerShell)

After downloading/cloning the repository:

```powershell
cd <path-to>\FINAL
```

### 1. Create Python virtual environment and install backend dependencies

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r .\automl_agents_2\requirements.txt
pip install fastapi uvicorn python-multipart
```

### 2. Set OpenAI API key (current terminal session)

```powershell
$env:OPENAI_API_KEY="sk-xxxxx"
```

### 3. Install frontend dependencies

```powershell
cd .\automl_web
npm install
```

### 4. Start backend (Terminal 1)

```powershell
python -m uvicorn api:app --reload --port 8000
```

### 5. Start frontend (Terminal 2)

```powershell
cd <path-to>\FINAL\automl_web
npm run dev
```

### 6. Open in browser

```text
http://localhost:5173
```

## Contributors

- Job Jomy
- Venkat Nivas Reddy K
- Sherlyn Rose
- Sahana Shetty
