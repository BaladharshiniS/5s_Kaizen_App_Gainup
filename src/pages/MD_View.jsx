import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { TEAMS, DEFAULT_CHECKLIST, getAudits, getKaizens } from '../firebase'
import { useLang } from '../App'

const MDView = () => {
  const [audits, setAudits] = useState([])
  const [kaizens, setKaizens] = useState([])
  const [tab, setTab] = useState('overview')
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST)
  const [selectedAudit, setSelectedAudit] = useState(null)
  const [baTeam, setBaTeam] = useState('')
  const [baDept, setBaDept] = useState('')
  const [baLevel, setBaLevel] = useState('')
  const lang = useLang()

  useEffect(() => {
    getAudits().then(data => setAudits(data)).catch(() => setAudits([]))
    getKaizens().then(data => setKaizens(data)).catch(() => setKaizens([]))
    const saved = localStorage.getItem('masterChecklist')
    if (saved) setChecklist(JSON.parse(saved))
  }, [])

  const totalSavings = kaizens.reduce((s, k) => s + (k.savingsAchieved || 0), 0)
  const totalEstimated = kaizens.reduce((s, k) => s + (Number(k.estimatedSaving) || 0), 0)
  const avgScore = audits.length ? Math.round(audits.reduce((s, a) => s + (a.scorePercent || 0), 0) / audits.length) : 0

  const getColor = s => s >= 80 ? '#16a34a' : s >= 60 ? '#d97706' : '#dc2626'
  const getBg = s => s >= 80 ? '#dcfce7' : s >= 60 ? '#fef9c3' : '#fee2e2'

  const teamStats = TEAMS.map(team => {
    const teamAudits = audits.filter(a => a.teamName === team)
    const teamKaizens = kaizens.filter(k => k.submittedTeam === team)
    const avg = teamAudits.length ? Math.round(teamAudits.reduce((s, a) => s + (a.scorePercent || 0), 0) / teamAudits.length) : 0
    return {
      team,
      audits: teamAudits.length,
      avg,
      kaizens: teamKaizens.length,
      implemented: teamKaizens.filter(k => k.stage === 'Closed').length,
      savings: teamKaizens.reduce((s, k) => s + (k.savingsAchieved || 0), 0),
    }
  })

  const hasBeforeAfter = audits.filter(a =>
    Object.keys(a.beforePhotos || {}).length > 0
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
      <Navbar />
      <div className="p-4 max-w-5xl mx-auto">

        {/* MD Header */}
        <div className="rounded-2xl p-5 mb-4 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #f97316, transparent)', transform: 'translate(30%,-30%)' }}></div>
          <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider">MD Dashboard</p>
          <h1 className="text-xl font-black text-white mt-1">GAIN UP — Executive Overview</h1>
          <p className="text-blue-300 text-xs mt-1">5S & Kaizen Performance Summary</p>

          <div className="grid grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Total Audits', value: audits.length, color: '#60a5fa' },
              { label: 'Avg Score', value: `${avgScore}%`, color: avgScore >= 80 ? '#34d399' : avgScore >= 60 ? '#fbbf24' : '#f87171' },
              { label: 'Kaizen Ideas', value: kaizens.length, color: '#a78bfa' },
              { label: 'Total Savings', value: `₹${totalSavings.toLocaleString()}`, color: '#34d399' },
            ].map(s => (
              <div key={s.label} className="text-center rounded-xl p-2"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
                <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-blue-300 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {['overview', 'team performance', 'before & after', 'kaizen impact'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap"
              style={tab === t
                ? { background: 'linear-gradient(135deg, #1e3a5f, #1e40af)', color: 'white' }
                : { background: 'white', color: '#64748b' }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-4">
            {/* Recent Audits */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-black text-gray-600 uppercase">Recent Audits</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      {['Department', 'Team', 'Auditor', 'Designation', 'Level', 'Date', 'Score'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-gray-500 font-bold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {audits.slice(0, 10).map(a => (
                      <tr key={a.id} className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedAudit(a)}>
                        <td className="px-3 py-2 font-bold text-gray-800">{a.area}</td>
                        <td className="px-3 py-2 text-gray-600">{a.teamName}</td>
                        <td className="px-3 py-2 font-semibold text-gray-700">{a.auditorName}</td>
                        <td className="px-3 py-2 text-gray-500">{a.auditorDesignation || '-'}</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded-full font-black text-white"
                            style={{ background: '#1e3a5f', fontSize: '10px' }}>{a.auditLevel}</span>
                        </td>
                        <td className="px-3 py-2 text-gray-400">{a.date}</td>
                        <td className="px-3 py-2">
                          <span className="font-black px-2 py-0.5 rounded-full"
                            style={{ background: getBg(a.scorePercent || 0), color: getColor(a.scorePercent || 0) }}>
                            {a.scorePercent || 0}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 'team performance' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
                  <tr>
                    {['Team', 'Audits', 'Avg Score', 'Kaizens', 'Implemented', 'Savings'].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-white font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teamStats.map(t => (
                    <tr key={t.team} className="border-t border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-3 font-black text-gray-800">{t.team}</td>
                      <td className="px-3 py-3 text-center font-bold text-gray-600">{t.audits}</td>
                      <td className="px-3 py-3">
                        <span className="font-black px-2 py-0.5 rounded-full"
                          style={{ background: getBg(t.avg), color: getColor(t.avg) }}>
                          {t.avg > 0 ? `${t.avg}%` : '-'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-purple-700">{t.kaizens}</td>
                      <td className="px-3 py-3 text-center font-bold text-green-600">{t.implemented}</td>
                      <td className="px-3 py-3 font-bold text-blue-700">₹{t.savings.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'before & after' && (
  <div className="space-y-4">

    {/* Filters */}
    <div className="bg-white rounded-2xl shadow-sm p-3 flex flex-wrap gap-2 items-center">
      <select value={baTeam} onChange={e => { setBaTeam(e.target.value); setBaDept(''); setBaLevel('') }}
        className="border-2 border-gray-100 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none bg-gray-50">
        <option value="">All Teams</option>
        {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <select value={baDept} onChange={e => setBaDept(e.target.value)}
        className="border-2 border-gray-100 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none bg-gray-50">
        <option value="">All Departments</option>
        {[...new Set(audits.filter(a => !baTeam || a.teamName === baTeam).map(a => a.area).filter(Boolean))].map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <select value={baLevel} onChange={e => setBaLevel(e.target.value)}
        className="border-2 border-gray-100 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none bg-gray-50">
        <option value="">All S Levels</option>
        {['1S', '2S', '3S', '4S', '5S'].map(l => <option key={l} value={l}>{l}</option>)}
      </select>
      {(baTeam || baDept || baLevel) && (
        <button onClick={() => { setBaTeam(''); setBaDept(''); setBaLevel('') }}
          className="text-xs text-red-500 font-bold">Clear ×</button>
      )}
    </div>

    {(() => {
      // Step 1 — Group all audits by team + dept only
      const groups = {}
      audits.forEach(audit => {
        if (!audit.beforePhotos || Object.keys(audit.beforePhotos).length === 0) return
        const key = `${audit.teamName}||${audit.area}`
        if (!groups[key]) groups[key] = []
        groups[key].push(audit)
      })

      // Step 2 — Sort each group by date (oldest first)
      Object.keys(groups).forEach(key => {
        groups[key].sort((a, b) => new Date(a.date) - new Date(b.date))
      })

      // Step 3 — Apply filters
      const filteredKeys = Object.keys(groups).filter(key => {
        const [team, dept] = key.split('||')
        if (baTeam && team !== baTeam) return false
        if (baDept && dept !== baDept) return false
        return true
      })

      if (filteredKeys.length === 0) return (
        <div className="bg-white rounded-2xl p-12 text-center">
          <p className="text-4xl mb-3">📷</p>
          <p className="text-gray-400 text-sm">No before/after photos found.</p>
        </div>
      )

      return filteredKeys.map(key => {
        const [team, dept] = key.split('||')
        const group = groups[key]

        // Step 4 — For each checklist item key, find first and latest photo
        const itemMap = {}
        group.forEach(audit => {
          Object.entries(audit.beforePhotos || {}).forEach(([itemKey, photo]) => {
            const [sLevel] = itemKey.split('_')
            if (baLevel && sLevel !== baLevel) return
            if (!itemMap[itemKey]) {
              itemMap[itemKey] = {
                before: photo,
                beforeDate: audit.date,
                beforeAuditor: audit.auditorName,
                beforeDesig: audit.auditorDesignation,
                after: null,
                afterDate: null,
                afterAuditor: null,
                afterDesig: null,
              }
            } else {
              itemMap[itemKey].after = photo
              itemMap[itemKey].afterDate = audit.date
              itemMap[itemKey].afterAuditor = audit.auditorName
              itemMap[itemKey].afterDesig = audit.auditorDesignation
            }
          })
        })

        const itemKeys = Object.keys(itemMap)
        if (itemKeys.length === 0) return null

        return (
          <div key={key} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100"
              style={{ background: 'linear-gradient(135deg, #f8fafc, #eff6ff)' }}>
              <p className="text-sm font-black text-gray-800">{team} — {dept}</p>
              <p className="text-xs text-gray-500 mt-0.5">{group.length} audit(s) done</p>
            </div>

            {/* Photos */}
            <div className="p-4 space-y-4">
              {itemKeys.map(itemKey => {
                const [sLevel, idx] = itemKey.split('_')
                const item = checklist[sLevel]?.items[Number(idx)]
                const data = itemMap[itemKey]
                if (!item) return null

                return (
                  <div key={itemKey} className="rounded-xl overflow-hidden border border-gray-100">

                    {/* Item label with Tamil/English */}
                    <div className="px-3 py-2" style={{ background: '#f8fafc' }}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black px-2 py-0.5 rounded-lg text-white"
                          style={{ background: checklist[sLevel]?.color || '#1e3a5f' }}>
                          {sLevel}
                        </span>
                        <p className="text-xs font-bold text-gray-700 flex-1">
                          {lang === 'ta' && item.tamil ? item.tamil : item.english}
                        </p>
                      </div>
                    </div>

                    {/* Before & After side by side */}
                    <div className="grid grid-cols-2 gap-0">

                      {/* Before */}
                      <div className="border-r border-gray-100">
                        <div className="px-3 py-1.5 text-center" style={{ background: '#fee2e2' }}>
                          <p className="text-xs font-black text-red-600">BEFORE</p>
                        </div>
                        <img src={data.before} alt="before" className="w-full h-36 object-cover" />
                        <div className="px-2 py-2" style={{ background: '#fff5f5' }}>
                          <p className="text-xs font-bold text-gray-700">{data.beforeAuditor}</p>
                          <p className="text-xs text-gray-400">{data.beforeDesig}</p>
                          <p className="text-xs text-gray-400">{data.beforeDate}</p>
                        </div>
                      </div>

                      {/* After */}
                      <div>
                        <div className="px-3 py-1.5 text-center" style={{ background: '#dcfce7' }}>
                          <p className="text-xs font-black text-green-600">AFTER</p>
                        </div>
                        {data.after ? (
                          <>
                            <img src={data.after} alt="after" className="w-full h-36 object-cover" />
                            <div className="px-2 py-2" style={{ background: '#f0fdf4' }}>
                              <p className="text-xs font-bold text-gray-700">{data.afterAuditor}</p>
                              <p className="text-xs text-gray-400">{data.afterDesig}</p>
                              <p className="text-xs text-gray-400">{data.afterDate}</p>
                            </div>
                          </>
                        ) : (
                          <div className="h-36 flex items-center justify-center"
                            style={{ background: '#f8fafc' }}>
                            <div className="text-center">
                              <p className="text-2xl mb-1">⏳</p>
                              <p className="text-xs text-gray-400 font-semibold">Not yet re-audited</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })
    })()}
  </div>
)}

        {tab === 'kaizen impact' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'Total Ideas', value: kaizens.length, color: '#1e3a5f', bg: '#eff6ff' },
                { label: 'Implemented', value: kaizens.filter(k => k.stage === 'Closed').length, color: '#16a34a', bg: '#dcfce7' },
                { label: 'In Progress', value: kaizens.filter(k => k.stage !== 'Closed').length, color: '#d97706', bg: '#fef9c3' },
                { label: 'Estimated ₹', value: `₹${totalEstimated.toLocaleString()}`, color: '#7c3aed', bg: '#f5f3ff' },
                { label: 'Achieved ₹', value: `₹${totalSavings.toLocaleString()}`, color: '#16a34a', bg: '#dcfce7' },
                { label: 'Achievement %', value: `${totalEstimated ? Math.round(totalSavings / totalEstimated * 100) : 0}%`, color: '#f97316', bg: '#fff7ed' },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-3 text-center shadow-sm" style={{ background: s.bg }}>
                  <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-black text-gray-600 uppercase">Kaizen Ideas — Full List</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      {['Title', 'Dept', 'Team', 'Submitted By', 'Stage', 'Est ₹', 'Achieved ₹', 'Benefit'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-gray-500 font-bold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {kaizens.map(k => (
                      <tr key={k.id} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-2 font-bold text-gray-800 min-w-32">{k.title}</td>
                        <td className="px-3 py-2 text-gray-500">{k.area}</td>
                        <td className="px-3 py-2 text-gray-500">{k.submittedTeam}</td>
                        <td className="px-3 py-2 font-semibold text-gray-700">{k.submittedBy}</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded-full font-bold text-white"
                            style={{ background: '#1e3a5f', fontSize: '10px' }}>{k.stage}</span>
                        </td>
                        <td className="px-3 py-2 text-blue-700 font-bold">₹{k.estimatedSaving || 0}</td>
                        <td className="px-3 py-2 text-green-600 font-bold">₹{k.savingsAchieved || 0}</td>
                        <td className="px-3 py-2 text-gray-500 max-w-32 truncate">{k.expectedBenefit || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Audit Detail Modal */}
      {selectedAudit && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full max-w-lg max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-white rounded-t-3xl px-5 pt-5 pb-3 border-b border-gray-100 flex justify-between">
              <div>
                <h2 className="text-sm font-black text-gray-800">{selectedAudit.area}</h2>
                <p className="text-xs text-gray-500">👤 {selectedAudit.auditorName} · {selectedAudit.auditorDesignation}</p>
                <p className="text-xs text-gray-400">🏷️ Team {selectedAudit.teamName} · {selectedAudit.auditLevel} · {selectedAudit.date}</p>
              </div>
              <button onClick={() => setSelectedAudit(null)}
                className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-500">×</button>
            </div>
            <div className="p-5">
              <div className="rounded-2xl p-4 text-center mb-4"
                style={{ background: getBg(selectedAudit.scorePercent || 0) }}>
                <p className="text-4xl font-black"
                  style={{ color: getColor(selectedAudit.scorePercent || 0) }}>
                  {selectedAudit.scorePercent || 0}%
                </p>
                <p className="text-sm font-semibold mt-1"
                  style={{ color: getColor(selectedAudit.scorePercent || 0) }}>
                  {selectedAudit.scoredMarks} / {selectedAudit.totalMarks} marks
                </p>
              </div>

              {Object.keys(selectedAudit.beforePhotos || {}).length > 0 && (
                <div>
                  <p className="text-xs font-black text-gray-600 uppercase mb-2">Current State Photos</p>
                  <div className="space-y-2">
                    {Object.entries(selectedAudit.beforePhotos).map(([key, photo]) => {
                      const [sLevel, idx] = key.split('_')
                      const item = checklist[sLevel]?.items[Number(idx)]
                      return (
                        <div key={key} className="rounded-xl overflow-hidden border border-gray-100">
                          <p className="px-3 py-1.5 text-xs font-bold text-gray-600"
                            style={{ background: '#f8fafc' }}>
                            {sLevel}: {item?.english?.substring(0, 50)}
                          </p>
                          <img src={photo} alt="current" className="w-full h-32 object-cover" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MDView