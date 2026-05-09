import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { mockUsers } from '../firebase'
import { useLang } from '../App'

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const lang = useLang()
  const [localLang, setLocalLang] = useState(() => localStorage.getItem('lang') || 'en')

  const toggleLang = () => {
    const newLang = localLang === 'en' ? 'ta' : 'en'
    setLocalLang(newLang)
    localStorage.setItem('lang', newLang)
    window.dispatchEvent(new Event('langchange'))
  }

  const allNavItems = [
    { label: 'MD View', emoji: '👔', path: '/md-view', roles: ['MD'] },
    { label: 'Dashboard', emoji: '🏠', path: '/dashboard', roles: ['Admin', 'AuditIncharge', 'FiveS_Incharge', 'Coordinator', 'TeamLead', 'Operator'] },
    { label: 'New Audit', emoji: '📋', path: '/new-audit', roles: ['Admin', 'AuditIncharge', 'FiveS_Incharge', 'Coordinator', 'TeamLead'] },
    { label: 'Audit History', emoji: '📊', path: '/audit-history', roles: ['Admin', 'AuditIncharge', 'FiveS_Incharge', 'Coordinator', 'TeamLead', 'Operator'] },
    { label: 'Audit Trends', emoji: '📈', path: '/audit-dashboard', roles: ['Admin', 'AuditIncharge', 'FiveS_Incharge', 'Coordinator', 'TeamLead', 'Operator'] },
    { label: 'Submit Idea', emoji: '💡', path: '/submit-kaizen', roles: ['Admin', 'AuditIncharge', 'FiveS_Incharge', 'Coordinator', 'TeamLead', 'Operator'] },
    { label: 'Kaizen Board', emoji: '📌', path: '/kaizen-board', roles: ['Admin', 'AuditIncharge', 'FiveS_Incharge', 'Coordinator', 'TeamLead', 'Operator'] },
    { label: 'Kaizen Stats', emoji: '🏆', path: '/kaizen-dashboard', roles: ['Admin', 'AuditIncharge', 'FiveS_Incharge', 'Coordinator', 'TeamLead', 'Operator'] },
    { label: 'Organogram', emoji: '🏢', path: '/organogram', roles: ['Admin', 'AuditIncharge', 'FiveS_Incharge', 'Coordinator', 'TeamLead', 'Operator'] },
    { label: 'Master Setup', emoji: '⚙️', path: '/master-setup', roles: ['Admin', 'AuditIncharge'] },
  ]

  const navItems = allNavItems.filter(item => item.roles.includes(user?.role))

  const pendingTasks = () => {
    const kaizens = JSON.parse(localStorage.getItem('kaizens') || '[]')
    if (user?.role === 'Admin' || user?.role === 'AuditIncharge') return kaizens.filter(k => k.stage === 'Reviewing').length
    if (user?.role === 'FiveS_Incharge') return kaizens.filter(k => k.stage === 'Submitted').length
    return 0
  }

  const pending = pendingTasks()

  return (
    <>
      <nav className="sticky top-0 z-40 shadow-xl"
        style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
              style={{ background: 'rgba(255,255,255,0.1)' }}>
              ☰
            </button>
            <div className="cursor-pointer" onClick={() => navigate('/dashboard')}>
              <p className="font-black text-white text-sm leading-tight">GAINUP 5S</p>
              <p className="text-blue-300 text-xs">Kaizen System</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Toggle — only show on New Audit page */}
            {location.pathname === '/new-audit' && (
              <button onClick={toggleLang}
                className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-bold"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                🌐 {localLang === 'en' ? 'EN' : 'தமிழ்'}
              </button>
            )}

            {pending > 0 && (
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl cursor-pointer"
                style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)' }}
                onClick={() => navigate('/kaizen-board')}>
                <span className="text-red-400 text-xs font-bold">🔔 {pending}</span>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.08)' }}
              onClick={() => setShowProfile(true)}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
                {user?.name?.[0]}
              </div>
              <div className="hidden sm:block">
                <p className="text-white text-xs font-semibold leading-tight">{user?.name}</p>
                <p className="text-blue-300 text-xs">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0" style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setSidebarOpen(false)}></div>
          <div className="relative w-72 h-full shadow-2xl flex flex-col"
            style={{ background: 'linear-gradient(180deg, #0f172a, #1e3a5f)' }}>

            <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg"
                  style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
                  {user?.name?.[0]}
                </div>
                <div>
                  <p className="font-bold text-white">{user?.name}</p>
                  <p className="text-blue-300 text-xs">{user?.role}</p>
                  <p className="text-blue-400 text-xs">Team: {user?.team}</p>
                </div>
              </div>
            </div>

            {pending > 0 && (
              <div className="mx-4 mt-4 rounded-xl p-3 cursor-pointer"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
                onClick={() => { navigate('/kaizen-board'); setSidebarOpen(false) }}>
                <p className="text-red-400 text-xs font-bold">🔔 {pending} task(s) pending</p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto py-4">
              {navItems.map(item => (
                <button key={item.path}
                  onClick={() => { navigate(item.path); setSidebarOpen(false) }}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left transition-all"
                  style={location.pathname === item.path
                    ? { background: 'rgba(249,115,22,0.2)', borderRight: '3px solid #f97316' }
                    : {}}>
                  <span className="text-xl">{item.emoji}</span>
                  <span className={`text-sm font-semibold ${location.pathname === item.path ? 'text-orange-400' : 'text-white opacity-80'}`}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <button onClick={() => { logout(); navigate('/') }}
                className="w-full py-3 rounded-xl text-white font-bold text-sm"
                style={{ background: 'rgba(220,38,38,0.8)' }}>
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      )}
    {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowProfile(false)}>
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full mx-4"
            onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-white text-2xl mx-auto mb-3"
                style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
                {user?.name?.[0]}
              </div>
              <h2 className="text-lg font-black text-gray-800">{user?.name}</h2>
              <p className="text-sm text-gray-500">{user?.designation}</p>
            </div>
            <div className="space-y-2 rounded-2xl p-4 mb-4" style={{ background: '#f8fafc' }}>
              {[
                ['Role', user?.role],
                ['Team', user?.team],
                ['Email', mockUsers.find(u => u.name === user?.name)?.email],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-gray-500 font-semibold">{label}:</span>
                  <span className="text-gray-800 font-bold">{value || '-'}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowProfile(false)}
              className="w-full text-white py-3 rounded-xl font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar