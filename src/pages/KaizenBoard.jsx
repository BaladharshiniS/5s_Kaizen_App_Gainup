import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { mockUsers, DESIGNATIONS, KAIZEN_STAGES, getKaizens, updateKaizen } from '../firebase'
import { TEAMS, listenKaizens } from '../firebase'

const STAGE_STYLE = {
  'Submitted': { color: '#475569', bg: '#f1f5f9', dot: '#94a3b8' },
  'Reviewing': { color: '#854d0e', bg: '#fef9c3', dot: '#eab308' },
  'Approval': { color: '#1e40af', bg: '#dbeafe', dot: '#3b82f6' },
  'Waiting to Implement': { color: '#5b21b6', bg: '#ede9fe', dot: '#8b5cf6' },
  'Wanting to Verify': { color: '#9a3412', bg: '#ffedd5', dot: '#f97316' },
  'Closed': { color: '#166534', bg: '#dcfce7', dot: '#22c55e' },
}

const STAGE_HANDLER = {
  'Submitted': 'Operator / TeamLead',
  'Reviewing': 'Auditor / FiveS Incharge',
  'Approval': 'Admin / Coordinator',
  'Waiting to Implement': 'Maintenance / TeamLead',
  'Wanting to Verify': 'Auditor',
  'Closed': 'Admin',
}

const PROOF_REQUIRED = {
  'Reviewing': 'Describe your review findings and observations',
  'Approval': 'Approval reason and person assigned for implementation',
  'Waiting to Implement': 'Implementation steps being taken',
  'Wanting to Verify': 'Verification evidence and actual savings achieved',
  'Closed': 'Final confirmation and total savings achieved',
}

const KaizenBoard = () => {
  const { user } = useAuth()
  const [kaizens, setKaizens] = useState([])
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState('')
  const [incentive, setIncentive] = useState('')
  const [comment, setComment] = useState('')
  const [handlerName, setHandlerName] = useState('')
  const [handlerDesignation, setHandlerDesignation] = useState('')
  const [isOtherHandler, setIsOtherHandler] = useState(false)
  const [customHandlerName, setCustomHandlerName] = useState('')
  const [customHandlerDesig, setCustomHandlerDesig] = useState('')
  const [proofText, setProofText] = useState('')
  const [proofPhoto, setProofPhoto] = useState(null)
  const [filterStage, setFilterStage] = useState('')
  const [filterArea, setFilterArea] = useState('')
  const [filterTeam, setFilterTeam] = useState('')
  const [view, setView] = useState('table')
  const [moveError, setMoveError] = useState('')

  useEffect(() => {
  const unsubscribe = listenKaizens((data) => {
    const migrated = data.map(k => ({
      ...k,
      stage: k.stage === 'Review' ? 'Reviewing'
        : k.stage === 'Approved' ? 'Approval'
        : k.stage === 'Implement' ? 'Waiting to Implement'
        : k.stage === 'Verify' ? 'Wanting to Verify'
        : k.stage
    }))

    setKaizens(migrated)
  })

  return () => unsubscribe()
}, [])
  const finalHandler = isOtherHandler ? customHandlerName : handlerName
  const finalHandlerDesig = isOtherHandler ? customHandlerDesig : handlerDesignation

  const handleProofPhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setProofPhoto({ name: file.name, type: file.type, data: reader.result })
    reader.readAsDataURL(file)
  }

  const updateStage = async (id, newStage) => {
  setMoveError('')

  if (!proofText && !proofPhoto) {
    setMoveError('Please add proof (description or photo) before moving!')
    return
  }

  if (!finalHandler) {
    setMoveError('Please select handler name!')
    return
  }

  try {
    const updated = kaizens.map(k =>
      k.id === id
        ? {
            ...k,
            stage: newStage,
            timestamps: {
              ...k.timestamps,
              [newStage]: new Date().toLocaleDateString()
            },
            handlers: {
              ...k.handlers,
              [newStage]: `${finalHandler} (${finalHandlerDesig})`
            },
            savingsAchieved:
              newStage === 'Closed' && saving
                ? Number(saving)
                : k.savingsAchieved,
            incentiveGiven:
              newStage === 'Closed' && incentive
                ? incentive
                : k.incentiveGiven,
            comments: [
              ...(k.comments || []),
              {
                stage: newStage,
                text: comment || proofText,
                proof: proofText,
                proofPhoto,
                by: finalHandler,
                designation: finalHandlerDesig,
                date: new Date().toLocaleDateString()
              }
            ]
          }
        : k
    )

    setKaizens(updated)

    const updatedItem = updated.find(k => k.id === id)

    if (updatedItem) {
      await updateKaizen(updatedItem.id, updatedItem)
    }

    setSelected(updatedItem)

    setSaving('')
    setComment('')
    setHandlerName('')
    setHandlerDesignation('')
    setProofText('')
    setProofPhoto(null)
    setMoveError('')
    setIsOtherHandler(false)
    setCustomHandlerName('')
    setCustomHandlerDesig('')
    setIncentive('')
  } catch (err) {
    console.error('Update failed:', err)
    setMoveError('Failed to update kaizen stage')
  }
}

  const getNext = stage => {
    const i = KAIZEN_STAGES.indexOf(stage)
    return i < KAIZEN_STAGES.length - 1 ? KAIZEN_STAGES[i + 1] : null
  }

  const canUpdate = user?.role === 'Admin' || user?.role === 'AuditIncharge' || user?.role === 'Coordinator' || user?.role === 'FiveS_Incharge'

  const filtered = kaizens.filter(k => {
    if (filterStage && k.stage !== filterStage) return false
    if (filterTeam && (k.submittedTeam || k.team) !== filterTeam) return false
    if (filterArea && k.area !== filterArea) return false
    return true
  })

  const areas = [...new Set(kaizens.map(k => k.area).filter(Boolean))]

  const getPriorityStyle = p => {
    if (p === 'Critical') return { color: '#dc2626', bg: '#fee2e2' }
    if (p === 'High') return { color: '#d97706', bg: '#fef9c3' }
    if (p === 'Medium') return { color: '#2563eb', bg: '#dbeafe' }
    return { color: '#475569', bg: '#f1f5f9' }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
      <Navbar />
      <div className="p-4 max-w-6xl mx-auto">

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-black text-gray-800">📌 Kaizen Board</h1>
          <div className="flex gap-2">
            {['table', 'board'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold capitalize"
                style={view === v
                  ? { background: 'linear-gradient(135deg, #1e3a5f, #1e40af)', color: 'white' }
                  : { background: 'white', color: '#64748b' }}>
                {v === 'table' ? '📋 Table' : '📌 Board'}
              </button>
            ))}
          </div>
        </div>

        {/* Stage Summary */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
          {KAIZEN_STAGES.map(stage => {
            const style = STAGE_STYLE[stage]
            const count = kaizens.filter(k => k.stage === stage).length
            return (
              <div key={stage}
                onClick={() => setFilterStage(filterStage === stage ? '' : stage)}
                className="rounded-xl p-2 text-center cursor-pointer"
                style={{ background: filterStage === stage ? style.dot : style.bg, border: `2px solid ${style.dot}30` }}>
                <p className="text-lg font-black"
                  style={{ color: filterStage === stage ? 'white' : style.color }}>{count}</p>
                <p className="text-xs font-semibold leading-tight"
                  style={{ color: filterStage === stage ? 'white' : style.color }}>{stage}</p>
              </div>
            )
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-3 mb-4 flex flex-wrap gap-2 items-center">
          <select value={filterTeam} onChange={e => { setFilterTeam(e.target.value); setFilterArea('') }}
            className="border-2 border-gray-100 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none bg-gray-50">
            <option value="">All Teams</option>
            {[...new Set(kaizens.map(k => k.submittedTeam || k.team).filter(Boolean))].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {filterTeam && (
            <select value={filterArea} onChange={e => setFilterArea(e.target.value)}
              className="border-2 border-gray-100 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none bg-gray-50">
              <option value="">All Departments</option>
              {areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          )}
          <span className="text-xs text-gray-400">{filtered.length} idea(s)</span>
          {(filterStage || filterArea) && (
            <button onClick={() => { setFilterStage(''); setFilterArea(''); setFilterTeam('') }}
              className="text-xs text-red-500 font-bold">Clear ×</button>
          )}
        </div>

        {kaizens.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-400 text-sm">No kaizen ideas yet.</p>
          </div>
        ) : view === 'table' ? (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="w-full text-xs" style={{ minWidth: '750px' }}>
                <thead style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
                  <tr>
                    {['Date', 'Title', 'Team', 'Department', 'Priority', 'Est. ₹', 'Actual ₹', 'Incentive', 'Stage'].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-white font-bold uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(k => {
                    const stageStyle = STAGE_STYLE[k.stage] || STAGE_STYLE['Submitted']
                    const priStyle = getPriorityStyle(k.priority)
                    return (
                      <tr key={k.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelected(k)}>
                        <td className="px-3 py-3 text-gray-400 whitespace-nowrap">{k.submittedDate}</td>
                        <td className="px-3 py-3 min-w-40">
                          <p className="font-bold text-gray-800 leading-tight">{k.title}</p>
                          {k.problemTypes?.length > 0 && (
                            <p className="text-gray-400 mt-0.5">{k.problemTypes.join(', ')}</p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{k.submittedTeam || k.team}</td>
                        <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{k.area}</td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full font-bold"
                            style={{ background: priStyle.bg, color: priStyle.color }}>
                            {k.priority || 'Med'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-blue-700 font-bold">₹{k.estimatedSaving || 0}</td>
                        <td className="px-3 py-3 text-green-600 font-bold">₹{k.savingsAchieved || 0}</td>
                        <td className="px-3 py-3 text-purple-600 font-bold">{k.incentiveGiven || '-'}</td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: stageStyle.dot }}></div>
                            <span className="font-bold px-2 py-0.5 rounded-full"
                              style={{ background: stageStyle.bg, color: stageStyle.color }}>{k.stage}</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {KAIZEN_STAGES.map(stage => {
              const style = STAGE_STYLE[stage]
              const items = filtered.filter(k => k.stage === stage)
              return (
                <div key={stage} className="rounded-2xl p-3 min-h-32"
                  style={{ background: 'white', border: `2px solid ${style.dot}20` }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: style.dot }}></div>
                    <h3 className="text-xs font-black" style={{ color: style.color }}>{stage}</h3>
                    <span className="ml-auto w-5 h-5 rounded-full flex items-center justify-center text-xs font-black"
                      style={{ background: style.bg, color: style.color }}>{items.length}</span>
                  </div>
                  {items.map(k => (
                    <div key={k.id} onClick={() => setSelected(k)}
                      className="rounded-xl p-2 cursor-pointer mb-2 hover:shadow-md transition"
                      style={{ background: style.bg }}>
                      <p className="text-xs font-bold leading-tight" style={{ color: style.color }}>{k.title}</p>
                      <p className="text-xs opacity-60 mt-0.5">{k.area}</p>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full max-w-lg max-h-screen overflow-y-auto">

            <div className="sticky top-0 bg-white rounded-t-3xl px-5 pt-5 pb-3 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-3">
                  <h2 className="text-sm font-black text-gray-800">{selected.title}</h2>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: STAGE_STYLE[selected.stage]?.bg, color: STAGE_STYLE[selected.stage]?.color }}>
                      {selected.stage}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: getPriorityStyle(selected.priority).bg, color: getPriorityStyle(selected.priority).color }}>
                      {selected.priority}
                    </span>
                  </div>
                </div>
                <button onClick={() => { setSelected(null); setMoveError('') }}
                  className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-500">×</button>
              </div>
            </div>

            <div className="p-5 space-y-4">

              {/* Submitter Info */}
              <div className="rounded-2xl p-3" style={{ background: '#f8fafc' }}>
                <p className="text-xs font-black text-gray-500 uppercase mb-2">Submitted By</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white"
                    style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>
                    {selected.submittedBy?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-800">{selected.submittedBy}</p>
                    <p className="text-xs text-gray-500">{selected.submittedDesignation || '-'}</p>
                    <p className="text-xs text-gray-400">Team: {selected.submittedTeam || selected.team}</p>
                  </div>
                  <p className="ml-auto text-xs text-gray-400">{selected.submittedDate}</p>
                </div>
              </div>

              {/* Details */}
              <div className="rounded-2xl p-3 space-y-1.5" style={{ background: '#f8fafc' }}>
                {[
                  ['Department', selected.area],
                  ['Problem Types', Array.isArray(selected.problemTypes) ? selected.problemTypes.join(', ') : selected.problemType],
                  ['Categories', Array.isArray(selected.categories) ? selected.categories.join(', ') : selected.category],
                  ['Team Members', selected.teamMembers],
                  ['Est. Saving', `₹${selected.estimatedSaving || 0}`],
                  ['Actual Saving', `₹${selected.savingsAchieved || 0}`],
                  ['Incentive', selected.incentiveGiven || '-'],
                ].filter(([, v]) => v).map(([l, v]) => (
                  <div key={l} className="flex gap-2 text-xs">
                    <span className="text-gray-400 w-24 flex-shrink-0">{l}:</span>
                    <span className="text-gray-700 font-semibold">{v}</span>
                  </div>
                ))}
              </div>

              {/* Problem & Solution */}
              {selected.description && (
                <div>
                  <p className="text-xs font-black text-gray-500 mb-1">PROBLEM</p>
                  <p className="text-xs text-gray-700 rounded-xl p-3" style={{ background: '#fee2e2' }}>{selected.description}</p>
                </div>
              )}
              {selected.proposedSolution && (
                <div>
                  <p className="text-xs font-black text-gray-500 mb-1">SOLUTION</p>
                  <p className="text-xs text-gray-700 rounded-xl p-3" style={{ background: '#dcfce7' }}>{selected.proposedSolution}</p>
                </div>
              )}

              {/* Media */}
              {selected.mediaFiles?.length > 0 && (
                <div>
                  <p className="text-xs font-black text-gray-500 mb-2">ATTACHMENTS</p>
                  <div className="flex gap-2 flex-wrap">
                    {selected.mediaFiles.map((f, i) => (
                      f.type?.startsWith('image/') ? (
                        <img key={i} src={f.data} alt={f.name} className="w-20 h-20 rounded-xl object-cover" />
                      ) : (
                        <div key={i} className="w-20 h-20 rounded-xl flex items-center justify-center text-2xl"
                          style={{ background: '#f1f5f9' }}>🎥</div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Pipeline Timeline Table */}
              <div>
                <p className="text-xs font-black text-gray-500 mb-2">PIPELINE HISTORY</p>
                <div className="rounded-2xl overflow-hidden border border-gray-100">
                  <table className="w-full text-xs">
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th className="px-2 py-2 text-left text-gray-500 font-bold">Stage</th>
                        <th className="px-2 py-2 text-left text-gray-500 font-bold">Handler</th>
                        <th className="px-2 py-2 text-left text-gray-500 font-bold">Date</th>
                        <th className="px-2 py-2 text-left text-gray-500 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {KAIZEN_STAGES.map(stage => {
                        const isDone = selected.timestamps?.[stage]
                        const isCurrent = selected.stage === stage
                        const style = STAGE_STYLE[stage]
                        return (
                          <tr key={stage} className="border-t border-gray-50"
                            style={{ background: isCurrent ? style.bg : 'white' }}>
                            <td className="px-2 py-2">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full"
                                  style={{ background: isDone ? style.dot : '#e2e8f0' }}></div>
                                <span className="font-bold" style={{ color: isDone ? style.color : '#94a3b8' }}>{stage}</span>
                              </div>
                            </td>
                            <td className="px-2 py-2 text-gray-600 text-xs">
                              {selected.handlers?.[stage] || (isDone ? STAGE_HANDLER[stage] : '-')}
                            </td>
                            <td className="px-2 py-2 text-gray-400 whitespace-nowrap">
                              {selected.timestamps?.[stage] || '-'}
                            </td>
                            <td className="px-2 py-2">
                              {isCurrent ? (
                                <span className="font-bold text-xs px-2 py-0.5 rounded-full"
                                  style={{ background: style.bg, color: style.color }}>Current</span>
                              ) : isDone ? (
                                <span className="text-green-600 font-bold">✅</span>
                              ) : (
                                <span className="text-gray-200">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Comments */}
              {selected.comments?.length > 0 && (
                <div>
                  <p className="text-xs font-black text-gray-500 mb-2">COMMENTS & PROOF</p>
                  <div className="space-y-2">
                    {selected.comments.map((c, i) => (
                      <div key={i} className="rounded-xl p-3" style={{ background: '#f8fafc' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-black text-gray-700">{c.by}</span>
                          {c.designation && <span className="text-xs text-gray-400">{c.designation}</span>}
                          <span className="ml-auto text-xs text-gray-400">{c.date}</span>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full mb-1 inline-block"
                          style={{ background: STAGE_STYLE[c.stage]?.bg, color: STAGE_STYLE[c.stage]?.color }}>
                          {c.stage}
                        </span>
                        {c.text && <p className="text-xs text-gray-600 mt-1">{c.text}</p>}
                        {c.proofPhoto && (
                          <img src={c.proofPhoto.data} alt="proof"
                            className="w-full h-24 object-cover rounded-xl mt-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Move to Next Stage */}
              {canUpdate && getNext(selected.stage) && (
                <div className="space-y-3 pt-3 border-t-2 border-gray-100">
                  <p className="text-xs font-black text-gray-600 uppercase">
                    Move to: {getNext(selected.stage)}
                  </p>

                  {moveError && (
                    <div className="rounded-xl p-3 text-xs text-red-600 font-semibold"
                      style={{ background: '#fee2e2' }}>
                      ⚠️ {moveError}
                    </div>
                  )}

                  <div className="rounded-xl p-3" style={{ background: '#eff6ff' }}>
                    <p className="text-xs font-bold text-blue-700 mb-1">📋 Required Proof:</p>
                    <p className="text-xs text-blue-600">{PROOF_REQUIRED[getNext(selected.stage)]}</p>
                  </div>

                  {/* Handler */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Handler Name *</label>
                    <select
                      value={isOtherHandler ? 'others' : handlerName}
                      onChange={e => {
                        if (e.target.value === 'others') {
                          setIsOtherHandler(true)
                          setHandlerName('')
                          setHandlerDesignation('')
                        } else {
                          setIsOtherHandler(false)
                          const found = mockUsers.find(u => u.name === e.target.value)
                          setHandlerName(e.target.value)
                          setHandlerDesignation(found?.designation || '')
                        }
                      }}
                      className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none bg-gray-50">
                      <option value="">-- Select Handler --</option>
                      {mockUsers.map(u => (
                        <option key={u.email} value={u.name}>{u.name} ({u.designation})</option>
                      ))}
                      <option value="others">Others</option>
                    </select>
                    {isOtherHandler && (
                      <div className="mt-2 space-y-2">
                        <input value={customHandlerName} onChange={e => setCustomHandlerName(e.target.value)}
                          placeholder="Enter handler name"
                          className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none bg-gray-50" />
                        <select value={customHandlerDesig} onChange={e => setCustomHandlerDesig(e.target.value)}
                          className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none bg-gray-50">
                          <option value="">-- Select Designation --</option>
                          {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Proof */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Proof / Evidence *</label>
                    <textarea value={proofText} onChange={e => setProofText(e.target.value)}
                      placeholder="Describe what was done or verified..."
                      className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none bg-gray-50 resize-none" rows={3} />
                  </div>

                  {/* Proof Photo */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Proof Photo (optional)</label>
                    {proofPhoto ? (
                      <div className="relative">
                        <img src={proofPhoto.data} alt="proof" className="w-full h-24 object-cover rounded-xl" />
                        <button onClick={() => setProofPhoto(null)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">×</button>
                      </div>
                    ) : (
                      <label className="w-full h-16 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                        style={{ background: '#f8fafc' }}>
                        <span className="text-lg">📷</span>
                        <span className="text-xs text-gray-400">Add proof photo</span>
                        <input type="file" accept="image/*,video/*" capture="environment" className="hidden" onChange={handleProofPhoto} />
                      </label>
                    )}
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Additional Comment</label>
                    <input value={comment} onChange={e => setComment(e.target.value)}
                      placeholder="Any additional comments..."
                      className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none bg-gray-50" />
                  </div>

                  {/* Savings for Wanting to Verify */}
                  {selected.stage === 'Wanting to Verify' && (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Actual Savings Achieved (₹) *</label>
                        <input type="number" value={saving} onChange={e => setSaving(e.target.value)}
                          placeholder="Enter actual savings"
                          className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none bg-gray-50" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Incentive Given</label>
                        <input value={incentive} onChange={e => setIncentive(e.target.value)}
                          placeholder="e.g. ₹500 cash / Certificate / Recognition"
                          className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none bg-gray-50" />
                      </div>
                    </div>
                  )}

                  <button onClick={() => updateStage(selected.id, getNext(selected.stage))}
                    className="w-full text-white py-3 rounded-xl font-black text-sm"
                    style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>
                    Move to {getNext(selected.stage)} →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default KaizenBoard