import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { AREAS, TEAMS, DEFAULT_CHECKLIST, TEAMS_DEPARTMENTS } from '../firebase'

const S_LEVELS = ['1S', '2S', '3S', '4S', '5S']

const StatsSection = ({ audits, filtered, overallAvg, TEAMS }) => {
  const [showTeams, setShowTeams] = useState(false)

  const auditedTeams = [...new Set(filtered.map(a => a.teamName).filter(Boolean))]
  const filteredAvg = filtered.length
    ? Math.round(filtered.reduce((s, a) => s + (a.scorePercent || 0), 0) / filtered.length)
    : 0
  const highest = filtered.length ? Math.max(...filtered.map(a => a.scorePercent || 0)) : 0
  const lowest = filtered.length ? Math.min(...filtered.map(a => a.scorePercent || 0)) : 0
  const highestAudit = filtered.find(a => (a.scorePercent || 0) === highest)
  const lowestAudit = filtered.find(a => (a.scorePercent || 0) === lowest)

  const stats = [
    { label: 'Total Audits', value: filtered.length, color: '#1e3a5f', bg: '#eff6ff' },
    { label: 'Avg Score', value: `${filteredAvg}%`, color: filteredAvg >= 80 ? '#16a34a' : filteredAvg >= 60 ? '#d97706' : '#dc2626', bg: '#f0fdf4' },
    {
      label: 'Highest',
      value: `${highest}%`,
      color: '#16a34a',
      bg: '#dcfce7',
      sub: highestAudit ? `${highestAudit.teamName} · ${highestAudit.area} · ${highestAudit.date}` : ''
    },
    {
      label: 'Lowest',
      value: `${lowest}%`,
      color: '#dc2626',
      bg: '#fee2e2',
      sub: lowestAudit ? `${lowestAudit.teamName} · ${lowestAudit.area} · ${lowestAudit.date}` : ''
    },
    { label: 'Areas', value: [...new Set(filtered.map(a => a.area).filter(Boolean))].length, color: '#7c3aed', bg: '#f5f3ff' },
    { label: 'Teams Audited', value: auditedTeams.length, color: '#d97706', bg: '#fffbeb', clickable: true },
  ]

  return (
    <>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        {stats.map(s => (
          <div key={s.label}
            onClick={() => s.clickable && setShowTeams(true)}
            className={`rounded-2xl p-3 text-center shadow-sm ${s.clickable ? 'cursor-pointer hover:shadow-md' : ''}`}
            style={{ background: s.bg }}>
            <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-tight">{s.label}</p>
            {s.sub && <p className="text-xs mt-0.5 leading-tight" style={{ color: s.color }}>{s.sub}</p>}
            {s.clickable && <p className="text-xs mt-0.5" style={{ color: s.color }}>tap →</p>}
          </div>
        ))}
      </div>

      {showTeams && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h2 className="text-base font-black text-gray-800 mb-4">
              Teams Audited ({auditedTeams.length}/{TEAMS.length})
            </h2>
            <div className="space-y-2 max-h-80 overflow-y-auto mb-4">
              {TEAMS.map(team => {
                const done = auditedTeams.includes(team)
                return (
                  <div key={team} className="flex items-center gap-3 rounded-xl p-2.5"
                    style={{ background: done ? '#dcfce7' : '#fee2e2' }}>
                    <span>{done ? '✅' : '⏳'}</span>
                    <span className="text-sm font-semibold flex-1"
                      style={{ color: done ? '#16a34a' : '#dc2626' }}>{team}</span>
                    <span className="text-xs font-bold"
                      style={{ color: done ? '#16a34a' : '#dc2626' }}>
                      {done ? 'Audited' : 'Pending'}
                    </span>
                  </div>
                )
              })}
            </div>
            <button onClick={() => setShowTeams(false)}
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

const AuditDashboard = () => {
  const [audits, setAudits] = useState([])
  const [selectedArea, setSelectedArea] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST)

  useEffect(() => {
    setAudits(JSON.parse(localStorage.getItem('audits') || '[]'))
    const saved = localStorage.getItem('masterChecklist')
    if (saved) setChecklist(JSON.parse(saved))
  }, [])

  const filtered = audits.filter(a => {
    if (selectedArea && a.area !== selectedArea) return false
    if (selectedLevel && a.auditLevel !== selectedLevel) return false
    if (selectedTeam && a.teamName !== selectedTeam) return false
    return true
  })

  const trendData = filtered.map((a, i) => ({
    name: `${a.date}`,
    Score: a.scorePercent || 0,
  }))

  const areaData = AREAS.map(area => {
    const areaAudits = audits.filter(a => a.area === area)
    return {
      name: area.split(' ')[0],
      Score: areaAudits.length
        ? Math.round(areaAudits.reduce((s, a) => s + (a.scorePercent || 0), 0) / areaAudits.length)
        : 0,
      Latest: areaAudits.length ? (areaAudits[areaAudits.length - 1].scorePercent || 0) : 0,
    }
  }).filter(a => a.Score > 0)

  const sectionData = S_LEVELS.map(s => {
    const sAudits = filtered.filter(a => {
      const idx = S_LEVELS.indexOf(a.auditLevel)
      return idx >= S_LEVELS.indexOf(s)
    })
    if (!sAudits.length) return { section: s, Average: 0 }
    const avgPct = sAudits.reduce((sum, a) => {
      const items = checklist[s]?.items || []
      const scored = items.reduce((ss, _, idx) => ss + (Number(a.scores?.[`${s}_${idx}`]) || 0), 0)
      const total = checklist[s]?.totalMarks || 1
      return sum + Math.round(scored / total * 100)
    }, 0) / sAudits.length
    return { section: `${s} ${checklist[s]?.label.split('(')[0].trim()}`, Average: Math.round(avgPct) }
  })

  const teamSLevelData = TEAMS.map(team => {
    const teamAudits = audits.filter(a => a.teamName === team)
    if (!teamAudits.length) return null
    const obj = { team: team.split(' ')[0] }
    S_LEVELS.forEach(s => {
      const sAudits = teamAudits.filter(a => {
        const idx = S_LEVELS.indexOf(a.auditLevel)
        return idx >= S_LEVELS.indexOf(s)
      })
      if (!sAudits.length) { obj[s] = 0; return }
      const avg = sAudits.reduce((sum, a) => {
        const items = checklist[s]?.items || []
        const scored = items.reduce((ss, _, idx) => ss + (Number(a.scores?.[`${s}_${idx}`]) || 0), 0)
        const total = checklist[s]?.totalMarks || 1
        return sum + Math.round(scored / total * 100)
      }, 0) / sAudits.length
      obj[s] = Math.round(avg)
    })
    return obj
  }).filter(Boolean)

  const levelData = S_LEVELS.map(level => {
    const levelAudits = audits.filter(a => a.auditLevel === level)
    return {
      name: level,
      Avg: levelAudits.length
        ? Math.round(levelAudits.reduce((s, a) => s + (a.scorePercent || 0), 0) / levelAudits.length)
        : 0,
      Count: levelAudits.length,
    }
  })

  const overallAvg = filtered.length
    ? Math.round(filtered.reduce((s, a) => s + (a.scorePercent || 0), 0) / filtered.length)
    : 0

  const S_COLORS = { '1S': '#dc2626', '2S': '#d97706', '3S': '#2563eb', '4S': '#7c3aed', '5S': '#0f766e' }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
      <Navbar />
      <div className="p-4 max-w-5xl mx-auto">
        <h1 className="text-xl font-black text-gray-800 mb-4">📈 Audit Trends</h1>

        {/* Stats */}
        <StatsSection
          audits={audits}
          filtered={filtered}
          overallAvg={overallAvg}
          TEAMS={TEAMS}
        />

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-3 mb-4 flex flex-wrap gap-2">
          <select value={selectedTeam} onChange={e => { setSelectedTeam(e.target.value); setSelectedArea('') }}
            className="border-2 border-gray-100 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none bg-gray-50">
            <option value="">All Teams</option>
            {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {selectedTeam && (
            <select value={selectedArea} onChange={e => setSelectedArea(e.target.value)}
              className="border-2 border-gray-100 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none bg-gray-50">
              <option value="">All Depts ({selectedTeam})</option>
              {(TEAMS_DEPARTMENTS[selectedTeam] || []).map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          )}
          <select value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)}
            className="border-2 border-gray-100 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none bg-gray-50">
            <option value="">All Levels</option>
            {S_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {audits.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-gray-400 text-sm">No data yet. Submit some audits first!</p>
          </div>
        ) : (
          <div className="space-y-4">

            {/* Trend Over Time */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <p className="text-xs font-black text-gray-600 uppercase mb-3">Compliance Trend Over Time</p>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Score" stroke="#1e3a5f" strokeWidth={2.5}
                    dot={{ r: 4, fill: '#f97316' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Score by Department */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <p className="text-xs font-black text-gray-600 uppercase mb-3">Score by Department</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={areaData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={55} />
                    <Tooltip />
                    <Bar dataKey="Score" fill="#1e3a5f" radius={[0, 4, 4, 0]} name="Average" />
                    <Bar dataKey="Latest" fill="#f97316" radius={[0, 4, 4, 0]} name="Latest" />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Average by S Level */}
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <p className="text-xs font-black text-gray-600 uppercase mb-3">Average Score by S Level</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={sectionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="section" tick={{ fontSize: 9 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="Average" radius={[4, 4, 0, 0]}>
                      {sectionData.map((_, index) => (
                        <rect key={index} fill={Object.values(S_COLORS)[index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Audit Level + Team Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <p className="text-xs font-black text-gray-600 uppercase mb-1">Audit Completion by Level</p>
                <p className="text-xs text-gray-400 mb-3">How many audits done per S level</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={levelData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="Count" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Team S-Level Scoring Table */}
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <p className="text-xs font-black text-gray-600 uppercase mb-3">Teams S-Level Scores</p>
                {teamSLevelData.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-8">No team data yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead style={{ background: '#f8fafc' }}>
                        <tr>
                          <th className="px-2 py-1.5 text-left text-gray-500 font-bold">Team</th>
                          {S_LEVELS.map(s => (
                            <th key={s} className="px-2 py-1.5 text-center font-bold"
                              style={{ color: S_COLORS[s] }}>{s}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {teamSLevelData.map((t, i) => (
                          <tr key={i} className="border-t border-gray-50">
                            <td className="px-2 py-1.5 font-bold text-gray-700">{t.team}</td>
                            {S_LEVELS.map(s => (
                              <td key={s} className="px-2 py-1.5 text-center">
                                <span className="font-black text-xs"
                                  style={{ color: t[s] >= 80 ? '#16a34a' : t[s] >= 60 ? '#d97706' : t[s] > 0 ? '#dc2626' : '#d1d5db' }}>
                                  {t[s] > 0 ? `${t[s]}%` : '-'}
                                </span>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {filtered.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <p className="text-xs font-black text-gray-600 uppercase mb-1">5S Section Performance</p>
                <p className="text-xs text-gray-400 mb-4">Average score % per S across all audits</p>
                <div className="space-y-3">
                  {sectionData.map((item, index) => {
                    const color = Object.values(S_COLORS)[index]
                    const pct = item.Average || 0
                    return (
                      <div key={item.section}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-gray-700">{item.section}</span>
                          <span className="text-xs font-black" style={{ color }}>{pct}%</span>
                        </div>
                        <div className="w-full rounded-full h-3" style={{ background: '#f1f5f9' }}>
                          <div className="h-3 rounded-full transition-all"
                            style={{ width: `${pct}%`, background: color }}></div>
                        </div>
                        <p className="text-xs mt-0.5 text-right font-bold"
                          style={{ color: pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626' }}>
                          {pct >= 80 ? '✅ Good' : pct >= 60 ? '⚠️ Average' : '❌ Needs Work'}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AuditDashboard