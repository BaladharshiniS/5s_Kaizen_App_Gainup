import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import { TEAMS, DEFAULT_CHECKLIST, TEAMS_DEPARTMENTS, getAudits } from '../firebase'

const S_LEVELS = ['1S', '2S', '3S', '4S', '5S']

const AuditHistory = () => {
  const [audits, setAudits] = useState([])
  const [filterArea, setFilterArea] = useState('')
  const [filterTeam, setFilterTeam] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [filterAuditor, setFilterAuditor] = useState('')
  const [filterYear, setFilterYear] = useState(() => String(new Date().getFullYear()))
  const [filterMonth, setFilterMonth] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [selected, setSelected] = useState(null)
  const [checklist] = useState(DEFAULT_CHECKLIST)
  const [exporting, setExporting] = useState(false)
  const printRef = useRef()

  useEffect(() => {
    getAudits().then(data => setAudits(data)).catch(() => setAudits([]))
  }, [])

  // ── Filtering ────────────────────────────────────────────────────────
  const filtered = audits.filter(a => {
    if (filterTeam && a.teamName !== filterTeam) return false
    if (filterArea && a.area !== filterArea) return false
    if (filterLevel && a.auditLevel !== filterLevel) return false
    if (filterAuditor && a.auditorName !== filterAuditor) return false

    // Year filter
    if (filterYear) {
      const auditDate = new Date(a.timestamp || a.auditDate)
      if (isNaN(auditDate)) return false
      if (String(auditDate.getFullYear()) !== filterYear) return false
    }

    // Month filter — expects "YYYY-MM"
    if (filterMonth) {
      const auditDate = new Date(a.timestamp || a.auditDate)
      const auditMonth = `${auditDate.getFullYear()}-${String(auditDate.getMonth() + 1).padStart(2, '0')}`
      if (auditMonth !== filterMonth) return false
    }

    // Date range filter
    if (filterDateFrom) {
      const from = new Date(filterDateFrom)
      const auditDate = new Date(a.timestamp || a.auditDate)
      if (auditDate < from) return false
    }
    if (filterDateTo) {
      const to = new Date(filterDateTo)
      to.setHours(23, 59, 59)
      const auditDate = new Date(a.timestamp || a.auditDate)
      if (auditDate > to) return false
    }

    return true
  })

  const clearAllFilters = () => {
    setFilterArea(''); setFilterTeam(''); setFilterLevel('')
    setFilterAuditor(''); setFilterYear(''); setFilterMonth('')
    setFilterDateFrom(''); setFilterDateTo('')
  }

  const hasFilters = filterArea || filterTeam || filterLevel ||
    filterAuditor || filterYear || filterMonth || filterDateFrom || filterDateTo

  // ── Helpers ──────────────────────────────────────────────────────────
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

  // ── PDF Export using browser print ───────────────────────────────────
  const handleExportPDF = () => {
    setExporting(true)
    setTimeout(() => {
      window.print()
      setExporting(false)
    }, 300)
  }

  // ── Unique year options from audit data ──────────────────────────────
  const yearOptions = [...new Set(audits.map(a => {
    const d = new Date(a.timestamp || a.auditDate)
    if (isNaN(d)) return null
    return String(d.getFullYear())
  }).filter(Boolean))].sort().reverse()

  // ── Unique month options from audit data ─────────────────────────────
  const monthOptions = [...new Set(audits.map(a => {
    const d = new Date(a.timestamp || a.auditDate)
    if (isNaN(d)) return null
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }).filter(Boolean))].sort().reverse()

  const formatMonth = (ym) => {
    const [y, m] = ym.split('-')
    return new Date(y, m - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
      <Navbar />

      {/* Print styles — only visible when printing */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="p-4 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-black text-gray-800">📊 Audit History</h1>
          <button
            onClick={handleExportPDF}
            disabled={exporting || filtered.length === 0}
            className="no-print flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white"
            style={{
              background: filtered.length === 0
                ? '#e2e8f0'
                : 'linear-gradient(135deg, #dc2626, #b91c1c)',
              color: filtered.length === 0 ? '#94a3b8' : 'white'
            }}>
            {exporting ? '⏳ Preparing...' : '🖨️ Print / PDF'}
          </button>
        </div>

        {/* ── Filters ── */}
        <div className="bg-white rounded-2xl shadow-sm p-3 mb-4 no-print">
          <p className="text-xs font-black text-gray-500 uppercase mb-3">Filters</p>

          {/* Row 1 — Team + Level */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <select value={filterTeam}
              onChange={e => { setFilterTeam(e.target.value); setFilterArea('') }}
              className="border-2 border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none bg-gray-50">
              <option value="">All Teams</option>
              {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filterLevel}
              onChange={e => setFilterLevel(e.target.value)}
              className="border-2 border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none bg-gray-50">
              <option value="">All Levels</option>
              {S_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Row 2 — Dept (conditional) + Auditor */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            {filterTeam ? (
              <select value={filterArea}
                onChange={e => setFilterArea(e.target.value)}
                className="border-2 border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none bg-gray-50">
                <option value="">All Depts</option>
                {(TEAMS_DEPARTMENTS[filterTeam] || []).map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            ) : (
              <div />
            )}
            <select value={filterAuditor}
              onChange={e => setFilterAuditor(e.target.value)}
              className="border-2 border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none bg-gray-50">
              <option value="">All Auditors</option>
              {[...new Set(audits.map(a => a.auditorName).filter(Boolean))].map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Row 3 — Year filter */}
<div className="mb-2">
  <p className="text-xs font-bold text-gray-400 mb-1">Filter by Year (Annual Report)</p>
  <select value={filterYear}
    onChange={e => {
      setFilterYear(e.target.value)
      setFilterMonth('')
      setFilterDateFrom('')
      setFilterDateTo('')
    }}
    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none bg-gray-50">
    <option value="">All Years</option>
    {yearOptions.map(y => (
      <option key={y} value={y}>{y} — Annual Report</option>
    ))}
  </select>
</div>


          {/* Row 3 — Month filter */}
          <div className="mb-2">
            <p className="text-xs font-bold text-gray-400 mb-1">Filter by Month</p>
            <select value={filterMonth}
              onChange={e => {
                setFilterMonth(e.target.value)
                setFilterDateFrom('')
                setFilterDateTo('')
              }}
              className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none bg-gray-50">
              <option value="">All Months</option>
              {monthOptions.map(m => (
                <option key={m} value={m}>{formatMonth(m)}</option>
              ))}
            </select>
          </div>

          {/* Row 4 — Date range filter */}
          <div className="mb-3">
            <p className="text-xs font-bold text-gray-400 mb-1">Filter by Date Range</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-gray-400 mb-1">From</p>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={e => {
                    setFilterDateFrom(e.target.value)
                    setFilterMonth('')
                  }}
                  className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none bg-gray-50"
                />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">To</p>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={e => {
                    setFilterDateTo(e.target.value)
                    setFilterMonth('')
                  }}
                  className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Count + Clear */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400 font-semibold">
              {filtered.length} record(s) found
            </span>
            {hasFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-red-500 font-bold px-3 py-1 rounded-lg"
                style={{ background: '#fee2e2' }}>
                Clear All ×
              </button>
            )}
          </div>
        </div>

        {/* ── Print Area ── */}
        <div id="print-area" ref={printRef}>

          {/* Print Header — only shows when printing */}
          <div className="hidden print:block mb-4 p-4 border-b-2 border-gray-200">
            <h1 className="text-xl font-black text-gray-800">GAINUP 5S — Audit Report</h1>
            <p className="text-xs text-gray-500 mt-1">
              Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
              {filterTeam && ` · Team: ${filterTeam}`}
              {filterArea && ` · Dept: ${filterArea}`}
              {filterLevel && ` · Level: ${filterLevel}`}
              {filterAuditor && ` · Auditor: ${filterAuditor}`}
              {filterYear && ` · Year: ${filterYear}`}
              {filterMonth && ` · Month: ${formatMonth(filterMonth)}`}
              {filterDateFrom && ` · From: ${filterDateFrom}`}
              {filterDateTo && ` · To: ${filterDateTo}`}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{filtered.length} audit(s)</p>
          </div>

          {/* Summary Table */}
          {filtered.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-xs font-black text-gray-600 uppercase tracking-wider">
                  Score Summary — {filtered.length} Audit(s)
                </p>
                {hasFilters && (
                  <p className="text-xs text-gray-400">
                    {filterTeam && `${filterTeam} · `}
                    {filterArea && `${filterArea} · `}
                    {filterMonth && `${formatMonth(filterMonth)} · `}
                    {filterDateFrom && `${filterDateFrom} → ${filterDateTo || 'now'}`}
                  </p>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-500 font-bold whitespace-nowrap">Department</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-bold whitespace-nowrap">Team</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-bold whitespace-nowrap">Auditor</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-bold whitespace-nowrap">Designation</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-bold whitespace-nowrap">Level</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-bold whitespace-nowrap">Date</th>
                      {S_LEVELS.map(s => (
                        <th key={s} className="px-3 py-2 text-center text-gray-500 font-bold">{s}</th>
                      ))}
                      <th className="px-3 py-2 text-center text-gray-500 font-bold whitespace-nowrap">Total</th>
                      <th className="px-3 py-2 text-center text-gray-500 font-bold">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((audit) => {
                      const levels = getAuditLevels(audit)
                      return (
                        <tr key={audit.id}
                          className="border-t border-gray-50 hover:bg-blue-50 cursor-pointer transition no-print-hover"
                          onClick={() => setSelected(audit)}>
                          <td className="px-3 py-2 font-bold text-gray-800 whitespace-nowrap">{audit.area}</td>
                          <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{audit.teamName}</td>
                          <td className="px-3 py-2 font-semibold text-gray-700 whitespace-nowrap">{audit.auditorName}</td>
                          <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{audit.auditorDesignation || '-'}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full font-black text-white"
                              style={{ background: '#1e3a5f', fontSize: '10px' }}>
                              {audit.auditLevel}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{audit.date}</td>
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
                          <td className="px-3 py-2 text-center font-bold text-gray-700 whitespace-nowrap">
                            {audit.scoredMarks}/{audit.totalMarks}
                          </td>
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            <span className="font-black px-2 py-0.5 rounded-full"
                              style={{
                                background: getBg(audit.scorePercent || 0),
                                color: getColor(audit.scorePercent || 0)
                              }}>
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
          ) : (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-gray-400 font-semibold text-sm">No audits found.</p>
              {hasFilters && (
                <button onClick={clearAllFilters}
                  className="mt-3 text-xs text-blue-500 font-bold underline">
                  Clear filters to see all
                </button>
              )}
            </div>
          )}

        </div>
        {/* end print-area */}

      </div>

      {/* ── Detail Modal ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center no-print"
          style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full max-w-2xl max-h-screen overflow-y-auto">

            {/* Modal Header */}
            <div className="sticky top-0 bg-white rounded-t-3xl px-5 pt-5 pb-3 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h2 className="text-base font-black text-gray-800">
                  {selected.area} — {selected.auditLevel} Audit
                </h2>
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
                  className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                  ×
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">

              {/* Score Breakdown */}
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
                                style={{ background: getBg(pct), color: getColor(pct) }}>
                                {pct}%
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Before / After Photos */}
              {(Object.keys(selected.beforePhotos || {}).length > 0 ||
                Object.keys(selected.afterPhotos || {}).length > 0) && (
                <div>
                  <p className="text-xs font-black text-gray-600 uppercase tracking-wider mb-2">
                    Before / After Photos
                  </p>
                  <div className="space-y-3">
                    {Object.keys({ ...selected.beforePhotos, ...selected.afterPhotos }).map(key => {
                      const beforeVal = selected.beforePhotos?.[key]
                      const after = selected.afterPhotos?.[key]

                      // Support both array (new) and string (old) format
                      const beforePhotos = Array.isArray(beforeVal)
                        ? beforeVal
                        : beforeVal ? [beforeVal] : []

                      if (!beforePhotos.length && !after) return null

                      const [sLevel, idx] = key.split('_')
                      const itemName = checklist[sLevel]?.items[Number(idx)]?.english || key

                      return (
                        <div key={key} className="rounded-xl overflow-hidden border border-gray-100">
                          <p className="px-3 py-2 text-xs font-bold text-gray-600"
                            style={{ background: '#f8fafc' }}>
                            {sLevel} — {itemName.substring(0, 50)}...
                          </p>

                          {/* Before photos — multiple */}
                          {beforePhotos.length > 0 && (
                            <div>
                              <p className="px-3 pt-2 text-xs font-bold text-gray-500">
                                Before ({beforePhotos.length} photo{beforePhotos.length > 1 ? 's' : ''})
                              </p>
                              <div className="flex gap-2 flex-wrap p-2">
                                {beforePhotos.map((url, pi) => (
                                  <img key={pi} src={url} alt={`before ${pi + 1}`}
                                    className="h-24 w-24 object-cover rounded-xl" />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* After photo */}
                          {after && (
                            <div>
                              <p className="px-3 pt-2 text-xs font-bold text-gray-500">After</p>
                              <div className="p-2">
                                <img src={after} alt="after"
                                  className="h-24 w-24 object-cover rounded-xl" />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Remarks */}
              {selected.remarks && Object.keys(selected.remarks).length > 0 && (
                <div>
                  <p className="text-xs font-black text-gray-600 uppercase tracking-wider mb-2">
                    Remarks / Issues
                  </p>
                  <div className="space-y-1">
                    {Object.entries(selected.remarks).map(([key, remark]) => {
                      if (!remark) return null
                      const [sLevel, idx] = key.split('_')
                      const item = checklist[sLevel]?.items[Number(idx)]
                      return (
                        <div key={key} className="rounded-xl p-2.5" style={{ background: '#fff7ed' }}>
                          <p className="text-xs font-bold text-orange-700">
                            {sLevel}: {item?.english?.substring(0, 40)}...
                          </p>
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
