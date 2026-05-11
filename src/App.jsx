import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext'
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

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
  return children
}

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
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/new-audit" element={<ProtectedRoute><NewAudit /></ProtectedRoute>} />
          <Route path="/audit-history" element={<ProtectedRoute><AuditHistory /></ProtectedRoute>} />
          <Route path="/audit-dashboard" element={<ProtectedRoute><AuditDashboard /></ProtectedRoute>} />
          <Route path="/submit-kaizen" element={<ProtectedRoute><SubmitKaizen /></ProtectedRoute>} />
          <Route path="/kaizen-board" element={<ProtectedRoute><KaizenBoard /></ProtectedRoute>} />
          <Route path="/kaizen-dashboard" element={<ProtectedRoute><KaizenDashboard /></ProtectedRoute>} />
          <Route path="/master-setup" element={<ProtectedRoute><MasterSetup /></ProtectedRoute>} />
          <Route path="/organogram" element={<ProtectedRoute><Organogram /></ProtectedRoute>} />
          <Route path="/md-view" element={<ProtectedRoute><MDView /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </LangContext.Provider>
  )
}

export default App
