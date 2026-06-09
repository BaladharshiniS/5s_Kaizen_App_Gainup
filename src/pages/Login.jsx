import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { mockUsers } from '../firebase'

const ROLE_GROUPS = [
  { label: 'Management', roles: ['Admin', 'MD', 'AuditIncharge', 'Coordinator', 'FiveS_Incharge'], color: '#dc2626', emoji: '👔' },
  { label: 'Team Lead', roles: ['TeamLead'], color: '#d97706', emoji: '🦁' },
  { label: 'Auditor', roles: ['Auditor'], color: '#7c3aed', emoji: '🔍' },
  { label: 'Operator', roles: ['Operator'], color: '#0f766e', emoji: '⚙️' },
]

const Login = () => {
  const [auditType, setAuditType] = useState(null)       // 'internal' | 'external'
  const [step, setStep] = useState(1)                     // for internal: 1=role, 2=name, 3=pwd | for external: 1=name
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [password, setPassword] = useState('')
  const [externalName, setExternalName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, externalLogin } = useAuth()
  const navigate = useNavigate()

  const usersInGroup = selectedGroup
    ? mockUsers.filter(u => selectedGroup.roles.includes(u.role))
    : []

  const handleInternalLogin = async () => {
    if (!selectedUser || !password) return
    setLoading(true)
    setError('')
    const result = await login(selectedUser.email, password)
    if (result.success) navigate('/dashboard')
    else { setError('Wrong password! Try again.'); setLoading(false) }
  }

  const handleExternalLogin = () => {
    if (!externalName.trim()) { setError('Please enter your name.'); return }
    const result = externalLogin(externalName)
    if (result.success) navigate('/dashboard')
  }

  // Total steps for indicator
  const totalSteps = auditType === 'external' ? 2 : 4
  const currentDisplayStep = auditType === null ? 1 : auditType === 'external' ? 2 : step + 1

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}>
      <div className="absolute top-20 left-20 w-72 h-72 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #f97316, transparent)' }}></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }}></div>

      <div className="w-full max-w-md mx-4 relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
            <span className="text-white text-3xl font-black">5S</span>
          </div>
          <h1 className="text-4xl font-black text-white">GAIN UP</h1>
          <p className="text-blue-300 mt-1 text-sm font-medium">5S Kaizen Digital Management System</p>
        </div>

        <div className="rounded-3xl p-6 shadow-2xl"
          style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>

          {/* Step indicator */}
          <div className="flex items-center justify-center mb-6 gap-0">
            {[1, 2, 3, 4].slice(0, auditType === 'external' ? 2 : 4).map((s, i, arr) => (
              <div key={s} className="flex items-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all"
                  style={currentDisplayStep >= s
                    ? { background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white', boxShadow: '0 0 12px rgba(249,115,22,0.5)' }
                    : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
                  {currentDisplayStep > s ? '✓' : s}
                </div>
                {i < arr.length - 1 && (
                  <div className="w-16 h-0.5 mx-1"
                    style={{ background: currentDisplayStep > s ? 'linear-gradient(90deg, #f97316, #ea580c)' : 'rgba(255,255,255,0.15)' }} />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="rounded-xl px-4 py-3 mb-4 text-sm"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
              ⚠️ {error}
            </div>
          )}

          {/* ✅ STEP 0 — Choose Internal or External */}
          {auditType === null && (
            <div>
              <p className="text-white font-bold text-sm mb-4">Select Audit Type</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setAuditType('internal'); setStep(1); setError('') }}
                  className="p-5 rounded-2xl text-center transition-all"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <p className="text-3xl mb-2">🏭</p>
                  <p className="text-white font-bold text-sm">Internal</p>
                  <p className="text-blue-300 text-xs mt-1">Company member</p>
                </button>
                <button
                  onClick={() => { setAuditType('external'); setStep(1); setError('') }}
                  className="p-5 rounded-2xl text-center transition-all"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <p className="text-3xl mb-2">🔍</p>
                  <p className="text-white font-bold text-sm">External</p>
                  <p className="text-blue-300 text-xs mt-1">Visiting auditor</p>
                </button>
              </div>
            </div>
          )}

          {/* ✅ EXTERNAL — Enter Name */}
          {auditType === 'external' && (
            <div>
              <button onClick={() => { setAuditType(null); setExternalName(''); setError('') }}
                className="flex items-center gap-1 text-blue-300 text-xs mb-4 font-semibold">
                ← Back
              </button>
              <div className="flex items-center gap-3 p-3 rounded-2xl mb-5"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
                <span className="text-2xl">🔍</span>
                <div>
                  <p className="text-white font-bold text-sm">External Auditor</p>
                  <p className="text-blue-300 text-xs">Visiting / third-party</p>
                </div>
              </div>
              <label className="block text-sm font-semibold text-blue-200 mb-2">Your Name</label>
              <input
                type="text"
                value={externalName}
                onChange={e => { setExternalName(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleExternalLogin()}
                placeholder="Enter your full name"
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
                autoFocus />
              <button onClick={handleExternalLogin} disabled={!externalName.trim()}
                className="w-full py-3 rounded-xl font-bold text-white text-sm mt-4"
                style={{ background: !externalName.trim() ? '#6b7280' : 'linear-gradient(135deg, #f97316, #ea580c)' }}>
                Enter as External Auditor →
              </button>
            </div>
          )}

          {/* INTERNAL — Step 1: Role Group */}
          {auditType === 'internal' && step === 1 && (
            <div>
              <button onClick={() => { setAuditType(null); setStep(1); setSelectedGroup(null); setError('') }}
                className="flex items-center gap-1 text-blue-300 text-xs mb-4 font-semibold">
                ← Back
              </button>
              <p className="text-white font-bold text-sm mb-4">Who are you?</p>
              <div className="grid grid-cols-2 gap-3">
                {ROLE_GROUPS.map(group => (
                  <button key={group.label}
                    onClick={() => { setSelectedGroup(group); setStep(2) }}
                    className="p-4 rounded-2xl text-center transition-all"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <p className="text-2xl mb-1">{group.emoji}</p>
                    <p className="text-white font-bold text-sm">{group.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* INTERNAL — Step 2: Select Person */}
          {auditType === 'internal' && step === 2 && (
            <div>
              <button onClick={() => { setStep(1); setSelectedGroup(null) }}
                className="flex items-center gap-1 text-blue-300 text-xs mb-4 font-semibold">
                ← Back
              </button>
              <p className="text-white font-bold text-sm mb-4">Select your name:</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {usersInGroup.map(u => (
                  <button key={u.email}
                    onClick={() => { setSelectedUser(u); setStep(3); setLoading(false); setError('') }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${selectedGroup.color}, ${selectedGroup.color}99)` }}>
                      {u.name[0]}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{u.name}</p>
                      <p className="text-blue-300 text-xs">{u.designation} · {u.team}</p>
                    </div>
                    <span className="ml-auto text-blue-400 text-lg">›</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* INTERNAL — Step 3: Password */}
          {auditType === 'internal' && step === 3 && (
            <div>
              <button onClick={() => { setStep(2); setSelectedUser(null); setPassword(''); setError('') }}
                className="flex items-center gap-1 text-blue-300 text-xs mb-4 font-semibold">
                ← Back
              </button>
              <div className="flex items-center gap-3 p-3 rounded-2xl mb-5"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm"
                  style={{ background: `linear-gradient(135deg, ${selectedGroup.color}, ${selectedGroup.color}99)` }}>
                  {selectedUser?.name[0]}
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{selectedUser?.name}</p>
                  <p className="text-blue-300 text-xs">{selectedUser?.designation}</p>
                </div>
                <span className="ml-auto text-green-400 text-xs font-bold">✓ Selected</span>
              </div>
              <label className="block text-sm font-semibold text-blue-200 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleInternalLogin()}
                  placeholder="Enter your password"
                  className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-orange-400 pr-12"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
                  autoFocus />
                <button type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 text-lg">
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <button onClick={handleInternalLogin} disabled={loading || !password}
                className="w-full py-3 rounded-xl font-bold text-white text-sm mt-4"
                style={{ background: loading || !password ? '#6b7280' : 'linear-gradient(135deg, #f97316, #ea580c)' }}>
                {loading ? '⏳ Signing in...' : 'Sign In →'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default Login