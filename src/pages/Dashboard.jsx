import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState({ audits: 0, avgScore: 0, kaizens: 0, pending: 0, savings: 0, implemented: 0 })
  const [recentAudits, setRecentAudits] = useState([])
  const [pendingKaizens, setPendingKaizens] = useState([])

  useEffect(() => {
    const audits = JSON.parse(localStorage.getItem('audits') || '[]')
    const kaizens = JSON.parse(localStorage.getItem('kaizens') || '[]')
    const avgScore = audits.length ? Math.round(audits.reduce((s, a) => s + (a.scorePercent || 0), 0) / audits.length) : 0
    setStats({
      audits: audits.length, avgScore,
      kaizens: kaizens.length,
      pending: kaizens.filter(k => k.stage !== 'Closed').length,
      savings: kaizens.reduce((s, k) => s + (k.savingsAchieved || 0), 0),
      implemented: kaizens.filter(k => k.stage === 'Closed').length,
    })
    setRecentAudits([...audits].reverse().slice(0, 3))
    setPendingKaizens(kaizens.filter(k => {
      if (user?.role === 'Admin') return k.stage === 'Review'
      if (user?.role === 'Auditor') return k.stage === 'Submitted'
      return false
    }).slice(0, 3))
  }, [user])

  const allModules = [
  { title: 'New 5S Audit', emoji: '📋', desc: 'Conduct section-wise audit with scoring', path: '/new-audit', gradient: 'linear-gradient(135deg, #1e3a5f, #1e40af)', roles: ['MD', 'AuditIncharge', 'FiveS_Incharge', 'Coordinator', 'TeamLead', 'Operator'] },
  { title: 'Audit History', emoji: '📊', desc: 'View all past audit records by area', path: '/audit-history', gradient: 'linear-gradient(135deg, #065f46, #0f766e)', roles: ['MD', 'AuditIncharge', 'FiveS_Incharge', 'Coordinator', 'TeamLead', 'Operator'] },
  { title: 'Audit Trends', emoji: '📈', desc: 'Compliance trends and charts over time', path: '/audit-dashboard', gradient: 'linear-gradient(135deg, #4c1d95, #7c3aed)', roles: ['MD', 'AuditIncharge', 'FiveS_Incharge', 'Coordinator', 'TeamLead', 'Operator'] },
  { title: 'Submit Idea', emoji: '💡', desc: 'Submit improvement idea for review', path: '/submit-kaizen', gradient: 'linear-gradient(135deg, #92400e, #b45309)', roles: ['MD', 'AuditIncharge', 'FiveS_Incharge', 'Coordinator', 'TeamLead', 'Operator'] },
  { title: 'Kaizen Board', emoji: '📌', desc: 'Track ideas through implementation pipeline', path: '/kaizen-board', gradient: 'linear-gradient(135deg, #9a3412, #b91c1c)', roles: ['MD', 'AuditIncharge', 'FiveS_Incharge', 'Coordinator', 'TeamLead', 'Operator'] },
  { title: 'Kaizen Stats', emoji: '🏆', desc: 'Savings achieved and performance metrics', path: '/kaizen-dashboard', gradient: 'linear-gradient(135deg, #064e3b, #065f46)', roles: ['MD', 'AuditIncharge', 'FiveS_Incharge', 'Coordinator', 'TeamLead', 'Operator'] },
  { title: 'Organogram', emoji: '🏢', desc: 'View team structure and members', path: '/organogram', gradient: 'linear-gradient(135deg, #1e3a5f, #0369a1)', roles: ['MD', 'AuditIncharge', 'FiveS_Incharge', 'Coordinator', 'TeamLead', 'Operator'] },
  { title: 'MD View', emoji: '👔', desc: 'Executive overview and reports', path: '/md-view', gradient: 'linear-gradient(135deg, #0f172a, #1e3a5f)', roles: ['MD'] },
  { title: 'Master Setup', emoji: '⚙️', desc: 'Manage checklist items', path: '/master-setup', gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)', roles: ['MD', 'AuditIncharge'] },
]

  const modules = allModules.filter(m => m.roles.includes(user?.role))

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
      <Navbar />
      <div className="p-4 max-w-2xl mx-auto">

        {/* Welcome */}
        <div className="rounded-2xl p-5 mb-4 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #f97316, transparent)', transform: 'translate(30%, -30%)' }}></div>
          <p className="text-blue-300 text-xs font-medium">
            {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening'} 👋
          </p>
          <h1 className="text-xl font-black text-white mt-1">{user?.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>{user?.role}</span>
            <span className="text-blue-300 text-xs">Team: {user?.team}</span>
            <span className="text-blue-400 text-xs">{new Date().toDateString()}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Audits', value: stats.audits, color: '#1e3a5f', bg: '#eff6ff' },
            { label: 'Avg Score', value: `${stats.avgScore}%`, color: stats.avgScore >= 80 ? '#16a34a' : stats.avgScore >= 60 ? '#d97706' : '#dc2626', bg: '#f0fdf4' },
            { label: 'Ideas', value: stats.kaizens, color: '#7c3aed', bg: '#f5f3ff' },
            { label: 'In Progress', value: stats.pending, color: '#d97706', bg: '#fffbeb' },
            { label: 'Implemented', value: stats.implemented, color: '#16a34a', bg: '#f0fdf4' },
            { label: 'Savings', value: `₹${stats.savings.toLocaleString()}`, color: '#be185d', bg: '#fdf2f8' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-3 text-center shadow-sm" style={{ background: s.bg }}>
              <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Pending Tasks */}
        {pendingKaizens.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            <p className="text-xs font-black text-red-600 uppercase tracking-wider mb-3">
              🔔 Pending Your Action ({pendingKaizens.length})
            </p>
            {pendingKaizens.map(k => (
              <div key={k.id} onClick={() => navigate('/kaizen-board')}
                className="flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-gray-50 mb-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-800">{k.title}</p>
                  <p className="text-xs text-gray-400">{k.area} · {k.stage}</p>
                </div>
                <span className="text-xs text-blue-500">Review →</span>
              </div>
            ))}
          </div>
        )}

        {/* Recent Audits */}
        {recentAudits.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            <p className="text-xs font-black text-gray-600 uppercase tracking-wider mb-3">Recent Audits</p>
            {recentAudits.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 mb-1">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black"
                  style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>
                  {a.auditLevel}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-800">{a.area}</p>
                  <p className="text-xs text-gray-400">{a.date} · {a.auditorName || a.submittedBy}</p>
                </div>
                <span className="text-sm font-black"
                  style={{ color: (a.scorePercent || 0) >= 80 ? '#16a34a' : (a.scorePercent || 0) >= 60 ? '#d97706' : '#dc2626' }}>
                  {a.scorePercent || 0}%
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Modules */}
        <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Modules</p>
        <div className="grid grid-cols-2 gap-3">
          {modules.map(card => (
            <div key={card.path} onClick={() => navigate(card.path)}
              className="rounded-2xl p-4 cursor-pointer shadow-md hover:shadow-xl transition-all text-white relative overflow-hidden"
              style={{ background: card.gradient }}>
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-10"
                style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(30%, -30%)' }}></div>
              <span className="text-2xl mb-2 block">{card.emoji}</span>
              <h2 className="text-xs font-black leading-tight">{card.title}</h2>
              <p className="text-xs opacity-70 mt-1">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard