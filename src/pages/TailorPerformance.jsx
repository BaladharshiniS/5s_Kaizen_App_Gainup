import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { LINES } from '../firebase'

const PERFORMANCE_ASPECTS = [
  { key: 'output', label: 'Daily Output', unit: 'pcs', target: 100 },
  { key: 'quality', label: 'Quality Score', unit: '%', target: 95 },
  { key: 'attendance', label: 'Attendance', unit: '%', target: 100 },
  { key: 'efficiency', label: 'Efficiency', unit: '%', target: 85 },
]

const getGrade = (efficiency) => {
  if (efficiency >= 90) return { grade: 'A+', label: 'Outstanding', color: '#0f766e', bg: '#ccfbf1' }
  if (efficiency >= 80) return { grade: 'A', label: 'Excellent', color: '#16a34a', bg: '#dcfce7' }
  if (efficiency >= 70) return { grade: 'B', label: 'Good', color: '#2563eb', bg: '#dbeafe' }
  if (efficiency >= 60) return { grade: 'C', label: 'Average', color: '#d97706', bg: '#fef9c3' }
  return { grade: 'D', label: 'Needs Improvement', color: '#dc2626', bg: '#fee2e2' }
}

const TailorPerformance = () => {
  const { user } = useAuth()
  const [tailors, setTailors] = useState([])
  const [showAddTailor, setShowAddTailor] = useState(false)
  const [showLogEntry, setShowLogEntry] = useState(false)
  const [selectedTailor, setSelectedTailor] = useState(null)
  const [viewTailor, setViewTailor] = useState(null)
  const [tab, setTab] = useState('overview')

  const [tailorForm, setTailorForm] = useState({ name: '', employeeId: '', line: '', designation: 'Tailor', joiningDate: '' })
  const [logForm, setLogForm] = useState({ date: new Date().toLocaleDateString(), output: '', quality: '', attendance: 'Present', efficiency: '', remarks: '', inspectedBy: user?.name || '' })

  useEffect(() => {
    setTailors(JSON.parse(localStorage.getItem('tailors') || '[]'))
  }, [])

  const saveTailors = (data) => {
    setTailors(data)
    localStorage.setItem('tailors', JSON.stringify(data))
  }

  const addTailor = () => {
    if (!tailorForm.name || !tailorForm.employeeId || !tailorForm.line) { alert('Fill all required fields!'); return }
    const newTailor = { id: Date.now(), ...tailorForm, logs: [], upgradeStatus: 'Monitoring' }
    saveTailors([...tailors, newTailor])
    setTailorForm({ name: '', employeeId: '', line: '', designation: 'Tailor', joiningDate: '' })
    setShowAddTailor(false)
  }

  const addLog = () => {
    if (!logForm.output || !logForm.efficiency) { alert('Fill output and efficiency!'); return }
    const updated = tailors.map(t => {
      if (t.id === selectedTailor.id) {
        const newLogs = [...(t.logs || []), { ...logForm, id: Date.now() }]
        const avgEff = Math.round(newLogs.reduce((s, l) => s + Number(l.efficiency), 0) / newLogs.length)
        const upgradeStatus = avgEff >= 85 ? '🔼 Ready for Upgrade' : avgEff >= 70 ? '✅ On Track' : avgEff >= 60 ? '⚠️ Needs Attention' : '❌ Action Required'
        return { ...t, logs: newLogs, upgradeStatus }
      }
      return t
    })
    saveTailors(updated)
    setLogForm({ date: new Date().toLocaleDateString(), output: '', quality: '', attendance: 'Present', efficiency: '', remarks: '', inspectedBy: user?.name || '' })
    setShowLogEntry(false)
    setSelectedTailor(null)
  }

  const topPerformers = [...tailors].sort((a, b) => {
    const avgA = a.logs?.length ? a.logs.reduce((s, l) => s + Number(l.efficiency), 0) / a.logs.length : 0
    const avgB = b.logs?.length ? b.logs.reduce((s, l) => s + Number(l.efficiency), 0) / b.logs.length : 0
    return avgB - avgA
  }).slice(0, 3)

  const getAvgEff = (tailor) => tailor.logs?.length ? Math.round(tailor.logs.reduce((s, l) => s + Number(l.efficiency), 0) / tailor.logs.length) : 0

  const canEdit = user?.role === 'Admin' || user?.role === 'Supervisor'

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
      <Navbar />
      <div className="p-4 md:p-6 max-w-6xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-800">👔 Tailor Performance</h1>
            <p className="text-gray-500 text-sm mt-0.5">Track output, efficiency and upgrade readiness</p>
          </div>
          {canEdit && (
            <button onClick={() => setShowAddTailor(true)} className="text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:opacity-90" style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>
              + Add Tailor
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {['overview', 'all tailors', 'top performers'].map(t => (
            <button key={t} onClick={() => setTab(t)} className="px-4 py-2 rounded-xl text-xs font-bold capitalize transition"
              style={tab === t ? { background: 'linear-gradient(135deg, #1e3a5f, #1e40af)', color: 'white' } : { background: 'white', color: '#64748b' }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {[
                { label: 'Total Tailors', value: tailors.length, color: '#1e3a5f', bg: '#eff6ff' },
                { label: 'Ready for Upgrade', value: tailors.filter(t => t.upgradeStatus?.includes('Upgrade')).length, color: '#0f766e', bg: '#ccfbf1' },
                { label: 'Needs Attention', value: tailors.filter(t => t.upgradeStatus?.includes('Attention') || t.upgradeStatus?.includes('Action')).length, color: '#dc2626', bg: '#fee2e2' },
                { label: 'On Track', value: tailors.filter(t => t.upgradeStatus?.includes('Track')).length, color: '#16a34a', bg: '#dcfce7' },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-4 text-center shadow-sm" style={{ background: s.bg }}>
                  <p className="text-3xl font-black" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs text-gray-600 mt-1 font-medium">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tailors.map(tailor => {
                const avgEff = getAvgEff(tailor)
                const grade = getGrade(avgEff)
                return (
                  <div key={tailor.id} className="bg-white rounded-2xl shadow-sm p-4 cursor-pointer hover:shadow-md transition" onClick={() => setViewTailor(tailor)}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm" style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>
                          {tailor.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{tailor.name}</p>
                          <p className="text-xs text-gray-500">{tailor.employeeId} · {tailor.line}</p>
                        </div>
                      </div>
                      <div className="rounded-xl px-2 py-1 text-center" style={{ background: grade.bg }}>
                        <p className="text-lg font-black" style={{ color: grade.color }}>{grade.grade}</p>
                      </div>
                    </div>

                    <div className="rounded-xl p-3 mb-3" style={{ background: '#f8fafc' }}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-500">Avg Efficiency</span>
                        <span className="text-sm font-black" style={{ color: grade.color }}>{avgEff}%</span>
                      </div>
                      <div className="w-full rounded-full h-2" style={{ background: '#e2e8f0' }}>
                        <div className="h-2 rounded-full transition-all" style={{ width: `${avgEff}%`, background: `linear-gradient(90deg, ${grade.color}, ${grade.color}99)` }}></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: grade.bg, color: grade.color }}>{tailor.upgradeStatus || 'No data'}</span>
                      <span className="text-xs text-gray-400">{tailor.logs?.length || 0} entries</span>
                    </div>

                    {canEdit && (
                      <button onClick={e => { e.stopPropagation(); setSelectedTailor(tailor); setShowLogEntry(true) }}
                        className="w-full mt-3 text-white py-2 rounded-xl text-xs font-bold hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
                        + Log Today's Performance
                      </button>
                    )}
                  </div>
                )
              })}

              {tailors.length === 0 && (
                <div className="col-span-3 bg-white rounded-2xl shadow-sm p-12 text-center">
                  <p className="text-5xl mb-3">👔</p>
                  <p className="text-gray-500">No tailors added yet.</p>
                  {canEdit && <button onClick={() => setShowAddTailor(true)} className="mt-4 text-white px-6 py-2 rounded-xl text-sm font-bold" style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>+ Add First Tailor</button>}
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'all tailors' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead style={{ background: '#f8fafc' }}>
                <tr className="text-left text-xs text-gray-500 font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Tailor</th>
                  <th className="px-4 py-3">Line</th>
                  <th className="px-4 py-3">Entries</th>
                  <th className="px-4 py-3">Avg Efficiency</th>
                  <th className="px-4 py-3">Grade</th>
                  <th className="px-4 py-3">Status</th>
                  {canEdit && <th className="px-4 py-3">Action</th>}
                </tr>
              </thead>
              <tbody>
                {tailors.map((tailor, i) => {
                  const avgEff = getAvgEff(tailor)
                  const grade = getGrade(avgEff)
                  return (
                    <tr key={tailor.id} className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => setViewTailor(tailor)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>{tailor.name[0]}</div>
                          <div>
                            <p className="font-semibold text-gray-800 text-xs">{tailor.name}</p>
                            <p className="text-gray-400 text-xs">{tailor.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{tailor.line}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{tailor.logs?.length || 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 rounded-full h-1.5" style={{ background: '#e2e8f0' }}>
                            <div className="h-1.5 rounded-full" style={{ width: `${avgEff}%`, background: grade.color }}></div>
                          </div>
                          <span className="text-xs font-bold" style={{ color: grade.color }}>{avgEff}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-lg text-xs font-black" style={{ background: grade.bg, color: grade.color }}>{grade.grade}</span></td>
                      <td className="px-4 py-3"><span className="text-xs">{tailor.upgradeStatus || '-'}</span></td>
                      {canEdit && <td className="px-4 py-3"><button onClick={e => { e.stopPropagation(); setSelectedTailor(tailor); setShowLogEntry(true) }} className="text-xs text-white px-3 py-1 rounded-lg font-semibold" style={{ background: '#f97316' }}>+ Log</button></td>}
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {tailors.length === 0 && <div className="p-12 text-center text-gray-400">No tailors added yet.</div>}
          </div>
        )}

        {tab === 'top performers' && (
          <div className="space-y-4">
            {tailors.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center text-gray-400">No data yet.</div>
            ) : (
              [...tailors].sort((a, b) => getAvgEff(b) - getAvgEff(a)).map((tailor, i) => {
                const avgEff = getAvgEff(tailor)
                const grade = getGrade(avgEff)
                return (
                  <div key={tailor.id} className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition" onClick={() => setViewTailor(tailor)}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg" style={{ background: i === 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : i === 1 ? 'linear-gradient(135deg, #94a3b8, #64748b)' : i === 2 ? 'linear-gradient(135deg, #d97706, #b45309)' : '#f1f5f9', color: i < 3 ? 'white' : '#64748b' }}>
                      {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">{tailor.name}</p>
                      <p className="text-xs text-gray-500">{tailor.line} · {tailor.employeeId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black" style={{ color: grade.color }}>{avgEff}%</p>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: grade.bg, color: grade.color }}>{grade.grade} · {grade.label}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Add Tailor Modal */}
      {showAddTailor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-black text-gray-800 mb-4">👔 Add New Tailor</h2>
            <div className="space-y-3">
              {[
                { label: 'Full Name *', key: 'name', placeholder: 'Tailor full name', type: 'text' },
                { label: 'Employee ID *', key: 'employeeId', placeholder: 'e.g. EMP001', type: 'text' },
                { label: 'Joining Date', key: 'joiningDate', placeholder: '', type: 'date' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-bold text-gray-600 mb-1">{f.label}</label>
                  <input type={f.type} value={tailorForm[f.key]} onChange={e => setTailorForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-gray-50" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Line *</label>
                <select value={tailorForm.line} onChange={e => setTailorForm(p => ({ ...p, line: e.target.value }))} className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-gray-50">
                  <option value="">-- Select Line --</option>
                  {LINES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Designation</label>
                <select value={tailorForm.designation} onChange={e => setTailorForm(p => ({ ...p, designation: e.target.value }))} className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-gray-50">
                  {['Tailor', 'Senior Tailor', 'Helper', 'Cutter', 'QC Inspector', 'Packer'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={addTailor} className="flex-1 text-white py-3 rounded-xl font-bold text-sm hover:opacity-90" style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>Add Tailor</button>
              <button onClick={() => setShowAddTailor(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Log Entry Modal */}
      {showLogEntry && selectedTailor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full mx-4 max-h-screen overflow-y-auto">
            <h2 className="text-lg font-black text-gray-800 mb-1">📊 Log Performance</h2>
            <p className="text-sm text-gray-500 mb-4">{selectedTailor.name} · {selectedTailor.line}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Date</label>
                <input type="text" value={logForm.date} onChange={e => setLogForm(p => ({ ...p, date: e.target.value }))} className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none bg-gray-50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Output (pieces) *</label>
                  <input type="number" value={logForm.output} onChange={e => setLogForm(p => ({ ...p, output: e.target.value }))} placeholder="e.g. 95" className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Efficiency (%) *</label>
                  <input type="number" value={logForm.efficiency} onChange={e => setLogForm(p => ({ ...p, efficiency: e.target.value }))} placeholder="e.g. 85" className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none bg-gray-50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Quality Score (%)</label>
                  <input type="number" value={logForm.quality} onChange={e => setLogForm(p => ({ ...p, quality: e.target.value }))} placeholder="e.g. 98" className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Attendance</label>
                  <select value={logForm.attendance} onChange={e => setLogForm(p => ({ ...p, attendance: e.target.value }))} className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none bg-gray-50">
                    {['Present', 'Absent', 'Half Day', 'Late'].map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Inspected By</label>
                <input type="text" value={logForm.inspectedBy} onChange={e => setLogForm(p => ({ ...p, inspectedBy: e.target.value }))} className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Remarks</label>
                <textarea value={logForm.remarks} onChange={e => setLogForm(p => ({ ...p, remarks: e.target.value }))} placeholder="Any observations..." className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none bg-gray-50 resize-none" rows={2} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={addLog} className="flex-1 text-white py-3 rounded-xl font-bold text-sm hover:opacity-90" style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>Save Entry</button>
              <button onClick={() => { setShowLogEntry(false); setSelectedTailor(null) }} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* View Tailor Detail Modal */}
      {viewTailor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-lg w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg" style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>{viewTailor.name[0]}</div>
              <div>
                <h2 className="text-lg font-black text-gray-800">{viewTailor.name}</h2>
                <p className="text-sm text-gray-500">{viewTailor.employeeId} · {viewTailor.line} · {viewTailor.designation}</p>
              </div>
            </div>

            {(() => {
              const avgEff = getAvgEff(viewTailor)
              const grade = getGrade(avgEff)
              return (
                <div className="rounded-2xl p-4 mb-4 text-center" style={{ background: grade.bg }}>
                  <p className="text-4xl font-black" style={{ color: grade.color }}>{avgEff}%</p>
                  <p className="text-sm font-bold mt-1" style={{ color: grade.color }}>Grade {grade.grade} · {grade.label}</p>
                  <p className="text-xs mt-1" style={{ color: grade.color }}>{viewTailor.upgradeStatus}</p>
                </div>
              )
            })()}

            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Performance Log ({viewTailor.logs?.length || 0} entries)</p>
            {viewTailor.logs?.length === 0 || !viewTailor.logs ? (
              <p className="text-center text-gray-400 text-sm py-4">No entries yet.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {[...viewTailor.logs].reverse().map(log => (
                  <div key={log.id} className="rounded-xl p-3" style={{ background: '#f8fafc' }}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-gray-700">{log.date}</span>
                      <span className="text-xs font-black" style={{ color: Number(log.efficiency) >= 85 ? '#16a34a' : Number(log.efficiency) >= 70 ? '#d97706' : '#dc2626' }}>{log.efficiency}% eff</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                      <span>📦 {log.output} pcs</span>
                      <span>✅ {log.quality || '-'}% quality</span>
                      <span>🕐 {log.attendance}</span>
                    </div>
                    {log.remarks && <p className="text-xs text-gray-400 mt-1 italic">"{log.remarks}"</p>}
                    <p className="text-xs text-gray-400 mt-1">Inspected by: {log.inspectedBy}</p>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setViewTailor(null)} className="w-full mt-5 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-sm">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TailorPerformance