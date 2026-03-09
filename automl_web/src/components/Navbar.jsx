// src/components/Navbar.jsx
import { useState, useEffect } from 'react'
import { Cpu, Github, BookOpen, ArrowRight } from 'lucide-react'

export default function Navbar({ onLaunch }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'glass border-b border-border/50' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
            <Cpu size={16} className="text-accent-bright" />
          </div>
          <span className="font-bold text-white tracking-tight">AutoML Agent</span>
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center gap-6">
          <a href="https://github.com" target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-sm text-subtle hover:text-white transition-colors">
            <Github size={14} /> GitHub
          </a>
          <a href="#how-it-works"
            className="flex items-center gap-1.5 text-sm text-subtle hover:text-white transition-colors">
            <BookOpen size={14} /> Docs
          </a>
          <button onClick={onLaunch}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent hover:bg-accent-bright text-white text-sm font-medium transition-all duration-200 glow-accent">
            Launch App <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </nav>
  )
}
