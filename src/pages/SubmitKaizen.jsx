import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { KAIZEN_CATEGORIES, KAIZEN_PROBLEM_TYPES, TEAMS, TEAMS_DEPARTMENTS, TEAMS_MEMBERS, saveKaizen } from '../firebase'

const PopupAlert = ({ message, onClose }) => (
  message ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">⚠️</span>
          <p className="text-sm font-black text-red-700">{message}</p>
        </div>
        <button onClick={onClose}
          className="w-full text-white py-2.5 rounded-xl font-bold text-sm"
          style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>
          OK, Got it
        </button>
      </div>
    </div>
  ) : null
)

const SubmitKaizen = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    team: '',
    area: '',
    problemTypes: [],
    categories: [],
    description: '',
    proposedSolution: '',
    expectedBenefit: '',
    estimatedSaving: '',
    teamMembers: [],
    customMember: '',
    priority: '',
  })
  const [mediaFiles, setMediaFiles] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [alertMsg, setAlertMsg] = useState('')

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const toggleMulti = (field, value) => {
    setForm(p => ({
      ...p,
      [field]: p[field].includes(value)
        ? p[field].filter(v => v !== value)
        : [...p[field], value]
    }))
  }

  const toggleMember = (name) => {
    setForm(p => ({
      ...p,
      teamMembers: p.teamMembers.includes(name)
        ? p.teamMembers.filter(m => m !== name)
        : [...p.teamMembers, name]
    }))
  }

  const availableAreas = form.team && TEAMS_DEPARTMENTS[form.team]
    ? [...TEAMS_DEPARTMENTS[form.team], 'Others']
    : []

  const availableMembers = form.team && TEAMS_MEMBERS[form.team]
    ? TEAMS_MEMBERS[form.team]
    : []

  const handleMedia = (e) => {
    const files = Array.from(e.target.files)
    const readers = files.map(file => new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = () => resolve({ name: file.name, type: file.type, data: reader.result })
      reader.readAsDataURL(file)
    }))
    Promise.all(readers).then(results => setMediaFiles(p => [...p, ...results]))
  }

  const handleSubmit = async () => {
    if (!form.title) { setAlertMsg('Please enter idea title!'); return }
    if (!form.priority) { setAlertMsg('Please select priority!'); return }
    if (!form.team) { setAlertMsg('Please select team!'); return }
    if (!form.area) { setAlertMsg('Please select department!'); return }
    if (!form.description) { setAlertMsg('Please enter problem description!'); return }
    if (!form.proposedSolution) { setAlertMsg('Please enter proposed solution!'); return }

    setAlertMsg('')

    const idea = {
      id: Date.now(),
      ...form,
      teamMembers: [...form.teamMembers, form.customMember].filter(Boolean).join(', '),
      mediaFiles,
      stage: 'Submitted',
      submittedBy: user?.name,
      submittedDesignation: user?.designation,
      submittedTeam: form.team,
      role: user?.role,
      submittedDate: new Date().toLocaleDateString(),
      timestamps: { Submitted: new Date().toLocaleDateString() },
      savingsAchieved: 0,
      comments: [],
    }
    try {
  await saveKaizen(idea)
  setSubmitted(true)
} catch (err) {
  alert('❌ Failed to save. Check internet connection.')
}
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
        <Navbar />
        <div className="p-4 max-w-md mx-auto mt-10">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <div className="text-5xl mb-4">💡</div>
            <h2 className="text-xl font-black text-gray-800">Idea Submitted!</h2>
            <p className="text-gray-500 mt-1 text-sm">Your kaizen idea has been sent for review.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => {
                setSubmitted(false)
                setForm({ title: '', team: '', area: '', problemTypes: [], categories: [], description: '', proposedSolution: '', expectedBenefit: '', estimatedSaving: '', teamMembers: [], customMember: '', priority: 'Medium' })
                setMediaFiles([])
              }} className="flex-1 text-white py-3 rounded-xl font-bold text-sm"
                style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>
                Submit Another
              </button>
              <button onClick={() => navigate('/kaizen-board')}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-sm">
                View Board
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
      <Navbar />
      <div className="p-4 max-w-2xl mx-auto">
        <h1 className="text-xl font-black text-gray-800 mb-1">💡 Submit Kaizen Idea</h1>
        <p className="text-gray-500 text-xs mb-4">Found a problem? Suggest a solution!</p>

        <PopupAlert message={alertMsg} onClose={() => setAlertMsg('')} />

        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">

          {/* Title */}
          <div>
            <label className="block text-xs font-black text-gray-600 uppercase mb-1.5">Idea Title *</label>
            <input name="title" value={form.title} onChange={handle}
              placeholder="Brief title of your idea"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none bg-gray-50" />
          </div>

          {/* Team */}
          <div>
            <label className="block text-xs font-black text-gray-600 uppercase mb-2">Team *</label>
            <div className="grid grid-cols-3 gap-2">
              {TEAMS.map(t => (
                <button key={t} type="button"
                  onClick={() => setForm(p => ({ ...p, team: t, area: '', teamMembers: [] }))}
                  className="py-2 px-2 rounded-xl text-xs font-bold transition-all leading-tight"
                  style={form.team === t
                    ? { background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white' }
                    : { background: '#f8fafc', color: '#475569', border: '2px solid #e2e8f0' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Department — filtered by team */}
          {form.team && (
            <div>
              <label className="block text-xs font-black text-gray-600 uppercase mb-2">
                Department * <span className="text-orange-500">({form.team})</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableAreas.map(a => (
                  <button key={a} type="button"
                    onClick={() => setForm(p => ({ ...p, area: a }))}
                    className="p-2.5 rounded-xl text-xs font-semibold text-left transition-all border-2"
                    style={form.area === a
                      ? { background: 'linear-gradient(135deg, #1e3a5f, #1e40af)', color: 'white', borderColor: 'transparent' }
                      : { background: '#f8fafc', color: '#475569', borderColor: '#e2e8f0' }}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Priority */}
          <div>
            <label className="block text-xs font-black text-gray-600 uppercase mb-2">Priority *</label>
            <div className="flex gap-2">
              {['Low', 'Medium', 'High', 'Critical'].map(p => (
                <button key={p} type="button"
                  onClick={() => setForm(prev => ({ ...prev, priority: p }))}
                  className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                  style={form.priority === p
                    ? { background: p === 'Critical' ? '#dc2626' : p === 'High' ? '#d97706' : p === 'Medium' ? '#2563eb' : '#475569', color: 'white' }
                    : { background: '#f8fafc', color: '#475569', border: form.priority === '' ? '2px solid #fca5a5' : '2px solid #e2e8f0' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Problem Type — Multiple selection */}
          <div>
            <label className="block text-xs font-black text-gray-600 uppercase mb-2">
              Problem Type * <span className="text-gray-400 font-normal">(select all that apply)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {KAIZEN_PROBLEM_TYPES.map(pt => (
                <button key={pt} type="button"
                  onClick={() => toggleMulti('problemTypes', pt)}
                  className="py-2 px-3 rounded-xl text-xs font-semibold text-left transition-all"
                  style={form.problemTypes.includes(pt)
                    ? { background: 'linear-gradient(135deg, #1e3a5f, #1e40af)', color: 'white' }
                    : { background: '#f8fafc', color: '#475569', border: '2px solid #e2e8f0' }}>
                  {form.problemTypes.includes(pt) ? '✅ ' : ''}{pt}
                </button>
              ))}
            </div>
            {form.problemTypes.includes('Other') && (
              <input
                name="otherProblemType"
                placeholder="Specify other problem type..."
                className="w-full mt-2 border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none bg-gray-50"
                onChange={handle}
              />
            )}
          </div>

          {/* Category — Multiple selection */}
          <div>
            <label className="block text-xs font-black text-gray-600 uppercase mb-2">
              Category <span className="text-gray-400 font-normal">(select all that apply)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {KAIZEN_CATEGORIES.map(c => (
                <button key={c} type="button"
                  onClick={() => toggleMulti('categories', c)}
                  className="py-2 px-3 rounded-xl text-xs font-semibold text-left transition-all"
                  style={form.categories.includes(c)
                    ? { background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white' }
                    : { background: '#f8fafc', color: '#475569', border: '2px solid #e2e8f0' }}>
                  {form.categories.includes(c) ? '✅ ' : ''}{c}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-black text-gray-600 uppercase mb-1.5">Problem Description *</label>
            <textarea name="description" value={form.description} onChange={handle}
              placeholder="Describe the current problem clearly..."
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none bg-gray-50 resize-none" rows={3} />
          </div>

          {/* Photo/Video right after description */}
          <div>
            <label className="block text-xs font-black text-gray-600 uppercase mb-1.5">
              📎 Photo / Video of Problem
            </label>
            <label className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center cursor-pointer hover:border-blue-400"
              style={{ background: '#f8fafc' }}>
              <span className="text-2xl mb-1">📸</span>
              <span className="text-xs text-gray-500 font-semibold">Tap to attach photo or video</span>
              <input type="file" accept="image/*,video/*" capture="environment" multiple onChange={handleMedia} className="hidden" />
            </label>
            {mediaFiles.length > 0 && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {mediaFiles.map((f, i) => (
                  <div key={i} className="relative">
                    {f.type.startsWith('image/') ? (
                      <img src={f.data} alt={f.name} className="w-16 h-16 rounded-xl object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl"
                        style={{ background: '#f1f5f9' }}>🎥</div>
                    )}
                    <button onClick={() => setMediaFiles(p => p.filter((_, j) => j !== i))}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Proposed Solution */}
          <div>
            <label className="block text-xs font-black text-gray-600 uppercase mb-1.5">Proposed Solution *</label>
            <textarea name="proposedSolution" value={form.proposedSolution} onChange={handle}
              placeholder="How to fix this problem?"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none bg-gray-50 resize-none" rows={3} />
          </div>

          {/* Expected Benefit */}
          <div>
            <label className="block text-xs font-black text-gray-600 uppercase mb-1.5">Expected Benefit</label>
            <input name="expectedBenefit" value={form.expectedBenefit} onChange={handle}
              placeholder="e.g. Reduce waste by 20%"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none bg-gray-50" />
          </div>

          {/* Estimated Saving */}
          <div>
            <label className="block text-xs font-black text-gray-600 uppercase mb-1.5">Estimated Monthly Saving (₹)</label>
            <input name="estimatedSaving" type="number" value={form.estimatedSaving} onChange={handle}
              placeholder="Monthly saving in rupees"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none bg-gray-50" />
          </div>

          {/* Team Members — from organogram */}
          {form.team && (
            <div>
              <label className="block text-xs font-black text-gray-600 uppercase mb-2">
                Team Members Involved
              </label>
              <div className="max-h-40 overflow-y-auto rounded-xl border-2 border-gray-100 bg-gray-50">
                {availableMembers.map(member => (
                  <div key={member}
                    onClick={() => toggleMember(member)}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-100 transition border-b border-gray-100 last:border-0">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center"
                      style={{ background: form.teamMembers.includes(member) ? '#1e3a5f' : 'white', border: '2px solid #e2e8f0' }}>
                      {form.teamMembers.includes(member) && <span className="text-white text-xs">✓</span>}
                    </div>
                    <p className="text-sm text-gray-700 font-medium">{member}</p>
                  </div>
                ))}
              </div>
              {form.teamMembers.length > 0 && (
                <p className="text-xs text-blue-600 font-semibold mt-1">
                  Selected: {form.teamMembers.join(', ')}
                </p>
              )}
              <input
                placeholder="Add other member name..."
                value={form.customMember}
                onChange={e => setForm(p => ({ ...p, customMember: e.target.value }))}
                className="w-full mt-2 border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none bg-gray-50"
              />
            </div>
          )}

          <button onClick={handleSubmit}
            className="w-full text-white py-4 rounded-2xl font-black text-base shadow-lg"
            style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>
            Submit Kaizen Idea 💡
          </button>
        </div>
      </div>
    </div>
  )
}

export default SubmitKaizen