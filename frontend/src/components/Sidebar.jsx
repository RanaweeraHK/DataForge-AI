import { NavLink } from 'react-router-dom'
import {
  Zap, MessageSquare, FileText, BarChart2,
  Brain, FlaskConical, ExternalLink,
} from 'lucide-react'

const NAV = [
  { to: '/',           icon: MessageSquare, label: 'Chat',           desc: 'Contextual AI chat' },
  { to: '/documents',  icon: FileText,      label: 'Document Q&A',   desc: 'RAG over PDFs' },
  { to: '/analytics',  icon: BarChart2,     label: 'Data Analytics', desc: 'Natural-language CSV' },
  { to: '/agents',     icon: Brain,         label: 'Multi-Agent',    desc: 'LangGraph planner' },
  { to: '/training',   icon: FlaskConical,  label: 'ML Training',    desc: 'Train + MLflow' },
]

const EXTERNAL = [
  { href: 'http://localhost:8000/docs', label: 'API Docs' },
  { href: 'http://localhost:5000',      label: 'MLflow UI' },
]

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 flex flex-col bg-slate-800 border-r border-slate-700/60">

      {/* ── Logo ── */}
      <div className="px-5 py-5 border-b border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-brand-500/20 border border-brand-500/30">
            <Zap className="w-4 h-4 text-brand-400" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-white leading-none">
              DataForge<span className="text-brand-400"> AI</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-none">
              Multi-Agent Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
        <p className="px-2 pb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
          Workspace
        </p>
        {NAV.map(({ to, icon: Icon, label, desc }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/25'
                  : 'text-slate-400 hover:bg-slate-700/60 hover:text-slate-200 border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <div className="min-w-0">
                  <p className="font-medium leading-none truncate">{label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-none truncate">{desc}</p>
                </div>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── External links ── */}
      <div className="px-2.5 py-3 border-t border-slate-700/60 space-y-0.5">
        <p className="px-2 pb-1 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
          Tools
        </p>
        {EXTERNAL.map(({ href, label }) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors"
          >
            {label}
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        ))}
        <p className="px-2 pt-2 text-[10px] text-slate-600 leading-relaxed">
          Ollama · LangGraph · FAISS · MLflow
        </p>
      </div>
    </aside>
  )
}

