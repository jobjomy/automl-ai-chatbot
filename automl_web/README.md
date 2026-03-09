# AutoML Agent — Web UI

A full-stack web application that replicates the Lovable design and integrates
directly with the LangChain AutoML pipeline.

## Project Structure

```
automl_web/
├── api.py              ← FastAPI backend (bridges React ↔ LangChain pipeline)
├── package.json
├── vite.config.js
├── src/
│   ├── App.jsx         ← Root app + chat modal
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Hero.jsx
│   │   ├── ChatBot.jsx     ← Main interactive pipeline UI
│   │   ├── HowItWorks.jsx
│   │   ├── AgentPipeline.jsx
│   │   ├── Features.jsx
│   │   └── Footer.jsx
│   └── lib/
│       └── api.js      ← API client
```

## Prerequisites

Make sure you have:
- Node.js 18+
- Python 3.10+ with the `automl_agents` project set up
- `OPENAI_API_KEY` in your `automl_agents/.env` file

## Setup & Run

### 1. Install frontend dependencies
```bash
cd automl_web
npm install
```

### 2. Install backend dependencies
```bash
pip install fastapi uvicorn python-multipart
```

### 3. Start the FastAPI backend
```bash
# From the automl_web/ folder
uvicorn api:app --reload --port 8000
```

### 4. Start the React frontend (new terminal)
```bash
# From the automl_web/ folder
npm run dev
```

### 5. Open in browser
```
http://localhost:5173
```

Click **"Launch App"** or **"Start Building"** — the chat modal opens and
guides you through the full pipeline interactively.

## How the Integration Works

```
Browser (React)
    ↕  HTTP / SSE
FastAPI (api.py) on :8000
    ↕  Python imports
automl_agents/ (LangChain pipeline)
    ↕  OpenAI API
GPT-4o-mini
```

- **POST /api/upload** — Uploads CSV, returns preview + columns
- **POST /api/run** — Starts pipeline async, returns job_id  
- **GET /api/stream/{job_id}** — SSE stream of real-time agent logs
- **GET /api/status/{job_id}** — Poll for final report
- **GET /api/health** — Check backend + API key status

## Folder Layout (relative to project root)

```
project_root/
├── automl_agents/      ← LangChain pipeline (existing)
│   ├── main.py
│   ├── agents/
│   └── ...
└── automl_web/         ← This web UI (new)
    ├── api.py
    ├── src/
    └── ...
```
