// src/components/ChatBot.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Cpu,
  User,
  CheckCircle,
  AlertCircle,
  Loader,
  FileText,
  Download,
  Send,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { uploadCSV, runPipeline, streamLogs } from '../lib/api';
import { downloadTxt, downloadPdf } from '../lib/download';
import { saveSession, createSession } from '../lib/history';
import ReactMarkdown from 'react-markdown';

const STEPS = {
  UPLOAD: 'upload',
  TASK_TYPE: 'task_type',
  TARGET_COLUMN: 'target_column',
  PRIORITY: 'priority',
  EXTENDED_DOCS: 'extended_docs',
  RUNNING: 'running',
  DONE: 'done',
  FOLLOWUP: 'followup',
};

const GREETING =
  "Hi! I'm **AutoML Agent** — your AI-powered ML engineer. Let's build a machine learning model together.\n\nStart by **uploading your CSV dataset** below.";

const FOLLOWUP_SUGGESTIONS = [
  'Switch to Regression',
  'Switch to Clustering',
  'Switch to Classification',
  'Change target column',
  'Run again with Accuracy priority',
  'Run again with Speed priority',
  'Explain the model selection',
  'What are the top features?',
  'How can I improve accuracy?',
  'What does ROC-AUC mean here?',
  'Generate extended documentation',
];

// ── Atoms ──────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex gap-1 items-center px-1 py-1">
      <div className="typing-dot" />
      <div className="typing-dot" />
      <div className="typing-dot" />
    </div>
  );
}

function AIBubble({ children, isTyping }) {
  return (
    <div className="flex gap-3 animate-slide-up">
      <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex-shrink-0 flex items-center justify-center mt-0.5">
        <Cpu size={14} className="text-accent-bright" />
      </div>
      <div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-panel border border-border px-4 py-3 text-sm text-slate-200 leading-relaxed">
        {isTyping ? <TypingDots /> : children}
      </div>
    </div>
  );
}

function UserBubble({ children }) {
  return (
    <div className="flex gap-3 justify-end animate-slide-up">
      <div className="max-w-[82%] rounded-2xl rounded-tr-sm bg-accent/20 border border-accent/30 px-4 py-3 text-sm text-slate-200">
        {children}
      </div>
      <div className="w-8 h-8 rounded-full bg-surface border border-border flex-shrink-0 flex items-center justify-center mt-0.5">
        <User size={14} className="text-subtle" />
      </div>
    </div>
  );
}

function DataPreview({ columns, preview }) {
  if (!preview?.length) return null;
  const vis = columns.slice(0, 5);
  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-border text-xs font-mono">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-surface/80">
              {vis.map((c) => (
                <th
                  key={c}
                  className="px-3 py-2 text-left text-accent-bright font-medium truncate max-w-[100px]"
                >
                  {c}
                </th>
              ))}
              {columns.length > 5 && (
                <th className="px-3 py-2 text-muted">
                  +{columns.length - 5} more
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {preview.slice(0, 3).map((row, i) => (
              <tr key={i} className="border-t border-border/50">
                {vis.map((c) => (
                  <td
                    key={c}
                    className="px-3 py-1.5 text-subtle truncate max-w-[100px]"
                  >
                    {row[c] == null || row[c] === '' ? (
                      <span className="text-muted italic">null</span>
                    ) : (
                      String(row[c]).slice(0, 15)
                    )}
                  </td>
                ))}
                {columns.length > 5 && (
                  <td className="px-3 py-1.5 text-muted">...</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AgentLog({ logs }) {
  return (
    <div className="mt-3 space-y-1.5 font-mono text-xs max-h-52 overflow-y-auto pr-1">
      {logs.map((log, i) => (
        <div
          key={i}
          className={`flex items-start gap-2 ${log.status === 'done' ? 'text-emerald-400' : log.status === 'error' ? 'text-red-400' : 'text-accent-bright'}`}
        >
          {log.status === 'done' ? (
            <CheckCircle size={11} className="mt-0.5 flex-shrink-0" />
          ) : log.status === 'error' ? (
            <AlertCircle size={11} className="mt-0.5 flex-shrink-0" />
          ) : (
            <Loader size={11} className="mt-0.5 flex-shrink-0 animate-spin" />
          )}
          <span className="text-muted">[{log.agent}]</span>
          <span>{log.message}</span>
        </div>
      ))}
    </div>
  );
}

function ReportBubble({
  report,
  config,
  onRerun,
  onSwitchTask,
  onChangeTarget,
  onReset,
}) {
  const [dl, setDl] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const handle = async (type) => {
    setDl(type);
    try {
      const ts = new Date().toISOString().slice(0, 10);
      if (type === 'pdf') await downloadPdf(report, `automl_report_${ts}.pdf`);
      if (type === 'txt') downloadTxt(report, `automl_report_${ts}.txt`);
    } catch (e) {
      console.error('Download error:', e);
    }
    setDl(null);
  };

  return (
    <div className="flex gap-3 animate-slide-up">
      <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex-shrink-0 flex items-center justify-center mt-0.5">
        <FileText size={14} className="text-emerald-400" />
      </div>
      <div className="flex-1 min-w-0 rounded-2xl rounded-tl-sm bg-panel border border-emerald-500/20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-sm font-semibold">
              AutoML Report Ready
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-xs text-muted hover:text-white border border-border hover:border-accent/40 px-3 py-1 rounded-full transition-all"
            >
              {expanded ? 'Collapse' : 'Expand'}
            </button>
            <button
              onClick={onReset}
              className="text-xs text-muted hover:text-white border border-border hover:border-red-400/30 px-3 py-1 rounded-full transition-all"
            >
              New Dataset
            </button>
          </div>
        </div>

        {/* Config summary */}
        {config && (
          <div className="flex flex-wrap gap-1.5 px-4 py-2.5 border-b border-border/50 bg-surface/20">
            {[
              { k: 'Task', v: config.taskType },
              { k: 'Target', v: config.targetColumn || 'N/A' },
              { k: 'Priority', v: config.priority },
              { k: 'Ext. Docs', v: config.extendedDocs ? 'Yes' : 'No' },
            ].map((item) => (
              <span
                key={item.k}
                className="text-xs px-2 py-0.5 rounded-md bg-surface border border-border"
              >
                <span className="text-muted">{item.k}: </span>
                <span className="text-white font-medium capitalize">
                  {item.v}
                </span>
              </span>
            ))}
          </div>
        )}

        {/* Download buttons */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50 bg-surface/30">
          <Download size={12} className="text-muted" />
          <span className="text-xs text-muted mr-1">Download:</span>
          {[
            {
              type: 'pdf',
              label: 'PDF',
              cls: 'text-red-400 border-red-400/30 hover:bg-red-400/10',
            },
            {
              type: 'txt',
              label: 'TXT',
              cls: 'text-slate-400 border-slate-400/30 hover:bg-slate-400/10',
            },
          ].map((b) => (
            <button
              key={b.type}
              onClick={() => handle(b.type)}
              disabled={dl !== null}
              className={`flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-medium transition-all disabled:opacity-50 ${b.cls}`}
            >
              {dl === b.type ? (
                <Loader size={10} className="animate-spin" />
              ) : (
                <Download size={10} />
              )}
              {b.label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-1.5 flex-wrap">
            <RefreshCw size={11} className="text-muted" />
            <span className="text-xs text-muted mr-0.5">Priority:</span>
            {['speed', 'accuracy', 'cost']
              .filter((p) => p !== config?.priority)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => onRerun({ priority: p })}
                  className="text-xs px-2 py-1 rounded-full border border-accent/20 text-accent-bright hover:bg-accent/10 transition-all capitalize"
                >
                  {p === 'speed' ? '⚡' : p === 'accuracy' ? '🎯' : '💰'} {p}
                </button>
              ))}
          </div>
        </div>

        {/* Task type switcher + target column changer */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-surface/20 flex-wrap">
          <MessageSquare size={11} className="text-muted flex-shrink-0" />
          <span className="text-xs text-muted">Switch task:</span>
          {[
            { type: 'classification', icon: '📊' },
            { type: 'regression', icon: '📈' },
            { type: 'clustering', icon: '🔵' },
          ]
            .filter((t) => t.type !== config?.taskType)
            .map((t) => (
              <button
                key={t.type}
                onClick={() => onSwitchTask(t.type)}
                className="text-xs px-2.5 py-1 rounded-full border border-cyan/20 text-cyan hover:bg-cyan/10 transition-all capitalize"
              >
                {t.icon} {t.type}
              </button>
            ))}
          {config?.taskType !== 'clustering' && (
            <button
              onClick={() => onChangeTarget()}
              className="text-xs px-2.5 py-1 rounded-full border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10 transition-all"
            >
              🎯 Change Target Column
            </button>
          )}
          <span className="ml-auto text-xs text-muted italic">
            same dataset · new task
          </span>
        </div>

        {/* Report content */}
        <div
          className={`px-4 py-4 overflow-y-auto transition-all ${expanded ? 'max-h-[700px]' : 'max-h-[420px]'}`}
        >
          <ReactMarkdown
            className="prose prose-invert prose-sm max-w-none
              prose-h1:text-white prose-h1:text-xl prose-h1:font-bold prose-h1:border-b prose-h1:border-accent/30 prose-h1:pb-2 prose-h1:mb-4
              prose-h2:text-accent-bright prose-h2:text-base prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-2
              prose-h3:text-cyan prose-h3:text-sm prose-h3:font-semibold prose-h3:mt-4 prose-h3:mb-1
              prose-p:text-slate-300 prose-p:leading-relaxed prose-p:my-2
              prose-li:text-slate-300 prose-li:my-1
              prose-strong:text-white prose-strong:font-semibold
              prose-code:text-cyan prose-code:bg-surface prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
              prose-pre:bg-[#16161e] prose-pre:border prose-pre:border-border prose-pre:rounded-xl prose-pre:p-4 prose-pre:overflow-x-auto
              prose-pre:text-[#a0dcff] prose-pre:text-xs prose-pre:font-mono prose-pre:leading-relaxed"
          >
            {report}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

// ── Picker widgets ─────────────────────────────────────────────────
const PillRow = ({ items, onSelect }) => (
  <div className="flex gap-3 pl-11 flex-wrap">
    {items.map(([label, value]) => (
      <button
        key={String(value)}
        onClick={() => onSelect(value, label)}
        className="px-4 py-2 rounded-full border border-border text-subtle hover:border-accent/60 hover:text-white hover:bg-accent/10 text-sm transition-all cursor-pointer"
      >
        {label}
      </button>
    ))}
  </div>
);

const ColumnPicker = ({ columns, onSelect }) => (
  <div className="pl-11 grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1">
    {columns.map((col, i) => (
      <button
        key={i}
        onClick={() => onSelect(i, col)}
        className="text-left px-3 py-1.5 rounded-lg border border-border hover:border-accent/50 hover:bg-accent/10 text-xs text-subtle hover:text-white transition-all cursor-pointer"
      >
        <span className="text-muted mr-1.5">{i}.</span>
        {col}
      </button>
    ))}
  </div>
);

// ── Follow-up suggestions bar ──────────────────────────────────────
function FollowUpSuggestions({ onSelect, currentTaskType, currentPriority }) {
  const filtered = FOLLOWUP_SUGGESTIONS.filter((s) => {
    if (s === `Switch to ${currentTaskType}`) return false;
    if (s === `Run again with ${currentPriority} priority`) return false;
    return true;
  });
  return (
    <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-none">
      {filtered.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="flex-shrink-0 px-3 py-1.5 rounded-full border border-border text-xs text-subtle hover:border-accent/50 hover:text-white hover:bg-accent/10 transition-all whitespace-nowrap"
        >
          {s}
        </button>
      ))}
    </div>
  );
}

// ── Follow-up input bar ────────────────────────────────────────────
function FollowUpBar({
  onSend,
  onRerunWithParams,
  uploadData,
  disabled,
  currentTaskType,
  currentPriority,
}) {
  const [text, setText] = useState('');

  const send = () => {
    const t = text.trim();
    if (!t || disabled) return;
    setText('');
    onSend(t);
  };

  return (
    <div className="border-t border-border flex-shrink-0">
      {/* Suggestions */}
      <div className="pt-2">
        <FollowUpSuggestions
          onSelect={(t) => {
            setText(t);
          }}
          currentTaskType={currentTaskType}
          currentPriority={currentPriority}
        />
      </div>
      {/* Input */}
      <div className="flex items-center gap-2 p-3 pt-1">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask a follow-up question or request a new run..."
          disabled={disabled}
          className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-muted focus:outline-none focus:border-accent/50 transition-colors disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={!text.trim() || disabled}
          className="w-10 h-10 rounded-xl bg-accent hover:bg-accent-bright flex items-center justify-center text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          {disabled ? (
            <Loader size={15} className="animate-spin" />
          ) : (
            <Send size={15} />
          )}
        </button>
      </div>
    </div>
  );
}

// ── Main ChatBot ───────────────────────────────────────────────────
export default function ChatBot({ userId, initialSession }) {
  // Restore from history or start fresh
  const [messages, setMessages] = useState(() => {
    if (initialSession?.messages?.length) return initialSession.messages;
    return [{ role: 'ai', content: GREETING }];
  });
  const [step, setStep] = useState(() => {
    if (initialSession?.status === 'done') return STEPS.FOLLOWUP;
    return STEPS.UPLOAD;
  });
  const [isTyping, setIsTyping] = useState(false);
  const [uploadData, setUploadData] = useState(
    () => initialSession?.uploadData || null
  );
  const [config, setConfig] = useState(
    () =>
      initialSession?.config || {
        filePath: null,
        taskType: null,
        targetColumn: null,
        priority: null,
        extendedDocs: false,
      }
  );
  const [logs, setLogs] = useState([]);
  const [report, setReport] = useState(() => initialSession?.report || null);
  const [dragging, setDragging] = useState(false);
  const [followupBusy, setFollowupBusy] = useState(false);
  const [session] = useState(() => initialSession || createSession());

  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const configRef = useRef(config);
  const reportRef = useRef(report);

  useEffect(() => {
    configRef.current = config;
  }, [config]);
  useEffect(() => {
    reportRef.current = report;
  }, [report]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, logs]);

  // Auto-save full message thread to history on every change
  useEffect(() => {
    if (!userId || messages.length <= 1) return;
    // Save serialisable messages only (strip widget callbacks — they're re-created on restore)
    const saveable = messages.map((m) => ({
      role: m.role,
      content: m.content,
      previewData: m.previewData || null,
      showLogs: m.showLogs || false,
      isReport: m.isReport || false,
      reportConfig: m.reportConfig || null,
    }));
    session.messages = saveable;
    session.config = configRef.current;
    session.report = reportRef.current;
    session.uploadData = uploadData
      ? {
          columns: uploadData.columns,
          preview: uploadData.preview,
          rows: uploadData.rows,
          cols: uploadData.cols,
          filename: uploadData.filename,
          file_path: uploadData.file_path,
        }
      : null;
    saveSession(userId, session);
  }, [messages]);

  const addMsg = useCallback(
    (role, content, extra = {}) =>
      setMessages((m) => [...m, { role, content, ...extra }]),
    []
  );

  const typeMsg = useCallback((content, delay = 650) => {
    setIsTyping(true);
    return new Promise((resolve) =>
      setTimeout(() => {
        setIsTyping(false);
        setMessages((m) => [...m, { role: 'ai', content }]);
        resolve();
      }, delay)
    );
  }, []);

  // ── File upload ──────────────────────────────────────────────
  const handleFile = async (file) => {
    if (!file?.name.endsWith('.csv')) {
      addMsg('ai', '⚠ Please upload a **.csv** file.');
      return;
    }
    addMsg('user', `📎 ${file.name}`);
    setIsTyping(true);
    try {
      const data = await uploadCSV(file);
      setUploadData(data);
      setConfig((c) => ({ ...c, filePath: data.file_path }));
      setIsTyping(false);
      addMsg(
        'ai',
        `✓ **${data.filename}** uploaded — **${data.rows.toLocaleString()} rows × ${data.cols} columns**\n\nHere's a preview:`,
        { previewData: { columns: data.columns, preview: data.preview } }
      );
      await new Promise((r) => setTimeout(r, 250));
      addMsg(
        'ai',
        `**Available columns (${data.columns.length}):**\n${data.columns.map((c, i) => `\`${i}. ${c}\``).join('  ')}\n\nWhat type of ML problem is this?`
      );
      setStep(STEPS.TASK_TYPE);
    } catch (e) {
      setIsTyping(false);
      addMsg('ai', `⚠ Upload failed: ${e.message}`);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  // ── Pipeline steps ───────────────────────────────────────────
  const handleTaskType = async (value, label) => {
    setStep(STEPS.RUNNING);
    addMsg('user', label);
    setConfig((c) => ({ ...c, taskType: value }));
    if (value === 'clustering') {
      setConfig((c) => ({ ...c, targetColumn: null }));
      await typeMsg(
        'Got it — **Clustering** task. No target column needed.\n\nWhat should I optimise for?'
      );
      setStep(STEPS.PRIORITY);
    } else {
      await typeMsg(
        `**${label.replace(/^[^\s]+ /, '')}** selected.\n\nWhich column is your **target variable**?`
      );
      setStep(STEPS.TARGET_COLUMN);
    }
  };

  const handleTargetColumn = async (colIndex, colName) => {
    setStep(STEPS.RUNNING);
    addMsg('user', `${colIndex}. ${colName}`);
    setConfig((c) => ({ ...c, targetColumn: colName }));
    await typeMsg(
      `Target set to **"${colName}"**.\n\nWhat should I optimise for?`
    );
    setStep(STEPS.PRIORITY);
  };

  const handlePriority = async (value, label) => {
    setStep(STEPS.RUNNING);
    addMsg('user', label);
    setConfig((c) => ({ ...c, priority: value }));
    await typeMsg(
      'Do you want **extended technical documentation**?\n\n*(Feature importance, hyperparameter reasoning, model limitations, future improvements)*'
    );
    setStep(STEPS.EXTENDED_DOCS);
  };

  const handleExtendedDocs = async (value, label) => {
    setStep(STEPS.RUNNING);
    addMsg('user', label);
    const cfg = { ...configRef.current, extendedDocs: value };
    setConfig(cfg);
    if (userId) {
      session.title = `${cfg.taskType} · ${cfg.targetColumn || 'clustering'} · ${cfg.priority}`;
      session.config = cfg;
      session.status = 'running';
      saveSession(userId, session);
    }
    await typeMsg(
      `**Configuration:**\n- Task: \`${cfg.taskType}\`  · Target: \`${cfg.targetColumn || 'N/A'}\`\n- Priority: \`${cfg.priority}\`  · Extended Docs: \`${value ? 'Yes' : 'No'}\`\n\nLaunching **15-agent pipeline** 🚀`
    );
    addMsg('ai', '**Pipeline running** — agents working in real time:', {
      showLogs: true,
    });
    setLogs([]);
    await launchPipeline(cfg);
  };

  const launchPipeline = async (cfg) => {
    try {
      const { job_id } = await runPipeline({
        filePath: cfg.filePath,
        taskType: cfg.taskType,
        targetColumn: cfg.targetColumn,
        priority: cfg.priority,
        extendedDocs: cfg.extendedDocs,
      });
      streamLogs(
        job_id,
        (log) => setLogs((l) => [...l, log]),
        async (status) => {
          if (status === 'done') {
            let attempts = 0;
            const poll = async () => {
              const data = await fetch(`/api/status/${job_id}`).then((r) =>
                r.json()
              );
              if (data.report) {
                setReport(data.report);
                setStep(STEPS.DONE);
                addMsg('ai', '__REPORT__', {
                  isReport: true,
                  reportConfig: cfg,
                });
                // Follow-up invite
                setTimeout(() => {
                  setMessages((m) => [
                    ...m,
                    {
                      role: 'ai',
                      content: `✅ **Report complete!** You can now:\n- **Ask me anything** about the results, model, or dataset\n- **Rerun** with different priority or target column using the buttons above\n- **Type a question** below — I'll answer using your report as context`,
                    },
                  ]);
                  setStep(STEPS.FOLLOWUP);
                }, 600);
                if (userId) {
                  session.status = 'done';
                  session.report = data.report;
                  saveSession(userId, session);
                }
              } else if (attempts++ < 20) {
                setTimeout(poll, 1500);
              }
            };
            poll();
          } else {
            addMsg(
              'ai',
              '⚠ Pipeline error. Check the uvicorn terminal and try again.'
            );
            setStep(STEPS.FOLLOWUP);
          }
        }
      );
    } catch (e) {
      addMsg('ai', `⚠ Failed to start pipeline: ${e.message}`);
      setStep(STEPS.FOLLOWUP);
    }
  };

  // ── Rerun with overrides ─────────────────────────────────────
  const handleRerun = async (overrides) => {
    const cfg = { ...configRef.current, ...overrides };
    setConfig(cfg);
    setLogs([]);
    const parts = [];
    if (overrides.priority) parts.push(`priority → **${overrides.priority}**`);
    if (overrides.targetColumn)
      parts.push(`target → **${overrides.targetColumn}**`);
    if (overrides.taskType) parts.push(`task → **${overrides.taskType}**`);
    addMsg('user', `🔄 Rerun with ${parts.join(', ')}`);
    await typeMsg(
      `Got it! Relaunching the pipeline with **${parts.join(', ')}**...\n\nSame dataset, new configuration. 🚀`
    );
    addMsg('ai', '**Pipeline running** — agents working in real time:', {
      showLogs: true,
    });
    setStep(STEPS.RUNNING);
    if (userId) {
      session.status = 'running';
      saveSession(userId, session);
    }
    await launchPipeline(cfg);
  };

  // ── Change target column on same dataset ─────────────────────────
  const handleChangeTarget = async () => {
    addMsg(
      'ai',
      'Pick a new **target column** from your dataset (' +
        (uploadData ? uploadData.columns.length : 0) +
        ' columns available):',
      { showTargetPicker: true }
    );
    setStep(STEPS.TARGET_COLUMN);
  };

  // ── Switch task type on same dataset ────────────────────────────
  const handleSwitchTask = async (newTaskType) => {
    const isCluster = newTaskType === 'clustering';
    addMsg('user', `🔄 Switch to ${newTaskType}`);

    if (isCluster) {
      // Clustering needs no target — ask priority directly
      const cfg = {
        ...configRef.current,
        taskType: newTaskType,
        targetColumn: null,
      };
      setConfig(cfg);
      await typeMsg(
        `Switching to **${newTaskType}** on the same dataset.

No target column needed for clustering.

What priority should I optimise for?`
      );
      setStep(STEPS.PRIORITY);
    } else {
      // Classification/Regression need a target column
      const cfg = { ...configRef.current, taskType: newTaskType };
      setConfig(cfg);
      await typeMsg(
        `Switching to **${newTaskType}** on the same dataset.

Which column should be the **target variable**?`
      );
      setStep(STEPS.TARGET_COLUMN);
    }
  };

  // ── Follow-up Q&A ────────────────────────────────────────────
  const handleFollowUp = async (text) => {
    if (!text.trim()) return;

    // Check if it's a rerun request
    const lower = text.toLowerCase();
    const priorityMatch = lower.match(/\b(speed|accuracy|cost)\b/);
    const targetMatch = uploadData?.columns.find((c) =>
      lower.includes(c.toLowerCase())
    );
    const isRerun =
      lower.includes('rerun') ||
      lower.includes('run again') ||
      lower.includes('try again') ||
      lower.includes('different');

    // Task type switch detection
    if (
      lower.includes('switch') ||
      lower.includes('change') ||
      lower.includes('try')
    ) {
      if (lower.includes('regression')) {
        await handleSwitchTask('regression');
        return;
      }
      if (lower.includes('clustering')) {
        await handleSwitchTask('clustering');
        return;
      }
      if (lower.includes('classification')) {
        await handleSwitchTask('classification');
        return;
      }
    }

    // Target column change detection
    if (
      lower.includes('target') ||
      lower.includes('different column') ||
      lower.includes('change column') ||
      lower.includes('another column')
    ) {
      await handleChangeTarget();
      return;
    }

    if (isRerun && priorityMatch) {
      await handleRerun({ priority: priorityMatch[1] });
      return;
    }
    if (isRerun && targetMatch) {
      await handleRerun({ targetColumn: targetMatch });
      return;
    }
    if (lower.includes('extended') || lower.includes('documentation')) {
      await handleRerun({ extendedDocs: true });
      return;
    }

    // Otherwise ask the AI about the report
    addMsg('user', text);
    setFollowupBusy(true);
    setIsTyping(true);

    try {
      const currentReport = reportRef.current;
      const systemPrompt = `You are AutoML Agent, an AI assistant. The user has just completed an AutoML pipeline run. 
Here is their report:

${currentReport}

Dataset info: ${uploadData ? `${uploadData.rows} rows, ${uploadData.cols} columns, columns: ${uploadData.columns.join(', ')}` : 'Unknown'}
Config: task=${configRef.current.taskType}, target=${configRef.current.targetColumn}, priority=${configRef.current.priority}

Answer the user's question concisely and helpfully based on their specific report and data. Be direct and specific.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: 'user', content: text }],
        }),
      });

      const data = await response.json();
      const answer =
        data.content?.map((b) => b.text || '').join('') ||
        'Sorry, I could not get a response.';
      setIsTyping(false);
      addMsg('ai', answer);
    } catch (e) {
      setIsTyping(false);
      // Fallback: handle locally
      addMsg(
        'ai',
        handleFollowUpLocally(text, configRef.current, reportRef.current)
      );
    }

    setFollowupBusy(false);
  };

  // ── Local fallback answers ────────────────────────────────────
  const handleFollowUpLocally = (text, cfg, rep) => {
    const lower = text.toLowerCase();
    if (lower.includes('accuracy') && lower.includes('improve'))
      return `To improve accuracy on this dataset, consider:\n\n- **Switch priority to Accuracy** — click the 🎯 Accuracy rerun button above to use XGBoost/LightGBM instead\n- **Feature engineering** — create interaction terms between numeric columns\n- **Hyperparameter tuning** — run a grid search around the selected model's parameters\n- **Ensemble methods** — combine multiple models for better generalisation`;
    if (lower.includes('feature') || lower.includes('important'))
      return `Feature importance can be extracted from the trained model. The Decision Tree / tree-based models provide \`feature_importances_\` directly:\n\`\`\`python\nimport pandas as pd\nfeature_imp = pd.Series(model.feature_importances_, index=X.columns).sort_values(ascending=False)\nprint(feature_imp.head(10))\n\`\`\``;
    if (lower.includes('roc') || lower.includes('auc'))
      return `**ROC-AUC** (Receiver Operating Characteristic — Area Under Curve) measures the model's ability to distinguish between classes.\n\n- **1.0** = perfect classifier\n- **0.5** = random guessing\n- **Your model's AUC** is shown in the Evaluation Metrics section above\n\nA higher AUC means the model ranks positive examples above negative ones more reliably.`;
    if (lower.includes('overfit'))
      return `Overfitting signs to watch for:\n- Training accuracy >> Validation accuracy\n- High variance in cross-validation scores\n\nThe current model uses \`max_depth=5\` specifically to limit overfitting. To reduce it further:\n- Decrease \`max_depth\` to 3–4\n- Increase \`min_samples_split\`\n- Add regularisation (for tree boosters)`;
    return `That's a great question about your ${cfg.taskType} model! Based on your report, the model was optimised for **${cfg.priority}** priority on the **${cfg.targetColumn || 'clustering'}** task.\n\nCould you be more specific? For example:\n- *"How can I improve the F1 score?"*\n- *"What does the confusion matrix tell me?"*\n- *"Rerun with accuracy priority"*`;
  };

  // ── Reset ────────────────────────────────────────────────────
  const reset = () => {
    setStep(STEPS.UPLOAD);
    setMessages([{ role: 'ai', content: GREETING }]);
    setIsTyping(false);
    setUploadData(null);
    setLogs([]);
    setReport(null);
    setFollowupBusy(false);
    setConfig({
      filePath: null,
      taskType: null,
      targetColumn: null,
      priority: null,
      extendedDocs: false,
    });
  };

  const handleChangeTargetAfterReport = async () => {
    addMsg(
      'ai',
      `Sure! Here are the available columns — pick a new target:\n\n${uploadData.columns.map((c, i) => `\`${i}. ${c}\``).join('  ')}`,
      { showTargetPicker: true }
    );
    setStep(STEPS.TARGET_COLUMN);
  };
  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
        {messages.map((msg, i) => (
          <div key={i}>
            {msg.role === 'ai' ? (
              msg.isReport ? (
                <ReportBubble
                  report={report}
                  config={msg.reportConfig}
                  onRerun={handleRerun}
                  onSwitchTask={handleSwitchTask}
                  onChangeTarget={handleChangeTarget}
                  onReset={reset}
                />
              ) : (
                <AIBubble>
                  <ReactMarkdown className="prose prose-invert prose-sm max-w-none prose-p:my-0.5 prose-code:bg-surface prose-code:px-1 prose-code:rounded prose-code:text-accent-bright prose-pre:bg-surface prose-pre:border prose-pre:border-border prose-pre:rounded-xl prose-pre:p-3 prose-pre:text-cyan prose-pre:text-xs prose-pre:font-mono">
                    {msg.content}
                  </ReactMarkdown>
                  {msg.previewData && <DataPreview {...msg.previewData} />}
                  {msg.showLogs && <AgentLog logs={logs} />}
                  {msg.showTargetPicker && uploadData && (
                    <div className="mt-3 grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                      {uploadData.columns.map((col, i) => (
                        <button
                          key={i}
                          onClick={() => handleRerun({ targetColumn: col })}
                          className="text-left px-3 py-1.5 rounded-lg border border-border hover:border-accent/50 hover:bg-accent/10 text-xs text-subtle hover:text-white transition-all"
                        >
                          <span className="text-muted mr-1.5">{i}.</span>
                          {col}
                        </button>
                      ))}
                    </div>
                  )}
                </AIBubble>
              )
            ) : (
              <UserBubble>{msg.content}</UserBubble>
            )}
          </div>
        ))}

        {isTyping && <AIBubble isTyping />}

        {/* Step pickers */}
        {step === STEPS.TASK_TYPE && !isTyping && (
          <PillRow
            items={[
              ['📊 Classification', 'classification'],
              ['📈 Regression', 'regression'],
              ['🔵 Clustering', 'clustering'],
            ]}
            onSelect={handleTaskType}
          />
        )}
        {step === STEPS.TARGET_COLUMN && !isTyping && uploadData && (
          <ColumnPicker
            columns={uploadData.columns}
            onSelect={handleTargetColumn}
          />
        )}
        {step === STEPS.PRIORITY && !isTyping && (
          <PillRow
            items={[
              ['⚡ Speed', 'speed'],
              ['🎯 Accuracy', 'accuracy'],
              ['💰 Cost', 'cost'],
            ]}
            onSelect={handlePriority}
          />
        )}
        {step === STEPS.EXTENDED_DOCS && !isTyping && (
          <PillRow
            items={[
              ['✅ Yes, include it', true],
              ['❌ No thanks', false],
            ]}
            onSelect={handleExtendedDocs}
          />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Upload zone */}
      {step === STEPS.UPLOAD && (
        <div className="p-4 border-t border-border flex-shrink-0">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-xl border-2 border-dashed p-7 text-center cursor-pointer transition-all ${dragging ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/40 hover:bg-surface/50'}`}
          >
            <Upload size={22} className="mx-auto mb-2 text-muted" />
            <p className="text-sm text-subtle">
              Drop your CSV here, or{' '}
              <span className="text-accent-bright">click to browse</span>
            </p>
            <p className="text-xs text-muted mt-1">Supports .csv files only</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
          />
        </div>
      )}

      {/* Running bar */}
      {step === STEPS.RUNNING && (
        <div className="p-4 border-t border-border flex-shrink-0">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface border border-border text-sm text-muted">
            <Loader
              size={14}
              className="animate-spin text-accent-bright flex-shrink-0"
            />
            <span>Pipeline running — agents are working, please wait...</span>
          </div>
        </div>
      )}

      {/* Follow-up input — shown after report is done */}
      {step === STEPS.FOLLOWUP && (
        <FollowUpBar
          onSend={handleFollowUp}
          onRerunWithParams={handleRerun}
          uploadData={uploadData}
          disabled={followupBusy || isTyping}
          currentTaskType={config.taskType}
          currentPriority={config.priority}
        />
      )}
    </div>
  );
}
