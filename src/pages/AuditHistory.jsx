import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { AREAS, TEAMS, DEFAULT_CHECKLIST, TEAMS_DEPARTMENTS } from '../firebase'

const S_LEVELS = ['1S', '2S', '3S', '4S', '5S']

const AuditHistory = () => {
  const [audits, setAudits] = useState([])
  const [filterArea, setFilterArea] = useState('')
  const [filterTeam, setFilterTeam] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [filterAuditor, setFilterAuditor] = useState('')
  const [selected, setSelected] = useState(null)
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST)

  useEffect(() => {
    setAudits([...JSON.parse(localStorage.getItem('audits') || '[]')].reverse())
    const saved = localStorage.getItem('masterChecklist')
    if (saved) setChecklist(JSON.parse(saved))
  }, [])

  const filtered = audits.filter(a => {
    if (filterTeam && a.teamName !== filterTeam) return false
    if (filterArea && a.area !== filterArea) return false
    if (filterLevel && a.auditLevel !== filterLevel) return false
    if (filterAuditor && a.auditorName !== filterAuditor) return false
    return true
  })

  const getColor = s => s >= 80 ? '#16a34a' : s >= 60 ? '#d97706' : '#dc2626'
  const getBg = s => s >= 80 ? '#dcfce7' : s >= 60 ? '#fef9c3' : '#fee2e2'

  const getSLevelScore = (audit, sLevel) => {
    if (!audit.scores) return { scored: 0, total: checklist[sLevel]?.totalMarks || 0 }
    const items = checklist[sLevel]?.items || []
    const scored = items.reduce((sum, _, idx) => sum + (Number(audit.scores[`${sLevel}_${idx}`]) || 0), 0)
    return { scored, total: checklist[sLevel]?.totalMarks || 0 }
  }

  const getAuditLevels = (audit) => {
    const idx = S_LEVELS.indexOf(audit.auditLevel)
    return idx >= 0 ? S_LEVELS.slice(0, idx + 1) : []
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
      <Navbar />
      <div className="p-4 max-w-4xl mx-auto">
        <h1 className="text-xl font-black text-gray-800 mb-4">📊 Audit History</h1>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-3 mb-4 space-y-2">
          <select value={filterTeam} onChange={e => { setFilterTeam(e.target.value); setFilterArea('') }}
            className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none bg-gray-50">
            <option value="">All Teams</option>
            {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {filterTeam && (
            <select value={filterArea} onChange={e => setFilterArea(e.target.value)}
              className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none bg-gray-50">
              <option value="">All Departments ({filterTeam})</option>
              {(TEAMS_DEPARTMENTS[filterTeam] || []).map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          )}
          
          <select value={filterAuditor} onChange={e => setFilterAuditor(e.target.value)}
            className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none bg-gray-50">
            <option value="">All Auditors</option>
            {[...new Set(audits.map(a => a.auditorName).filter(Boolean))].map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
            className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none bg-gray-50">
            <option value="">All Levels</option>
            {S_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">{filtered.length} record(s)</span>
            {(filterArea || filterTeam || filterLevel) && (
              <button onClick={() => { setFilterArea(''); setFilterTeam(''); setFilterLevel(''); setFilterAuditor('') }}
                className="text-xs text-red-500 font-bold">Clear ×</button>
            )}
          </div>
        </div>

        {/* Summary Table */}
        {filtered.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-black text-gray-600 uppercase tracking-wider">Score Summary Table</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-500 font-bold">Department</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-bold">Team</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-bold">Auditor</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-bold">Designation</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-bold">Level</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-bold">Date</th>
                    {S_LEVELS.map(s => (
                      <th key={s} className="px-3 py-2 text-center text-gray-500 font-bold">{s}</th>
                    ))}
                    <th className="px-3 py-2 text-center text-gray-500 font-bold">Total</th>
                    <th className="px-3 py-2 text-center text-gray-500 font-bold">%</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((audit, i) => {
                    const levels = getAuditLevels(audit)
                    return (
                      <tr key={audit.id}
                        className="border-t border-gray-50 hover:bg-blue-50 cursor-pointer transition"
                        onClick={() => setSelected(audit)}>
                        <td className="px-3 py-2 font-bold text-gray-800">{audit.area}</td>
                        <td className="px-3 py-2 text-gray-600">{audit.teamName}</td>
                        <td className="px-3 py-2 font-semibold text-gray-700">{audit.auditorName}</td>
                        <td className="px-3 py-2 text-gray-500">{audit.auditorDesignation || '-'}</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded-full font-black text-white"
                            style={{ background: '#1e3a5f', fontSize: '10px' }}>{audit.auditLevel}</span>
                        </td>
                        <td className="px-3 py-2 text-gray-400">{audit.date}</td>
                        {S_LEVELS.map(s => {
                          const { scored, total } = getSLevelScore(audit, s)
                          const included = levels.includes(s)
                          return (
                            <td key={s} className="px-3 py-2 text-center">
                              {included ? (
                                <span className="font-bold"
                                  style={{ color: total ? getColor(Math.round(scored / total * 100)) : '#94a3b8' }}>
                                  {scored}/{total}
                                </span>
                              ) : (
                                <span className="text-gray-200">-</span>
                              )}
                            </td>
                          )
                        })}
                        <td className="px-3 py-2 text-center font-bold text-gray-700">
                          {audit.scoredMarks}/{audit.totalMarks}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="font-black px-2 py-0.5 rounded-full"
                            style={{ background: getBg(audit.scorePercent || 0), color: getColor(audit.scorePercent || 0) }}>
                            {audit.scorePercent || 0}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-400 font-semibold text-sm">No audits found.</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-white rounded-t-3xl px-5 pt-5 pb-3 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h2 className="text-base font-black text-gray-800">{selected.area} — {selected.auditLevel} Audit</h2>
                <p className="text-xs text-gray-500">👤 {selected.auditorName} · {selected.auditorDesignation}</p>
                <p className="text-xs text-gray-400">🏷️ Team {selected.teamName} · 📅 {selected.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-xl px-3 py-1.5 text-center"
                  style={{ background: getBg(selected.scorePercent || 0) }}>
                  <p className="text-xl font-black" style={{ color: getColor(selected.scorePercent || 0) }}>
                    {selected.scorePercent || 0}%
                  </p>
                </div>
                <button onClick={() => setSelected(null)}
                  className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-500">×</button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* S Level Breakdown */}
              <div>
                <p className="text-xs font-black text-gray-600 uppercase tracking-wider mb-2">Score Breakdown</p>
                <div className="rounded-2xl overflow-hidden border border-gray-100">
                  <table className="w-full text-xs">
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-500 font-bold">S Level</th>
                        <th className="px-3 py-2 text-left text-gray-500 font-bold">Name</th>
                        <th className="px-3 py-2 text-center text-gray-500 font-bold">Scored</th>
                        <th className="px-3 py-2 text-center text-gray-500 font-bold">Total</th>
                        <th className="px-3 py-2 text-center text-gray-500 font-bold">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getAuditLevels(selected).map(s => {
                        const { scored, total } = getSLevelScore(selected, s)
                        const pct = total ? Math.round(scored / total * 100) : 0
                        const info = checklist[s]
                        return (
                          <tr key={s} className="border-t border-gray-50">
                            <td className="px-3 py-2">
                              <span className="font-black px-2 py-0.5 rounded-lg text-white"
                                style={{ background: info.color, fontSize: '10px' }}>{s}</span>
                            </td>
                            <td className="px-3 py-2 text-gray-600">{info.label}</td>
                            <td className="px-3 py-2 text-center font-bold text-gray-700">{scored}</td>
                            <td className="px-3 py-2 text-center text-gray-500">{total}</td>
                            <td className="px-3 py-2 text-center">
                              <span className="font-black px-2 py-0.5 rounded-full"
                                style={{ background: getBg(pct), color: getColor(pct) }}>{pct}%</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Before/After Photos */}
              {(Object.keys(selected.beforePhotos || {}).length > 0 || Object.keys(selected.afterPhotos || {}).length > 0) && (
                <div>
                  <p className="text-xs font-black text-gray-600 uppercase tracking-wider mb-2">Before / After Photos</p>
                  <div className="space-y-3">
                    {Object.keys({ ...selected.beforePhotos, ...selected.afterPhotos }).map(key => {
                      const before = selected.beforePhotos?.[key]
                      const after = selected.afterPhotos?.[key]
                      if (!before && !after) return null
                      const [sLevel, idx] = key.split('_')
                      const itemName = checklist[sLevel]?.items[Number(idx)]?.english || key
                      return (
                        <div key={key} className="rounded-xl overflow-hidden border border-gray-100">
                          <p className="px-3 py-2 text-xs font-bold text-gray-600" style={{ background: '#f8fafc' }}>
                            {sLevel} — {itemName.substring(0, 50)}...
                          </p>
                          <div className="grid grid-cols-2 gap-0">
                            <div className="relative">
                              <p className="absolute top-2 left-2 z-10 text-xs font-black text-white px-2 py-0.5 rounded-full"
                                style={{ background: 'rgba(0,0,0,0.6)' }}>Before</p>
                              {before
                                ? <img src={before} alt="before" className="w-full h-32 object-cover" />
                                : <div className="w-full h-32 flex items-center justify-center text-gray-300 text-xs"
                                    style={{ background: '#f8fafc' }}>No photo</div>
                              }
                            </div>
                            <div className="relative border-l border-gray-100">
                              <p className="absolute top-2 left-2 z-10 text-xs font-black text-white px-2 py-0.5 rounded-full"
                                style={{ background: 'rgba(22,163,74,0.8)' }}>After</p>
                              {after
                                ? <img src={after} alt="after" className="w-full h-32 object-cover" />
                                : <div className="w-full h-32 flex items-center justify-center text-gray-300 text-xs"
                                    style={{ background: '#f8fafc' }}>No photo</div>
                              }
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Low Score Remarks */}
              {selected.remarks && Object.keys(selected.remarks).length > 0 && (
                <div>
                  <p className="text-xs font-black text-gray-600 uppercase tracking-wider mb-2">Remarks / Issues</p>
                  <div className="space-y-1">
                    {Object.entries(selected.remarks).map(([key, remark]) => {
                      if (!remark) return null
                      const [sLevel, idx] = key.split('_')
                      const item = checklist[sLevel]?.items[Number(idx)]
                      return (
                        <div key={key} className="rounded-xl p-2.5" style={{ background: '#fff7ed' }}>
                          <p className="text-xs font-bold text-orange-700">{sLevel}: {item?.english?.substring(0, 40)}...</p>
                          <p className="text-xs text-orange-600 mt-0.5">{remark}</p>
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

export default AuditHistory