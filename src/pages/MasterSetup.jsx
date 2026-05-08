import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { DEFAULT_CHECKLIST } from '../firebase'
import { useLang } from '../App'

const EditableItem = ({ item, idx, sLevel, checklist, setChecklist, onRemove }) => {
  const [editing, setEditing] = useState(false)
  const lang = useLang()
  const [editEng, setEditEng] = useState(item.english)
  const [editTamil, setEditTamil] = useState(item.tamil || '')
  const [editMarks, setEditMarks] = useState(item.marks)

  const saveEdit = () => {
    const updated = { ...checklist }
    updated[sLevel].items[idx] = { ...item, english: editEng, tamil: editTamil, marks: Number(editMarks) }
    updated[sLevel].totalMarks = updated[sLevel].items.reduce((s, i) => s + i.marks, 0)
    setChecklist(updated)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="rounded-xl p-3 border-2 border-blue-200" style={{ background: '#eff6ff' }}>
        <textarea value={editEng} onChange={e => setEditEng(e.target.value)}
          className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none bg-white resize-none mb-2" rows={2}
          placeholder="English" />
        <textarea value={editTamil} onChange={e => setEditTamil(e.target.value)}
          className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none bg-white resize-none mb-2" rows={2}
          placeholder="Tamil (optional)" />
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-600">Marks:</label>
          <input type="number" value={editMarks} onChange={e => setEditMarks(e.target.value)}
            className="w-14 border-2 border-gray-100 rounded-lg px-2 py-1 text-xs text-center font-black focus:outline-none" />
          <button onClick={saveEdit} className="flex-1 text-white py-1.5 rounded-lg text-xs font-black"
            style={{ background: '#16a34a' }}>Save</button>
          <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-lg text-xs font-black bg-gray-100 text-gray-600">Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: '#f8fafc' }}>
      <div className="flex-1">
        <p className="text-xs font-semibold text-gray-800">{idx + 1}. {item.english}</p>
        {item.tamil && <p className="text-xs text-gray-400 mt-0.5 italic">{item.tamil}</p>}
        <p className="text-xs font-bold mt-1" style={{ color: '#1e3a5f' }}>{item.marks} marks</p>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={() => setEditing(true)}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs"
          style={{ background: '#2563eb' }}>✏️</button>
        <button onClick={onRemove}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs"
          style={{ background: '#dc2626' }}>×</button>
      </div>
    </div>
  )
}

const MasterSetup = () => {
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST)
  const [activeS, setActiveS] = useState('1S')
  const [newItem, setNewItem] = useState({ english: '', tamil: '', marks: 10 })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('masterChecklist')
    if (saved) setChecklist(JSON.parse(saved))
  }, [])

  const saveChecklist = () => {
    localStorage.setItem('masterChecklist', JSON.stringify(checklist))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const addItem = () => {
    if (!newItem.english) { alert('Enter item description!'); return }
    const updated = { ...checklist }
    updated[activeS].items = [...updated[activeS].items, { ...newItem, id: Date.now(), marks: Number(newItem.marks) }]
    updated[activeS].totalMarks = updated[activeS].items.reduce((s, i) => s + i.marks, 0)
    setChecklist(updated)
    setNewItem({ english: '', tamil: '', marks: 10 })
  }

  const removeItem = (sLevel, idx) => {
    if (!window.confirm('Remove this item?')) return
    const updated = { ...checklist }
    updated[sLevel].items = updated[sLevel].items.filter((_, i) => i !== idx)
    updated[sLevel].totalMarks = updated[sLevel].items.reduce((s, i) => s + i.marks, 0)
    setChecklist(updated)
  }

  const updateMarks = (sLevel, idx, marks) => {
    const updated = { ...checklist }
    updated[sLevel].items[idx].marks = Number(marks)
    updated[sLevel].totalMarks = updated[sLevel].items.reduce((s, i) => s + i.marks, 0)
    setChecklist(updated)
  }

  const resetToDefault = () => {
    if (!window.confirm('Reset to default checklist?')) return
    setChecklist(DEFAULT_CHECKLIST)
    localStorage.removeItem('masterChecklist')
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
      <Navbar />
      <div className="p-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-black text-gray-800">⚙️ Master Setup</h1>
          <div className="flex gap-2">
            <button onClick={resetToDefault}
              className="px-3 py-2 rounded-xl text-xs font-bold text-red-600"
              style={{ background: '#fee2e2' }}>Reset</button>
            <button onClick={saveChecklist}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white"
              style={{ background: saved ? '#16a34a' : 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>
              {saved ? '✅ Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {['1S', '2S', '3S', '4S', '5S'].map(s => (
            <button key={s} onClick={() => setActiveS(s)}
              className="flex-1 py-2 rounded-xl text-xs font-black transition-all"
              style={activeS === s
                ? { background: checklist[s].color, color: 'white' }
                : { background: checklist[s].bg, color: checklist[s].color }}>
              {s}
              <p className="text-xs opacity-80">{checklist[s].totalMarks}M</p>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-black text-gray-800">{checklist[activeS].label}</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: checklist[activeS].bg, color: checklist[activeS].color }}>
              {checklist[activeS].items.length} items · {checklist[activeS].totalMarks} marks
            </span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
            {checklist[activeS].items.map((item, idx) => (
              <EditableItem
                key={idx}
                item={item}
                idx={idx}
                sLevel={activeS}s
                checklist={checklist}
                setChecklist={setChecklist}
                onRemove={() => removeItem(activeS, idx)}
              />
            ))}
          </div>

          <div className="border-t-2 border-gray-100 pt-4">
            <p className="text-xs font-black text-gray-600 uppercase mb-2">Add New Item</p>
            <textarea value={newItem.english} onChange={e => setNewItem(p => ({ ...p, english: e.target.value }))}
              placeholder="Enter checklist item in English..."
              className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none bg-gray-50 resize-none mb-2" rows={2} />
            <textarea value={newItem.tamil} onChange={e => setNewItem(p => ({ ...p, tamil: e.target.value }))}
              placeholder="Enter in Tamil (optional)..."
              className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none bg-gray-50 resize-none mb-2" rows={2} />
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-600">Marks:</label>
                <input type="number" value={newItem.marks} onChange={e => setNewItem(p => ({ ...p, marks: Number(e.target.value) }))}
                  className="w-16 border-2 border-gray-100 rounded-xl px-2 py-2 text-xs text-center font-black focus:outline-none bg-gray-50" />
              </div>
              <button onClick={addItem}
                className="flex-1 text-white py-2 rounded-xl text-xs font-black"
                style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>
                + Add Item
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MasterSetup