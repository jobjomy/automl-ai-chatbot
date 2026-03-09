// src/components/Features.jsx
import { Brain, FileText, Zap, Search, RefreshCw, Code2 } from 'lucide-react'

const features = [
  { icon: Brain,      color: 'accent', title: 'Smart Model Selection',   desc: 'Chooses from 64 ML algorithms based on dataset size, feature types, and your chosen priority.' },
  { icon: FileText,   color: 'cyan',   title: 'Auto Documentation',      desc: 'Generates a complete professional Markdown report with reproducible code in one pass.' },
  { icon: Zap,        color: 'accent', title: 'Priority-Driven',         desc: 'Optimise for Speed, Accuracy, or Cost — every agent adapts its strategy accordingly.' },
  { icon: Search,     color: 'cyan',   title: 'Dataset Intelligence',    desc: 'Auto-detects column types, missing values, class imbalance, and dataset size heuristics.' },
  { icon: RefreshCw,  color: 'accent', title: 'Multi-Agent Loop',        desc: 'ML Engineer, QA Engineer and Technical Writer collaborate in a supervised refinement loop.' },
  { icon: Code2,      color: 'cyan',   title: 'Reproducible Code',       desc: 'One clean, complete Python script — ready to copy, run, and deploy. No boilerplate hunting.' },
]

const classificationModels = ['Random Forest','XGBoost','LightGBM','CatBoost','SVM','KNN','Logistic Regression','Gradient Boosting','AdaBoost','Extra Trees','Decision Tree','Naive Bayes','Ridge Classifier','SGD Classifier','LDA','HistGradientBoosting']
const regressionModels = ['Linear Regression','Ridge','Lasso','ElasticNet','Random Forest Reg','XGBoost Reg','LightGBM Reg','SVR','Gradient Boosting','Huber Regressor','Bayesian Ridge','Quantile Regressor','Theil-Sen','Bagging Regressor']
const clusteringModels = ['K-Means','DBSCAN','HDBSCAN','Agglomerative','Gaussian Mixture','Spectral Clustering','Birch','Mean Shift','Affinity Propagation','MiniBatch K-Means','Fuzzy C-Means']

function ModelPill({ name, color }) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs border ${
      color === 'accent' ? 'border-accent/20 text-accent-bright bg-accent/5' :
      color === 'cyan'   ? 'border-cyan/20 text-cyan bg-cyan/5' :
                           'border-border text-subtle bg-surface'
    }`}>{name}</span>
  )
}

export default function Features() {
  return (
    <>
      {/* Features grid */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-accent-bright text-sm font-medium tracking-widest uppercase mb-3">Features</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white">Everything handled for you</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className="glass glass-hover rounded-2xl p-6 group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                  f.color === 'cyan' ? 'bg-cyan/10 border border-cyan/20' : 'bg-accent/10 border border-accent/20'
                }`}>
                  <f.icon size={18} className={f.color === 'cyan' ? 'text-cyan' : 'text-accent-bright'} />
                </div>
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-subtle text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Models section */}
      <section className="py-20 px-6 bg-surface/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-accent-bright text-sm font-medium tracking-widest uppercase mb-3">Model Library</p>
            <h2 className="text-4xl font-bold text-white">64 ML Algorithms. One Conversation.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-bright" /> Classification
              </h4>
              <div className="flex flex-wrap gap-2">
                {classificationModels.map(m => <ModelPill key={m} name={m} color="accent" />)}
                <ModelPill name="+9 more" color="default" />
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan" /> Regression
              </h4>
              <div className="flex flex-wrap gap-2">
                {regressionModels.map(m => <ModelPill key={m} name={m} color="cyan" />)}
                <ModelPill name="+11 more" color="default" />
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Clustering
              </h4>
              <div className="flex flex-wrap gap-2">
                {clusteringModels.map(m => <ModelPill key={m} name={m} color="default" />)}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
