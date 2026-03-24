import { useState } from 'react'
import { Brain, Sparkles, ChevronDown, ChevronRight, Loader2, AlertCircle, ArrowRight } from 'lucide-react'
import { agentAPI } from '../api/client'

const ROUTE_META = {
  rag:        { label: 'Document RAG',    color: 'text-purple-400 bg-purple-400/10 border-purple-500/30' },
  data:       { label: 'Data Analytics',  color: 'text-blue-400   bg-blue-400/10   border-blue-500/30'   },
  calculator: { label: 'Calculator',      color: 'text-amber-400  bg-amber-400/10  border-amber-500/30'  },
  direct:     { label: 'Direct LLM',      color: 'text-green-400  bg-green-400/10  border-green-500/30'  },
}

const EXAMPLES = [
  'Summarise the main findings from the uploaded document',
  'What is the average salary in the dataset?',
  'Calculate the compound interest on $10,000 at 5% over 10 years',
  'Explain the difference between RAG and fine-tuning',
]

function Collapsible({ label, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-3 border border-slate-700 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-700/40 transition-colors">
        {label}
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  )
}

export default function MultiAgent() {
  const [query, setQuery]   = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  async function handleRun() {
    const q = query.trim()
    if (!q || loading) return
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await agentAPI.query(q)
      setResult(res.data)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Agent failed')
    } finally { setLoading(false) }
  }

  const meta = result ? (ROUTE_META[result.route] ?? ROUTE_META.direct) : null

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-2.5">
        <Brain className="w-5 h-5 text-brand-400" />
        <div>
          <h1 className="text-base font-semibold text-white">Multi-Agent</h1>
          <p className="text-xs text-slate-500">LangGraph planner routes to the best specialist agent</p>
        </div>
      </div>

      {/* Pipeline diagram */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
        {['Planner', 'RAG | Data | Calculator | Direct', 'Response'].map((s, i, arr) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg">{s}</span>
            {i < arr.length - 1 && <ArrowRight className="w-3 h-3 shrink-0" />}
          </span>
        ))}
      </div>

      {/* Input */}
      <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Your Query</p>
        <textarea
          rows={3}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Ask anything — the AI decides which agent to use…"
          className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500/60 resize-none"
        />
        <div className="flex items-center justify-between mt-3">
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map(ex => (
              <button key={ex} onClick={() => setQuery(ex)}
                className="text-[10px] px-2 py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-slate-200 transition-colors truncate max-w-[200px]">
                {ex}
              </button>
            ))}
          </div>
          <button onClick={handleRun} disabled={!query.trim() || loading}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-sm font-medium transition-colors ml-3">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Running…' : 'Run Agents'}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Routed to</span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.color}`}>
              {meta.label}
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Final Answer</p>
            <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">{result.response}</p>
          </div>
          <Collapsible label="Tool output (raw)">
            <pre className="text-[11px] text-slate-400 font-mono bg-slate-900 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">{result.tool_output}</pre>
          </Collapsible>
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

