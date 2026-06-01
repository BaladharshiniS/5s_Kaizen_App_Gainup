import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { getKaizens, KAIZEN_STAGES } from '../firebase'

const STAGE_STYLE = {
  'Submitted':            { color: '#475569', bg: '#f1f5f9', dot: '#94a3b8' },
  'Reviewing':            { color: '#854d0e', bg: '#fef9c3', dot: '#eab308' },
  'Approval':             { color: '#1e40af', bg: '#dbeafe', dot: '#3b82f6' },
  'Waiting to Implement': { color: '#5b21b6', bg: '#ede9fe', dot: '#8b5cf6' },
  'Wanting to Verify':    { color: '#9a3412', bg: '#ffedd5', dot: '#f97316' },
  'Closed':               { color: '#166534', bg: '#dcfce7', dot: '#22c55e' },
}

const getAgingInfo = (kaizen) => {
  if (kaizen.stage === 'Closed') return null
  const stageEnteredDate = kaizen.timestamps?.[kaizen.stage]
  if (!stageEnteredDate) return null
  const entered = new Date(stageEnteredDate)
  if (isNaN(entered)) return null
  const diffDays = Math.floor((new Date() - entered) / (1000 * 60 * 60 * 24))
  if (diffDays >= 14) return { days: diffDays, level: 'md',     label: `🚨 Stuck ${diffDays}d`,  bg: '#ede9fe', color: '#5b21b6' }
  if (diffDays >= 7)  return { days: diffDays, level: 'red',    label: `🔴 ${diffDays} days`,    bg: '#fee2e2', color: '#dc2626' }
  if (diffDays >= 3)  return { days: diffDays, level: 'yellow', label: `⏳ ${diffDays} days`,    bg: '#fef9c3', color: '#92400e' }
  return null
}

const STAGE_ORDER = [
  'Submitted', 'Reviewing', 'Approval',
  'Waiting to Implement', 'Wanting to Verify', 'Closed'
]

const IdeaProgressBar = ({ stage }) => {
  const current = STAGE_ORDER.indexOf(stage)
  return (
    <div className="flex items-center gap-1 mt-2">
      {STAGE_ORDER.map((s, i) => {
        const style = STAGE_STYLE[s]
        const done = i <= current
        return (
          <div key={s} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full h-1.5 rounded-full"
              style={{ background: done ? style.dot : '#e2e8f0' }}
            />
          </div>
        )
      })}
    </div>
  )
}

const MyIdeas = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [myIdeas, setMyIdeas] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filterStage, setFilterStage] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const all = await getKaizens()
      const mine = all.filter(k =>
        k.submittedBy === user?.name ||
        k.submittedBy === user?.email
      )
      setMyIdeas(mine)
      setLoading(false)
    }
    load()
  }, [user])

  const filtered = filterStage
    ? myIdeas.filter(k => k.stage === filterStage)
    : myIdeas

  const totalSavings = myIdeas
    .filter(k => k.stage === 'Closed')
    .reduce((sum, k) => sum + (Number(k.savingsAchieved) || 0), 0)

  const closedCount  = myIdeas.filter(k => k.stage === 'Closed').length
  const activeCount  = myIdeas.filter(k => k.stage !== 'Closed').length
  const stuckCount   = myIdeas.filter(k => getAgingInfo(k)?.level === 'red' || getAgingInfo(k)?.level === 'md').length

  // ── Empty state ──────────────────────────────────────────────────────
  if (!loading && myIdeas.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
        <Navbar />
        <div className="p-4 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[80vh]">
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm w-full">
            <div className="text-6xl mb-4">💡</div>
            <h2 className="text-lg font-black text-gray-800 mb-2">
              No ideas yet, {user?.name?.split(' ')[0]}!
            </h2>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Every big improvement starts with one small idea.<br />
              Your idea could save time, money, or effort for the whole team.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { emoji: '🏆', label: 'Earn points' },
                { emoji: '💰', label: 'Win incentives' },
                { emoji: '🌟', label: 'Get recognized' },
              ].map(({ emoji, label }) => (
                <div key={label} className="rounded-2xl p-3 text-center"
                  style={{ background: '#f8fafc' }}>
                  <p className="text-2xl mb-1">{emoji}</p>
                  <p className="text-xs font-bold text-gray-500">{label}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/submit-kaizen')}
              className="w-full py-3 rounded-2xl text-white font-black text-sm"
              style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>
              ✨ Submit My First Idea
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
      <Navbar />
      <div className="p-4 max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-black text-gray-800">My Ideas</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {user?.name} · {user?.designation || user?.role}
            </p>
          </div>
          <button
            onClick={() => navigate('/submit-kaizen')}
            className="px-3 py-2 rounded-xl text-xs font-black text-white"
            style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>
            + New Idea
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Total',    value: myIdeas.length,  bg: '#f1f5f9', color: '#475569' },
            { label: 'Active',   value: activeCount,     bg: '#dbeafe', color: '#1e40af' },
            { label: 'Closed',   value: closedCount,     bg: '#dcfce7', color: '#166534' },
            { label: 'Stuck',    value: stuckCount,      bg: stuckCount > 0 ? '#fee2e2' : '#f1f5f9',
                                                          color: stuckCount > 0 ? '#dc2626' : '#94a3b8' },
          ].map(({ label, value, bg, color }) => (
            <div key={label} className="rounded-2xl p-3 text-center"
              style={{ background: bg }}>
              <p className="text-lg font-black" style={{ color }}>{value}</p>
              <p className="text-xs font-semibold" style={{ color }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Savings card */}
        {totalSavings > 0 && (
          <div className="rounded-2xl p-4 mb-4 flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>
            <div className="text-3xl">💰</div>
            <div>
              <p className="text-xs text-blue-200 font-semibold">Total savings from your ideas</p>
              <p className="text-xl font-black text-white">₹{totalSavings.toLocaleString('en-IN')}</p>
            </div>
          </div>
        )}

        {/* Stage filter */}
        <div className="bg-white rounded-2xl p-3 mb-4 shadow-sm">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterStage('')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold"
              style={!filterStage
                ? { background: '#1e40af', color: 'white' }
                : { background: '#f1f5f9', color: '#64748b' }}>
              All ({myIdeas.length})
            </button>
            {STAGE_ORDER.filter(s => myIdeas.some(k => k.stage === s)).map(s => {
              const style = STAGE_STYLE[s]
              const count = myIdeas.filter(k => k.stage === s).length
              return (
                <button key={s}
                  onClick={() => setFilterStage(s)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold"
                  style={filterStage === s
                    ? { background: style.dot, color: 'white' }
                    : { background: style.bg, color: style.color }}>
                  {s} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}

        {/* Ideas list */}
        <div className="space-y-3">
          {filtered.map(k => {
            const stageStyle = STAGE_STYLE[k.stage] || STAGE_STYLE['Submitted']
            const aging = getAgingInfo(k)
            return (
              <div
                key={k.id}
                onClick={() => setSelected(k)}
                className="bg-white rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md transition"
                style={{ border: aging ? `2px solid ${aging.color}40` : '2px solid transparent' }}>

                {/* Title + stage */}
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-black text-gray-800 flex-1 leading-tight">
                    {k.title}
                  </p>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: stageStyle.bg, color: stageStyle.color }}>
                    {k.stage}
                  </span>
                </div>

                {/* Progress bar */}
                <IdeaProgressBar stage={k.stage} />

                {/* Meta row */}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="text-xs text-gray-400">{k.submittedDate}</span>
                  {k.area && (
                    <span className="text-xs text-gray-400">· {k.area}</span>
                  )}
                  {(k.estimatedSaving > 0) && (
                    <span className="text-xs font-bold text-blue-600">
                      Est. ₹{Number(k.estimatedSaving).toLocaleString('en-IN')}
                    </span>
                  )}
                  {(k.savingsAchieved > 0) && (
                    <span className="text-xs font-bold text-green-600">
                      Saved ₹{Number(k.savingsAchieved).toLocaleString('en-IN')}
                    </span>
                  )}
                  {k.incentiveGiven && (
                    <span className="text-xs font-bold text-purple-600">
                      🎁 {k.incentiveGiven}
                    </span>
                  )}
                </div>

                {/* Aging badge */}
                {aging && (
                  <div className="mt-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: aging.bg, color: aging.color }}>
                      {aging.label} in {k.stage}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-screen overflow-y-auto">

            <div className="sticky top-0 bg-white rounded-t-3xl px-5 pt-5 pb-3 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-3">
                  <h2 className="text-sm font-black text-gray-800">{selected.title}</h2>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: STAGE_STYLE[selected.stage]?.bg,
                        color: STAGE_STYLE[selected.stage]?.color
                      }}>
                      {selected.stage}
                    </span>
                    {getAgingInfo(selected) && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: getAgingInfo(selected).bg,
                          color: getAgingInfo(selected).color
                        }}>
                        {getAgingInfo(selected).label}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                  ×
                </button>
              </div>
              <IdeaProgressBar stage={selected.stage} />
            </div>

            <div className="p-5 space-y-4">

              {/* Details */}
              <div className="rounded-2xl p-3 space-y-1.5" style={{ background: '#f8fafc' }}>
                {[
                  ['Submitted',   selected.submittedDate],
                  ['Team',        selected.submittedTeam || selected.team],
                  ['Department',  selected.area],
                  ['Priority',    selected.priority],
                  ['Est. Saving', selected.estimatedSaving ? `₹${Number(selected.estimatedSaving).toLocaleString('en-IN')}` : null],
                  ['Actual Saving', selected.savingsAchieved > 0 ? `₹${Number(selected.savingsAchieved).toLocaleString('en-IN')}` : null],
                  ['Incentive',   selected.incentiveGiven || null],
                ].filter(([, v]) => v).map(([l, v]) => (
                  <div key={l} className="flex gap-2 text-xs">
                    <span className="text-gray-400 w-24 flex-shrink-0">{l}:</span>
                    <span className="text-gray-700 font-semibold">{v}</span>
                  </div>
                ))}
              </div>

              {/* Problem */}
              {selected.description && (
                <div>
                  <p className="text-xs font-black text-gray-500 mb-1">PROBLEM</p>
                  <p className="text-xs text-gray-700 rounded-xl p-3"
                    style={{ background: '#fee2e2' }}>{selected.description}</p>
                </div>
              )}

              {/* Solution */}
              {selected.proposedSolution && (
                <div>
                  <p className="text-xs font-black text-gray-500 mb-1">SOLUTION</p>
                  <p className="text-xs text-gray-700 rounded-xl p-3"
                    style={{ background: '#dcfce7' }}>{selected.proposedSolution}</p>
                </div>
              )}

              {/* Pipeline timeline */}
              <div>
                <p className="text-xs font-black text-gray-500 mb-2">PIPELINE PROGRESS</p>
                <div className="rounded-2xl overflow-hidden border border-gray-100">
                  <table className="w-full text-xs">
                    <tbody>
                      {STAGE_ORDER.map(stage => {
                        const isDone = selected.timestamps?.[stage]
                        const isCurrent = selected.stage === stage
                        const style = STAGE_STYLE[stage]
                        return (
                          <tr key={stage} className="border-t border-gray-50"
                            style={{ background: isCurrent ? style.bg : 'white' }}>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ background: isDone ? style.dot : '#e2e8f0' }} />
                                <span className="font-bold"
                                  style={{ color: isDone ? style.color : '#94a3b8' }}>
                                  {stage}
                                </span>
                                {isCurrent && (
                                  <span className="ml-1 text-xs px-2 py-0.5 rounded-full font-bold"
                                    style={{ background: style.dot, color: 'white' }}>
                                    Current
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-gray-400 text-right">
                              {selected.timestamps?.[stage] || (isCurrent ? 'In progress' : '—')}
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
                  <p className="text-xs font-black text-gray-500 mb-2">UPDATES</p>
                  <div className="space-y-2">
                    {selected.comments.map((c, i) => (
                      <div key={i} className="rounded-xl p-3" style={{ background: '#f8fafc' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-black text-gray-700">{c.by}</span>
                          {c.designation && (
                            <span className="text-xs text-gray-400">{c.designation}</span>
                          )}
                          <span className="ml-auto text-xs text-gray-400">{c.date}</span>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full inline-block mb-1"
                          style={{
                            background: STAGE_STYLE[c.stage]?.bg,
                            color: STAGE_STYLE[c.stage]?.color
                          }}>
                          {c.stage}
                        </span>
                        {c.text && (
                          <p className="text-xs text-gray-600 mt-1">{c.text}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setSelected(null)}
                className="w-full py-3 rounded-2xl text-sm font-black text-gray-600"
                style={{ background: '#f1f5f9' }}>
                Close
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyIdeas