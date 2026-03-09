// src/components/Hero.jsx
import { ArrowRight, Zap } from 'lucide-react'

export default function Hero({ onLaunch }) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 dot-grid overflow-hidden">
      {/* Glow orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-2/3 left-1/4 w-[300px] h-[300px] rounded-full bg-cyan/5 blur-[80px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-accent/20 text-xs text-accent-bright mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse-slow" />
          15 Specialized AI Agents · Powered by GPT-4o-mini + LangChain
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.05]">
          Your AI-Powered<br />
          <span className="text-gradient">AutoML Engineer</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-subtle max-w-2xl mx-auto mb-10 leading-relaxed">
          Upload a dataset. Answer 4 questions. Let 15 specialized AI agents
          build, train, evaluate and document your ML model — automatically.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <button onClick={onLaunch}
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-accent hover:bg-accent-bright text-white font-semibold text-base transition-all duration-200 glow-accent">
            Start Building <ArrowRight size={18} />
          </button>
          <a href="#how-it-works"
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl border border-border hover:border-accent/40 text-subtle hover:text-white text-base transition-all duration-200">
            See How It Works
          </a>
        </div>

        {/* Trust bar */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted">
          {['GPT-4o-mini', 'LangChain', '15 Agents', '64 ML Models', 'Zero ML Knowledge Required'].map(item => (
            <span key={item} className="flex items-center gap-1.5">
              <Zap size={10} className="text-accent-bright" /> {item}
            </span>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted text-xs">
        <span>Scroll to explore</span>
        <div className="w-px h-8 bg-gradient-to-b from-accent/40 to-transparent" />
      </div>
    </section>
  )
}
