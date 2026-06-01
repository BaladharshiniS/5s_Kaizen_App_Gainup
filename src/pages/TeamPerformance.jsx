import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { getKaizens, getAudits, TEAMS } from '../firebase'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip
} from 'recharts'

const MEDAL = ['🥇', '🥈', '🥉']

const getRankStyle = (i) => {
  if (i === 0) return { bg: '#fef9c3', border: '#eab308', color: '#854d0e' }
  if (i === 1) return { bg: '#f1f5f9', border: '#94a3b8', color: '#475569' }
  if (i === 2) return { bg: '#fff7ed', border: '#f97316', color: '#9a3412' }
  return { bg: 'white', border: '#e2e8f0', color: '#475569' }
}

const ScoreBar = ({ value, max = 100, color = '#1e40af' }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 rounded-full h-2" style={{ background: '#e2e8f0' }}>
      <div className="h-2 rounded-full transition-all"
        style={{ width: `${Math.min(100, Math.round(value / max * 100))}%`, background: color }} />
    </div>
    <span className="text-xs font-black w-8 text-right" style={{ color }}>
      {Math.round(value / max * 100)}%
    </span>
  </div>
)

const TeamPerformance = () => {
  const [kaizens, setKaizens] = useState([])
  const [audits, setAudits] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [selectedTeam, setSelectedTeam] = useState(null)

  useEffect(() => {
    const load = async () => {
      const [k, a] = await Promise.all([getKaizens(), getAudits()])
      setKaizens(k)
      setAudits(a)
      setLoading(false)
    }
    load()
  }, [])

  // ── Per-team stats ────────────────────────────────────────────────────
  const teamStats = TEAMS.map(team => {
    const teamKaizens = kaizens.filter(k =>
      (k.submittedTeam || k.team) === team
    )
    const teamAudits = audits.filter(a => a.teamName === team)

    // Kaizen stats
    const totalIdeas    = teamKaizens.length
    const closed        = teamKaizens.filter(k => k.stage === 'Closed').length
    const rejected      = teamKaizens.filter(k => k.stage === 'Rejected').length
    const active        = teamKaizens.filter(k =>
      k.stage !== 'Closed' && k.stage !== 'Rejected'
    ).length
    const savings       = teamKaizens.reduce((s, k) =>
      s + (Number(k.savingsAchieved) || 0), 0
    )
    const implRate      = totalIdeas > 0
      ? Math.round(closed / totalIdeas * 100) : 0
    const rejRate       = totalIdeas > 0
      ? Math.round(rejected / totalIdeas * 100) : 0

    // Average days to implement (Submitted → Closed)
    const closedIdeas = teamKaizens.filter(k =>
      k.stage === 'Closed' &&
      k.timestamps?.Submitted &&
      k.timestamps?.Closed
    )
    const avgDays = closedIdeas.length > 0
      ? Math.round(
          closedIdeas.reduce((sum, k) => {
            const start = new Date(k.timestamps.Submitted)
            const end   = new Date(k.timestamps.Closed)
            return sum + (isNaN(start) || isNaN(end)
              ? 0
              : Math.max(0, (end - start) / (1000 * 60 * 60 * 24)))
          }, 0) / closedIdeas.length
        )
      : null

    // 5S stats — average scorePercent across all audits for this team
    const avg5S = teamAudits.length > 0
      ? Math.round(
          teamAudits.reduce((s, a) => s + (Number(a.scorePercent) || 0), 0)
          / teamAudits.length
        )
      : null

    // Latest 5S audit
    const latestAudit = teamAudits
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]

    // 5S by level (average per level)
    const levels = ['1S', '2S', '3S', '4S', '5S']
    const fivesByLevel = levels.map(lvl => {
      const lvlAudits = teamAudits.filter(a => a.auditLevel === lvl)
      const avg = lvlAudits.length > 0
        ? Math.round(
            lvlAudits.reduce((s, a) => s + (Number(a.scorePercent) || 0), 0)
            / lvlAudits.length
          )
        : 0
      return { level: lvl, score: avg }
    })

    // Combined score (50% kaizen + 50% 5S)
    const kaizenScore = totalIdeas > 0
      ? Math.min(100, Math.round(
          (implRate * 0.5) +
          (Math.min(totalIdeas, 10) * 5) +
          (savings > 0 ? 10 : 0)
        ))
      : 0
    const combined = avg5S !== null
      ? Math.round((kaizenScore + avg5S) / 2)
      : kaizenScore

    return {
      team, totalIdeas, closed, rejected, active,
      savings, implRate, rejRate, avgDays,
      avg5S, latestAudit, fivesByLevel, kaizenScore, combined,
      auditCount: teamAudits.length,
    }
  }).filter(t => t.totalIdeas > 0 || t.auditCount > 0)
    .sort((a, b) => b.combined - a.combined)

  const radarData = selectedTeam
    ? (() => {
        const t = teamStats.find(ts => ts.team === selectedTeam)
        if (!t) return []
        return [
          { metric: 'Ideas',        value: Math.min(100, t.totalIdeas * 10) },
          { metric: 'Impl Rate',    value: t.implRate },
          { metric: '5S Score',     value: t.avg5S || 0 },
          { metric: 'Savings',      value: Math.min(100, Math.round(t.savings / 500)) },
          { metric: 'Speed',        value: t.avgDays ? Math.max(0, 100 - t.avgDays * 2) : 0 },
          { metric: 'Low Rejection',value: Math.max(0, 100 - t.rejRate) },
        ]
      })()
    : []

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#f1f5f9' }}>
      <div className="bg-white px-6 py-4 rounded-2xl shadow-sm">
        <p className="text-sm font-bold text-slate-600">Loading team data...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
      <Navbar />
      <div className="p-4 max-w-5xl mx-auto">

        <h1 className="text-xl font-black text-gray-800 mb-4">
          📊 Team Performance
        </h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {['overview', '5s ranking', 'kaizen ranking', 'deep dive'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap"
              style={tab === t
                ? { background: 'linear-gradient(135deg, #1e3a5f, #1e40af)', color: 'white' }
                : { background: 'white', color: '#64748b' }}>
              {t}
            </button>
          ))}
        </div>

        {teamStats.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-gray-400 text-sm">No team data yet.</p>
          </div>
        ) : (
          <>

            {/* ── OVERVIEW TAB ── */}
            {tab === 'overview' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-400 font-semibold px-1">
                  Ranked by Combined Score (5S + Kaizen)
                </p>
                {teamStats.map((t, i) => {
                  const rs = getRankStyle(i)
                  return (
                    <div key={t.team}
                      className="rounded-2xl p-4 shadow-sm"
                      style={{ background: rs.bg, border: `2px solid ${rs.border}` }}>

                      {/* Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xl">{MEDAL[i] || `#${i + 1}`}</span>
                        <div className="flex-1">
                          <p className="text-sm font-black text-gray-800">{t.team}</p>
                          <p className="text-xs font-semibold" style={{ color: rs.color }}>
                            Combined Score: {t.combined}%
                          </p>
                        </div>
                        <button
                          onClick={() => { setSelectedTeam(t.team); setTab('deep dive') }}
                          className="text-xs font-bold px-3 py-1.5 rounded-xl"
                          style={{ background: 'white', color: '#1e40af',
                            border: '1px solid #bfdbfe' }}>
                          Details →
                        </button>
                      </div>

                      {/* Score bars */}
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-gray-500">5S Score</span>
                            <span className="text-xs font-bold text-blue-700">
                              {t.avg5S !== null ? `${t.avg5S}%` : 'No audits'}
                            </span>
                          </div>
                          <ScoreBar value={t.avg5S || 0} color="#1e40af" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-gray-500">Kaizen Score</span>
                            <span className="text-xs font-bold text-purple-700">
                              {t.kaizenScore}%
                            </span>
                          </div>
                          <ScoreBar value={t.kaizenScore} color="#7c3aed" />
                        </div>
                      </div>

                      {/* Stats row */}
                      <div className="grid grid-cols-4 gap-2 mt-3 pt-3"
                        style={{ borderTop: `1px solid ${rs.border}40` }}>
                        {[
                          { label: 'Ideas',    value: t.totalIdeas,  color: '#1e40af' },
                          { label: 'Closed',   value: t.closed,      color: '#166534' },
                          { label: 'Rejected', value: t.rejected,    color: '#dc2626' },
                          { label: 'Savings',  value: `₹${t.savings.toLocaleString('en-IN')}`, color: '#5b21b6' },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="text-center">
                            <p className="text-xs font-black" style={{ color }}>{value}</p>
                            <p className="text-xs text-gray-400">{label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── 5S RANKING TAB ── */}
            {tab === '5s ranking' && (
              <div className="space-y-3">
                <div className="bg-white rounded-2xl shadow-sm p-4">
                  <p className="text-xs font-black text-gray-600 uppercase mb-4">
                    Average 5S Score by Team
                  </p>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={[...teamStats]
                        .filter(t => t.avg5S !== null)
                        .sort((a, b) => b.avg5S - a.avg5S)
                        .map(t => ({ name: t.team.split(' ')[0], score: t.avg5S }))}
                      margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }}
                        angle={-35} textAnchor="end" interval={0} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={v => [`${v}%`, '5S Score']} />
                      <Bar dataKey="score" fill="#1e40af" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* 5S table */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <table className="w-full text-xs">
                    <thead style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
                      <tr>
                        {['Rank', 'Team', 'Avg 5S%', 'Audits', 'Latest'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-white font-bold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...teamStats]
                        .sort((a, b) => (b.avg5S || 0) - (a.avg5S || 0))
                        .map((t, i) => (
                          <tr key={t.team} className="border-t border-gray-50 hover:bg-gray-50">
                            <td className="px-3 py-2 font-black text-gray-400">
                              {MEDAL[i] || `#${i + 1}`}
                            </td>
                            <td className="px-3 py-2 font-bold text-gray-800">{t.team}</td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 rounded-full bg-gray-100">
                                  <div className="h-1.5 rounded-full"
                                    style={{
                                      width: `${t.avg5S || 0}%`,
                                      background: '#1e40af'
                                    }} />
                                </div>
                                <span className="font-black text-blue-700">
                                  {t.avg5S !== null ? `${t.avg5S}%` : '—'}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-gray-500">{t.auditCount}</td>
                            <td className="px-3 py-2 text-gray-400">
                              {t.latestAudit?.auditDate || '—'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── KAIZEN RANKING TAB ── */}
            {tab === 'kaizen ranking' && (
              <div className="space-y-3">
                <div className="bg-white rounded-2xl shadow-sm p-4">
                  <p className="text-xs font-black text-gray-600 uppercase mb-4">
                    Ideas Submitted vs Implemented
                  </p>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={[...teamStats]
                        .sort((a, b) => b.totalIdeas - a.totalIdeas)
                        .map(t => ({
                          name: t.team.split(' ')[0],
                          Ideas: t.totalIdeas,
                          Closed: t.closed,
                          Rejected: t.rejected,
                        }))}
                      margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }}
                        angle={-35} textAnchor="end" interval={0} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="Ideas"    fill="#1e3a5f" radius={[4,4,0,0]} maxBarSize={30} />
                      <Bar dataKey="Closed"   fill="#16a34a" radius={[4,4,0,0]} maxBarSize={30} />
                      <Bar dataKey="Rejected" fill="#dc2626" radius={[4,4,0,0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 justify-center mt-2">
                    {[['#1e3a5f','Ideas'],['#16a34a','Closed'],['#dc2626','Rejected']].map(([c,l]) => (
                      <div key={l} className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
                        <span className="text-xs text-gray-500">{l}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kaizen table */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <table className="w-full text-xs">
                    <thead style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
                      <tr>
                        {['Rank','Team','Ideas','Closed','Rejected','Rej%','Avg Days','Savings'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-white font-bold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...teamStats]
                        .sort((a, b) => b.totalIdeas - a.totalIdeas)
                        .map((t, i) => (
                          <tr key={t.team} className="border-t border-gray-50 hover:bg-gray-50">
                            <td className="px-3 py-2 font-black text-gray-400">
                              {MEDAL[i] || `#${i+1}`}
                            </td>
                            <td className="px-3 py-2 font-bold text-gray-800">{t.team}</td>
                            <td className="px-3 py-2 font-black text-blue-700">{t.totalIdeas}</td>
                            <td className="px-3 py-2 font-black text-green-600">{t.closed}</td>
                            <td className="px-3 py-2 font-black text-red-500">{t.rejected}</td>
                            <td className="px-3 py-2">
                              <span className="px-2 py-0.5 rounded-full font-bold"
                                style={{
                                  background: t.rejRate > 20 ? '#fee2e2' : '#dcfce7',
                                  color: t.rejRate > 20 ? '#dc2626' : '#166534'
                                }}>
                                {t.rejRate}%
                              </span>
                            </td>
                            <td className="px-3 py-2 text-gray-500">
                              {t.avgDays !== null ? `${t.avgDays}d` : '—'}
                            </td>
                            <td className="px-3 py-2 font-black text-purple-600">
                              ₹{t.savings.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── DEEP DIVE TAB ── */}
            {tab === 'deep dive' && (
              <div className="space-y-3">
                {/* Team selector */}
                <div className="bg-white rounded-2xl p-3 shadow-sm">
                  <p className="text-xs font-black text-gray-500 uppercase mb-2">Select Team</p>
                  <div className="flex gap-2 flex-wrap">
                    {teamStats.map(t => (
                      <button key={t.team}
                        onClick={() => setSelectedTeam(t.team)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold"
                        style={selectedTeam === t.team
                          ? { background: '#1e40af', color: 'white' }
                          : { background: '#f1f5f9', color: '#475569' }}>
                        {t.team}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedTeam && (() => {
                  const t = teamStats.find(ts => ts.team === selectedTeam)
                  if (!t) return null
                  return (
                    <div className="space-y-3">

                      {/* Combined score card */}
                      <div className="rounded-2xl p-4 shadow-sm"
                        style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
                        <p className="text-blue-300 text-xs font-semibold mb-1">{t.team}</p>
                        <div className="flex items-end gap-2">
                          <p className="text-3xl font-black text-white">{t.combined}%</p>
                          <p className="text-blue-300 text-xs mb-1">Combined Score</p>
                        </div>
                        <div className="flex gap-4 mt-3">
                          <div>
                            <p className="text-white font-black">{t.avg5S !== null ? `${t.avg5S}%` : '—'}</p>
                            <p className="text-blue-300 text-xs">5S Score</p>
                          </div>
                          <div>
                            <p className="text-white font-black">{t.kaizenScore}%</p>
                            <p className="text-blue-300 text-xs">Kaizen Score</p>
                          </div>
                          <div>
                            <p className="text-white font-black">₹{t.savings.toLocaleString('en-IN')}</p>
                            <p className="text-blue-300 text-xs">Total Savings</p>
                          </div>
                        </div>
                      </div>

                      {/* Radar chart */}
                      {radarData.length > 0 && (
                        <div className="bg-white rounded-2xl p-4 shadow-sm">
                          <p className="text-xs font-black text-gray-600 uppercase mb-2">
                            Performance Radar
                          </p>
                          <ResponsiveContainer width="100%" height={260}>
                            <RadarChart data={radarData}>
                              <PolarGrid stroke="#e2e8f0" />
                              <PolarAngleAxis dataKey="metric"
                                tick={{ fontSize: 10, fill: '#475569' }} />
                              <Radar dataKey="value" fill="#1e40af"
                                fillOpacity={0.3} stroke="#1e40af" strokeWidth={2} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* 5S by level */}
                      <div className="bg-white rounded-2xl p-4 shadow-sm">
                        <p className="text-xs font-black text-gray-600 uppercase mb-3">
                          5S Score by Level
                        </p>
                        <div className="space-y-3">
                          {t.fivesByLevel.map(({ level, score }) => (
                            <div key={level}>
                              <div className="flex justify-between mb-1">
                                <span className="text-xs font-bold text-gray-600">{level}</span>
                                <span className="text-xs font-black text-blue-700">{score}%</span>
                              </div>
                              <ScoreBar value={score} color="#1e40af" />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Kaizen breakdown */}
                      <div className="bg-white rounded-2xl p-4 shadow-sm">
                        <p className="text-xs font-black text-gray-600 uppercase mb-3">
                          Kaizen Breakdown
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: 'Total Ideas',    value: t.totalIdeas,  bg: '#dbeafe', color: '#1e40af' },
                            { label: 'Implemented',    value: t.closed,      bg: '#dcfce7', color: '#166534' },
                            { label: 'Active',         value: t.active,      bg: '#ede9fe', color: '#5b21b6' },
                            { label: 'Rejected',       value: t.rejected,    bg: '#fee2e2', color: '#dc2626' },
                            { label: 'Impl. Rate',     value: `${t.implRate}%`, bg: '#fef9c3', color: '#854d0e' },
                            { label: 'Rejection Rate', value: `${t.rejRate}%`,  bg: t.rejRate > 20 ? '#fee2e2' : '#dcfce7', color: t.rejRate > 20 ? '#dc2626' : '#166534' },
                            { label: 'Avg Days',       value: t.avgDays !== null ? `${t.avgDays}d` : '—', bg: '#f1f5f9', color: '#475569' },
                            { label: 'Total Savings',  value: `₹${t.savings.toLocaleString('en-IN')}`, bg: '#ede9fe', color: '#5b21b6' },
                          ].map(({ label, value, bg, color }) => (
                            <div key={label} className="rounded-xl p-3 text-center"
                              style={{ background: bg }}>
                              <p className="text-sm font-black" style={{ color }}>{value}</p>
                              <p className="text-xs mt-0.5" style={{ color }}>{label}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )
                })()}
              </div>
            )}

          </>
        )}
      </div>
    </div>
  )
}

export default TeamPerformance