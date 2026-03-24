import { useState, useRef } from 'react'
import { FileText, Upload, Search, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { ragAPI } from '../api/client'

function Card({ children, className = '' }) {
  return (
    <div className={`bg-slate-800 border border-slate-700/60 rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  )
}

export default function DocumentQA() {
  const [file, setFile]         = useState(null)
  const [indexed, setIndexed]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [query, setQuery]       = useState('')
  const [answer, setAnswer]     = useState('')
  const [asking, setAsking]     = useState(false)
  const [error, setError]       = useState('')
  const fileRef = useRef()

  async function handleUpload() {
    if (!file) return
    setUploading(true); setError('')
    try {
      await ragAPI.upload(file)
      setIndexed(true)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Upload failed')
    } finally { setUploading(false) }
  }

  async function handleAsk() {
    const q = query.trim()
    if (!q || !indexed) return
    setAsking(true); setError('')
    try {
      const res = await ragAPI.query(q)
      setAnswer(res.data.response)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Query failed')
    } finally { setAsking(false) }
  }

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <FileText className="w-5 h-5 text-brand-400" />
        <div>
          <h1 className="text-base font-semibold text-white">Document Q&A</h1>
          <p className="text-xs text-slate-500">Upload a PDF and ask questions — powered by RAG</p>
        </div>
      </div>

      {/* Upload card */}
      <Card>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          1 · Upload PDF
        </p>
        <div
          onClick={() => fileRef.current.click()}
          className="border-2 border-dashed border-slate-600 hover:border-brand-500/50 rounded-xl p-8 text-center cursor-pointer transition-colors group"
        >
          <Upload className="w-7 h-7 text-slate-500 group-hover:text-brand-400 mx-auto mb-2 transition-colors" />
          <p className="text-sm text-slate-400 group-hover:text-slate-300">
            {file ? file.name : 'Click to choose a PDF'}
          </p>
          <p className="text-xs text-slate-600 mt-1">Max 100 MB</p>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden"
            onChange={e => { setFile(e.target.files[0]); setIndexed(false); setAnswer('') }} />
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading || indexed}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Indexing…</>
            : indexed  ? <><CheckCircle2 className="w-4 h-4" /> Indexed!</>
            : <><Upload className="w-4 h-4" /> Index Document</>}
        </button>
      </Card>

      {/* Query card */}
      <Card className={!indexed ? 'opacity-50 pointer-events-none' : ''}>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          2 · Ask a Question
        </p>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAsk()}
            placeholder="What does this document say about…?"
            className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500/60"
          />
          <button
            onClick={handleAsk}
            disabled={!query.trim() || asking}
            className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white transition-colors"
          >
            {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>
      </Card>

      {/* Answer */}
      {answer && (
        <Card>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Answer</p>
          <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">{answer}</p>
        </Card>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
        </div>
      )}
    </div>
  )
}

