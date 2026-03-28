// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react'
import { Cpu, Plus, Clock, CheckCircle, AlertCircle, Loader, Trash2,
         LogOut, ChevronRight, BarChart3, FileText, X, Copy, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getSessions, deleteSession } from '../lib/history'
import { downloadTxt, downloadPdf, downloadPy, downloadIpynb } from '../lib/download'
import ChatBot from '../components/ChatBot'
import ReactMarkdown from 'react-markdown'

// ── CodeBlock with copy button ────────────────────────────────────
function CodeBlock({ inline, className, children }) {
  const [copied, setCopied] = useState(false)
  const code = String(children).replace(/\n$/, '')
  if (inline) return <code className="bg-surface border border-border/50 text-cyan px-1.5 py-0.5 rounded text-xs font-mono">{code}</code>
  const copy = () => { navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }) }
  return (
    <div className="relative group my-3">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a2e] rounded-t-xl border border-border border-b-0">
        <span className="text-xs text-muted font-mono">{className?.replace('language-', '') || 'python'}</span>
        <button onClick={copy} className="flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors">
          {copied ? <><Check size={12} className="text-emerald-400" /><span className="text-emerald-400">Copied!</span></> : <><Copy size={12} /><span>Copy</span></>}
        </button>
      </div>
      <pre className="bg-[#16161e] border border-border border-t-0 rounded-b-xl p-4 overflow-x-auto m-0">
        <code className="text-[#a0dcff] text-xs font-mono leading-relaxed whitespace-pre">{code}</code>
      </pre>
    </div>
  )
}
const MD_COMPONENTS = { code: CodeBlock }

function StatusBadge({ status }) {
  const map = {
    new:     { icon: Clock,         cls: 'text-muted border-muted/30 bg-muted/5',         label: 'New' },
    running: { icon: Loader,        cls: 'text-accent-bright border-accent/30 bg-accent/5', label: 'Running' },
    done:    { icon: CheckCircle,   cls: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5', label: 'Completed' },
    error:   { icon: AlertCircle,   cls: 'text-red-400 border-red-400/30 bg-red-400/5',    label: 'Error' },
  }
  const { icon: Icon, cls, label } = map[status] || map.new
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${cls}`}>
      <Icon size={10} className={status==='running'?'animate-spin':''} /> {label}
    </span>
  )
}

function SessionCard({ session, onDelete, onView, onOpenChat, onDownload }) {
  const date = new Date(session.createdAt).toLocaleDateString('en-US',{ month:'short', day:'numeric', year:'numeric' })
  const time = new Date(session.createdAt).toLocaleTimeString('en-US',{ hour:'2-digit', minute:'2-digit' })
  return (
    <div className="glass glass-hover rounded-xl p-4 group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={session.status} />
            <span className="text-xs text-muted">{date} · {time}</span>
          </div>
          <h3 className="text-white text-sm font-semibold truncate capitalize">{session.title}</h3>
          {session.config && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[
                session.config.taskType,
                session.config.targetColumn && `target: ${session.config.targetColumn}`,
                session.config.priority && `priority: ${session.config.priority}`,
              ].filter(Boolean).map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-md bg-surface border border-border text-xs text-subtle font-mono">{tag}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {session.report && (
            <>
              <button onClick={() => onView(session)}
                title="View Report"
                className="w-7 h-7 rounded-lg border border-border hover:border-accent/40 flex items-center justify-center text-muted hover:text-white transition-all">
                <FileText size={13} />
              </button>
              <button onClick={() => onDownload(session, 'pdf')} title="Download PDF"
                className="w-7 h-7 rounded-lg border border-border hover:border-red-400/40 flex items-center justify-center text-muted hover:text-red-400 transition-all">
                <span className="text-[9px] font-bold">PDF</span>
              </button>
              <button onClick={() => onDownload(session, 'txt')} title="Download TXT"
                className="w-7 h-7 rounded-lg border border-border hover:border-slate-400/40 flex items-center justify-center text-muted hover:text-slate-300 transition-all">
                <span className="text-[9px] font-bold">TXT</span>
              </button>
              <button onClick={() => onDownload(session, 'py')} title="Download Python"
                className="w-7 h-7 rounded-lg border border-border hover:border-blue-400/40 flex items-center justify-center text-muted hover:text-blue-400 transition-all">
                <span className="text-[9px] font-bold">.py</span>
              </button>
              <button onClick={() => onDownload(session, 'ipynb')} title="Download Notebook"
                className="w-7 h-7 rounded-lg border border-border hover:border-orange-400/40 flex items-center justify-center text-muted hover:text-orange-400 transition-all">
                <span className="text-[9px] font-bold">nb</span>
              </button>

            </>
          )}
          <button onClick={() => onDelete(session.id)}
            title="Delete"
            className="w-7 h-7 rounded-lg border border-border hover:border-red-400/40 flex items-center justify-center text-muted hover:text-red-400 transition-all">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => onOpenChat(session)}
          className="flex-1 text-left text-xs text-accent-bright hover:text-white border border-accent/20 hover:border-accent/50 hover:bg-accent/5 rounded-lg px-3 py-2 transition-all flex items-center justify-between">
          <span>💬 Continue chat</span>
          <ChevronRight size={12} />
        </button>
        {session.report && (
          <button onClick={() => onView(session)}
            className="text-xs text-muted hover:text-white border border-border hover:border-border/80 rounded-lg px-3 py-2 transition-all">
            Report only
          </button>
        )}
      </div>
    </div>
  )
}

function ReportModal({ session, onClose }) {
  const [dl, setDl] = useState(null)
  const handle = async (type) => {
    setDl(type)
    try {
      const ts = session.createdAt.slice(0,10)
      if (type==='pdf')   await downloadPdf(session.report, `automl_report_${ts}.pdf`)
      if (type==='txt')   downloadTxt(session.report, `automl_report_${ts}.txt`)
      if (type==='py')    downloadPy(session.report, `automl_pipeline_${ts}.py`)
      if (type==='ipynb') downloadIpynb(session.report, session.report, `automl_pipeline_${ts}.ipynb`)
    } catch(e) { console.error(e) }
    setDl(null)
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="absolute inset-0 bg-void/85 backdrop-blur-md" />
      <div className="relative w-full max-w-3xl h-[90vh] flex flex-col rounded-2xl border border-border overflow-hidden animate-fade-in" style={{background:'#0e0e14'}}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div>
            <p className="text-white font-semibold text-sm capitalize">{session.title}</p>
            <p className="text-xs text-muted">{new Date(session.createdAt).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2">
            {[
              { type:'pdf', label:'PDF', cls:'text-red-400 border-red-400/30 hover:bg-red-400/10' },
              { type:'txt', label:'TXT', cls:'text-slate-400 border-slate-400/30 hover:bg-slate-400/10' },
            ].map(b => (
              <button key={b.type} onClick={()=>handle(b.type)} disabled={dl!==null}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-medium transition-all disabled:opacity-50 ${b.cls}`}>
                {dl===b.type ? <Loader size={10} className="animate-spin" /> : null}
                {b.label}
              </button>
            ))}
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg border border-border hover:border-accent/40 flex items-center justify-center text-muted hover:text-white transition-all ml-1">
              <X size={15} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <ReactMarkdown
            className="prose prose-invert prose-sm max-w-none
              prose-h1:text-white prose-h1:text-xl prose-h1:font-bold prose-h1:border-b prose-h1:border-accent/30 prose-h1:pb-2 prose-h1:mb-4
              prose-h2:text-accent-bright prose-h2:text-base prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-2
              prose-h3:text-cyan prose-h3:text-sm prose-h3:font-semibold prose-h3:mt-4
              prose-p:text-slate-300 prose-p:leading-relaxed prose-p:my-2
              prose-li:text-slate-300 prose-strong:text-white"
            components={MD_COMPONENTS}>
            {session.report}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [sessions, setSessions]         = useState([])
  const [chatOpen, setChatOpen]         = useState(false)
  const [activeSession, setActiveSession] = useState(null)
  const [viewSession, setViewSession]   = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)  // session id to confirm delete
  const [backendOk, setBackendOk]       = useState(null)

  const load = () => setSessions(getSessions(user.id))
  useEffect(() => { load() }, [])

  useEffect(() => {
    import('../lib/api').then(({ checkHealth }) => {
      checkHealth().then(h => setBackendOk(h?.status==='ok' && h?.openai_key))
    })
  }, [])

  const handleDelete = (id) => setConfirmDelete(id)

  const confirmDeleteSession = () => {
    deleteSession(user.id, confirmDelete)
    load()
    setConfirmDelete(null)
  }

  const handleDownload = async (session, type) => {
    const ts = session.createdAt.slice(0,10)
    if (type==='pdf')   await downloadPdf(session.report, `automl_report_${ts}.pdf`)
    if (type==='txt')   downloadTxt(session.report, `automl_report_${ts}.txt`)
    if (type==='py')    downloadPy(session.report, `automl_pipeline_${ts}.py`)
    if (type==='ipynb') downloadIpynb(session.report, session.report, `automl_pipeline_${ts}.ipynb`)
  }

  const completedCount = sessions.filter(s => s.status==='done').length

  return (
    <div className="min-h-screen bg-void">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-64 bg-surface border-r border-border flex flex-col z-30">
        {/* Logo */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
              <Cpu size={15} className="text-accent-bright" />
            </div>
            <span className="text-white font-bold tracking-tight">AutoML Agent</span>
          </div>
        </div>

        {/* New pipeline button */}
        <div className="p-4">
          <button onClick={() => { setActiveSession(null); setChatOpen(true) }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent hover:bg-accent-bright text-white text-sm font-medium transition-all glow-accent">
            <Plus size={16} /> New Pipeline
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 overflow-y-auto">
          <div className="text-xs text-muted font-medium uppercase tracking-wider px-2 mb-2">Recent Pipelines</div>
          {sessions.length === 0 ? (
            <p className="text-xs text-muted px-2 py-3">No pipelines yet. Start your first one!</p>
          ) : (
            <div className="space-y-1">
              {sessions.slice(0,15).map(s => (
                <button key={s.id} onClick={() => { setActiveSession(s); setChatOpen(true) }}
                  className="w-full text-left px-2 py-2 rounded-lg hover:bg-panel transition-colors group">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      s.status==='done'?'bg-emerald-400':s.status==='error'?'bg-red-400':s.status==='running'?'bg-accent-bright animate-pulse':'bg-muted'
                    }`} />
                    <span className="text-xs text-subtle group-hover:text-white transition-colors truncate capitalize">{s.title}</span>
                  </div>
                  <p className="text-[10px] text-muted mt-0.5 ml-3.5">{new Date(s.createdAt).toLocaleDateString()}</p>
                </button>
              ))}
            </div>
          )}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-accent-bright font-semibold">{user.name[0].toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-medium truncate">{user.name}</p>
                <p className="text-muted text-[10px] truncate">{user.email}</p>
              </div>
            </div>
            <button onClick={logout} title="Sign out"
              className="w-7 h-7 rounded-lg border border-border hover:border-red-400/40 flex items-center justify-center text-muted hover:text-red-400 transition-all flex-shrink-0">
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-subtle text-sm mt-1">Welcome back, <span className="text-white">{user.name}</span></p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label:'Total Pipelines', value: sessions.length, icon: BarChart3, color:'accent' },
            { label:'Completed',       value: completedCount,   icon: CheckCircle, color:'emerald' },
            { label:'Backend',         value: backendOk===null?'Checking':backendOk?'Online':'Offline',
              icon: Cpu, color: backendOk?'emerald':backendOk===null?'yellow':'red' },
          ].map((stat, i) => (
            <div key={i} className="glass rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-subtle text-sm">{stat.label}</span>
                <stat.icon size={16} className={`text-${stat.color === 'accent' ? 'accent-bright' : stat.color+'-400'}`} />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Backend warning */}
        {backendOk === false && (
          <div className="mb-6 flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
            <span>Backend is offline. Run <code className="font-mono bg-red-500/10 px-1 rounded text-xs ml-1">python -m uvicorn api:app --reload --port 8000</code> to start it.</span>
          </div>
        )}

        {/* Sessions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Pipeline History</h2>
            {sessions.length > 0 && (
              <span className="text-xs text-muted">{sessions.length} total</span>
            )}
          </div>

          {sessions.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <Cpu size={32} className="mx-auto mb-4 text-accent/40" />
              <h3 className="text-white font-semibold mb-2">No pipelines yet</h3>
              <p className="text-subtle text-sm mb-6">Start your first AutoML pipeline by uploading a CSV dataset</p>
              <button onClick={() => { setActiveSession(null); setChatOpen(true) }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-bright text-white text-sm font-medium transition-all">
                <Plus size={15} /> Start First Pipeline
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {sessions.map(s => (
                <SessionCard key={s.id} session={s}
                  onDelete={handleDelete}
                  onView={setViewSession}
                  onOpenChat={(s) => { setActiveSession(s); setChatOpen(true) }}
                  onDownload={handleDownload} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Modal */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&setChatOpen(false)}>
          <div className="absolute inset-0 bg-void/85 backdrop-blur-md" />
          <div className="relative w-full max-w-2xl h-[88vh] max-h-[820px] flex flex-col rounded-2xl border border-border overflow-hidden animate-fade-in" style={{background:'#0e0e14'}}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
                  <Cpu size={15} className="text-accent-bright" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">AutoML Agent</p>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${backendOk===null?'bg-yellow-400 animate-pulse':backendOk?'bg-emerald-400':'bg-red-400'}`} />
                    <span className="text-xs text-muted">{backendOk===null?'Connecting...':backendOk?'Backend online':'Backend offline'}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => { setChatOpen(false); load() }}
                className="w-8 h-8 rounded-lg border border-border hover:border-accent/40 flex items-center justify-center text-muted hover:text-white transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatBot key={activeSession?.id || "new"} userId={user.id} initialSession={activeSession} />
            </div>
          </div>
        </div>
      )}

      {/* Report modal */}
      {viewSession && <ReportModal session={viewSession} onClose={() => setViewSession(null)} />}

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="absolute inset-0 bg-void/80 backdrop-blur-sm" />
          <div className="relative bg-surface border border-border rounded-2xl p-6 w-full max-w-sm animate-fade-in shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center flex-shrink-0">
                <Trash2 size={16} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Delete pipeline?</h3>
                <p className="text-muted text-xs mt-0.5">This will permanently remove the chat and report.</p>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 rounded-xl border border-border text-subtle hover:text-white text-sm transition-all">
                Cancel
              </button>
              <button onClick={confirmDeleteSession}
                className="flex-1 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-medium text-sm transition-all">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
