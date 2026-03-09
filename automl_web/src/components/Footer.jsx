// src/components/Footer.jsx
import { Cpu, Github } from 'lucide-react'

const sampleReport = `# AutoML Project Report

## Model Selected: XGBoost Classifier
**Priority:** Accuracy  |  **Dataset:** 49,068 rows × 10 columns

## Why This Model Was Chosen
Given the medium-sized dataset and accuracy priority, XGBoost
was selected for its superior gradient boosting performance.

## Evaluation Metrics
\`\`\`
Accuracy  : 0.92     F1 Score  : 0.89
ROC AUC   : 0.94     Precision : 0.90
Recall    : 0.88
\`\`\`

## Complete Reproducible Python Code
\`\`\`python
import pandas as pd
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
...
\`\`\``

export function ReportPreview() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-accent-bright text-sm font-medium tracking-widest uppercase mb-3">Output</p>
          <h2 className="text-4xl font-bold text-white">What You Get at the End</h2>
          <p className="text-subtle mt-3">A complete, professional Markdown report saved as <code className="text-cyan text-sm">automl_report.md</code></p>
        </div>

        <div className="rounded-2xl border border-border overflow-hidden">
          {/* Editor chrome */}
          <div className="flex items-center gap-2 px-4 py-3 bg-panel border-b border-border">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
            <span className="ml-3 text-xs text-muted font-mono">automl_report.md</span>
          </div>
          {/* Content */}
          <div className="bg-void p-6 font-mono text-sm leading-relaxed">
            <pre className="text-slate-300 whitespace-pre-wrap">{sampleReport}</pre>
          </div>
          <div className="flex items-center justify-between px-4 py-3 bg-panel border-t border-border">
            <span className="text-xs text-muted">17 sections · Full reproducible code · Deployment notes</span>
            <span className="text-xs text-accent-bright">✓ Production ready</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Footer() {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
              <Cpu size={15} className="text-accent-bright" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">AutoML Agent</p>
              <p className="text-muted text-xs">AI that builds AI models for you</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-subtle">
            <a href="https://github.com" target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Github size={13} /> GitHub
            </a>
            <span className="text-border">·</span>
            <span>Built with LangChain</span>
            <span className="text-border">·</span>
            <span>Powered by GPT-4o-mini</span>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border/50 text-center text-xs text-muted">
          © 2025 AutoML Agent · MIT License
        </div>
      </div>
    </footer>
  )
}
