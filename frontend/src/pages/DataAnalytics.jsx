import { useState, useRef } from 'react'
import {
  BarChart2, Upload, Sparkles, ChevronDown, ChevronRight,
  Loader2, AlertCircle, Database
} from 'lucide-react'
import { dataAPI } from '../api/client'

// ✅ Chart.js imports
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  LineElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js'

import { Pie, Bar, Line } from 'react-chartjs-2'

// Register chart components
ChartJS.register(
    ArcElement,
    BarElement,
    LineElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend
)

// ── UI Components ─────────────────────────────────────────

function Card({ children, className = '' }) {
  return (
      <div className={`bg-slate-800 border border-slate-700/60 rounded-2xl p-5 ${className}`}>
        {children}
      </div>
  )
}

function Collapsible({ label, children }) {
  const [open, setOpen] = useState(false)
  return (
      <div className="mt-3 border border-slate-700 rounded-xl overflow-hidden">
        <button
            onClick={() => setOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-700/40 transition-colors"
        >
          {label}
          {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        {open && <div className="px-4 pb-4 pt-1">{children}</div>}
      </div>
  )
}

function ChartRenderer({ chart }) {
  if (!chart) return null

  const colors = [
    '#60a5fa',
    '#34d399',
    '#fbbf24',
    '#f87171',
    '#a78bfa',
    '#f472b6'
  ]

  const data = {
    labels: chart.labels || [],
    datasets: [
      {
        label: chart.title,
        data: chart.values,
        backgroundColor: colors,
      }
    ]
  }

  const options = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#cbd5f5',
          font: { size: 10 }
        }
      }
    }
  }

  if (chart.type === "pie") return <Pie data={data} options={options} />
  if (chart.type === "bar") return <Bar data={data} options={options} />
  if (chart.type === "line") return <Line data={data} options={options} />

  return null
}
// ── MAIN COMPONENT ────────────────────────────────────────

export default function DataAnalytics() {
  const [dataInfo, setDataInfo] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setError('')
    setResult(null)

    try {
      const res = await dataAPI.uploadCSV(file)
      setDataInfo(res.data)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleAnalyze() {
    const q = query.trim()
    if (!q || !dataInfo) return

    setLoading(true)
    setError('')

    try {
      const res = await dataAPI.analyze(q)
      setResult(res.data)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  return (
      <div className="px-6 py-6 max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center gap-2.5">
          <BarChart2 className="w-5 h-5 text-brand-400" />
          <div>
            <h1 className="text-base font-semibold text-white">Data Analytics</h1>
            <p className="text-xs text-slate-500">
              Upload a CSV and ask questions in plain English
            </p>
          </div>
        </div>

        {/* Upload */}
        <Card>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
            1 · Load Dataset
          </p>

          <div
              onClick={() => fileRef.current.click()}
              className="border-2 border-dashed border-slate-600 hover:border-brand-500/50 rounded-xl p-6 text-center cursor-pointer transition-colors group"
          >
            <Upload className="w-6 h-6 text-slate-500 group-hover:text-brand-400 mx-auto mb-2 transition-colors" />
            <p className="text-sm text-slate-400">Click to upload a CSV file</p>
            <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleUpload}
            />
          </div>

          {uploading && (
              <p className="text-xs text-brand-400 mt-3 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading dataset…
              </p>
          )}
        </Card>

        {/* Dataset Info */}
        {dataInfo && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">
              {dataInfo.message}
            </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">Rows × Columns</p>
                  <p className="text-lg font-bold text-white">
                    {dataInfo.shape?.rows}
                    <span className="text-slate-500 text-sm"> × </span>
                    {dataInfo.shape?.columns}
                  </p>
                </div>

                <div className="bg-slate-900 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">Columns</p>
                  <p className="text-xs text-slate-300 break-words">
                    {dataInfo.columns?.join(', ')}
                  </p>
                </div>
              </div>

              <Collapsible label="Full summary statistics">
            <pre className="text-[11px] text-slate-400 font-mono overflow-x-auto whitespace-pre">
              {dataInfo.summary}
            </pre>
              </Collapsible>
            </Card>
        )}

        {/* Query */}
        <Card className={!dataInfo ? 'opacity-50 pointer-events-none' : ''}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
            2 · Ask a Question
          </p>

          <div className="flex gap-2">
            <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                placeholder="e.g. Show a pie chart of category"
                className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500/60"
            />

            <button
                onClick={handleAnalyze}
                disabled={!query.trim() || loading}
                className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white flex items-center gap-1.5 text-sm font-medium"
            >
              {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                  <Sparkles className="w-4 h-4" />
              )}
              {loading ? 'Analyzing…' : 'Analyze'}
            </button>
          </div>
        </Card>

        {/* Results */}
        {result && (
            <Card>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                Answer
              </p>

              <p className="text-sm text-slate-100 mb-4">
                {result.answer}
              </p>

              {/* ✅ Chart */}
              {result.chart && (
                  <div className="bg-slate-900 p-4 rounded-xl mb-4">
                    <ChartRenderer chart={result.chart} />
                  </div>
              )}

              {/* ✅ NEW: Suggestions (ADD HERE) */}
              {result?.suggestions && (
                  <div className="mt-4">
                    <p className="text-xs text-slate-400 mb-2">Try next:</p>
                    <div className="flex gap-2 flex-wrap">
                      {result.suggestions.map((s, i) => (
                          <button
                              key={i}
                              onClick={() => setQuery(s)}
                              className="px-3 py-1.5 bg-slate-700 rounded-lg text-xs text-slate-300 hover:bg-slate-600"
                          >
                            {s}
                          </button>
                      ))}
                    </div>
                  </div>
              )}

              <Collapsible label="Generated Python code">
      <pre className="text-[11px] text-green-300 font-mono bg-slate-900 rounded-lg p-3 overflow-x-auto whitespace-pre">
        {result.code}
      </pre>
              </Collapsible>

              <Collapsible label="Raw output">
      <pre className="text-[11px] text-slate-400 font-mono bg-slate-900 rounded-lg p-3 overflow-x-auto whitespace-pre">
        {result.output}
      </pre>
              </Collapsible>
            </Card>
        )}
      </div>
  )
}