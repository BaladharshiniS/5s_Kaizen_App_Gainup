import Navbar from '../components/Navbar'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { saveOrganogram, getOrganogram, getAudits } from '../firebase'

// ── Default data ────────────────────────────────────────────────────────────
const DEFAULT_LEADERSHIP = [
  { role: 'Captain',           name: 'Mr. Askar',    color: '#f97316' },
  { role: 'Coordinator',       name: 'Mr. Prasanth', color: '#3b82f6' },
  { role: 'Sec. Coordinator',  name: 'Mrs. Karthika', color: '#8b5cf6' },
]

const TEAMS_DATA = [
  { name: 'Royal Lions',    color: '#dc2626', bg: '#fee2e2', facilitator: 'Mrs. Pavithra',   leader: 'Team Leader',        areas: ['Trim Store', 'Fabric Store'],                   zones: ['Zone-1', 'Zone-2'],            members: ['Roja', 'Jerry', 'Kumari', 'Akila', 'Ranjith', 'Mohan'],                                           extraRoles: [] },
  { name: 'Dragon Force',   color: '#d97706', bg: '#fef9c3', facilitator: 'Mrs. Shanthi',    leader: 'Mr. Babu',           areas: ['Cutting', 'Super Market', 'I/CAD'],             zones: ['Zone-3', 'Zone-4'],            members: ['Deepa', 'Pugazhwaram', 'Sarswathi', 'Selvi', 'Kavitha'],                                          extraRoles: [] },
  { name: 'Golden Tiger',   color: '#16a34a', bg: '#dcfce7', facilitator: 'Mr. Kumaresan',   leader: 'Mr. Joseph',         areas: ['Line 1 to 11', 'Line 12 to 22'],                zones: ['Zone-5', 'Zone-6'],            members: ['Deepa', 'Muthulakshmi', 'Principal', 'Savithri', 'Malathi', 'Shantha Kumari'],                     extraRoles: [] },
  { name: 'Golden Eagle',   color: '#7c3aed', bg: '#ede9fe', facilitator: 'Mr. Lazar',       leader: 'Mr. Vicky',          areas: ['Line 23 to 28', 'Line 29 to 35'],               zones: ['Zone-7', 'Zone-8'],            members: ['Suganya', 'Indra', 'Nisha', 'Lalitha', 'Kalaiswari'],                                             extraRoles: [] },
  { name: 'Bison Warriors', color: '#0369a1', bg: '#dbeafe', facilitator: 'Mr. Prabhu',      leader: 'Mr. Anand',          areas: ['Line 36 to 39', 'Line 40 to 44'],               zones: ['Zone-9', 'Zone-10'],           members: ['Deepa', 'Narmadha', 'Jayanthi', 'Muthu Lakshmi', 'Shiva Lakshmi'],                                extraRoles: [] },
  { name: 'Penguins',       color: '#be185d', bg: '#fdf2f8', facilitator: 'Mrs. Chandra',    leader: 'Mrs. Meena',         areas: ['Pattern', 'Sampling'],                          zones: ['Zone-11', 'Zone-12'],          members: ['Priya', 'Sujeedha', 'Jayalakshmi', 'Karthika'],                                                   extraRoles: [] },
  { name: 'Phoenix Squad',  color: '#065f46', bg: '#ccfbf1', facilitator: 'Mrs. Prabhu',     leader: 'Mrs. Pazhaiyamma',   areas: ['Electric', 'Maintenance'],                      zones: ['Zone-13', 'Zone-14'],          members: ['Babu', 'Sudha', 'Buvena', 'Tamil', 'Mukesh', 'Vinothi'],                                          extraRoles: [] },
  { name: 'Storm Blades',   color: '#92400e', bg: '#ffedd5', facilitator: 'Mrs. Jayanthi',   leader: 'Mrs. Raj Kumar',     areas: ['Security Gate', 'All Canteen', 'Staff Tables'],  zones: ['Zone-15', 'Zone-16', 'Zone-17'], members: ['Suresh', 'Anitha', 'Priyanka', 'Manikar', 'Narmalar', 'Kathireesan', 'Swaminathan'],             extraRoles: [] },
  { name: 'Spartan Kings',  color: '#1e40af', bg: '#dbeafe', facilitator: 'Mr. Baskar',      leader: 'Mr. Vineet',         areas: ['Packing-1', 'Packing-2', 'FGS / Non-FG'],      zones: ['Zone-18', 'Zone-19', 'Zone-20'], members: ['Muthu', 'Muthuprandi', 'Geetha', 'Saraswathi', 'Ruban', 'Poorna', 'Muthunasar'],                extraRoles: [] },
]

const EMPTY_TEAM = { name: '', color: '#1e40af', bg: '#dbeafe', facilitator: '', leader: '', areas: [], zones: [], members: [], extraRoles: [] }

// ── Small helpers ───────────────────────────────────────────────────────────
const initials = (name = '') => name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()

// ── Main component ──────────────────────────────────────────────────────────
const Organogram = () => {
  const { user } = useAuth()
  const canEdit = user?.role === 'AuditIncharge' || user?.role === 'Admin' || user?.role === 'MD'

  const [leadership, setLeadership]     = useState(DEFAULT_LEADERSHIP)
  const [teamsData, setTeamsData]       = useState(TEAMS_DATA)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [editingTeam, setEditingTeam]   = useState(null)
  const [editForm, setEditForm]         = useState(null)
  const [showAddTeam, setShowAddTeam]   = useState(false)
  const [newTeam, setNewTeam]           = useState({ ...EMPTY_TEAM })
  const [saving, setSaving]             = useState(false)
  const [auditScores, setAuditScores] = useState({}) // { teamName: { pct, date } }
  const [editLeadership, setEditLeadership] = useState(false)
  const [leaderForm, setLeaderForm]     = useState(null)
  const detailRef = useRef(null)

  useEffect(() => {
    getAudits().then(audits => {
      const scores = {}
      // Step 1: group by teamName → level → date → audits[]
const grouped = {}
audits.forEach(a => {
  const name = a.teamName
  if (!name) return
  const level = a.auditLevel || ''
  const date = a.auditDate || a.date || ''
  const pct = a.scorePercent ?? (a.totalMarks ? Math.round((a.scoredMarks / a.totalMarks) * 100) : 0)
  if (!grouped[name]) grouped[name] = {}
  if (!grouped[name][level]) grouped[name][level] = {}
  if (!grouped[name][level][date]) grouped[name][level][date] = []
  grouped[name][level][date].push(pct)
})

// Step 2: per team → find latest level → find latest date → average
const S_ORDER = ['5S', '4S', '3S', '2S', '1S']
Object.entries(grouped).forEach(([name, levels]) => {
  const latestLevel = S_ORDER.find(s => levels[s])
  if (!latestLevel) return
  const dates = Object.keys(levels[latestLevel]).sort((a, b) => new Date(b) - new Date(a))
  const latestDate = dates[0]
  const pcts = levels[latestLevel][latestDate]
  const avg = Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length)
  scores[name] = { pct: avg, date: latestDate }
})
      setAuditScores(scores)
    })
  }, [])

  // Load from Firebase
  useEffect(() => {
  getOrganogram().then(data => {
    if (!data) {
      // ✅ Nothing in Firebase yet — save defaults now
      saveOrganogram({ leadership: DEFAULT_LEADERSHIP, teams: TEAMS_DATA })
      return
    }
    if (data.teams) {
      setTeamsData(data.teams)
      if (data.leadership) setLeadership(data.leadership)
    } else {
      const arr = Array.isArray(data) ? data : Object.values(data)
      setTeamsData(arr.map(t => ({ extraRoles: [], ...t })))
    }
  })
}, [])

  const persist = async (newTeams, newLeadership) => {
  const clean = JSON.parse(JSON.stringify({
    leadership: newLeadership || leadership,
    teams: newTeams || teamsData
  }))
  // ✅ Return true/false instead of throwing
  try {
    await saveOrganogram(clean)
    return true
  } catch (err) {
    console.error('Persist error:', err)
    return false
  }
}

  // ── Leadership edit ────────────────────────────────────────────────────────
  const openLeaderEdit = () => {
    setLeaderForm(leadership.map(l => ({ ...l })))
    setEditLeadership(true)
  }
  const saveLeadership = async () => {
  setSaving(true)
  const ok = await persist(teamsData, leaderForm)
  if (!ok) {
    alert('❌ Failed to save. Check your internet connection.')
  } else {
    setLeadership(leaderForm)
    setEditLeadership(false)
  }
  setSaving(false)
}
  const addLeaderRole = () => setLeaderForm(f => [...f, { role: '', name: '', color: '#64748b' }])
  const removeLeaderRole = (idx) => setLeaderForm(f => f.filter((_, i) => i !== idx))

  // ── Team edit ──────────────────────────────────────────────────────────────
  const openEditTeam = (team) => {
    setEditingTeam(team)
    setEditForm({ ...team, members: [...(team.members || [])], areas: [...(team.areas || [])], zones: [...(team.zones || [])], extraRoles: [...(team.extraRoles || [])] })
  }
  const handleSaveEdit = async () => {
  setSaving(true)
  const updated = teamsData.map(t => t.name === editingTeam.name ? { ...editForm } : t)
  const ok = await persist(updated)
  if (!ok) {
    alert('❌ Failed to save. Check your internet connection.')
  } else {
    setTeamsData(updated)
    if (selectedTeam?.name === editingTeam.name) setSelectedTeam({ ...editForm })
    setEditingTeam(null)
    setEditForm(null)
  }
  setSaving(false)
}

  const handleDeleteTeam = async () => {
  if (!window.confirm(`Delete "${editingTeam.name}"? This cannot be undone.`)) return
  setSaving(true)
  const updated = teamsData.filter(t => t.name !== editingTeam.name)
  const ok = await persist(updated)
  if (!ok) {
    alert('❌ Failed to delete. Check your internet connection.')
  } else {
    setTeamsData(updated)
    if (selectedTeam?.name === editingTeam.name) setSelectedTeam(null)
    setEditingTeam(null)
    setEditForm(null)
  }
  setSaving(false)
}
  const handleAddTeam = async () => {
  if (!newTeam.name.trim()) return
  setSaving(true)
  const updated = [...teamsData, { ...newTeam, bg: newTeam.color + '22', extraRoles: newTeam.extraRoles || [] }]
  const ok = await persist(updated)
  if (!ok) {
    alert('❌ Failed to save. Check your internet connection.')
  } else {
    setTeamsData(updated)
    setShowAddTeam(false)
    setNewTeam({ ...EMPTY_TEAM })
  }
  setSaving(false)
}

  // ── Extra roles helpers ────────────────────────────────────────────────────
  const addExtraRole = (formSetter) =>
    formSetter(f => ({ ...f, extraRoles: [...(f.extraRoles || []), { role: '', name: '' }] }))
  const updateExtraRole = (formSetter, idx, field, val) =>
    formSetter(f => ({ ...f, extraRoles: f.extraRoles.map((r, i) => i === idx ? { ...r, [field]: val } : r) }))
  const removeExtraRole = (formSetter, idx) =>
    formSetter(f => ({ ...f, extraRoles: f.extraRoles.filter((_, i) => i !== idx) }))

  // ── Shared team edit fields JSX ────────────────────────────────────────────
  const TeamFormFields = ({ form, setForm }) => (
    <>
      <label className="text-xs font-black text-gray-500 uppercase mb-1 block">Team Name</label>
      <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none bg-gray-50" />

      <label className="text-xs font-black text-gray-500 uppercase mb-1 block">Facilitator</label>
      <input value={form.facilitator} onChange={e => setForm(f => ({ ...f, facilitator: e.target.value }))}
        className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none bg-gray-50" />

      <label className="text-xs font-black text-gray-500 uppercase mb-1 block">Team Leader</label>
      <input value={form.leader} onChange={e => setForm(f => ({ ...f, leader: e.target.value }))}
        className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none bg-gray-50" />

      {/* Extra custom roles */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-black text-gray-500 uppercase">Additional Roles</label>
          <button type="button" onClick={() => addExtraRole(setForm)}
            className="text-xs font-bold px-2 py-0.5 rounded-lg"
            style={{ background: '#eff6ff', color: '#1e40af' }}>+ Add Role</button>
        </div>
        {(form.extraRoles || []).map((r, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <input value={r.role} placeholder="Role (e.g. Asst. Coordinator)"
              onChange={e => updateExtraRole(setForm, idx, 'role', e.target.value)}
              className="flex-1 border-2 border-gray-100 rounded-xl px-2 py-1.5 text-xs focus:outline-none bg-gray-50" />
            <input value={r.name} placeholder="Person name"
              onChange={e => updateExtraRole(setForm, idx, 'name', e.target.value)}
              className="flex-1 border-2 border-gray-100 rounded-xl px-2 py-1.5 text-xs focus:outline-none bg-gray-50" />
            <button type="button" onClick={() => removeExtraRole(setForm, idx)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
              style={{ background: '#fee2e2', color: '#dc2626' }}>×</button>
          </div>
        ))}
        {(form.extraRoles || []).length === 0 && (
          <p className="text-xs text-gray-400 italic">No extra roles. Click "+ Add Role" to add positions like Asst. Coordinator, Zone Owner, etc.</p>
        )}
      </div>

      <label className="text-xs font-black text-gray-500 uppercase mb-1 block">Team Color</label>
      <div className="flex items-center gap-3 mb-3">
        <input type="color" value={form.color}
          onChange={e => setForm(f => ({ ...f, color: e.target.value, bg: e.target.value + '22' }))}
          className="w-10 h-10 rounded-xl border-2 border-gray-100 cursor-pointer" />
        <span className="text-sm text-gray-500 font-mono">{form.color}</span>
      </div>

      <label className="text-xs font-black text-gray-500 uppercase mb-1 block">Areas (one per line)</label>
      <textarea value={(form.areas || []).join('\n')}
        onChange={e => setForm(f => ({ ...f, areas: e.target.value.split('\n') }))}
        rows={3} className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none bg-gray-50" />

      <label className="text-xs font-black text-gray-500 uppercase mb-1 block">Zones (one per line)</label>
      <textarea value={(form.zones || []).join('\n')}
        onChange={e => setForm(f => ({ ...f, zones: e.target.value.split('\n') }))}
        rows={3} className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none bg-gray-50" />

      <label className="text-xs font-black text-gray-500 uppercase mb-1 block">Members (one per line)</label>
      <textarea value={(form.members || []).join('\n')}
        onChange={e => setForm(f => ({ ...f, members: e.target.value.split('\n').filter(Boolean) }))}
        rows={6} className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none bg-gray-50" />
    </>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
      <Navbar />
      <div className="p-4 max-w-6xl mx-auto">

        {/* ── Header ── */}
        <div className="rounded-2xl p-5 mb-5 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #f97316, transparent)', transform: 'translate(30%,-30%)' }}></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider">GAINUP Industries</p>
              <h1 className="text-xl font-black mt-1">Woven Division</h1>
              <p className="text-blue-300 text-sm mt-0.5">5S Organogram</p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-xl"
              style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>5S</div>
          </div>

          {/* Leadership row */}
          <div className="mt-4 grid grid-cols-3 gap-3 relative z-10">
            {leadership.map(l => (
              <div key={l.role} className="rounded-xl p-3 text-center"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-white text-xs mx-auto mb-1"
                  style={{ background: l.color }}>{initials(l.name)}</div>
                <p className="text-white text-xs font-bold leading-tight">{l.name}</p>
                <p className="text-blue-300 text-xs opacity-80">{l.role}</p>
              </div>
            ))}
          </div>

          {/* Edit leadership button */}
          {canEdit && (
            <button onClick={openLeaderEdit}
              className="mt-3 px-3 py-1.5 rounded-xl text-xs font-bold relative z-10"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
              ✏️ Edit Leadership
            </button>
          )}
        </div>

        {/* ── 5S Legend ── */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-5">
          <p className="text-xs font-black text-gray-600 uppercase tracking-wider mb-3">5S Pillars</p>
          <div className="grid grid-cols-5 gap-2">
            {[
              { s: '1S', name: 'SORT',        sub: 'Seiri',    color: '#dc2626', bg: '#fee2e2' },
              { s: '2S', name: 'SET IN ORDER', sub: 'Seiton',   color: '#d97706', bg: '#fef9c3' },
              { s: '3S', name: 'SHINE',        sub: 'Seiso',    color: '#2563eb', bg: '#dbeafe' },
              { s: '4S', name: 'STANDARDIZE',  sub: 'Seiketsu', color: '#7c3aed', bg: '#ede9fe' },
              { s: '5S', name: 'SUSTAIN',      sub: 'Shitsuke', color: '#0f766e', bg: '#ccfbf1' },
            ].map(item => (
              <div key={item.s} className="rounded-xl p-2 text-center" style={{ background: item.bg }}>
                <p className="text-lg font-black" style={{ color: item.color }}>{item.s}</p>
                <p className="text-xs font-black leading-tight" style={{ color: item.color }}>{item.name}</p>
                <p className="text-xs opacity-60 mt-0.5" style={{ color: item.color }}>{item.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Org Chart ── */}
        <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Team Structure</p>

        <div className="flex justify-center mb-2">
          <div className="rounded-2xl px-6 py-3 text-white text-center"
            style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
            <p className="text-sm font-black">GAIN UP — Woven Division 5S</p>
          </div>
        </div>
        <div className="flex justify-center mb-2"><div className="w-0.5 h-6" style={{ background: '#94a3b8' }}></div></div>

        {/* Captain (first leadership item) */}
        <div className="flex justify-center mb-2">
          <div className="rounded-2xl p-3 text-center border-2 min-w-36"
            style={{ background: '#fff7ed', borderColor: leadership[0]?.color || '#f97316' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white mx-auto mb-1"
              style={{ background: leadership[0]?.color || '#f97316' }}>
              {initials(leadership[0]?.name || '')}
            </div>
            <p className="text-xs font-black text-gray-800">{leadership[0]?.name}</p>
            <p className="text-xs font-semibold" style={{ color: leadership[0]?.color || '#f97316' }}>{leadership[0]?.role}</p>
          </div>
        </div>
        <div className="flex justify-center mb-2"><div className="w-0.5 h-6" style={{ background: '#94a3b8' }}></div></div>

        {/* Rest of leadership */}
        {leadership.length > 1 && (
          <>
            <div className="flex justify-center gap-4 mb-2 flex-wrap">
              {leadership.slice(1).map(c => (
                <div key={c.role} className="rounded-2xl p-3 text-center border-2 min-w-32"
                  style={{ background: '#f8fafc', borderColor: c.color }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-white mx-auto mb-1"
                    style={{ background: c.color }}>{initials(c.name)}</div>
                  <p className="text-xs font-black text-gray-800">{c.name}</p>
                  <p className="text-xs font-semibold" style={{ color: c.color }}>{c.role}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-center mb-2"><div className="w-0.5 h-6" style={{ background: '#94a3b8' }}></div></div>
          </>
        )}

        <div className="w-full h-0.5 mb-2" style={{ background: '#e2e8f0' }}></div>

        {/* ── Teams Grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {teamsData.map(team => (
            <div key={team.name}
              onClick={() => {
                if (selectedTeam?.name === team.name) { setSelectedTeam(null) }
                else {
                  setSelectedTeam(team)
                  setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
                }
              }}
              className="rounded-2xl overflow-hidden cursor-pointer hover:shadow-md transition shadow-sm"
              style={{ border: `2px solid ${selectedTeam?.name === team.name ? team.color : team.color + '40'}` }}>

              <div className="px-3 py-2 flex items-center gap-2" style={{ background: team.color }}>
                <div className="w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs"
                  style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                  {initials(team.name)}
                </div>
                <p className="text-white font-black text-xs flex-1">{team.name}</p>
                {auditScores[team.name] && (
                  <span className="text-xs font-black px-1.5 py-0.5 rounded-lg mr-1"
                    style={{
                      background: auditScores[team.name].pct >= 80 ? '#16a34a'
                        : auditScores[team.name].pct >= 60 ? '#d97706' : '#dc2626',
                      color: 'white',
                      fontSize: '10px'
                    }}>
                    {auditScores[team.name].pct}%
                  </span>
                )}
                <span className="text-white opacity-70 text-xs">{selectedTeam?.name === team.name ? '▲' : '▼'}</span>
                {canEdit && (
                  <button onClick={e => { e.stopPropagation(); openEditTeam(team) }}
                    className="ml-1 px-2 py-0.5 rounded-lg text-xs font-bold"
                    style={{ background: 'rgba(255,255,255,0.25)', color: 'white' }}>✏️</button>
                )}
              </div>

              <div className="p-2.5" style={{ background: team.bg }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs px-1.5 py-0.5 rounded font-bold text-white"
                    style={{ background: team.color, fontSize: '9px' }}>F</span>
                  <p className="text-xs font-semibold text-gray-700">{team.facilitator}</p>
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs px-1.5 py-0.5 rounded font-bold text-white"
                    style={{ background: team.color, fontSize: '9px' }}>L</span>
                  <p className="text-xs font-semibold text-gray-700">{team.leader}</p>
                </div>
                {/* Extra roles badges */}
                {(team.extraRoles || []).map((r, i) => (
                  <div key={i} className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs px-1.5 py-0.5 rounded font-bold text-white"
                      style={{ background: team.color, fontSize: '9px' }}>+</span>
                    <p className="text-xs font-semibold text-gray-700">{r.name} <span className="text-gray-400">({r.role})</span></p>
                  </div>
                ))}
                <div className="flex flex-wrap gap-1 mt-1">
                  {(team.zones || []).map(z => (
                    <span key={z} className="text-xs px-1.5 py-0.5 rounded font-semibold"
                      style={{ background: 'white', color: team.color, border: `1px solid ${team.color}40`, fontSize: '9px' }}>{z}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {canEdit && (
          <button onClick={() => setShowAddTeam(true)}
            className="w-full mt-3 py-3 rounded-2xl text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)', color: 'white' }}>
            + Add New Team
          </button>
        )}

        {/* ── Team Detail ── */}
        {selectedTeam && (
          <div ref={detailRef} className="mt-4 bg-white rounded-2xl shadow-sm overflow-hidden"
            style={{ border: `2px solid ${selectedTeam.color}` }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ background: selectedTeam.color }}>
              <p className="text-white font-black">{selectedTeam.name} — Details</p>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <button onClick={() => openEditTeam(selectedTeam)}
                    className="px-3 py-1 rounded-xl text-xs font-bold"
                    style={{ background: 'rgba(255,255,255,0.25)', color: 'white' }}>✏️ Edit</button>
                )}
                <button onClick={() => setSelectedTeam(null)}
                  className="w-7 h-7 rounded-xl bg-white bg-opacity-20 flex items-center justify-center text-white font-bold">×</button>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-black text-gray-500 uppercase mb-2">Leadership</p>
                  <div className="space-y-2">
                    {[
                      { role: 'Facilitator', name: selectedTeam.facilitator },
                      { role: 'Team Leader', name: selectedTeam.leader },
                      ...(selectedTeam.extraRoles || []),
                    ].map((l, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-xl p-2" style={{ background: selectedTeam.bg }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black"
                          style={{ background: selectedTeam.color }}>{initials(l.name)}</div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">{l.name}</p>
                          <p className="text-xs text-gray-500">{l.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs font-black text-gray-500 uppercase mt-3 mb-2">Zones & Areas</p>
                  <div className="flex flex-wrap gap-1">
                    {(selectedTeam.zones || []).map(z => (
                      <span key={z} className="text-xs px-2 py-1 rounded-full font-bold text-white"
                        style={{ background: selectedTeam.color }}>{z}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(selectedTeam.areas || []).map(a => (
                      <span key={a} className="text-xs px-2 py-1 rounded-full font-semibold"
                        style={{ background: selectedTeam.bg, color: selectedTeam.color }}>{a}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-black text-gray-500 uppercase mb-2">Team Members</p>
                  <div className="space-y-1">
                    {(selectedTeam.members || []).map((m, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg px-2 py-1.5" style={{ background: selectedTeam.bg }}>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-black"
                          style={{ background: selectedTeam.color }}>{i + 1}</div>
                        <p className="text-xs font-semibold text-gray-700">{m}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ═══════════════════════════════════════════════════════
          EDIT LEADERSHIP MODAL
      ═══════════════════════════════════════════════════════ */}
      {editLeadership && leaderForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white rounded-3xl shadow-2xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="font-black text-gray-800">✏️ Edit Leadership</p>
              <button onClick={() => setEditLeadership(false)}
                className="w-7 h-7 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-500">×</button>
            </div>

            <p className="text-xs text-gray-400 mb-3">Edit names, roles, or colors. Add new positions. Remove old ones.</p>

            <div className="space-y-3 mb-4">
              {leaderForm.map((l, idx) => (
                <div key={idx} className="rounded-xl p-3 border-2 border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-gray-500 uppercase">Position {idx + 1}</span>
                    <button onClick={() => removeLeaderRole(idx)}
                      className="text-xs px-2 py-0.5 rounded-lg font-bold"
                      style={{ background: '#fee2e2', color: '#dc2626' }}>Remove</button>
                  </div>
                  <input value={l.role} placeholder="Role (e.g. Captain, Coordinator)"
                    onChange={e => setLeaderForm(f => f.map((x, i) => i === idx ? { ...x, role: e.target.value } : x))}
                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm mb-2 focus:outline-none bg-gray-50" />
                  <input value={l.name} placeholder="Person name"
                    onChange={e => setLeaderForm(f => f.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm mb-2 focus:outline-none bg-gray-50" />
                  <div className="flex items-center gap-3">
                    <input type="color" value={l.color}
                      onChange={e => setLeaderForm(f => f.map((x, i) => i === idx ? { ...x, color: e.target.value } : x))}
                      className="w-9 h-9 rounded-xl border-2 border-gray-100 cursor-pointer" />
                    <span className="text-xs text-gray-400">Badge color</span>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addLeaderRole}
              className="w-full py-2 rounded-xl text-sm font-bold mb-3"
              style={{ background: '#eff6ff', color: '#1e40af' }}>
              + Add New Position
            </button>

            <div className="flex gap-3">
              <button onClick={() => setEditLeadership(false)}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-gray-100 text-gray-700">Cancel</button>
              <button onClick={saveLeadership} disabled={saving}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
                style={{ background: saving ? '#94a3b8' : 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>
                {saving ? 'Saving...' : 'Save ✅'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          EDIT TEAM MODAL
      ═══════════════════════════════════════════════════════ */}
      {editingTeam && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white rounded-3xl shadow-2xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="font-black text-gray-800">✏️ Edit Team</p>
              <button onClick={() => { setEditingTeam(null); setEditForm(null) }}
                className="w-7 h-7 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-500">×</button>
            </div>
            <TeamFormFields form={editForm} setForm={setEditForm} />
            <div className="flex gap-3">
              <button onClick={handleDeleteTeam} disabled={saving}
                className="px-4 py-3 rounded-xl text-sm font-bold"
                style={{ background: '#fee2e2', color: '#dc2626' }}>🗑️ Delete</button>
              <button onClick={handleSaveEdit} disabled={saving}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
                style={{ background: saving ? '#94a3b8' : 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>
                {saving ? 'Saving...' : 'Save Changes ✅'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          ADD NEW TEAM MODAL
      ═══════════════════════════════════════════════════════ */}
      {showAddTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white rounded-3xl shadow-2xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="font-black text-gray-800">➕ Add New Team</p>
              <button onClick={() => { setShowAddTeam(false); setNewTeam({ ...EMPTY_TEAM }) }}
                className="w-7 h-7 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-500">×</button>
            </div>
            <TeamFormFields form={newTeam} setForm={setNewTeam} />
            <button onClick={handleAddTeam} disabled={saving || !newTeam.name.trim()}
              className="w-full py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: saving || !newTeam.name.trim() ? '#94a3b8' : 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>
              {saving ? 'Saving...' : 'Add Team ✅'}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default Organogram
