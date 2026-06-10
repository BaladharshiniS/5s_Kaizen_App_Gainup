import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { mockUsers, TEAMS } from '../firebase'

const MANAGEMENT_ROLES = ['Admin', 'MD', 'AuditIncharge', 'Coordinator', 'FiveS_Incharge', 'Auditor']

const Login = () => {
  const [auditType, setAuditType] = useState(null)       // 'internal' | 'external'
  const [step, setStep] = useState(1)                     // 1=pick person/team, 2=pick member, 3=pwd
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [selectedGroup, setSelectedGroup] = useState(null) // 'management' | 'teams'
  const [password, setPassword] = useState('')
  const [externalName, setExternalName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, externalLogin } = useAuth()
  const navigate = useNavigate()

  const managementUsers = mockUsers.filter(u => MANAGEMENT_ROLES.includes(u.role))

  const teamLeadOf = (teamName) =>
    mockUsers.find(u => u.role === 'TeamLead' && u.team === teamName)

  const membersOf = (teamName) =>
    mockUsers.filter(u => u.role === 'TeamMember' && u.team === teamName)

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

  const selectUser = (u) => {
    setSelectedUser(u)
    setStep(3)
    setPassword('')
    setError('')
  }

  // Step indicator counts
  // internal: step1=pick, step2=team members, step3=pwd → display as 1,2,3
  // external: just name → display as 1
  const totalSteps = auditType === 'external' ? 2 : 3
  const currentDisplayStep = auditType === null ? 0 : auditType === 'external' ? 1 : step

  const roleColor = (role) => {
    if (['Admin','MD'].includes(role)) return '#dc2626'
    if (role === 'AuditIncharge') return '#7c3aed'
    if (['Coordinator','FiveS_Incharge'].includes(role)) return '#0369a1'
    if (role === 'Auditor') return '#0f766e'
    if (role === 'TeamLead') return '#d97706'
    return '#475569'
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}>
      <div className="absolute top-20 left-20 w-72 h-72 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #f97316, transparent)' }} />
      <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />

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

          {/* Step indicator — only show after audit type chosen */}
          {auditType !== null && (
            <div className="flex items-center justify-center mb-6 gap-0">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s, i, arr) => (
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
          )}

          {error && (
            <div className="rounded-xl px-4 py-3 mb-4 text-sm"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
              ⚠️ {error}
            </div>
          )}

          {/* ── STEP 0 — Internal or External ── */}
          {auditType === null && (
            <div>
              <p className="text-white font-bold text-sm mb-4">Select Login Type</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { setAuditType('internal'); setStep(1); setError('') }}
                  className="p-5 rounded-2xl text-center transition-all"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <p className="text-3xl mb-2">🏭</p>
                  <p className="text-white font-bold text-sm">Internal</p>
                  <p className="text-blue-300 text-xs mt-1">Company member</p>
                </button>
                <button onClick={() => { setAuditType('external'); setStep(1); setError('') }}
                  className="p-5 rounded-2xl text-center transition-all"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <p className="text-3xl mb-2">🔍</p>
                  <p className="text-white font-bold text-sm">External</p>
                  <p className="text-blue-300 text-xs mt-1">Visiting auditor</p>
                </button>
              </div>
            </div>
          )}

          {/* ── EXTERNAL — Enter Name ── */}
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
                type="text" value={externalName}
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

          {/* ── INTERNAL STEP 1 — Choose Management or Teams ── */}
          {auditType === 'internal' && step === 1 && !selectedGroup && (
            <div>
              <button onClick={() => { setAuditType(null); setError('') }}
                className="flex items-center gap-1 text-blue-300 text-xs mb-4 font-semibold">
                ← Back
              </button>
              <p className="text-white font-bold text-sm mb-4">Who are you?</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setSelectedGroup('management')}
                  className="p-5 rounded-2xl text-center transition-all"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <p className="text-3xl mb-2">🏢</p>
                  <p className="text-white font-bold text-sm">Management</p>
                  <p className="text-blue-300 text-xs mt-1">Staff & Coordinators</p>
                </button>
                <button onClick={() => setSelectedGroup('teams')}
                  className="p-5 rounded-2xl text-center transition-all"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <p className="text-3xl mb-2">🦁</p>
                  <p className="text-white font-bold text-sm">Teams</p>
                  <p className="text-blue-300 text-xs mt-1">Lead & Members</p>
                </button>
              </div>
            </div>
          )}

          {/* ── INTERNAL STEP 1 — Management names ── */}
          {auditType === 'internal' && step === 1 && selectedGroup === 'management' && (
            <div>
              <button onClick={() => { setSelectedGroup(null); setError('') }}
                className="flex items-center gap-1 text-blue-300 text-xs mb-4 font-semibold">
                ← Back
              </button>
              <p className="text-white font-bold text-sm mb-3">Select your name</p>
              <div className="space-y-2">
                {managementUsers.map(u => (
                  <button key={u.email}
                    onClick={() => selectUser(u)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${roleColor(u.role)}, ${roleColor(u.role)}99)` }}>
                      {u.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm">{u.name}</p>
                      <p className="text-blue-300 text-xs">{u.designation}</p>
                    </div>
                    <span className="text-blue-400 text-lg">›</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── INTERNAL STEP 1 — Team grid ── */}
          {auditType === 'internal' && step === 1 && selectedGroup === 'teams' && (
            <div>
              <button onClick={() => { setSelectedGroup(null); setError('') }}
                className="flex items-center gap-1 text-blue-300 text-xs mb-4 font-semibold">
                ← Back
              </button>
              <p className="text-white font-bold text-sm mb-3">Select your team</p>
              <div className="grid grid-cols-3 gap-2">
                {TEAMS.map(teamName => (
                  <button key={teamName}
                    onClick={() => { setSelectedTeam(teamName); setStep(2); setError('') }}
                    className="p-3 rounded-2xl text-center transition-all"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <p className="text-xl mb-1">🦁</p>
                    <p className="text-white font-bold text-xs leading-tight">{teamName}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── INTERNAL STEP 2 — Team Lead + Members ── */}
          {auditType === 'internal' && step === 2 && (
            <div>
              <button onClick={() => { setStep(1); setSelectedTeam(null); setError('') }}
                className="flex items-center gap-1 text-blue-300 text-xs mb-4 font-semibold">
                ← Back
              </button>
              <p className="text-white font-bold text-sm mb-3">
                {selectedTeam}
              </p>

              {/* Team Lead */}
              {teamLeadOf(selectedTeam) && (
                <>
                  <p className="text-blue-300 text-xs font-black uppercase tracking-wider mb-2">Team Lead</p>
                  <button
                    onClick={() => selectUser(teamLeadOf(selectedTeam))}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl text-left mb-4 transition-all"
                    style={{ background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.3)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #d97706, #d9770699)' }}>
                      {teamLeadOf(selectedTeam).name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm">{teamLeadOf(selectedTeam).name}</p>
                      <p className="text-yellow-300 text-xs">Team Leader</p>
                    </div>
                    <span className="text-blue-400 text-lg">›</span>
                  </button>
                </>
              )}

              {/* Members */}
              {membersOf(selectedTeam).length > 0 && (
                <>
                  <p className="text-blue-300 text-xs font-black uppercase tracking-wider mb-2">Members</p>
                  <div className="grid grid-cols-2 gap-2">
                    {membersOf(selectedTeam).map(u => (
                      <button key={u.email}
                        onClick={() => selectUser(u)}
                        className="flex items-center gap-2 p-3 rounded-2xl text-left transition-all"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #0369a1, #0369a199)' }}>
                          {u.name[0]}
                        </div>
                        <p className="text-white font-semibold text-xs leading-tight">{u.name}</p>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── INTERNAL STEP 3 — Password ── */}
          {auditType === 'internal' && step === 3 && (
            <div>
              <button onClick={() => {
                if (selectedTeam) {
                  setStep(2)
                } else {
                  setStep(1)
                  setSelectedGroup('management')
                }
                setSelectedUser(null)
                setPassword('')
                setError('')
              }}
                className="flex items-center gap-1 text-blue-300 text-xs mb-4 font-semibold">
                ← Back
              </button>

              <div className="flex items-center gap-3 p-3 rounded-2xl mb-5"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm"
                  style={{ background: `linear-gradient(135deg, ${roleColor(selectedUser?.role)}, ${roleColor(selectedUser?.role)}99)` }}>
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