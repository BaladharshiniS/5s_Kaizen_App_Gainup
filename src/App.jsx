import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { createContext, useContext, useState, useEffect } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NewAudit from './pages/NewAudit'
import AuditHistory from './pages/AuditHistory'
import AuditDashboard from './pages/AuditDashboard'
import SubmitKaizen from './pages/SubmitKaizen'
import KaizenBoard from './pages/KaizenBoard'
import KaizenDashboard from './pages/KaizenDashboard'
import MasterSetup from './pages/MasterSetup'
import Organogram from './pages/Organogram'
import MDView from './pages/MD_View'

export const LangContext = createContext('en')

export const useLang = () => useContext(LangContext)

function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en')

  useEffect(() => {
    const handleChange = () => {
      setLang(localStorage.getItem('lang') || 'en')
    }
    window.addEventListener('langchange', handleChange)
    return () => window.removeEventListener('langchange', handleChange)
  }, [])

  return (
    <LangContext.Provider value={lang}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/new-audit" element={<NewAudit />} />
          <Route path="/audit-history" element={<AuditHistory />} />
          <Route path="/audit-dashboard" element={<AuditDashboard />} />
          <Route path="/submit-kaizen" element={<SubmitKaizen />} />
          <Route path="/kaizen-board" element={<KaizenBoard />} />
          <Route path="/kaizen-dashboard" element={<KaizenDashboard />} />
          <Route path="/master-setup" element={<MasterSetup />} />
          <Route path="/organogram" element={<Organogram />} />
          <Route path="/md-view" element={<MDView />} />
        </Routes>
      </BrowserRouter>
    </LangContext.Provider>
  )
}

export default App
