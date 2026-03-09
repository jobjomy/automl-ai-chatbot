// src/pages/AuthPage.jsx
import { useState } from 'react'
import { Cpu, Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function AuthPage() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login') // login | register
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setError(''); setLoading(true)
    try {
      if (mode === 'login') {
        if (!form.email || !form.password) throw new Error('Please fill in all fields')
        login(form.email, form.password)
      } else {
        if (!form.name || !form.email || !form.password) throw new Error('Please fill in all fields')
        if (form.password.length < 6) throw new Error('Password must be at least 6 characters')
        register(form.name, form.email, form.password)
      }
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  const handleKey = (e) => { if (e.key === 'Enter') handleSubmit() }

  return (
    <div className="min-h-screen bg-void dot-grid flex flex-col items-center justify-center p-6">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-accent/8 blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center">
            <Cpu size={20} className="text-accent-bright" />
          </div>
          <span className="text-white text-xl font-bold tracking-tight">AutoML Agent</span>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl border border-border p-8">
          <h1 className="text-white text-2xl font-bold mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-subtle text-sm mb-7">
            {mode === 'login'
              ? 'Sign in to access your ML pipelines and history'
              : 'Start building AI-powered ML models for free'}
          </p>

          {/* Fields */}
          <div className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="text-xs text-subtle mb-1.5 block">Full Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text" placeholder="John Doe" value={form.name}
                    onChange={e => set('name', e.target.value)} onKeyDown={handleKey}
                    className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-accent/50 transition-colors" />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-subtle mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email" placeholder="you@example.com" value={form.email}
                  onChange={e => set('email', e.target.value)} onKeyDown={handleKey}
                  className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-accent/50 transition-colors" />
              </div>
            </div>

            <div>
              <label className="text-xs text-subtle mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="password" placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'} value={form.password}
                  onChange={e => set('password', e.target.value)} onKeyDown={handleKey}
                  className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-accent/50 transition-colors" />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle size={13} className="flex-shrink-0" /> {error}
            </div>
          )}

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading}
            className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent hover:bg-accent-bright text-white font-semibold text-sm transition-all disabled:opacity-60 glow-accent">
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            {!loading && <ArrowRight size={15} />}
          </button>

          {/* Toggle */}
          <p className="mt-5 text-center text-xs text-subtle">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
              className="text-accent-bright hover:underline font-medium">
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-muted mt-6">
          Your data stays local — no server accounts required
        </p>
      </div>
    </div>
  )
}
