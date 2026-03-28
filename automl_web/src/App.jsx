// src/App.jsx
import { useState } from 'react'
import { X, Cpu, AlertCircle } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import AgentPipeline from './components/AgentPipeline'
import Features from './components/Features'
import { ReportPreview } from './components/Footer'
import Footer from './components/Footer'
import ChatBot from './components/ChatBot'

// ── Inner app — has access to auth context ─────────────────────────
function InnerApp() {
  const { user, loading } = useAuth()
  const [chatOpen, setChatOpen]   = useState(false)
  const [showAuth, setShowAuth]   = useState(false)
  const [backendOk, setBackendOk] = useState(null)

  // Check backend once on mount
  useState(() => {
    import('./lib/api').then(({ checkHealth }) => {
      checkHealth().then(h => setBackendOk(h?.status==='ok' && h?.openai_key))
    })
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Logged in → show dashboard
  if (user) return <Dashboard />

  // Auth page
  if (showAuth) return <AuthPage onBack={() => setShowAuth(false)} />

  // Landing page
  const openChat = () => {
    // Prompt login before chatting
    setShowAuth(true)
  }

  return (
    <div className="min-h-screen bg-void text-slate-200">
      <Navbar onLaunch={openChat} />
      <main>
        <Hero onLaunch={openChat} />
        <HowItWorks />
        <AgentPipeline />
        <Features />
        <ReportPreview />
      </main>
      <Footer />

      {/* Guest chat modal — allows trying without login */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
          onClick={e => e.target===e.currentTarget && setChatOpen(false)}>
          <div className="absolute inset-0 bg-void/80 backdrop-blur-md" />
          <div className="relative w-full max-w-2xl h-[85vh] max-h-[800px] flex flex-col rounded-2xl border border-border overflow-hidden animate-fade-in" style={{background:'#0e0e14'}}>
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
              <button onClick={() => setChatOpen(false)}
                className="w-8 h-8 rounded-lg border border-border hover:border-accent/40 flex items-center justify-center text-muted hover:text-white transition-all">
                <X size={16} />
              </button>
            </div>
            {backendOk === false && (
              <div className="mx-4 mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex-shrink-0">
                <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                <span>Backend offline. Run <code className="font-mono ml-1">python -m uvicorn api:app --reload --port 8000</code></span>
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <ChatBot />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <InnerApp />
    </AuthProvider>
  )
}
