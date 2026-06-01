import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { mockUsers } from '../firebase'
import { useLang } from '../App'

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, changePassword } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [pwdSuccess, setPwdSuccess] = useState('')
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const lang = useLang()
  const [localLang, setLocalLang] = useState(() => localStorage.getItem('lang') || 'en')
  const [notifications, setNotifications] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifsRead, setNotifsRead] = useState(false)
  const notifRef = useRef()

  useEffect(() => {
  if (!user) return
  const load = async () => {
    const { getNotifications } = await import('../firebase')
    const notifs = await getNotifications(user)
    setNotifications(notifs)
  }
  load()
}, [user])

useEffect(() => {
  const handleClick = (e) => {
    if (notifRef.current && !notifRef.current.contains(e.target)) {
      setShowNotifs(false)
    }
  }
  document.addEventListener('mousedown', handleClick)
  return () => document.removeEventListener('mousedown', handleClick)
}, [])


  const toggleLang = () => {
    const newLang = localLang === 'en' ? 'ta' : 'en'
    setLocalLang(newLang)
    localStorage.setItem('lang', newLang)
    window.dispatchEvent(new Event('langchange'))
  }

  const allNavItems = [
  { label: 'Dashboard', emoji: '🏠', path: '/dashboard', roles: ['Admin', 'MD', 'AuditIncharge', 'FiveS_Incharge', 'Coordinator', 'TeamLead', 'Operator', 'Auditor'] },
  { label: 'New Audit', emoji: '📋', path: '/new-audit', roles: ['Admin', 'MD', 'AuditIncharge', 'FiveS_Incharge', 'Coordinator', 'TeamLead', 'Auditor'] },
  { label: 'Audit History', emoji: '📊', path: '/audit-history', roles: ['Admin', 'MD', 'AuditIncharge', 'FiveS_Incharge', 'Coordinator', 'TeamLead', 'Operator', 'Auditor'] },
  { label: 'Audit Trends', emoji: '📈', path: '/audit-dashboard', roles: ['Admin', 'MD', 'AuditIncharge', 'FiveS_Incharge', 'Coordinator', 'TeamLead', 'Operator', 'Auditor'] },
  { label: 'Submit Idea', emoji: '💡', path: '/submit-kaizen', roles: ['Admin', 'MD', 'AuditIncharge', 'FiveS_Incharge', 'Coordinator', 'TeamLead', 'Operator', 'Auditor'] },
  { label: 'Kaizen Board', emoji: '📌', path: '/kaizen-board', roles: ['Admin', 'MD', 'AuditIncharge', 'FiveS_Incharge', 'Coordinator', 'TeamLead', 'Operator', 'Auditor'] },
  { label: 'Kaizen Stats', emoji: '🏆', path: '/kaizen-dashboard', roles: ['Admin', 'MD', 'AuditIncharge', 'FiveS_Incharge', 'Coordinator', 'TeamLead', 'Operator', 'Auditor'] },
  { label: 'Organogram', emoji: '🏢', path: '/organogram', roles: ['Admin', 'MD', 'AuditIncharge', 'FiveS_Incharge', 'Coordinator', 'TeamLead', 'Operator', 'Auditor'] },
  { label: 'MD View', emoji: '👔', path: '/md-view', roles: ['MD', 'Admin'] },
  { label: 'Master Setup', emoji: '⚙️', path: '/master-setup', roles: ['MD', 'Admin', 'AuditIncharge'] },
  { label: 'My Ideas', emoji: '💡', path: '/my-ideas', roles: ['Admin', 'MD', 'AuditIncharge', 'FiveS_Incharge', 'Coordinator', 'TeamLead', 'Operator', 'Auditor'] },
  { label: 'Team Performance', emoji: '📊', path: '/team-performance', roles: ['Admin', 'MD', 'AuditIncharge', 'FiveS_Incharge', 'Coordinator'] },
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

            {/* Notification Bell */}
<div className="relative" ref={notifRef}>
  <button
    onClick={() => { setShowNotifs(p => !p); setNotifsRead(true) }}
    className="relative w-9 h-9 rounded-xl flex items-center justify-center"
    style={{ background: 'rgba(255,255,255,0.1)' }}>
    <span className="text-white text-base">🔔</span>
    {notifications.length > 0 && !notifsRead && (
      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white font-black"
        style={{ background: '#ef4444', fontSize: '9px' }}>
        {notifications.length > 9 ? '9+' : notifications.length}
      </span>
    )}
  </button>

  {/* Dropdown */}
  {showNotifs && (
    <div className="absolute right-0 top-12 w-80 rounded-2xl shadow-2xl overflow-hidden z-50"
      style={{ background: 'white', border: '1px solid #e2e8f0' }}>

      <div className="px-4 py-3 flex items-center justify-between"
        style={{ background: '#0f172a' }}>
        <p className="text-white text-xs font-black">Notifications</p>
        <span className="text-blue-300 text-xs">{notifications.length} alerts</span>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-3xl mb-2">✅</p>
            <p className="text-xs text-gray-400 font-semibold">All clear! No alerts.</p>
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.id}
              onClick={() => { navigate('/kaizen-board'); setShowNotifs(false) }}
              className="px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50"
              style={{ borderLeft: `3px solid ${n.dot}` }}>
              <p className="text-xs font-black text-gray-800">{n.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">{n.message}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: n.bg, color: n.color }}>
                  {n.team}
                </span>
                {n.days > 0 && (
                  <span className="text-xs text-gray-400">{n.days} days</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100">
          <button
            onClick={() => { navigate('/kaizen-board'); setShowNotifs(false) }}
            className="w-full text-xs font-bold text-blue-600 py-1">
            View all in Kaizen Board →
          </button>
        </div>
      )}
    </div>
  )}
</div>
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
            <button onClick={() => { setShowProfile(false); setShowChangePassword(true) }}
              className="w-full py-3 rounded-xl font-bold text-sm mb-2"
              style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)' }}>
              🔑 Change Password
            </button>
            <button onClick={() => { logout(); navigate('/') }}
              className="w-full py-3 rounded-xl font-bold text-sm mb-2"
              style={{ background: 'rgba(220,38,38,0.15)', color: '#ef4444', border: '1px solid rgba(220,38,38,0.3)' }}>
              🚪 Logout
            </button>
            <button onClick={() => setShowProfile(false)}
              className="w-full text-white py-3 rounded-xl font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>
              Close
            </button>
          </div>
        </div>
      )}
    {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => { setShowChangePassword(false); setPwdError(''); setPwdSuccess(''); setOldPwd(''); setNewPwd(''); setConfirmPwd('') }}>
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full mx-4"
            onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-black text-gray-800 mb-1">🔑 Change Password</h2>
            <p className="text-xs text-gray-400 mb-4">{user?.name}</p>

            {pwdError && (
              <div className="rounded-xl p-3 mb-3 text-xs text-red-600 font-semibold"
                style={{ background: '#fee2e2' }}>⚠️ {pwdError}</div>
            )}
            {pwdSuccess && (
              <div className="rounded-xl p-3 mb-3 text-xs text-green-600 font-semibold"
                style={{ background: '#dcfce7' }}>✅ {pwdSuccess}</div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Current Password</label>
                <div className="relative">
                  <input type={showOld ? 'text' : 'password'} value={oldPwd}
                    onChange={e => setOldPwd(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none bg-gray-50 pr-10" />
                  <button onClick={() => setShowOld(p => !p)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    {showOld ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">New Password</label>
                <div className="relative">
                  <input type={showNew ? 'text' : 'password'} value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none bg-gray-50 pr-10" />
                  <button onClick={() => setShowNew(p => !p)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    {showNew ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Confirm New Password</label>
                <input type="password" value={confirmPwd}
                  onChange={e => setConfirmPwd(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none bg-gray-50" />
              </div>
            </div>

            <button onClick={async () => {
              setPwdError('')
              setPwdSuccess('')
              if (!oldPwd || !newPwd || !confirmPwd) { setPwdError('Please fill all fields!'); return }
              if (newPwd !== confirmPwd) { setPwdError('New passwords do not match!'); return }
              if (newPwd.length < 4) { setPwdError('Password must be at least 4 characters!'); return }
              const userEmail = mockUsers.find(u => u.name === user?.name)?.email
              const result = await changePassword(userEmail, oldPwd, newPwd)
              if (result.success) {
                setPwdSuccess('Password changed successfully!')
                setOldPwd(''); setNewPwd(''); setConfirmPwd('')
              } else {
                setPwdError(result.error)
              }
            }}
              className="w-full text-white py-3 rounded-xl font-bold text-sm mt-4"
              style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>
              Update Password
            </button>

            <button onClick={() => { setShowChangePassword(false); setPwdError(''); setPwdSuccess(''); setOldPwd(''); setNewPwd(''); setConfirmPwd('') }}
              className="w-full py-2 rounded-xl font-bold text-sm mt-2 text-gray-400">
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar