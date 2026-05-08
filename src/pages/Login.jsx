import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { mockUsers } from '../firebase'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      const result = login(email, password)
      if (result.success) navigate('/dashboard')
      else { setError('Invalid email or password!'); setLoading(false) }
    }, 600)
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}>
      <div className="absolute top-20 left-20 w-72 h-72 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #f97316, transparent)' }}></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }}></div>

      <div className="w-full max-w-md mx-4 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
            <span className="text-white text-3xl font-black">5S</span>
          </div>
          <h1 className="text-4xl font-black text-white">GAIN UP</h1>
          <p className="text-blue-300 mt-1 text-sm font-medium">5S Kaizen Digital Management System</p>
        </div>

        <div className="rounded-3xl p-8 shadow-2xl"
          style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {error && (
            <div className="rounded-xl px-4 py-3 mb-5 flex items-center gap-2 text-sm"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
              ⚠️ {error}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-blue-200 mb-2">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
                required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-200 mb-2">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
                required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:shadow-lg mt-2"
              style={{ background: loading ? '#6b7280' : 'linear-gradient(135deg, #f97316, #ea580c)' }}>
              {loading ? '⏳ Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div className="mt-6 rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-3">Quick Login</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {mockUsers.map(u => (
                <div key={u.email} onClick={() => { setEmail(u.email); setPassword(u.password) }}
                  className="flex items-center gap-3 rounded-xl p-2 cursor-pointer hover:bg-white hover:bg-opacity-5 transition">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: u.role === 'Admin' ? '#dc2626' : u.role === 'Auditor' ? '#7c3aed' : u.role === 'TeamLead' ? '#f97316' : '#0f766e' }}>
                    {u.name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{u.name}</p>
                    <p className="text-xs text-blue-300">{u.role} · {u.team}</p>
                  </div>
                  <span className="ml-auto text-xs text-blue-400">tap</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login