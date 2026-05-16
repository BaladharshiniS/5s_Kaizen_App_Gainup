import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { TEAMS, DEFAULT_CHECKLIST, mockUsers, DESIGNATIONS, TEAMS_DEPARTMENTS, saveAudit, getAudits } from '../firebase'
import { useLang } from '../App'

const S_LEVELS = ['1S', '2S', '3S', '4S', '5S']

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

const CameraModal = ({ onCapture, onClose }) => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [camError, setCamError] = useState('')

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(stream => {
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => setReady(true)
        }
      })
      .catch(() => setCamError('Camera access denied. Use Gallery instead.'))
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()) }
  }, [])

  const shoot = () => {
    if (!ready) return
    canvasRef.current.width = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    canvasRef.current.getContext('2d').drawImage(videoRef.current, 0, 0)
    streamRef.current.getTracks().forEach(t => t.stop())
    onCapture(canvasRef.current.toDataURL('image/jpeg', 0.88))
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3" style={{ background: 'rgba(0,0,0,0.8)' }}>
        <button onClick={onClose} className="text-white font-bold px-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.15)' }}>✕ Cancel</button>
        <p className="text-white text-sm font-semibold">📷 Take Photo</p>
        <div className="w-20" />
      </div>
      <div className="flex-1 relative">
        {camError
          ? <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <span className="text-5xl mb-3">📵</span>
              <p className="text-white font-bold mb-1">Camera Not Available</p>
              <p className="text-gray-400 text-sm mb-6">{camError}</p>
              <button onClick={onClose} className="bg-white text-black font-bold py-3 px-8 rounded-2xl text-sm">Close</button>
            </div>
          : <>
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {!ready && <div className="absolute inset-0 flex items-center justify-center"><p className="text-white text-sm">Starting camera...</p></div>}
            </>
        }
      </div>
      <canvas ref={canvasRef} className="hidden" />
      {!camError && (
        <div className="flex items-center justify-center py-8" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <button onClick={shoot} disabled={!ready}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center"
            style={{ opacity: ready ? 1 : 0.4 }}>
            <div className="w-14 h-14 rounded-full bg-white" />
          </button>
        </div>
      )}
    </div>
  )
}

const NewAudit = () => {
  const { user } = useAuth()
  const lang = useLang()
  const navigate = useNavigate()

  const canPutMarks = user?.role === 'AuditIncharge' || user?.role === 'MD'
  const canAudit = user?.role === 'AuditIncharge' || user?.role === 'FiveS_Incharge' || user?.role === 'Coordinator' || user?.role === 'Admin' || user?.role === 'TeamLead'
  const viewOnly = !canAudit

  const [step, setStep] = useState(1)
  const [area, setArea] = useState('')
  const [otherArea, setOtherArea] = useState('')
  const [auditLevel, setAuditLevel] = useState('')
  const [teamName, setTeamName] = useState('')
  const [auditorName, setAuditorName] = useState(user?.name || '')
  const [auditorDesignation, setAuditorDesignation] = useState(user?.designation || '')
  const [isOtherAuditor, setIsOtherAuditor] = useState(false)
  const [customAuditorName, setCustomAuditorName] = useState('')
  const [customDesignation, setCustomDesignation] = useState('')
  const [auditDate, setAuditDate] = useState(new Date().toISOString().split('T')[0])
  const [scores, setScores] = useState({})
  const [remarks, setRemarks] = useState({})
  const [beforePhotos, setBeforePhotos] = useState({})
  const [submitted, setSubmitted] = useState(false) 
  const [previewMode, setPreviewMode] = useState(false)
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST)
  const [alertMsg, setAlertMsg] = useState('')
  const [previewImg, setPreviewImg] = useState(null)
  const [showSLevelCheck, setShowSLevelCheck] = useState(false)
  const [completedLevels, setCompletedLevels] = useState([])
  const [showPrevScores, setShowPrevScores] = useState(false)
  const [prevAudits, setPrevAudits] = useState([])
  const [activeCamera, setActiveCamera] = useState(null) // key like "1S_0"
  const [showConfirm, setShowConfirm] = useState(false)

  const [allAudits, setAllAudits] = useState([])
  useEffect(() => {
  getAudits().then(setAllAudits).catch(() => setAllAudits([]))
}, [])

  useEffect(() => {
    const saved = localStorage.getItem('masterChecklist')
    if (saved) setChecklist(JSON.parse(saved))
  }, [])

  const availableAreas = teamName && TEAMS_DEPARTMENTS[teamName]
    ? [...TEAMS_DEPARTMENTS[teamName], 'Others']
    : []

  const getActiveLevels = () => {
    if (!auditLevel) return []
    return S_LEVELS.slice(0, S_LEVELS.indexOf(auditLevel) + 1)
  }

  const getTotalMarks = () => getActiveLevels().reduce((sum, s) => sum + checklist[s].totalMarks, 0)
  const getScoredMarks = () => Object.values(scores).reduce((sum, v) => sum + (Number(v) || 0), 0)
  const getScorePercent = () => {
    const total = getTotalMarks()
    return total ? Math.round((getScoredMarks() / total) * 100) : 0
  }

  const checkSLevelCompletion = (level) => {
  if (!teamName || !area) return true
  const levelIdx = S_LEVELS.indexOf(level)
  if (levelIdx === 0) return true
  const prevLevel = S_LEVELS[levelIdx - 1]
  return allAudits.some(a =>
    a.teamName === teamName &&
    (a.area === area || a.area === otherArea) &&
    a.auditLevel === prevLevel
  )
}

const getCompletedLevels = () => {
  if (!teamName || !area) return []
  return S_LEVELS.filter(s =>
    allAudits.some(a =>
      a.teamName === teamName &&
      (a.area === area || a.area === otherArea) &&
      a.auditLevel === s
    )
  )
}

const getPreviousAudits = (level) => {
  return allAudits.filter(a =>
    a.teamName === teamName &&
    (a.area === area || a.area === otherArea) &&
    a.auditLevel === level
  ).slice(0, 3)
}

  const handleLevelSelect = (level) => {
    const done = getCompletedLevels()
    const prev = getPreviousAudits(level)
    setPrevAudits(prev)

    if (!checkSLevelCompletion(level)) {
      setCompletedLevels(done)
      setShowSLevelCheck(true)
      return
    }
    setAuditLevel(level)
    if (prev.length > 0) setShowPrevScores(true)
  }

  // Auto select 1S when area is selected and no audits done yet
  useEffect(() => {
    if (area && teamName) {
      const done = getCompletedLevels()
      if (done.length === 0) {
        setAuditLevel('1S')
      }
    }
  }, [area, teamName, allAudits])

  const handlePhoto = (sLevel, idx, e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const key = `${sLevel}_${idx}`
      setBeforePhotos(p => ({ ...p, [key]: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  const finalAuditorName = isOtherAuditor ? customAuditorName : auditorName
  const finalDesignation = isOtherAuditor ? customDesignation : auditorDesignation

  const handleSubmit = () => {
    if (!area) { setAlertMsg('Please select a department!'); return }
    if (!auditLevel) { setAlertMsg('Please select audit level!'); return }
    if (!teamName) { setAlertMsg('Please select a team!'); return }
    if (!finalAuditorName) { setAlertMsg('Please select auditor name!'); return }

    const totalItems = getActiveLevels().reduce((sum, s) => sum + checklist?.[s]?.items || [].length, 0)
    const answered = Object.keys(scores).filter(k => Number(scores[k]) > 0).length

    if (canPutMarks && answered === 0) {
      setAlertMsg('⚠️ No scores entered! Please enter scores before submitting.')
      return
    }

    setShowConfirm(true)
  }

  const doSubmit = async () => {
  setShowConfirm(false)
  const audit = {
    area: area === 'Others' ? otherArea : area,
    auditLevel, teamName,
    auditorName: finalAuditorName,
    auditorDesignation: finalDesignation,
    auditDate, scores, remarks,
    beforePhotos: beforePhotos,
    scoredMarks: getScoredMarks(),
    totalMarks: getTotalMarks(),
    scorePercent: getScorePercent(),
    submittedBy: user?.name,
    date: new Date(auditDate).toLocaleDateString(),
    timestamp: new Date().toISOString(),
  }
  try {
    await saveAudit(audit)
    setPreviewMode(false)
    setSubmitted(true)
  } catch (err) {
    setAlertMsg('❌ Failed to save. Check your internet connection and try again.')
  }
}

  const resetForm = () => {
    setStep(1); setArea(''); setOtherArea(''); setAuditLevel('')
    setTeamName(''); setScores({}); setRemarks({})
    setBeforePhotos({}); setSubmitted(false)
    setAuditorName(user?.name || '')
    setAuditorDesignation(user?.designation || '')
    setIsOtherAuditor(false)
    setCustomAuditorName(''); setCustomDesignation('')
    setAuditDate(new Date().toISOString().split('T')[0])
    setAlertMsg('')
  }

  const getColor = s => s >= 80 ? '#16a34a' : s >= 60 ? '#d97706' : '#dc2626'
  const getBg = s => s >= 80 ? '#dcfce7' : s >= 60 ? '#fef9c3' : '#fee2e2'

  if (previewMode) {
    return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
      <Navbar />

      <div className="p-4 max-w-2xl mx-auto">

        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <h2 className="text-xl font-black text-gray-800 mb-3">
            📋 Audit Preview
          </h2>

          <div className="space-y-2 text-sm">
            <p><span className="font-black">Department:</span> {area}</p>
            <p><span className="font-black">Audit Level:</span> {auditLevel}</p>
            <p><span className="font-black">Team:</span> {teamName}</p>
            <p><span className="font-black">Auditor:</span> {finalAuditorName}</p>
            <p><span className="font-black">Score:</span> {getScoredMarks()} / {getTotalMarks()}</p>
          </div>
        </div>

        <div className="space-y-4">

          {Object.keys(scores).map(key => {

            const score = scores[key]
            const remark = remarks[key]
            const photo = beforePhotos[key]

            if (!score) return null

            return (
              <div key={key} className="bg-white rounded-2xl shadow-sm p-4">

                <div className="flex justify-between mb-2">
                  <p className="font-bold text-sm">{key}</p>
                  <p className="font-black text-blue-700">{score}</p>
                </div>

                {remark && (
                  <p className="text-xs text-orange-600 mb-2">
                    {remark}
                  </p>
                )}

                {photo && (
                  <img
                    src={photo}
                    alt=""
                    className="w-full h-40 object-cover rounded-xl"
                  />
                )}

              </div>
            )
          })}
        </div>

        <div className="flex gap-3 mt-4 mb-8">

          <button
            onClick={() => setPreviewMode(false)}
            className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-black">
            ← Back
          </button>

          <button
            onClick={doSubmit}          
            className="flex-1 text-white py-4 rounded-2xl font-black"
            style={{
              background: 'linear-gradient(135deg, #1e3a5f, #1e40af)'
            }}>
            Confirm Submit ✅
          </button>

        </div>

      </div>
    </div>
  )
}

  if (submitted) {
    const pct = getScorePercent()
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
        <Navbar />
        <div className="p-4 max-w-md mx-auto mt-6">
          <div className="bg-white rounded-3xl shadow-xl p-6 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: getBg(pct) }}>
              <span className="text-4xl">{pct >= 80 ? '✅' : pct >= 60 ? '⚠️' : '❌'}</span>
            </div>
            <h2 className="text-xl font-black text-gray-800">Audit Submitted!</h2>
            <p className="text-gray-500 text-sm mt-1">{area === 'Others' ? otherArea : area} · {auditLevel} · Team {teamName}</p>
            <p className="text-gray-400 text-xs mt-0.5">By: {finalAuditorName} ({finalDesignation})</p>
            <div className="mt-4 rounded-2xl p-4" style={{ background: '#f8fafc' }}>
              <p className="text-4xl font-black" style={{ color: getColor(pct) }}>{pct}%</p>
              <p className="text-sm text-gray-500 mt-1">{getScoredMarks()} / {getTotalMarks()} marks</p>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={resetForm} className="flex-1 text-white py-3 rounded-xl font-bold text-sm"
                style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>New Audit</button>
              <button onClick={() => navigate('/audit-history')}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-sm">History</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 1) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
        <Navbar />
        <div className="p-4 max-w-2xl mx-auto">
          <h1 className="text-xl font-black text-gray-800 mb-4">📋 New 5S Audit</h1>

          <PopupAlert message={alertMsg} onClose={() => setAlertMsg('')} />

          {viewOnly && (
            <div className="rounded-2xl p-4 mb-4 flex items-center gap-3"
              style={{ background: '#fef9c3', border: '2px solid #fde68a' }}>
              <span className="text-2xl">👁️</span>
              <div>
                <p className="text-sm font-black text-yellow-800">View Only Mode</p>
                <p className="text-xs text-yellow-700">You can view audits but cannot submit.</p>
              </div>
            </div>
          )}

          {/* Auditor + Date — locked to login user and today */}
<div className="bg-white rounded-2xl shadow-sm px-4 py-3 mb-3 flex items-center justify-between">
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0"
      style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>
      {user?.name?.[0]}
    </div>
    <div>
      <p className="text-sm font-black text-gray-800">{user?.name}</p>
      <p className="text-xs text-gray-400">{user?.designation}</p>
    </div>
  </div>
  <div className="text-right">
    <p className="text-xs font-black text-gray-700">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
    <p className="text-xs text-gray-400">Today</p>
  </div>
</div>

          {/* Team */}
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-3">
            <label className="block text-xs font-black text-gray-600 uppercase mb-3">Select Team *</label>
            <div className="grid grid-cols-3 gap-2">
              {TEAMS.map(t => (
                <button key={t} type="button"
                  onClick={() => { setTeamName(t); setArea('') }}
                  className="py-2 px-2 rounded-xl text-xs font-bold transition-all leading-tight"
                  style={teamName === t
                    ? { background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white' }
                    : { background: '#f8fafc', color: '#475569', border: '2px solid #e2e8f0' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Department -- filtered by team */}
          {teamName && (
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-3">
              <label className="block text-xs font-black text-gray-600 uppercase mb-3">
                Select Department * <span className="text-orange-500">({teamName})</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableAreas.map(a => (
                  <button key={a} type="button" onClick={() => setArea(a)}
                    className="p-2.5 rounded-xl text-xs font-semibold text-left transition-all border-2"
                    style={area === a
                      ? { background: 'linear-gradient(135deg, #1e3a5f, #1e40af)', color: 'white', borderColor: 'transparent' }
                      : { background: '#f8fafc', color: '#475569', borderColor: '#e2e8f0' }}>
                    {a}
                  </button>
                ))}
              </div>
              {area === 'Others' && (
                <input value={otherArea} onChange={e => setOtherArea(e.target.value)}
                  placeholder="Specify department name"
                  className="w-full mt-2 border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none bg-gray-50" />
              )}
            </div>
          )}

          {/* Audit Level */}
          {area && (
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
              <label className="block text-xs font-black text-gray-600 uppercase mb-3">Select Audit Level *</label>

              {/* Previous S level scores */}
              {getCompletedLevels().length > 0 && (
                <div className="mb-3 rounded-xl p-3" style={{ background: '#f0fdf4' }}>
                  <p className="text-xs font-black text-green-700 mb-2">✅ Completed Levels for {area}:</p>
                  <div className="flex gap-2 flex-wrap">
                    {getCompletedLevels().map(s => (
                      <span key={s} className="px-2 py-1 rounded-lg text-xs font-black text-white"
                        style={{ background: checklist[s].color }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-5 gap-2">
                {S_LEVELS.map(level => {
                  const info = checklist[level]
                  const done = getCompletedLevels()
                  const levelIdx = S_LEVELS.indexOf(level)
                  const prevDone = levelIdx === 0 || done.includes(S_LEVELS[levelIdx - 1])
                  return (
                    <button key={level} type="button" onClick={() => handleLevelSelect(level)}
                      className="p-2 rounded-xl text-center transition-all relative"
                      style={auditLevel === level
                        ? { background: info.color, color: 'white' }
                        : !prevDone
                          ? { background: '#f1f5f9', color: '#d1d5db', border: '2px dashed #e2e8f0' }
                          : { background: info.bg, color: info.color }}>
                      <p className="text-sm font-black">{level}</p>
                      <p className="text-xs">{info.totalMarks}M</p>
                      {!prevDone && <span className="text-xs">🔒</span>}
                      {done.includes(level) && <span className="text-xs absolute top-0.5 right-0.5">✅</span>}
                    </button>
                  )
                })}
              </div>

              {auditLevel && (
                <div className="mt-3 rounded-xl p-3" style={{ background: '#f8fafc' }}>
                  <p className="text-xs font-bold text-gray-600">Includes: {getActiveLevels().join(' + ')}</p>
                  <p className="text-xs text-gray-500">Total marks: {getTotalMarks()}</p>
                </div>
              )}
            </div>
          )}

          {canAudit ? (
            <button type="button" onClick={() => {
              if (!teamName) { setAlertMsg('Please select a team!'); return }
              if (!area) { setAlertMsg('Please select a department!'); return }
              if (area === 'Others' && !otherArea) { setAlertMsg('Please specify department name!'); return }
              if (!auditLevel) { setAlertMsg('Please select audit level!'); return }
              if (!finalAuditorName) { setAlertMsg('Please select auditor!'); return }
              setAlertMsg('')
              setStep(2)
            }} className="w-full text-white py-4 rounded-2xl font-black text-base shadow-lg"
              style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>
              Start Audit →
            </button>
          ) : (
            <div className="w-full py-4 rounded-2xl text-center text-sm font-bold"
              style={{ background: '#f1f5f9', color: '#94a3b8' }}>
              👁️ View only -- no permission to audit
            </div>
          )}
        </div>

        {/* S Level Check Popup */}
        {showSLevelCheck && (
          <div className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)' }}>
            <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full mx-4">
              <p className="text-lg font-black text-gray-800 mb-4">🔒 Previous Level Pending</p>
              <p className="text-xs text-gray-500 mb-4">
                Complete previous S levels before proceeding to this level.
              </p>
              <div className="space-y-2 mb-4">
                {S_LEVELS.map(s => {
                  const done = completedLevels.includes(s)
                  return (
                    <div key={s} className="flex items-center gap-3 rounded-xl p-2"
                      style={{ background: done ? '#dcfce7' : '#fee2e2' }}>
                      <span>{done ? '✅' : '❌'}</span>
                      <span className="text-xs font-bold" style={{ color: done ? '#16a34a' : '#dc2626' }}>
                        {s} -- {checklist[s]?.label}
                      </span>
                      <span className="ml-auto text-xs font-bold" style={{ color: done ? '#16a34a' : '#dc2626' }}>
                        {done ? 'Done' : 'Pending'}
                      </span>
                    </div>
                  )
                })}
              </div>
              <button onClick={() => setShowSLevelCheck(false)}
                className="w-full text-white py-3 rounded-xl font-bold text-sm"
                style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>
                OK, Got it
              </button>
            </div>
          </div>
        )}

        {/* Previous Scores Popup */}
        {showPrevScores && prevAudits.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)' }}>
            <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full mx-4">
              <p className="text-lg font-black text-gray-800 mb-1">📊 Previous {auditLevel} Scores</p>
              <p className="text-xs text-gray-500 mb-4">{area} · Team {teamName}</p>
              <div className="space-y-3 mb-4">
                {prevAudits.map((a, i) => (
                  <div key={a.id} className="rounded-xl p-3"
                    style={{ background: i === 0 ? '#eff6ff' : '#f8fafc' }}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-gray-700">{a.date}</p>
                        <p className="text-xs text-gray-400">By: {a.auditorName}</p>
                      </div>
                      <span className="text-xl font-black"
                        style={{ color: a.scorePercent >= 80 ? '#16a34a' : a.scorePercent >= 60 ? '#d97706' : '#dc2626' }}>
                        {a.scorePercent}%
                      </span>
                    </div>
                    {i === 0 && <p className="text-xs text-blue-500 font-bold mt-1">Latest</p>}
                  </div>
                ))}
              </div>
              <button onClick={() => setShowPrevScores(false)}
                className="w-full text-white py-3 rounded-xl font-bold text-sm"
                style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>
                Continue to Audit
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
      <Navbar />
      <div className="p-4 max-w-2xl mx-auto">

        <div className="bg-white rounded-2xl shadow-sm p-3 mb-4 flex items-center justify-between sticky top-16 z-10">
          <div>
            <p className="font-black text-gray-800 text-sm">{area === 'Others' ? otherArea : area}</p>
            <p className="text-xs text-gray-400">{auditLevel} · Team {teamName} · {finalAuditorName}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-center">
              <p className="font-black text-lg"
                style={{ color: getColor(getScorePercent()) }}>
                {getScorePercent()}%
              </p>
              <p className="text-xs text-gray-400">{getScoredMarks()}/{getTotalMarks()}</p>
            </div>
            <button type="button" onClick={() => setStep(1)}
              className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-semibold">← Back</button>
          </div>
        </div>

        <PopupAlert message={alertMsg} onClose={() => setAlertMsg('')} />

        {/* Confirm Submit Popup */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.6)' }}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">📋</span>
                <p className="text-base font-black text-gray-800">Submit Audit?</p>
              </div>
              <p className="text-sm text-gray-500 mb-1">Score: <span className="font-black" style={{ color: getColor(getScorePercent()) }}>{getScorePercent()}%</span></p>
              <p className="text-xs text-gray-400 mb-5">{getScoredMarks()} / {getTotalMarks()} marks · {auditLevel} · {area === 'Others' ? otherArea : area}</p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-sm">
                  Cancel
                </button>
                <button onClick={doSubmit}
                  className="flex-1 text-white py-3 rounded-xl font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>
                  Yes, Submit ✅
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {getActiveLevels().map(sLevel => {
            const info = checklist[sLevel]
            return (
              <div key={sLevel} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-2" style={{ background: info.color }}>
                  <span className="text-white font-black">{sLevel}</span>
                  <span className="text-white font-semibold text-sm">{info.label}</span>
                  <span className="ml-auto text-white text-xs opacity-80">{info.totalMarks} marks</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {info.items.map((item, idx) => {
                    const key = `${sLevel}_${idx}`
                    const val = Number(scores[key] || 0)
                    const pct = item.marks > 0 ? Math.round((val / item.marks) * 100) : 0
                    const isLow = val < item.marks * 0.6 && val > 0
                    return (
                      <div key={idx} className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <p className="text-sm text-gray-800 font-semibold leading-snug">
                              <span className="text-gray-400 text-xs font-black mr-1">{idx + 1}.</span>
                              {lang === 'ta' && item.tamil ? item.tamil : item.english}
                            </p>
                          </div>
                          <span className="text-xs font-black px-2 py-0.5 rounded-lg flex-shrink-0"
                            style={{
                              background: pct >= 80 ? '#dcfce7' : pct >= 60 ? '#fef9c3' : val === 0 ? '#f1f5f9' : '#fee2e2',
                              color: pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : val === 0 ? '#94a3b8' : '#dc2626'
                            }}>
                            {val}/{item.marks}
                          </span>
                        </div>

                        {canPutMarks ? (
                          <div className="mt-2">
                            <div className="flex items-center gap-3 mb-1">
                              <input
                                type="range" min={0} max={item.marks} step={1}
                                value={val}
                                onChange={e => setScores(p => ({ ...p, [key]: Number(e.target.value) }))}
                                className="flex-1 cursor-pointer"
                                style={{
                                  height: '8px',
                                  borderRadius: '4px',
                                  outline: 'none',
                                  WebkitAppearance: 'none',
                                  appearance: 'none',
                                  accentColor: pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626',
                                  background: `linear-gradient(to right, ${pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626'} ${pct}%, #e2e8f0 ${pct}%)`
                                }}
                              />
                              <input
                                type="number" min={0} max={item.marks}
                                value={val}
                                onChange={e => setScores(p => ({ ...p, [key]: Math.min(item.marks, Math.max(0, Number(e.target.value))) }))}
                                className="w-12 border-2 border-gray-100 rounded-lg px-1 py-1.5 text-xs text-center font-black focus:outline-none bg-gray-50"
                              />
                            </div>
                            <div className="flex justify-between text-xs text-gray-300 px-0.5">
                              <span>0</span>
                              <span>{Math.round(item.marks / 2)}</span>
                              <span>{item.marks}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 rounded-xl p-2 text-center" style={{ background: '#f8fafc' }}>
                            <p className="text-xs text-gray-400">Score entered by Audit Incharge only</p>
                          </div>
                        )}

                        {isLow && canPutMarks && (
                          <div className="mt-2">
                            <input
                              type="text"
                              maxLength={200}
                              placeholder="Reason for low score (required, max 200 chars)..."
                              value={remarks[key] || ''}
                              onChange={e => setRemarks(p => ({ ...p, [key]: e.target.value }))}
                              className="w-full border-2 border-orange-100 rounded-xl px-3 py-2 text-xs focus:outline-none bg-orange-50"
                            />
                            <p className="text-xs text-gray-400 text-right mt-0.5">
                              {(remarks[key] || '').length}/200
                            </p>
                          </div>
                        )}

                        {canAudit && (
                          <div className="mt-3">
                            <p className="text-xs font-bold text-gray-500 mb-1">📸 Current State</p>
                            {beforePhotos[key] ? (
                              <div className="relative">
                                {beforePhotos[key].startsWith('data:video') ? (
                                  <video src={beforePhotos[key]} controls className="w-full h-24 rounded-xl" />
                                ) : (
                                  <img
                                    src={beforePhotos[key]}
                                    alt="current"
                                    className="w-full h-24 object-cover rounded-xl cursor-pointer"
                                    onClick={() => setPreviewImg(beforePhotos[key])}
                                  />
                                )}
                                <button onClick={() => setBeforePhotos(p => { const n = { ...p }; delete n[key]; return n })}
                                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">×</button>
                                <button
                                  onClick={() => setPreviewImg(beforePhotos[key])}
                                  className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">🔍</button>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                <button type="button"
                                  onClick={() => setActiveCamera(key)}
                                  className="h-16 border-2 border-dashed border-blue-200 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer"
                                  style={{ background: '#eff6ff' }}>
                                  <span className="text-base">📷</span>
                                  <span className="text-xs text-blue-600 font-black">Camera</span>
                                </button>
                                <label className="h-16 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-blue-400"
                                  style={{ background: '#f8fafc' }}>
                                  <span className="text-base">🖼️</span>
                                  <span className="text-xs text-gray-400">Gallery</span>
                                  <input type="file" accept="image/*,video/*" className="hidden"
                                    onChange={e => handlePhoto(sLevel, idx, e)} />
                                </label>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        {/* Image Preview Modal */}
        {previewImg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.9)' }}
            onClick={() => setPreviewImg(null)}>
            <div className="relative max-w-full max-h-full p-4">
              <img src={previewImg} alt="preview"
                className="max-w-full max-h-screen rounded-xl object-contain"
                style={{ maxHeight: '80vh' }} />
              <button
                onClick={() => setPreviewImg(null)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white text-gray-800 font-black flex items-center justify-center shadow-lg">×</button>
              <p className="text-white text-xs text-center mt-2">Tap anywhere to close</p>
            </div>
          </div>
        )}

        {canAudit && (
          <button type="button" onClick={() => setPreviewMode(true)}
            className="w-full text-white py-4 rounded-2xl font-black text-base shadow-lg mt-4 mb-8"
            style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>
            Submit Audit ✅
          </button>
        )}
      </div>

      {/* ── Real-time Camera Modal ── */}
      {activeCamera && <CameraModal
        onCapture={dataUrl => { setBeforePhotos(p => ({ ...p, [activeCamera]: dataUrl })); setActiveCamera(null) }}
        onClose={() => setActiveCamera(null)}
      />}
    </div>
  )
}

export default NewAudit
