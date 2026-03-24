import { useState, useRef, useEffect } from 'react'
import { Send, Trash2, MessageSquare, Bot, User, Loader2 } from 'lucide-react'
import { chatAPI } from '../api/client'

const SESSION = 'default'

function Bubble({ role, content }) {
  const isUser = role === 'user' || role === 'human'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
        isUser ? 'bg-brand-500 text-white' : 'bg-slate-700 text-slate-300'
      }`}>
        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>
      <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
          ? 'bg-brand-500 text-white rounded-tr-sm'
          : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-sm'
      }`}>
        {content}
      </div>
    </div>
  )
}

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m DataForge AI. Ask me anything — I\'ll remember our conversation.' },
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send() {
    const q = input.trim()
    if (!q || loading) return
    setInput('')
    setError('')
    setMessages(m => [...m, { role: 'user', content: q }])
    setLoading(true)
    try {
      const res = await chatAPI.send(q, SESSION)
      setMessages(m => [...m, { role: 'assistant', content: res.data.response }])
    } catch (e) {
      setError(e?.response?.data?.detail || 'Request failed. Is the API running?')
    } finally {
      setLoading(false)
    }
  }

  async function clearHistory() {
    await chatAPI.clearHistory(SESSION)
    setMessages([{ role: 'assistant', content: 'Conversation cleared. How can I help you?' }])
    setError('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="w-5 h-5 text-brand-400" />
          <div>
            <h1 className="text-base font-semibold text-white">Chat</h1>
            <p className="text-xs text-slate-500">Context-aware conversation with memory</p>
          </div>
        </div>
        <button
          onClick={clearHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors border border-slate-700 hover:border-red-500/30"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear history
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {messages.map((m, i) => <Bubble key={i} role={m.role} content={m.content} />)}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-slate-300" />
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-2.5">
              <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
            </div>
          </div>
        )}
        {error && (
          <div className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 pb-5">
        <div className="flex gap-2 items-end bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 focus-within:border-brand-500/50 transition-colors">
          <textarea
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Send a message… (Shift+Enter for newline)"
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-none max-h-32 leading-relaxed"
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="shrink-0 p-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

