// src/components/HowItWorks.jsx
import { Upload, MessageSquare, BarChart3 } from 'lucide-react'

const steps = [
  {
    num: '01', icon: Upload, color: 'accent',
    title: 'Upload Your Dataset',
    desc: 'Drop any CSV file. AutoML Agent previews your data and detects all columns automatically. No preprocessing needed.',
  },
  {
    num: '02', icon: MessageSquare, color: 'cyan',
    title: 'Answer 4 Simple Questions',
    desc: 'Task type, target column, priority, and docs preference — all via chat. No ML knowledge or code required.',
  },
  {
    num: '03', icon: BarChart3, color: 'accent',
    title: 'Get Your ML Report',
    desc: '15 AI agents collaborate to select, train, evaluate and document the best model for your data — fully automatically.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-accent-bright text-sm font-medium tracking-widest uppercase mb-3">How It Works</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">Three steps to your model</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="glass glass-hover rounded-2xl p-7 group">
              <div className="flex items-start justify-between mb-5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                  s.color === 'cyan' ? 'bg-cyan/10 border border-cyan/20' : 'bg-accent/10 border border-accent/20'
                }`}>
                  <s.icon size={20} className={s.color === 'cyan' ? 'text-cyan' : 'text-accent-bright'} />
                </div>
                <span className="font-mono text-4xl font-bold text-border group-hover:text-accent/20 transition-colors">{s.num}</span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{s.title}</h3>
              <p className="text-subtle text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
