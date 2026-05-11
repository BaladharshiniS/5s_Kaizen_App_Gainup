import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { TEAMS, getKaizens } from '../firebase'

const COLORS = ['#1e3a5f', '#f97316', '#0f766e', '#7c3aed', '#b91c1c', '#065f46', '#b45309', '#0369a1', '#be185d']
const STAGES = ['Submitted', 'Review', 'Approved', 'Implement', 'Verify', 'Closed']

const KaizenDashboard = () => {
  const [kaizens, setKaizens] = useState([])
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    getKaizens().then(data => setKaizens(data)).catch(() => setKaizens([]))
  }, [])

  const totalSavings = kaizens.reduce((s, k) => s + (k.savingsAchieved || 0), 0)
  const totalEstimated = kaizens.reduce((s, k) => s + (Number(k.estimatedSaving) || 0), 0)
  const closed = kaizens.filter(k => k.stage === 'Closed').length
  const pending = kaizens.filter(k => k.stage !== 'Closed').length

  const stageData = STAGES.map(stage => ({
    name: stage,
    Count: kaizens.filter(k => k.stage === stage).length
  }))

  const teamData = TEAMS.map(team => ({
    name: team.split(' ')[0],
    Ideas: kaizens.filter(k => k.submittedTeam === team).length,
    Implemented: kaizens.filter(k => k.submittedTeam === team && k.stage === 'Closed').length,
    Savings: kaizens.filter(k => k.submittedTeam === team).reduce((s, k) => s + (k.savingsAchieved || 0), 0),
  })).filter(t => t.Ideas > 0)

  const areaData = [...new Set(kaizens.map(k => k.area).filter(Boolean))].map(area => ({
    name: area.split(' ')[0],
    Count: kaizens.filter(k => k.area === area).length,
  }))

  const categoryData = [...new Set(kaizens.flatMap(k => {
    if (Array.isArray(k.categories)) return k.categories
    if (k.category) return [k.category]
    return []
  }).filter(Boolean))].map(cat => ({
    name: cat,
    value: kaizens.filter(k =>
      (Array.isArray(k.categories) && k.categories.includes(cat)) ||
      k.category === cat
    ).length
  })).filter(d => d.value > 0)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
      <Navbar />
      <div className="p-4 max-w-5xl mx-auto">
        <h1 className="text-xl font-black text-gray-800 mb-4">🏆 Kaizen Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Ideas', value: kaizens.length, color: '#1e3a5f', bg: '#eff6ff' },
            { label: 'Implemented', value: closed, color: '#16a34a', bg: '#dcfce7' },
            { label: 'In Progress', value: pending, color: '#d97706', bg: '#fef9c3' },
            { label: 'Savings', value: `₹${totalSavings.toLocaleString()}`, color: '#7c3aed', bg: '#f5f3ff' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-3 text-center shadow-sm" style={{ background: s.bg }}>
              <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {['overview', 'by team', 'by dept', 'ideas list'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap"
              style={tab === t
                ? { background: 'linear-gradient(135deg, #1e3a5f, #1e40af)', color: 'white' }
                : { background: 'white', color: '#64748b' }}>
              {t}
            </button>
          ))}
        </div>

        {kaizens.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <p className="text-4xl mb-3">🏆</p>
            <p className="text-gray-400 text-sm">No kaizen data yet.</p>
          </div>
        ) : (
          <>
            {tab === 'overview' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl shadow-sm p-4">
                  <p className="text-xs font-black text-gray-600 uppercase mb-3">Ideas by Stage</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stageData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="Count" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl shadow-sm p-4">
                    <p className="text-xs font-black text-gray-600 uppercase mb-3">By Category</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}>
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                        <Legend formatter={v => <span style={{ fontSize: 9 }}>{v}</span>} />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm p-4">
                    <div className="flex justify-between mb-3">
                      <p className="text-xs font-black text-gray-600 uppercase">Savings Tracker</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Estimated Total</span>
                        <span className="font-black text-blue-700">₹{totalEstimated.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Achieved Total</span>
                        <span className="font-black text-green-600">₹{totalSavings.toLocaleString()}</span>
                      </div>
                      <div className="w-full rounded-full h-3" style={{ background: '#e2e8f0' }}>
                        <div className="h-3 rounded-full"
                          style={{ width: `${totalEstimated ? Math.min(100, Math.round(totalSavings / totalEstimated * 100)) : 0}%`, background: 'linear-gradient(90deg, #16a34a, #22c55e)' }}></div>
                      </div>
                      <p className="text-xs text-gray-400 text-center">
                        {totalEstimated ? Math.min(100, Math.round(totalSavings / totalEstimated * 100)) : 0}% of target achieved
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'by team' && (
              <div className="space-y-3">
                <div className="bg-white rounded-2xl shadow-sm p-4">
                  <p className="text-xs font-black text-gray-600 uppercase mb-3">Ideas by Team</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={teamData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="Ideas" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Implemented" fill="#16a34a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <table className="w-full text-xs">
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-500 font-bold">Team</th>
                        <th className="px-3 py-2 text-center text-gray-500 font-bold">Ideas</th>
                        <th className="px-3 py-2 text-center text-gray-500 font-bold">Done</th>
                        <th className="px-3 py-2 text-center text-gray-500 font-bold">Savings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TEAMS.map(team => {
                        const ideas = kaizens.filter(k => k.submittedTeam === team).length
                        const done = kaizens.filter(k => k.submittedTeam === team && k.stage === 'Closed').length
                        const savings = kaizens.filter(k => k.submittedTeam === team).reduce((s, k) => s + (k.savingsAchieved || 0), 0)
                        return (
                          <tr key={team} className="border-t border-gray-50 hover:bg-gray-50">
                            <td className="px-3 py-2 font-bold text-gray-800">{team}</td>
                            <td className="px-3 py-2 text-center font-black text-blue-700">{ideas}</td>
                            <td className="px-3 py-2 text-center font-black text-green-600">{done}</td>
                            <td className="px-3 py-2 text-center font-black text-purple-600">₹{savings.toLocaleString()}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'by dept' && (
              <div className="space-y-3">
                <div className="bg-white rounded-2xl shadow-sm p-4">
                  <p className="text-xs font-black text-gray-600 uppercase mb-3">Ideas by Department</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={areaData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={55} />
                      <Tooltip />
                      <Bar dataKey="Count" fill="#f97316" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {tab === 'ideas list' && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
                      <tr>
                        {['Title', 'Team', 'Dept', 'Stage', 'Est. ₹', 'Achieved ₹'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-white font-bold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {kaizens.map(k => (
                        <tr key={k.id} className="border-t border-gray-50 hover:bg-gray-50">
                          <td className="px-3 py-2 font-semibold text-gray-800">{k.title}</td>
                          <td className="px-3 py-2 text-gray-500">{k.submittedTeam}</td>
                          <td className="px-3 py-2 text-gray-500">{k.area}</td>
                          <td className="px-3 py-2">
                            <span className="px-2 py-0.5 rounded-full font-bold text-white"
                              style={{ background: '#1e3a5f', fontSize: '10px' }}>{k.stage}</span>
                          </td>
                          <td className="px-3 py-2 text-blue-700 font-bold">₹{k.estimatedSaving || 0}</td>
                          <td className="px-3 py-2 text-green-600 font-bold">₹{k.savingsAchieved || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default KaizenDashboard