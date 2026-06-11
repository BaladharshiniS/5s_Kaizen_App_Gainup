import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import {
  getOrganogram, getAudits, getExternalAudits, saveExternalAudit,
  saveSchedule, getSchedules, listenSchedules, TEAMS,
  saveKrishnanSchedule, getKrishnanSchedule, listenKrishnanSchedule,
  updateScheduleEntry, saveReschedule, listenReschedules
} from '../firebase'

const TEAM_COLORS = [
  '#dc2626','#d97706','#16a34a','#7c3aed',
  '#0369a1','#be185d','#065f46','#92400e','#1e40af'
]

// Mon–Fri only
const getWeekdays = (year, month) => {
  const days = []
  const daysInMonth = new Date(year, month, 0).getDate()
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month - 1, d).getDay()
    if (dow !== 0 && dow !== 6) days.push(d)
  }
  return days
}

// Exclude AuditIncharge/Management team from inter-team pool
const getAuditableTeams = (teams) =>
  teams
    .map(t => typeof t === 'string' ? t : t?.name)
    .filter(Boolean)
    .filter(n => {
      const l = n.toLowerCase()
      return l !== 'management' && l !== 'audit' && l !== 'krishnan'
    })

const toDateStr = (year, month, day) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

const assignDates = (items, weekdays, year, month, usedDates) => {
  const n = items.length
  const step = Math.max(1, Math.floor(weekdays.length / n))
  const result = []

  items.forEach((item, idx) => {
    const start = Math.min(idx * step, weekdays.length - 1)
    let placed = false

    for (let a = 0; a < weekdays.length; a++) {
      const wi = (start + a) % weekdays.length
      const dateStr = toDateStr(year, month, weekdays[wi])
      const busy = usedDates.get(dateStr) || new Set()
      if (!item.teams.some(t => busy.has(t))) {
        if (!usedDates.has(dateStr)) usedDates.set(dateStr, new Set())
        item.teams.forEach(t => usedDates.get(dateStr).add(t))
        result.push({ ...item, date: dateStr, wi })
        placed = true
        break
      }
    }

    if (!placed) {
      const dateStr = toDateStr(year, month, weekdays[start])
      result.push({ ...item, date: dateStr, wi: start })
    }
  })

  return result
}

const generateMonthSchedule = (teams, year, month) => {
  const teamNames = getAuditableTeams(teams)
  if (teamNames.length < 2) return []

  const weekdays = getWeekdays(year, month)
  const monthStr = `${year}-${String(month).padStart(2, '0')}`

  const s1 = [...teamNames].sort(() => Math.random() - 0.5)
  const round1 = s1.map((auditing, i) => ({
    auditing,
    beingAudited: s1[(i + 1) % s1.length],
  })).filter(p => p.auditing !== p.beingAudited)

  let round2 = []
  for (let t = 0; t < 30 && round2.length !== teamNames.length; t++) {
    const s2 = [...teamNames].sort(() => Math.random() - 0.5)
    const cand = s2.map((auditing, i) => ({
      auditing,
      beingAudited: s2[(i + 2) % s2.length],
    })).filter(p =>
      p.auditing !== p.beingAudited &&
      !round1.some(r => r.auditing === p.auditing && r.beingAudited === p.beingAudited)
    )
    if (cand.length === teamNames.length) round2 = cand
  }
  if (!round2.length) round2 = round1.map(p => ({ auditing: p.beingAudited, beingAudited: p.auditing }))

  const allPairs = [...round1, ...round2]
  const usedDates = new Map()
  const items = allPairs.map(p => ({ ...p, teams: [p.auditing, p.beingAudited] }))
  const assigned = assignDates(items, weekdays, year, month, usedDates)

  return assigned.map(a => ({
    date: a.date,
    type: 'scheduled',
    auditing: a.auditing,
    beingAudited: a.beingAudited,
    status: 'pending',
    week: Math.ceil((a.wi + 1) / 5),
    monthKey: monthStr,
  }))
}

const generateKrishnanSchedule = (teams, year, month, interTeam = []) => {
  const teamNames = getAuditableTeams(teams)
  if (!teamNames.length) return []

  const weekdays = getWeekdays(year, month)
  const monthStr = `${year}-${String(month).padStart(2, '0')}`

  const usedDates = new Map()
  interTeam.forEach(s => {
    if (!usedDates.has(s.date)) usedDates.set(s.date, new Set())
    usedDates.get(s.date).add(s.auditing)
    usedDates.get(s.date).add(s.beingAudited)
  })

  const round1 = [...teamNames].sort(() => Math.random() - 0.5)
  const round2 = [...teamNames].sort(() => Math.random() - 0.5)
  const visits = [...round1, ...round2]

  const result = []
  const krishnanBusyDates = new Set()
  let dayPointer = 0

  for (const team of visits) {
    let placed = false

    for (let i = dayPointer; i < weekdays.length; i++) {
      const dateStr = toDateStr(year, month, weekdays[i])

      if (krishnanBusyDates.has(dateStr)) continue

      const busy = usedDates.get(dateStr) || new Set()
      if (busy.has(team)) continue

      krishnanBusyDates.add(dateStr)
      if (!usedDates.has(dateStr)) usedDates.set(dateStr, new Set())
      usedDates.get(dateStr).add(team)

      result.push({
        date: dateStr,
        team,
        type: 'krishnan',
        status: 'pending',
        monthKey: monthStr,
      })

      dayPointer = i + 1
      placed = true
      break
    }

    if (!placed) {
      for (let i = 0; i < weekdays.length; i++) {
        const dateStr = toDateStr(year, month, weekdays[i])
        if (krishnanBusyDates.has(dateStr)) continue
        const busy = usedDates.get(dateStr) || new Set()
        if (busy.has(team)) continue

        krishnanBusyDates.add(dateStr)
        result.push({
          date: dateStr,
          team,
          type: 'krishnan',
          status: 'pending',
          monthKey: monthStr,
        })
        placed = true
        break
      }
    }
  }

  return result
}

const getNextMonth = (year, month) =>
  month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }

// ── RescheduleModal — extracted component so useState works correctly ──
const RescheduleModal = ({ rescheduleTarget, rescheduleReason, setRescheduleReason, rescheduleError, setRescheduleError, rescheduleDate, setRescheduleDate, handleReschedule, onClose, getValidRescheduleDates }) => {
  const origDate = new Date(rescheduleTarget.date)
  const [rCalYear, setRCalYear] = useState(origDate.getFullYear())
  const [rCalMonth, setRCalMonth] = useState(origDate.getMonth() + 1)

  const validDates = new Set(getValidRescheduleDates(rescheduleTarget.date, rescheduleTarget.targetTeams || []))

  const firstDay = new Date(rCalYear, rCalMonth - 1, 1).getDay()
  const daysInMonth = new Date(rCalYear, rCalMonth, 0).getDate()
  const calDays = []
  for (let i = 0; i < firstDay; i++) calDays.push(null)
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d)

  const toStr = (d) => `${rCalYear}-${String(rCalMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  const isWeekend = (d) => { const dow = new Date(rCalYear, rCalMonth - 1, d).getDay(); return dow === 0 || dow === 6 }
  const todayStr = new Date().toISOString().split('T')[0]
  const monthNames2 = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="bg-white rounded-3xl shadow-2xl p-5 w-full max-w-sm max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-3">
          <p className="font-black text-gray-800">🔄 Reschedule Audit</p>
          <button onClick={onClose}
            className="w-7 h-7 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-500">×</button>
        </div>

        <div className="rounded-xl p-3 mb-4" style={{ background: '#fef9c3', border: '1px solid #fde68a' }}>
          <p className="text-xs font-black text-gray-700">
            🏭 {rescheduleTarget.auditing} → {rescheduleTarget.beingAudited || rescheduleTarget.team}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Original date: {rescheduleTarget.date}</p>
          <p className="text-xs font-bold mt-0.5" style={{ color: '#92400e' }}>
            Attempt: {(rescheduleTarget.rescheduleCount || 0) + 1}/2
          </p>
        </div>

        <label className="text-xs font-black text-gray-500 uppercase mb-1 block">Reason * (mandatory)</label>
        <textarea value={rescheduleReason}
          onChange={e => { setRescheduleReason(e.target.value); setRescheduleError('') }}
          placeholder="Why is this audit being rescheduled?"
          rows={2}
          className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none bg-gray-50" />

        <label className="text-xs font-black text-gray-500 uppercase mb-2 block">Select New Date</label>

        {/* Month nav */}
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => {
            if (rCalMonth === 1) { setRCalMonth(12); setRCalYear(y => y - 1) }
            else setRCalMonth(m => m - 1)
            setRescheduleDate('')
          }}
            className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-gray-500"
            style={{ background: '#f1f5f9' }}>‹</button>
          <p className="text-xs font-black text-gray-700">{monthNames2[rCalMonth - 1]} {rCalYear}</p>
          <button onClick={() => {
            if (rCalMonth === 12) { setRCalMonth(1); setRCalYear(y => y + 1) }
            else setRCalMonth(m => m + 1)
            setRescheduleDate('')
          }}
            className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-gray-500"
            style={{ background: '#f1f5f9' }}>›</button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <div key={i} className="text-center text-xs font-black text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar days — grey for unavailable, white for available, blue for selected */}
        <div className="grid grid-cols-7 gap-0.5 mb-4">
          {calDays.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} />
            const ds = toStr(day)
            const weekend = isWeekend(day)
            const past = ds <= todayStr
            const available = validDates.has(ds)
            const selected = rescheduleDate === ds

            let bg, color, cursor, opacity
            if (weekend || past || !available) {
              bg = '#f1f5f9'; color = '#cbd5e1'; cursor = 'default'; opacity = 0.5
            } else if (selected) {
              bg = '#1e40af'; color = 'white'; cursor = 'pointer'; opacity = 1
            } else {
              bg = '#f8fafc'; color = '#1e293b'; cursor = 'pointer'; opacity = 1
            }

            return (
              <div key={day}
                onClick={() => available && !past && !weekend && setRescheduleDate(ds)}
                className="flex items-center justify-center rounded-lg text-xs font-black"
                style={{ height: '32px', background: bg, color, cursor, opacity }}>
                {day}
              </div>
            )
          })}
        </div>

        {rescheduleDate && (
          <div className="rounded-xl p-2 mb-3 text-center"
            style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <p className="text-xs font-black text-blue-700">
              Selected: {new Date(rescheduleDate).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        )}

        {rescheduleError && (
          <p className="text-xs text-red-600 font-bold mb-3">⚠️ {rescheduleError}</p>
        )}

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-bold bg-gray-100 text-gray-700">Cancel</button>
          <button onClick={handleReschedule}
            disabled={!rescheduleDate || !rescheduleReason.trim()}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
            style={{ background: !rescheduleDate || !rescheduleReason.trim() ? '#94a3b8' : 'linear-gradient(135deg, #f97316, #ea580c)' }}>
            Confirm 🔄
          </button>
        </div>

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
const AuditCalendar = () => {
  const { user } = useAuth()

  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1)
  const [teams, setTeams] = useState([])
  const [schedules, setSchedules] = useState([])
  const [schedulesLoaded, setSchedulesLoaded] = useState(false)
  const [audits, setAudits] = useState([])
  const [externalAudits, setExternalAudits] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [showExternalModal, setShowExternalModal] = useState(false)
  const [extForm, setExtForm] = useState({ date: '', title: '', auditorName: '' })
  const autoGenDone = useRef(new Set())
  const [krishnanSchedule, setKrishnanSchedule] = useState([])
  const [reschedules, setReschedules] = useState([])
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [rescheduleTarget, setRescheduleTarget] = useState(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleReason, setRescheduleReason] = useState('')
  const [rescheduleError, setRescheduleError] = useState('')
  const detailRef = useRef(null)

  const [currentMonthOpen, setCurrentMonthOpen] = useState(false)
  const [nextMonthOpen, setNextMonthOpen] = useState(false)
  const [remindersOpen, setRemindersOpen] = useState(false)
  const [viewTab, setViewTab] = useState('all')

  useEffect(() => { setViewTab('all') }, [user?.role])

  useEffect(() => {
    const unsub = listenReschedules(setReschedules)
    return () => unsub()
  }, [])

  useEffect(() => {
    const unsub = listenKrishnanSchedule(setKrishnanSchedule)
    return () => unsub()
  }, [])

  useEffect(() => {
    getOrganogram().then(data => {
      if (!data) { setTeams(TEAMS.map(name => ({ name }))); return }
      if (data.teams) {
        const arr = Array.isArray(data.teams) ? data.teams : Object.values(data.teams)
        setTeams(arr.filter(t => t && t.name))
      } else {
        const arr = Array.isArray(data) ? data : Object.values(data)
        setTeams(arr.filter(t => t && t.name))
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const unsub = listenSchedules(data => {
      setSchedules(data)
      setSchedulesLoaded(true)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    getAudits().then(setAudits)
    getExternalAudits().then(setExternalAudits)
  }, [])

  useEffect(() => {
    if (!teams.length || !schedulesLoaded) return

    const tryGenerate = async (year, month) => {
      const key = `${year}-${String(month).padStart(2, '0')}`
      if (autoGenDone.current.has(key)) return
      autoGenDone.current.add(key)

      const alreadyHasInterTeam = schedules.some(s => s.date?.startsWith(key))
      const alreadyHasKrishnan = krishnanSchedule.some(k => k.date?.startsWith(key))

      if (alreadyHasInterTeam && alreadyHasKrishnan) return

      let interTeam = schedules.filter(s => s.date?.startsWith(key))

      if (!alreadyHasInterTeam) {
        interTeam = generateMonthSchedule(teams, year, month)
        if (!interTeam.length) return
        for (const s of interTeam) await saveSchedule({ ...s, monthKey: key })
      }

      if (!alreadyHasKrishnan) {
        const krishnan = generateKrishnanSchedule(teams, year, month, interTeam)
        console.log('Krishnan schedule generated:', krishnan)
        console.log('Teams used:', teams)
        for (const k of krishnan) await saveKrishnanSchedule(k)
      }
    }

    tryGenerate(currentYear, currentMonth)
    const nxt = getNextMonth(currentYear, currentMonth)
    tryGenerate(nxt.year, nxt.month)
  }, [teams, schedulesLoaded, currentYear, currentMonth])

  const auditInchargeName = user?.role === 'AuditIncharge' ? user?.name : 'Audit Incharge'

  const getValidRescheduleDates = (originalDate, targetTeams = []) => {
    const orig = new Date(originalDate)
    const day = orig.getDay()
    const monday = new Date(orig)
    monday.setDate(orig.getDate() - (day === 0 ? 6 : day - 1))
    const nextFriday = new Date(monday)
    nextFriday.setDate(monday.getDate() + 11)
    const validDates = []
    const cur = new Date(monday)
    const todayStr = new Date().toISOString().split('T')[0]
    while (cur <= nextFriday) {
      const d = cur.getDay()
      if (d !== 0 && d !== 6) {
        const ds = cur.toISOString().split('T')[0]
        if (ds > todayStr) {
          const teamsBusyOnDate = new Set()
          schedules.filter(s => s.date === ds).forEach(s => {
            teamsBusyOnDate.add(s.auditing)
            teamsBusyOnDate.add(s.beingAudited)
          })
          krishnanSchedule.filter(k => k.date === ds).forEach(k => {
            teamsBusyOnDate.add(k.team)
          })
          const hasCollision = targetTeams.some(t => teamsBusyOnDate.has(t))
          if (!hasCollision) validDates.push(ds)
        }
      }
      cur.setDate(cur.getDate() + 1)
    }
    return validDates
  }

  const handleReschedule = async () => {
    if (!rescheduleDate) { setRescheduleError('Please select a date!'); return }
    if (!rescheduleReason.trim()) { setRescheduleError('Reason is mandatory!'); return }
    if (!rescheduleTarget) return
    const attemptCount = (rescheduleTarget.rescheduleCount || 0) + 1
    if (attemptCount > 2) { setRescheduleError('Maximum 2 reschedules allowed!'); return }

    await saveReschedule({
      originalScheduleId: rescheduleTarget.id,
      originalDate: rescheduleTarget.date,
      newDate: rescheduleDate,
      auditing: rescheduleTarget.auditing,
      beingAudited: rescheduleTarget.beingAudited,
      team: rescheduleTarget.team,
      rescheduleType: rescheduleTarget.eventType === 'krishnan' ? 'krishnan' : 'interteam',
      reason: rescheduleReason,
      attemptNumber: attemptCount,
      status: 'pending',
      rescheduledBy: user?.name,
      timestamp: new Date().toISOString(),
      monthKey: rescheduleTarget.monthKey,
    })
    if (rescheduleTarget.id) {
      await updateScheduleEntry(rescheduleTarget.id, {
        status: 'rescheduled',
        rescheduledTo: rescheduleDate,
        rescheduleCount: attemptCount,
        rescheduleReason: rescheduleReason,
      })
    }
    setShowRescheduleModal(false)
    setRescheduleTarget(null)
    setRescheduleDate('')
    setRescheduleReason('')
    setRescheduleError('')
  }

  // ── All events for a date (unfiltered) ──
  const getEventsForDate = (dateStr) => {
    const todayStr = new Date().toISOString().split('T')[0]
    const events = []
    reschedules.filter(r => r.newDate === dateStr).forEach(r =>
      events.push({ ...r, eventType: 'rescheduled' })
    )
    schedules.filter(s => s.date === dateStr).forEach(s => {
      const done = audits.some(a => a.teamName === s.beingAudited && a.auditDate === s.date)
      const missed = !done && s.date < todayStr
      events.push({ ...s, eventType: 'schedule', status: done ? 'completed' : missed ? 'missed' : 'pending' })
    })
    krishnanSchedule.filter(k => k.date === dateStr).forEach(k => {
      const done = audits.some(a => a.teamName === k.team && a.auditDate === k.date && a.auditorName === 'Mr. Krishnan')
      const krishnanMissed = !done && k.date < todayStr
      events.push({ ...k, eventType: 'krishnan', status: done ? 'completed' : krishnanMissed ? 'missed' : 'pending' })
    })
    audits.filter(a => a.auditDate === dateStr).forEach(a => events.push({ ...a, eventType: 'submitted' }))
    audits.filter(a => a.reauditDate === dateStr).forEach(a => events.push({ ...a, eventType: 'reaudit' }))
    externalAudits.filter(e => e.date === dateStr).forEach(e => events.push({ ...e, eventType: 'external' }))
    return events
  }

  const getFilteredEventsForDate = (dateStr) => {
    const all = getEventsForDate(dateStr)

    let tabFiltered
    if (viewTab === 'my') {
      tabFiltered = all.filter(e => e.eventType === 'krishnan')
    } else if (viewTab === 'team') {
      tabFiltered = all.filter(e => ['schedule','rescheduled','reaudit','submitted'].includes(e.eventType))
    } else if (viewTab === 'external') {
      tabFiltered = all.filter(e => e.eventType === 'external')
    } else {
      tabFiltered = all
    }

    if (user?.role === 'TeamLead') {
      return tabFiltered.filter(e => {
        if (e.eventType === 'krishnan') return true
        if (e.eventType === 'schedule') return e.auditing === user?.team || e.beingAudited === user?.team
        if (e.eventType === 'rescheduled') return e.auditing === user?.team || e.beingAudited === user?.team || e.team === user?.team
        return true
      })
    }

    return tabFiltered
  }

  const getCalendarEvents = (dateStr) => getFilteredEventsForDate(dateStr)

  const buildCalendar = () => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay()
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
    const days = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(d)
    return days
  }

  const days = buildCalendar()
  const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  // Deduplicate reminders — fix "Today" duplicate: use seen set with date key too
  const getReminders = () => {
    const seen = new Set()
    const reminders = []
    for (let i = 0; i <= 3; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const ds = d.toISOString().split('T')[0]
      getEventsForDate(ds).forEach(e => {
        if (user?.role === 'TeamLead') {
          if (e.eventType === 'schedule' && e.auditing !== user?.team && e.beingAudited !== user?.team) return
          if (e.eventType === 'krishnan' && e.team !== user?.team) return
          if (e.eventType === 'rescheduled' && e.auditing !== user?.team && e.beingAudited !== user?.team && e.team !== user?.team) return
        }
        const key = `${e.eventType}|${ds}|${e.id || ''}|${e.auditing || ''}|${e.beingAudited || ''}|${e.team || ''}|${e.teamName || ''}|${e.title || ''}`
        if (seen.has(key)) return
        seen.add(key)
        reminders.push({ ...e, dateStr: ds, daysAway: i })
      })
    }
    return reminders
  }

  const reminders = getReminders()
  const urgentReminders = reminders.filter(r => r.daysAway <= 1)

  const prevMonth = () => {
    if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
    setSelectedDate(null)
  }

  const nextMonth = () => {
    if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
    setSelectedDate(null)
  }

  const getTeamColor = (teamName) => {
    const idx = teams.findIndex(t => (typeof t === 'string' ? t : t?.name) === teamName)
    return TEAM_COLORS[idx % TEAM_COLORS.length] || '#64748b'
  }

  // ── eventSymbol: symbols only in 'all' tab; dots in other tabs ──
  const eventSymbol = (type, status, scorePercent, tab = viewTab) => {
    const useSymbol = tab === 'all'
    if (type === 'external')    return useSymbol ? { symbol: '⭐', color: '#f97316', isDot: false } : { symbol: null, color: '#f97316', isDot: true }
    if (type === 'krishnan')    return useSymbol ? { symbol: '🔍', color: '#8b5cf6', isDot: false } : { symbol: null, color: '#8b5cf6', isDot: true }
    if (type === 'rescheduled') return useSymbol ? { symbol: '🔄', color: '#f59e0b', isDot: false } : { symbol: null, color: '#f59e0b', isDot: true }
    if (type === 'reaudit')     return useSymbol ? { symbol: '🔁', color: '#0891b2', isDot: false } : { symbol: null, color: '#0891b2', isDot: true }
    if (type === 'submitted') {
      const passed = scorePercent !== undefined ? scorePercent >= 60 : (status !== 'failed')
      return { symbol: null, color: passed ? '#16a34a' : '#dc2626', isDot: true }
    }
    if (status === 'completed') return { symbol: null, color: '#16a34a', isDot: true }
    if (status === 'missed')    return { symbol: null, color: '#f97316', isDot: true }
    return { symbol: null, color: '#3b82f6', isDot: true }
  }

  const eventDot = (type, status) => eventSymbol(type, status).color

  const nxt = getNextMonth(currentYear, currentMonth)
  const nextMonthKey = `${nxt.year}-${String(nxt.month).padStart(2, '0')}`
  const nextMonthScheduled = schedules.some(s => s.date?.startsWith(nextMonthKey))

  const getFilteredSchedules = (key) => {
    return schedules.filter(s => {
      if (!s.date?.startsWith(key)) return false
      if (viewTab === 'my' || viewTab === 'external') return false
      if (user?.role === 'TeamLead') return s.auditing === user?.team || s.beingAudited === user?.team
      return true
    })
  }

  const currentMonthSchedules = getFilteredSchedules(monthKey)
  const nextMonthSchedules = getFilteredSchedules(nextMonthKey)

  const getKrishnanScheduleForMonth = (key) =>
    krishnanSchedule.filter(k => k.monthKey === key || k.date?.startsWith(key))

  const currentKrishnanSchedules = getKrishnanScheduleForMonth(monthKey)
  const nextKrishnanSchedules = getKrishnanScheduleForMonth(nextMonthKey)

  const tabs = [
    { key: 'all', label: '📋 All' },
    { key: 'my', label: '🔍 KV Visits' },
    { key: 'team', label: '🏭 Team' },
    { key: 'external', label: '🌐 External' },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
      <Navbar />
      <div className="p-4 max-w-2xl mx-auto">

        {/* ── Header ── */}
        <div className="rounded-2xl p-4 mb-4 text-white"
          style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest">Audit Calendar</p>
              <h1 className="text-xl font-black mt-0.5">{monthNames[currentMonth - 1]} {currentYear}</h1>
              <p className="text-xs mt-1" style={{ color: nextMonthScheduled ? '#86efac' : '#fca5a5' }}>
                {!schedulesLoaded ? '⏳ Loading...'
                  : nextMonthScheduled
                    ? `✅ ${monthNames[nxt.month - 1]} schedule ready`
                    : `⏳ Generating ${monthNames[nxt.month - 1]} schedule...`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold"
                style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>‹</button>
              <button onClick={nextMonth}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold"
                style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>›</button>
            </div>
          </div>
          {/* Legend — dots for status types, symbols for special types */}
          <div className="flex gap-3 mt-3 flex-wrap">
            {[
              { dot: true,  color: '#3b82f6',  label: 'Scheduled' },
              { dot: true,  color: '#16a34a',  label: 'Done' },
              { dot: true,  color: '#f97316',  label: 'Missed' },
              { dot: true,  color: '#dc2626',  label: 'Failed' },
              { symbol: '⭐', color: '#fdba74', label: 'External' },
              { symbol: '🔄', color: '#fde68a', label: 'Rescheduled' },
              { symbol: '🔍', color: '#c4b5fd', label: 'KV Visit' },
              { symbol: '🔁', color: '#67e8f9', label: 'Re-audit' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1">
                {l.dot
                  ? <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, display: 'inline-block', flexShrink: 0 }} />
                  : <span style={{ fontSize: '10px' }}>{l.symbol}</span>
                }
                <span className="text-xs" style={{ color: l.color }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── View Filter Tabs ── */}
        {tabs.length > 0 && (
          <div className="flex gap-2 mb-4">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => { setViewTab(tab.key); setSelectedDate(null) }}
                className="flex-1 py-2 rounded-xl text-xs font-black transition-all"
                style={{
                  background: viewTab === tab.key ? 'linear-gradient(135deg, #0f172a, #1e3a5f)' : 'white',
                  color: viewTab === tab.key ? 'white' : '#64748b',
                  border: viewTab === tab.key ? 'none' : '1px solid #e2e8f0',
                  boxShadow: viewTab === tab.key ? '0 2px 8px rgba(15,23,42,0.3)' : 'none',
                }}>
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Reminders — compact collapsible ── */}
        {reminders.length > 0 && (
          <div className="mb-4 rounded-2xl overflow-hidden" style={{ border: '1px solid #fed7aa' }}>
            <button
              onClick={() => setRemindersOpen(o => !o)}
              className="w-full px-3 py-2.5 flex items-center justify-between"
              style={{ background: '#fff7ed' }}>
              <div className="flex items-center gap-2">
                <span>🔔</span>
                <p className="text-xs font-black text-orange-700">
                  {urgentReminders.length > 0
                    ? `${urgentReminders.length} reminder${urgentReminders.length > 1 ? 's' : ''} today/tomorrow`
                    : `${reminders.length} upcoming`}
                </p>
                {/* Fix: deduplicated badges — show unique daysAway labels only once each */}
                {!remindersOpen && (() => {
                  const shownLabels = new Set()
                  return urgentReminders.slice(0, 2).map((r, i) => {
                    const label = r.daysAway === 0 ? 'Today' : 'Tomorrow'
                    if (shownLabels.has(label)) return null
                    shownLabels.add(label)
                    return (
                      <span key={i} className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: r.daysAway === 0 ? '#fee2e2' : '#fef9c3', color: r.daysAway === 0 ? '#dc2626' : '#92400e' }}>
                        {label}
                      </span>
                    )
                  })
                })()}
              </div>
              <span className="text-orange-400 text-xs font-bold">{remindersOpen ? '▲' : '▼'}</span>
            </button>
            {remindersOpen && (
              <div className="divide-y divide-orange-50">
                {reminders.map((r, i) => {
                  const es = eventSymbol(r.eventType, r.status, r.scorePercent)
                  return (
                    <div key={i} className="px-3 py-2 flex items-center gap-2 bg-white">
                      {es.isDot
                        ? <span style={{ width: 8, height: 8, borderRadius: '50%', background: es.color, display: 'inline-block', flexShrink: 0 }} />
                        : <span style={{ fontSize: '12px', flexShrink: 0 }}>{es.symbol}</span>
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">
                          {r.eventType === 'schedule' && `${r.auditing} audits ${r.beingAudited}`}
                          {r.eventType === 'krishnan' && `Internal Audit (${auditInchargeName}) → ${r.team}`}
                          {r.eventType === 'reaudit' && `Re-audit: ${r.teamName}`}
                          {r.eventType === 'external' && `External: ${r.title}`}
                          {r.eventType === 'submitted' && `Audit done: ${r.teamName}`}
                        </p>
                        <p className="text-xs text-gray-400">{r.dateStr}</p>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: r.daysAway === 0 ? '#fee2e2' : r.daysAway === 1 ? '#fef9c3' : '#eff6ff', color: r.daysAway === 0 ? '#dc2626' : r.daysAway === 1 ? '#92400e' : '#1e40af' }}>
                        {r.daysAway === 0 ? 'Today' : r.daysAway === 1 ? 'Tomorrow' : `${r.daysAway}d`}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── External Audit button (Admin/MD/Coordinator only) ── */}
        {['Admin','MD','Coordinator','AuditIncharge'].includes(user?.role) && (
          <div className="mb-4">
            <button onClick={() => setShowExternalModal(true)}
              className="w-full py-2.5 rounded-xl text-sm font-bold"
              style={{ background: '#fff7ed', color: '#f97316', border: '1px solid #fed7aa' }}>
              + Add External Audit
            </button>
          </div>
        )}

        {/* ── Calendar Grid ── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <div className="grid grid-cols-7 border-b border-gray-100">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="py-2 text-center text-xs font-black text-gray-400">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              if (!day) return <div key={`e-${idx}`} className="h-14 border-b border-r border-gray-50" />
              const dateStr = toDateStr(currentYear, currentMonth, day)
              const events = getCalendarEvents(dateStr)
              const isToday = dateStr === today.toISOString().split('T')[0]
              const isSelected = selectedDate === dateStr
              return (
                <div key={day}
                  onClick={() => {
                    const nd = isSelected ? null : dateStr
                    setSelectedDate(nd)
                    if (nd) {
                      setTimeout(() => {
                        if (detailRef.current) {
                          const rect = detailRef.current.getBoundingClientRect()
                          window.scrollTo({ top: window.pageYOffset + rect.top - 70, behavior: 'smooth' })
                        }
                      }, 80)
                    }
                  }}
                  className="h-14 border-b border-r border-gray-50 p-1 cursor-pointer"
                  style={{ background: isSelected ? '#eff6ff' : 'white' }}>
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-black w-6 h-6 rounded-full flex items-center justify-center"
                      style={isToday ? { background: '#1e40af', color: 'white' } : { color: '#374151' }}>
                      {day}
                    </span>
                  </div>
                  {/* Calendar indicators: dots for status events, symbols for special events */}
                  <div className="flex flex-wrap gap-0.5 mt-0.5 items-center">
                    {events.slice(0, 4).map((e, i) => {
                      const score = e.scorePercent
                      const es = eventSymbol(e.eventType, e.status, score)
                      if (es.isDot) {
                        return (
                          <span key={i}
                            style={{
                              width: 7, height: 7,
                              borderRadius: '50%',
                              background: es.color,
                              display: 'inline-block',
                              flexShrink: 0,
                            }}
                            title={e.eventType}
                          />
                        )
                      }
                      return (
                        <span key={i} style={{ fontSize: '9px', lineHeight: 1 }} title={e.eventType}>
                          {es.symbol}
                        </span>
                      )
                    })}
                    {events.length > 4 && <span className="text-gray-400" style={{ fontSize: '8px' }}>+{events.length - 4}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Date Detail Panel ── */}
        {selectedDate && (
          <div ref={detailRef} className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
            <div className="px-4 py-3 flex items-center justify-between" style={{ background: '#0f172a' }}>
              <p className="text-white font-black text-sm">📅 {selectedDate}</p>
              <button onClick={() => setSelectedDate(null)} className="text-blue-300 text-xs font-bold">Close</button>
            </div>
            {(() => {
              const events = getFilteredEventsForDate(selectedDate)
              if (!events.length) return (
                <div className="p-6 text-center">
                  <p className="text-2xl mb-1">📭</p>
                  <p className="text-xs text-gray-400">No events on this day</p>
                </div>
              )

              const krishnanEvents = events.filter(e => e.eventType === 'krishnan')
              const weAuditEvents = user?.role === 'TeamLead'
                ? events.filter(e => (e.eventType === 'schedule' || e.eventType === 'rescheduled') && e.auditing === user?.team)
                : []
              const othersAuditUsEvents = user?.role === 'TeamLead'
                ? events.filter(e => (e.eventType === 'schedule' || e.eventType === 'rescheduled') && e.beingAudited === user?.team)
                : []
              const interTeamEvents = user?.role === 'TeamLead'
                ? []
                : events.filter(e => e.eventType === 'schedule' || e.eventType === 'rescheduled')
              const otherEvents = events.filter(e => !['krishnan','schedule','rescheduled'].includes(e.eventType))

              const renderEventItem = (e, i) => {
                const score = e.scorePercent
                const es = eventSymbol(e.eventType, e.status, score)
                const indicatorEl = es.isDot
                  ? <span style={{ width: 10, height: 10, borderRadius: '50%', background: es.color, display: 'inline-block', flexShrink: 0, marginTop: 3 }} />
                  : <span style={{ fontSize: '14px', marginTop: '2px', flexShrink: 0 }}>{es.symbol}</span>

                return (
                  <div key={i} className="px-4 py-3 flex items-start gap-3">
                    {indicatorEl}
                    <div className="flex-1">
                      {e.eventType === 'schedule' && (
                        <>
                          <p className="text-xs font-black text-gray-800">🏭 {e.auditing} → {e.beingAudited}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                              style={{
                                background: e.status === 'completed' ? '#dcfce7' : e.status === 'missed' ? '#fee2e2' : e.status === 'rescheduled' ? '#fef9c3' : '#eff6ff',
                                color: e.status === 'completed' ? '#16a34a' : e.status === 'missed' ? '#dc2626' : e.status === 'rescheduled' ? '#92400e' : '#1e40af'
                              }}>
                              {e.status === 'completed' ? '✅ Done' : e.status === 'missed' ? '⚠️ Missed' : e.status === 'rescheduled' ? `🔄 Rescheduled (${e.rescheduleCount}/2)` : '📅 Pending'}
                            </span>
                            {e.status === 'rescheduled' && e.rescheduledTo && (
                              <span className="text-xs text-gray-400">→ {e.rescheduledTo}</span>
                            )}
                          </div>
                          {e.rescheduleReason && <p className="text-xs text-orange-600 mt-0.5">📝 {e.rescheduleReason}</p>}
                          {e.status === 'missed' && (e.rescheduleCount || 0) < 2 && user?.role === 'Coordinator' && (
                            <button onClick={() => { setRescheduleTarget({ ...e, targetTeams: [e.auditing, e.beingAudited] }); setShowRescheduleModal(true); setRescheduleError(''); setRescheduleDate(''); setRescheduleReason('') }}
                              className="mt-1 px-2 py-1 rounded-lg text-xs font-bold"
                              style={{ background: '#fef9c3', color: '#92400e' }}>🔄 Reschedule</button>
                          )}
                          {e.status === 'missed' && (e.rescheduleCount || 0) >= 2 && (
                            <p className="text-xs font-bold mt-0.5" style={{ color: '#dc2626' }}>⛔ No more reschedules</p>
                          )}
                        </>
                      )}

                      {e.eventType === 'rescheduled' && (
                        <>
                          <p className="text-xs font-black text-gray-800">
                            🔄 {e.auditing} → {e.beingAudited}
                            <span className="ml-1 font-normal text-orange-500">(Attempt {e.attemptNumber}/2)</span>
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">Originally: {e.originalDate}</p>
                          <p className="text-xs text-orange-600 mt-0.5">📝 {e.reason}</p>
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block"
                            style={{
                              background: e.status === 'completed' ? '#dcfce7' : e.status === 'missed' ? '#fee2e2' : '#fef9c3',
                              color: e.status === 'completed' ? '#16a34a' : e.status === 'missed' ? '#dc2626' : '#92400e'
                            }}>
                            {e.status === 'completed' ? '✅ Done' : e.status === 'missed' ? '❌ Missed Again' : '⏳ Pending'}
                          </span>
                          {e.status === 'missed' && e.attemptNumber < 2 && user?.role === 'Coordinator' && (
                            <button onClick={() => { setRescheduleTarget({ ...e, id: e.originalScheduleId, date: e.newDate, rescheduleCount: e.attemptNumber, targetTeams: [e.auditing, e.beingAudited] }); setShowRescheduleModal(true); setRescheduleError(''); setRescheduleDate(''); setRescheduleReason('') }}
                              className="mt-1 px-2 py-1 rounded-lg text-xs font-bold block"
                              style={{ background: '#fef9c3', color: '#92400e' }}>🔄 Reschedule Again (Final)</button>
                          )}
                          {e.status === 'missed' && e.attemptNumber >= 2 && (
                            <p className="text-xs font-bold mt-0.5" style={{ color: '#dc2626' }}>⛔ Permanently Missed</p>
                          )}
                        </>
                      )}

                      {e.eventType === 'krishnan' && (
                        <>
                          <p className="text-xs font-black text-gray-800">
                            🏭 Visiting → {e.team}
                          </p>
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full mt-0.5 inline-block"
                            style={{
                              background: e.status === 'completed' ? '#dcfce7' : e.status === 'missed' ? '#fee2e2' : '#fef9c3',
                              color: e.status === 'completed' ? '#16a34a' : e.status === 'missed' ? '#dc2626' : '#92400e'
                            }}>
                            {e.status === 'completed' ? '✅ Done' : e.status === 'missed' ? '⚠️ Missed' : '📅 Pending'}
                          </span>
                          {(e.status === 'missed' || e.status === 'pending') && user?.role === 'AuditIncharge' && (
                            <button onClick={() => { setRescheduleTarget({ ...e, auditing: auditInchargeName, beingAudited: e.team, targetTeams: [e.team] }); setShowRescheduleModal(true); setRescheduleError(''); setRescheduleDate(''); setRescheduleReason('') }}
                              className="mt-1 px-2 py-1 rounded-lg text-xs font-bold block"
                              style={{ background: '#f3e8ff', color: '#7c3aed' }}>🔄 Reschedule My Visit</button>
                          )}
                        </>
                      )}

                      {e.eventType === 'submitted' && (
                        <>
                          <p className="text-xs font-black text-gray-800">Audit Done: {e.teamName}</p>
                          <p className="text-xs text-gray-400">{e.auditLevel} · By {e.auditorName}</p>
                          {/* Score using scorePercent field */}
                          {e.scorePercent !== undefined && (
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                                style={{
                                  background: e.scorePercent >= 80 ? '#dcfce7' : e.scorePercent >= 60 ? '#fef9c3' : '#fee2e2',
                                  color: e.scorePercent >= 80 ? '#16a34a' : e.scorePercent >= 60 ? '#92400e' : '#dc2626'
                                }}>
                                Score: {e.scorePercent}%
                              </span>
                            </div>
                          )}
                        </>
                      )}

                      {e.eventType === 'reaudit' && (
                        <>
                          <p className="text-xs font-black text-gray-800">🔁 Re-audit: {e.teamName}</p>
                          <p className="text-xs text-gray-400">{e.auditLevel} · Re-audit needed</p>
                        </>
                      )}

                      {e.eventType === 'external' && (
                        <>
                          <p className="text-xs font-black text-gray-800">🌐 External: {e.title}</p>
                          <p className="text-xs text-gray-400">Auditor: {e.auditorName}</p>
                        </>
                      )}
                    </div>
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                      style={{ background: eventDot(e.eventType, e.status) + '20', color: eventDot(e.eventType, e.status) }}>
                      {e.eventType === 'krishnan' ? 'KV' : e.eventType}
                    </span>
                  </div>
                )
              }

              return (
                <div className="divide-y divide-gray-50">
                  {krishnanEvents.length > 0 && (
                    <>
                      <div className="px-4 py-1.5" style={{ background: '#faf5ff' }}>
                        <p className="text-xs font-black" style={{ color: '#7c3aed' }}>
                          🔍 Mr. Krishnan's Audits
                        </p>
                      </div>
                      {krishnanEvents.map(renderEventItem)}
                    </>
                  )}
                  {user?.role === 'TeamLead' && weAuditEvents.length > 0 && (
                    <>
                      <div className="px-4 py-1.5" style={{ background: '#eff6ff' }}>
                        <p className="text-xs font-black" style={{ color: '#1e40af' }}>🏭 We Audit Others</p>
                      </div>
                      {weAuditEvents.map(renderEventItem)}
                    </>
                  )}
                  {user?.role === 'TeamLead' && othersAuditUsEvents.length > 0 && (
                    <>
                      <div className="px-4 py-1.5" style={{ background: '#f0fdf4' }}>
                        <p className="text-xs font-black" style={{ color: '#16a34a' }}>👥 Others Audit Us</p>
                      </div>
                      {othersAuditUsEvents.map(renderEventItem)}
                    </>
                  )}
                  {interTeamEvents.length > 0 && (
                    <>
                      <div className="px-4 py-1.5" style={{ background: '#eff6ff' }}>
                        <p className="text-xs font-black" style={{ color: '#1e40af' }}>🏭 Team Audits</p>
                      </div>
                      {interTeamEvents.map(renderEventItem)}
                    </>
                  )}
                  {otherEvents.length > 0 && (
                    <>
                      {(krishnanEvents.length > 0 || interTeamEvents.length > 0 || weAuditEvents.length > 0 || othersAuditUsEvents.length > 0) && (
                        <div className="px-4 py-1.5" style={{ background: '#fff7ed' }}>
                          <p className="text-xs font-black" style={{ color: '#f97316' }}>📋 Other Events</p>
                        </div>
                      )}
                      {otherEvents.map(renderEventItem)}
                    </>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {/* ── Monthly Schedule List — collapsible ── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-3">
          <button
            onClick={() => setCurrentMonthOpen(o => !o)}
            className="w-full px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">📋</span>
              <p className="font-black text-gray-800 text-sm">
                {monthNames[currentMonth - 1]} {currentYear} Schedule
              </p>
              {currentMonthSchedules.length > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: '#eff6ff', color: '#1e40af' }}>
                  {currentMonthSchedules.length}
                </span>
              )}
            </div>
            <span className="text-gray-400 text-xs font-bold">{currentMonthOpen ? '▲ Hide' : '▼ View'}</span>
          </button>

          {currentMonthOpen && (() => {
            if (viewTab === 'my') {
              return currentKrishnanSchedules.length === 0 ? (
                <div className="px-4 pb-4 text-center">
                  <p className="text-xs text-gray-400">{schedulesLoaded ? 'No Krishnan visits scheduled' : 'Loading...'}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 border-t border-gray-100">
                  {currentKrishnanSchedules.sort((a, b) => a.date.localeCompare(b.date)).map((k, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs flex-shrink-0"
                        style={{ background: '#8b5cf6' }}>KV</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-gray-800 truncate">→ {k.team}</p>
                        <p className="text-xs text-gray-400">{k.date}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                        style={{ background: '#faf5ff', color: '#7c3aed' }}>Visit</span>
                    </div>
                  ))}
                </div>
              )
            }

            if (user?.role === 'TeamLead') {
              return (
                <div className="border-t border-gray-100">
                  {currentKrishnanSchedules.length > 0 && (
                    <>
                      <div className="px-4 py-1.5" style={{ background: '#faf5ff' }}>
                        <p className="text-xs font-black" style={{ color: '#7c3aed' }}>🔍 Internal Audit Schedule ({auditInchargeName})</p>
                      </div>
                      {currentKrishnanSchedules.sort((a, b) => a.date.localeCompare(b.date)).map((k, i) => (
                        <div key={i} className="px-4 py-2.5 flex items-center gap-3 border-b border-gray-50">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs flex-shrink-0"
                            style={{ background: k.team === user?.team ? '#7c3aed' : '#c4b5fd' }}>KV</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-gray-800 truncate">→ {k.team}{k.team === user?.team ? ' (Us)' : ''}</p>
                            <p className="text-xs text-gray-400">{k.date}</p>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                            style={{ background: k.team === user?.team ? '#faf5ff' : '#f5f3ff', color: '#7c3aed' }}>
                            {k.team === user?.team ? 'Our Visit' : 'Visit'}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                  {currentMonthSchedules.filter(s => s.auditing === user?.team).length > 0 && (
                    <>
                      <div className="px-4 py-1.5" style={{ background: '#eff6ff' }}>
                        <p className="text-xs font-black" style={{ color: '#1e40af' }}>🏭 We Audit Others</p>
                      </div>
                      {currentMonthSchedules.filter(s => s.auditing === user?.team).sort((a, b) => a.date.localeCompare(b.date)).map((s, i) => (
                        <div key={i} className="px-4 py-2.5 flex items-center gap-3 border-b border-gray-50">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs flex-shrink-0"
                            style={{ background: getTeamColor(s.auditing) }}>W{s.week}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-gray-800 truncate">→ {s.beingAudited}</p>
                            <p className="text-xs text-gray-400">{s.date}</p>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                            style={{ background: '#eff6ff', color: '#1e40af' }}>We Audit</span>
                        </div>
                      ))}
                    </>
                  )}
                  {currentMonthSchedules.filter(s => s.beingAudited === user?.team).length > 0 && (
                    <>
                      <div className="px-4 py-1.5" style={{ background: '#f0fdf4' }}>
                        <p className="text-xs font-black" style={{ color: '#16a34a' }}>👥 Others Audit Us</p>
                      </div>
                      {currentMonthSchedules.filter(s => s.beingAudited === user?.team).sort((a, b) => a.date.localeCompare(b.date)).map((s, i) => (
                        <div key={i} className="px-4 py-2.5 flex items-center gap-3 border-b border-gray-50">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs flex-shrink-0"
                            style={{ background: getTeamColor(s.auditing) }}>W{s.week}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-gray-800 truncate">{s.auditing} → Us</p>
                            <p className="text-xs text-gray-400">{s.date}</p>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                            style={{ background: '#f0fdf4', color: '#16a34a' }}>Audit Us</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )
            }

            return currentMonthSchedules.length === 0 ? (
              <div className="px-4 pb-4 text-center">
                <p className="text-xs text-gray-400">{schedulesLoaded ? 'No schedule for this month' : 'Loading...'}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 border-t border-gray-100">
                {currentMonthSchedules.sort((a, b) => a.date.localeCompare(b.date)).map((s, i) => (
                  <div key={i} className="px-4 py-2.5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs flex-shrink-0"
                      style={{ background: getTeamColor(s.auditing) }}>W{s.week}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-gray-800 truncate">{s.auditing} → {s.beingAudited}</p>
                      <p className="text-xs text-gray-400">{s.date}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                      style={{ background: '#eff6ff', color: '#1e40af' }}>Scheduled</span>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>

        {/* ── Next Month — collapsible ── */}
        {nextMonthScheduled && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
            <button
              onClick={() => setNextMonthOpen(o => !o)}
              className="w-full px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">📅</span>
                <p className="font-black text-gray-800 text-sm">
                  {monthNames[nxt.month - 1]} {nxt.year}
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: '#dcfce7', color: '#16a34a' }}>Pre-generated</span>
                {nextMonthSchedules.length > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: '#f0fdf4', color: '#16a34a' }}>{nextMonthSchedules.length}</span>
                )}
              </div>
              <span className="text-gray-400 text-xs font-bold">{nextMonthOpen ? '▲ Hide' : '▼ View'}</span>
            </button>
            {nextMonthOpen && (
              <div className="divide-y divide-gray-50 border-t border-gray-100">
                {nextMonthSchedules.sort((a, b) => a.date.localeCompare(b.date)).map((s, i) => (
                  <div key={i} className="px-4 py-2.5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs flex-shrink-0"
                      style={{ background: getTeamColor(s.auditing) }}>W{s.week}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-gray-800 truncate">{s.auditing} → {s.beingAudited}</p>
                      <p className="text-xs text-gray-400">{s.date}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                      style={{ background: '#f0fdf4', color: '#16a34a' }}>Upcoming</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Reschedule Modal ── */}
      {showRescheduleModal && rescheduleTarget && (
        <RescheduleModal
          rescheduleTarget={rescheduleTarget}
          rescheduleReason={rescheduleReason}
          setRescheduleReason={setRescheduleReason}
          rescheduleError={rescheduleError}
          setRescheduleError={setRescheduleError}
          rescheduleDate={rescheduleDate}
          setRescheduleDate={setRescheduleDate}
          handleReschedule={handleReschedule}
          onClose={() => { setShowRescheduleModal(false); setRescheduleTarget(null); setRescheduleDate(''); setRescheduleReason(''); setRescheduleError('') }}
          getValidRescheduleDates={getValidRescheduleDates}
        />
      )}

      {/* ── External Audit Modal ── */}
      {showExternalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white rounded-3xl shadow-2xl p-5 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="font-black text-gray-800">🌐 Add External Audit</p>
              <button onClick={() => setShowExternalModal(false)}
                className="w-7 h-7 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-500">×</button>
            </div>
            <label className="text-xs font-black text-gray-500 uppercase mb-1 block">Title / Purpose</label>
            <input value={extForm.title} onChange={e => setExtForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. ISO Audit, Client Visit"
              className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none bg-gray-50" />
            <label className="text-xs font-black text-gray-500 uppercase mb-1 block">Auditor Name</label>
            <input value={extForm.auditorName} onChange={e => setExtForm(f => ({ ...f, auditorName: e.target.value }))}
              placeholder="External auditor name"
              className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none bg-gray-50" />
            <label className="text-xs font-black text-gray-500 uppercase mb-1 block">Date</label>
            <input type="date" value={extForm.date} min={today.toISOString().split('T')[0]}
              onChange={e => setExtForm(f => ({ ...f, date: e.target.value }))}
              className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none bg-gray-50" />
            <button onClick={async () => {
              if (!extForm.date || !extForm.title) return
              await saveExternalAudit(extForm)
              setExternalAudits(prev => [...prev, extForm])
              setShowExternalModal(false)
              setExtForm({ date: '', title: '', auditorName: '' })
            }} className="w-full py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
              Save External Audit ✅
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditCalendar
