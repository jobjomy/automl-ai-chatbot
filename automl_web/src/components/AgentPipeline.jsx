// src/components/AgentPipeline.jsx
const chain1 = [
  { name: 'Request Validator',      role: 'Validates CSV & inputs' },
  { name: 'Instruction Parser',     role: 'Structures user intent' },
  { name: 'Dataset Analyzer',       role: 'Profiles the data' },
  { name: 'AutoML Reasoner',        role: 'Plans ML approach' },
  { name: 'Model Selector',         role: 'Picks best algorithm' },
  { name: 'Pipeline Designer',      role: 'Designs full pipeline' },
  { name: 'Data Preprocessing',     role: 'Cleans & encodes data' },
  { name: 'Training Agent',         role: 'Trains the model' },
  { name: 'Execution Verifier',     role: 'Checks training output' },
  { name: 'Implementation Verifier',role: 'Verifies code quality' },
  { name: 'Code Builder',           role: 'Packages final code' },
]

const chain2 = [
  { name: 'Project Lead',    role: 'Orchestrates workers' },
  { name: 'ML Engineer',     role: 'Builds ML artifacts' },
  { name: 'QA Engineer',     role: 'Evaluates quality' },
  { name: 'Technical Writer',role: 'Writes documentation' },
  { name: 'Final Answer',    role: 'Compiles final report' },
]

function AgentCard({ agent, index }) {
  return (
    <div className="glass glass-hover rounded-xl p-3 min-w-[130px] group cursor-default"
      style={{ animationDelay: `${index * 60}ms` }}>
      <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center mb-2 group-hover:bg-accent/20 transition-colors">
        <div className="w-2 h-2 rounded-full bg-accent-bright" />
      </div>
      <p className="text-white text-xs font-medium leading-tight">{agent.name}</p>
      <p className="text-muted text-[10px] mt-0.5">{agent.role}</p>
    </div>
  )
}

export default function AgentPipeline() {
  return (
    <section className="py-24 px-6 bg-surface/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-accent-bright text-sm font-medium tracking-widest uppercase mb-3">Under the Hood</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">15 Specialized AI Agents</h2>
          <p className="text-subtle text-lg max-w-2xl mx-auto">Working together in a two-stage pipeline — sequential chain followed by a collaborative worker loop.</p>
        </div>

        {/* Stage 1 */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent-bright text-xs font-medium">Stage 1</div>
            <span className="text-subtle text-sm">Sequential Chain</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3">
            {chain1.map((a, i) => (
              <div key={i} className="flex items-center gap-2 flex-shrink-0">
                <AgentCard agent={a} index={i} />
                {i < chain1.length - 1 && <div className="text-accent/40 text-lg flex-shrink-0">→</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Stage 2 */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="px-3 py-1 rounded-full bg-cyan/10 border border-cyan/20 text-cyan text-xs font-medium">Stage 2</div>
            <span className="text-subtle text-sm">Worker Loop (up to 5 iterations)</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3">
            {chain2.map((a, i) => (
              <div key={i} className="flex items-center gap-2 flex-shrink-0">
                <AgentCard agent={a} index={i} />
                {i < chain2.length - 1 && (
                  <div className="text-cyan/40 text-lg flex-shrink-0">{i === 0 ? '↔' : '→'}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
