import { useState } from 'react'
import { FlaskConical, Play, ExternalLink, Loader2, AlertCircle, CheckCircle2, Trophy } from 'lucide-react'
import { mlAPI } from '../api/client'

const MODELS = [
  { value: 'random_forest_classifier', label: 'Random Forest Classifier' },
  { value: 'random_forest_regressor',  label: 'Random Forest Regressor' },
  { value: 'logistic_regression',      label: 'Logistic Regression' },
  { value: 'linear_regression',        label: 'Linear Regression' },
]

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-medium text-slate-300">{label}</label>
        {hint && <span className="text-[10px] text-slate-500">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

const inputCls = "w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500/60"
const selectCls = `${inputCls} cursor-pointer`

export default function MLTraining() {
  const [form, setForm] = useState({
    target_column:   '',
    model_name:      'random_forest_classifier',
    test_size:       0.2,
    experiment_name: 'dataforge-ai',
  })
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleTrain() {
    if (!form.target_column.trim()) return
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await mlAPI.train(form)
      setResult(res.data)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Training failed. Upload a CSV first.')
    } finally { setLoading(false) }
  }

  const metrics = result?.metrics ?? {}

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-2.5">
        <FlaskConical className="w-5 h-5 text-brand-400" />
        <div>
          <h1 className="text-base font-semibold text-white">ML Training</h1>
          <p className="text-xs text-slate-500">Train scikit-learn models and track experiments with MLflow</p>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-xs text-amber-400">
        ⚠ Upload a CSV in Data Analytics first, then train a model on it here.
      </div>

      {/* Form */}
      <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-5 space-y-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Training Configuration</p>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Target Column" hint="column to predict">
            <input value={form.target_column} onChange={e => set('target_column', e.target.value)}
              placeholder="e.g. species, price, survived"
              className={inputCls} />
          </Field>

          <Field label="Model">
            <select value={form.model_name} onChange={e => set('model_name', e.target.value)} className={selectCls}>
              {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </Field>

          <Field label="Test Split" hint={`${Math.round(form.test_size * 100)}%`}>
            <input type="range" min={0.1} max={0.5} step={0.05} value={form.test_size}
              onChange={e => set('test_size', parseFloat(e.target.value))}
              className="w-full accent-brand-500 cursor-pointer" />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>10%</span><span>50%</span>
            </div>
          </Field>

          <Field label="MLflow Experiment">
            <input value={form.experiment_name} onChange={e => set('experiment_name', e.target.value)}
              className={inputCls} />
          </Field>
        </div>

        <button onClick={handleTrain} disabled={!form.target_column.trim() || loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Training…</>
            : <><Play className="w-4 h-4" /> Start Training</>}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <p className="text-sm font-semibold text-green-400">Training complete</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {Object.entries(metrics).map(([k, v]) => (
              <div key={k} className="bg-slate-900 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-500 mb-1 uppercase">{k}</p>
                <p className="text-xl font-bold text-white flex items-center justify-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  {typeof v === 'number' ? v.toFixed(4) : v}
                </p>
              </div>
            ))}
          </div>

          <div className="text-xs text-slate-500 space-y-1 mb-4">
            <p><span className="text-slate-400">Run ID:</span> <code className="font-mono text-slate-300">{result.run_id}</code></p>
            <p><span className="text-slate-400">Experiment:</span> {result.experiment}</p>
            <p><span className="text-slate-400">Model:</span> {result.model} → <span className="text-brand-400">{result.target}</span></p>
          </div>

          <a href={result.mlflow_ui} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-600 hover:border-brand-500/50 text-sm text-slate-300 hover:text-white transition-colors">
            <ExternalLink className="w-4 h-4" /> Open MLflow UI
          </a>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
        </div>
      )}
    </div>
  )
}

