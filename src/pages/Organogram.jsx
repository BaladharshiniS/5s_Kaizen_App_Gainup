import Navbar from '../components/Navbar'
import { useState, useRef } from 'react'
const TEAMS_DATA = [
  {
    name: 'Royal Lions',
    color: '#dc2626',
    bg: '#fee2e2',
    facilitator: 'Mrs. Pavithra',
    leader: 'Team Leader',
    areas: ['Trim Store', 'Fabric Store'],
    zones: ['Zone-1', 'Zone-2'],
    members: ['1. Roja', '2. Jerry', '3. Kumari', '4. Akila', '5. Ranjith', '6. Mohan'],
  },
  {
    name: 'Dragon Force',
    color: '#d97706',
    bg: '#fef9c3',
    facilitator: 'Mrs. Shanthi',
    leader: 'Mr. Babu',
    areas: ['Cutting', 'Super Market', 'I/CAD'],
    zones: ['Zone-3', 'Zone-4'],
    members: ['1. Deepa', '2. Pugazhwaram', '3. Sarswathi', '4. Selvi', '5. Kavitha', '6. Kavitha'],
  },
  {
    name: 'Golden Tiger',
    color: '#16a34a',
    bg: '#dcfce7',
    facilitator: 'Mr. Kumaresan',
    leader: 'Mr. Joseph',
    areas: ['Line 1 to 11', 'Line 12 to 22'],
    zones: ['Zone-5', 'Zone-6'],
    members: ['1. Deepa', '2. Muthulakshmi', '3. Principal', '4. Savithri', '5. Malathi', '6. Shantha Kumari'],
  },
  {
    name: 'Golden Eagle',
    color: '#7c3aed',
    bg: '#ede9fe',
    facilitator: 'Mr. Lazar',
    leader: 'Mr. Vicky',
    areas: ['Line 23 to 28', 'Line 29 to 33'],
    zones: ['Zone-7', 'Zone-8'],
    members: ['1. Suganya', '2. Suganya', '3. Indra', '4. Nisha', '5. Lalitha', '6. Kalaiswari'],
  },
  {
    name: 'Bison Warriors',
    color: '#0369a1',
    bg: '#dbeafe',
    facilitator: 'Mr. Prabhu',
    leader: 'Mr. Anand',
    areas: ['Line 34 to 38', 'Line 39 to 44'],
    zones: ['Zone-9', 'Zone-10'],
    members: ['1. Deepa', '2. Narmadha', '3. Jayanthi', '4. Muthu Lakshmi', '5. Shiva Lakshmi', '6. Sivaakshmi'],
  },
  {
    name: 'Penguins',
    color: '#be185d',
    bg: '#fdf2f8',
    facilitator: 'Mrs. Chandra',
    leader: 'Mrs. Meena',
    areas: ['Pattern', 'Sampling'],
    zones: ['Zone-11', 'Zone-12'],
    members: ['1. Priya', '2. Sujeedha', '3. Jayalakshmi', '4. Karthika', '5. -', '6. -'],
  },
  {
    name: 'Phoenix Squad',
    color: '#065f46',
    bg: '#ccfbf1',
    facilitator: 'Mrs. Prabhu',
    leader: 'Mrs. Pazhaiyamma',
    areas: ['Electric', 'Maintenance'],
    zones: ['Zone-13', 'Zone-14'],
    members: ['1. Babu', '2. Sudha', '3. Buvena', '4. Tamil', '5. Mukesh', '6. Vinothi'],
  },
  {
    name: 'Storm Blades',
    color: '#92400e',
    bg: '#ffedd5',
    facilitator: 'Mrs. Jayanthi',
    leader: 'Mrs. Raj Kumar',
    areas: ['Security Gate', 'All Canteen', 'Staff Tables'],
    zones: ['Zone-15', 'Zone-16', 'Zone-17'],
    members: ['1. Suresh', '2. Anitha', '3. Priyanka', '4. Manikar', '5. Narmalar', '6. Kathireesan', '7. Swaminathan', '8. Kathireesan'],
  },
  {
    name: 'Spartan Kings',
    color: '#1e40af',
    bg: '#dbeafe',
    facilitator: 'Mr. Baskar',
    leader: 'Mr. Vineet',
    areas: ['Passing-1', 'Passing-2', 'FGS / Non-FG'],
    zones: ['Zone-18', 'Zone-19', 'Zone-20'],
    members: ['1. Muthu', '2. Muthuprandi', '3. Geetha', '4. Saraswathi', '5. Ruban', '6. Muthu', '7. Poorna', '8. Muthunasar'],
  },
]

const Organogram = () => {
  const [selectedTeam, setSelectedTeam] = useState(null)
  const detailRef = useRef(null)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
      <Navbar />
      <div className="p-4 max-w-6xl mx-auto">

        {/* Header */}
        <div className="rounded-2xl p-5 mb-5 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #f97316, transparent)', transform: 'translate(30%, -30%)' }}></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider">GAINUP Industries</p>
              <h1 className="text-xl font-black mt-1">Woven Division</h1>
              <p className="text-blue-300 text-sm mt-0.5">5S Organogram</p>
            </div>
            <div className="text-right">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-xl"
                style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>5S</div>
            </div>
          </div>

          {/* Leadership */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { role: 'Captain', name: 'Mr. Askar', color: '#f97316' },
              { role: 'Coordinator', name: 'Mr. Prabath', color: '#3b82f6' },
              { role: 'Sec. Coordinator', name: 'Mrs. Karthika', color: '#8b5cf6' },
            ].map(l => (
              <div key={l.role} className="rounded-xl p-3 text-center"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-white text-xs mx-auto mb-1"
                  style={{ background: l.color }}>
                  {l.name.split(' ').map(n => n[0]).join('')}
                </div>
                <p className="text-white text-xs font-bold leading-tight">{l.name}</p>
                <p className="text-blue-300 text-xs opacity-80">{l.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 5S Legend */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-5">
          <p className="text-xs font-black text-gray-600 uppercase tracking-wider mb-3">5S Pillars</p>
          <div className="grid grid-cols-5 gap-2">
            {[
              { s: '1S', name: 'SORT', sub: 'Seiri', desc: 'Eliminate unnecessary items', color: '#dc2626', bg: '#fee2e2' },
              { s: '2S', name: 'SET IN ORDER', sub: 'Seiton', desc: 'Organizing the workspace', color: '#d97706', bg: '#fef9c3' },
              { s: '3S', name: 'SHINE', sub: 'Seiso', desc: 'Turning up the workplace', color: '#2563eb', bg: '#dbeafe' },
              { s: '4S', name: 'STANDARDIZE', sub: 'Seiketsu', desc: 'Make it a Standard', color: '#7c3aed', bg: '#ede9fe' },
              { s: '5S', name: 'SUSTAIN', sub: 'Shitsuke', desc: 'Sustaining new practices', color: '#0f766e', bg: '#ccfbf1' },
            ].map(item => (
              <div key={item.s} className="rounded-xl p-2 text-center" style={{ background: item.bg }}>
                <p className="text-lg font-black" style={{ color: item.color }}>{item.s}</p>
                <p className="text-xs font-black leading-tight" style={{ color: item.color }}>{item.name}</p>
                <p className="text-xs opacity-60 mt-0.5" style={{ color: item.color }}>{item.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Teams Grid */}
        
            {/* Org Chart Diagram */}
<p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Team Structure</p>

{/* Leadership Row */}
<div className="flex justify-center mb-2">
  <div className="rounded-2xl px-6 py-3 text-white text-center"
    style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
    <p className="text-sm font-black">GAIN UP — Woven Division 5S</p>
  </div>
</div>

{/* Connector */}
<div className="flex justify-center mb-2">
  <div className="w-0.5 h-6" style={{ background: '#94a3b8' }}></div>
</div>

{/* Captain */}
<div className="flex justify-center mb-2">
  <div className="rounded-2xl p-3 text-center border-2 min-w-36"
    style={{ background: '#fff7ed', borderColor: '#f97316' }}>
    <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white mx-auto mb-1"
      style={{ background: '#f97316' }}>MA</div>
    <p className="text-xs font-black text-gray-800">Mr. Askar</p>
    <p className="text-xs text-orange-600 font-semibold">Captain</p>
  </div>
</div>

<div className="flex justify-center mb-2">
  <div className="w-0.5 h-6" style={{ background: '#94a3b8' }}></div>
</div>

{/* Coordinators */}
<div className="flex justify-center gap-4 mb-2">
  {[
    { name: 'Mr. Prabath', role: 'Coordinator', initials: 'MP', color: '#3b82f6' },
    { name: 'Mrs. Karthika', role: 'Sec. Coordinator', initials: 'MK', color: '#8b5cf6' },
  ].map(c => (
    <div key={c.name} className="rounded-2xl p-3 text-center border-2 min-w-32"
      style={{ background: '#f8fafc', borderColor: c.color }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-white mx-auto mb-1"
        style={{ background: c.color }}>{c.initials}</div>
      <p className="text-xs font-black text-gray-800">{c.name}</p>
      <p className="text-xs font-semibold" style={{ color: c.color }}>{c.role}</p>
    </div>
  ))}
</div>

{/* Connector to teams */}
<div className="flex justify-center mb-2">
  <div className="w-0.5 h-6" style={{ background: '#94a3b8' }}></div>
</div>
<div className="w-full h-0.5 mb-2" style={{ background: '#e2e8f0' }}></div>

{/* Teams */}
<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
  {TEAMS_DATA.map(team => (
    <div key={team.name}
      onClick={() => {
        if (selectedTeam?.name === team.name) {
          setSelectedTeam(null)
        } else {
          setSelectedTeam(team)
          setTimeout(() => {
            detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 100)
        }
      }}
      className="rounded-2xl overflow-hidden cursor-pointer hover:shadow-md transition shadow-sm"
      style={{ border: `2px solid ${selectedTeam?.name === team.name ? team.color : team.color + '40'}` }}>

      {/* Team Header */}
      <div className="px-3 py-2 flex items-center gap-2"
        style={{ background: team.color }}>
        <div className="w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs"
          style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
          {team.name.split(' ').map(w => w[0]).join('').substring(0, 2)}
        </div>
        <p className="text-white font-black text-xs flex-1">{team.name}</p>
        <span className="text-white opacity-70 text-xs">{selectedTeam?.name === team.name ? '▲' : '▼'}</span>
      </div>

      {/* Facilitator & Leader */}
      <div className="p-2.5" style={{ background: team.bg }}>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs px-1.5 py-0.5 rounded font-bold text-white"
            style={{ background: team.color, fontSize: '9px' }}>F</span>
          <p className="text-xs font-semibold text-gray-700">{team.facilitator}</p>
        </div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-xs px-1.5 py-0.5 rounded font-bold text-white"
            style={{ background: team.color, fontSize: '9px' }}>L</span>
          <p className="text-xs font-semibold text-gray-700">{team.leader}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {team.zones.map(z => (
            <span key={z} className="text-xs px-1.5 py-0.5 rounded font-semibold"
              style={{ background: 'white', color: team.color, border: `1px solid ${team.color}40`, fontSize: '9px' }}>
              {z}
            </span>
          ))}
        </div>
      </div>
    </div>
  ))}
</div>

        {/* Team Detail */}
        {selectedTeam && (
          <div ref={detailRef} className="mt-4 bg-white rounded-2xl shadow-sm overflow-hidden"
            style={{ border: `2px solid ${selectedTeam.color}` }}>
            <div className="px-4 py-3 flex items-center justify-between"
              style={{ background: selectedTeam.color }}>
              <p className="text-white font-black">{selectedTeam.name} — Details</p>
              <button onClick={() => setSelectedTeam(null)}
                className="w-7 h-7 rounded-xl bg-white bg-opacity-20 flex items-center justify-center text-white font-bold">×</button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-black text-gray-500 uppercase mb-2">Leadership</p>
                  <div className="space-y-2">
                    {[
                      { role: 'Facilitator', name: selectedTeam.facilitator },
                      { role: 'Team Leader', name: selectedTeam.leader },
                    ].map(l => (
                      <div key={l.role} className="flex items-center gap-2 rounded-xl p-2"
                        style={{ background: selectedTeam.bg }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black"
                          style={{ background: selectedTeam.color }}>
                          {l.name.split(' ').pop()[0]}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">{l.name}</p>
                          <p className="text-xs text-gray-500">{l.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs font-black text-gray-500 uppercase mt-3 mb-2">Zones & Areas</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedTeam.zones.map(z => (
                      <span key={z} className="text-xs px-2 py-1 rounded-full font-bold text-white"
                        style={{ background: selectedTeam.color }}>{z}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedTeam.areas.map(a => (
                      <span key={a} className="text-xs px-2 py-1 rounded-full font-semibold"
                        style={{ background: selectedTeam.bg, color: selectedTeam.color }}>{a}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-black text-gray-500 uppercase mb-2">Team Members</p>
                  <div className="space-y-1">
                    {selectedTeam.members.map((m, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                        style={{ background: selectedTeam.bg }}>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-black"
                          style={{ background: selectedTeam.color }}>{i + 1}</div>
                        <p className="text-xs font-semibold text-gray-700">{m.replace(/^\d+\.\s*/, '')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Organogram