/**
 * DataForge AI — API client
 * Uses /api as base (proxied by Vite in dev, by nginx in Docker).
 */
import axios from 'axios'

const http = axios.create({ baseURL: '/api' })

// ── Chat ──────────────────────────────────────────────────────────────────────
export const chatAPI = {
  send:         (query, sessionId = 'default') =>
    http.post('/chat', { query, session_id: sessionId }),
  getHistory:   (sessionId = 'default') =>
    http.get('/chat/history', { params: { session_id: sessionId } }),
  clearHistory: (sessionId = 'default') =>
    http.delete('/chat/history', { params: { session_id: sessionId } }),
}

// ── RAG / Document Q&A ────────────────────────────────────────────────────────
export const ragAPI = {
  upload: (file) => {
    const form = new FormData()
    form.append('file', file)
    return http.post('/upload', form)
  },
  query: (query) => http.get('/rag', { params: { query } }),
}

// ── Data Analytics ────────────────────────────────────────────────────────────
export const dataAPI = {
  uploadCSV: (file) => {
    const form = new FormData()
    form.append('file', file)
    return http.post('/upload_csv', form)
  },
  analyze: (query)  => http.get('/analyze', { params: { query } }),
  summary: ()       => http.get('/data/summary'),
}

// ── Multi-Agent ───────────────────────────────────────────────────────────────
export const agentAPI = {
  query: (query) => http.post('/query', { query }),
}

// ── ML Training ───────────────────────────────────────────────────────────────
export const mlAPI = {
  train: (params) => http.post('/train', params),
  models: ()      => http.get('/train/models'),
}

// ── Health ────────────────────────────────────────────────────────────────────
export const healthAPI = {
  check: () => http.get('/health'),
}

