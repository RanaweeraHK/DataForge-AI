import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Chat         from './pages/Chat'
import DocumentQA   from './pages/DocumentQA'
import DataAnalytics from './pages/DataAnalytics'
import MultiAgent   from './pages/MultiAgent'
import MLTraining   from './pages/MLTraining'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-slate-900 text-slate-100 font-sans">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/"          element={<Chat />} />
            <Route path="/documents" element={<DocumentQA />} />
            <Route path="/analytics" element={<DataAnalytics />} />
            <Route path="/agents"    element={<MultiAgent />} />
            <Route path="/training"  element={<MLTraining />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

