// src/firebase.js
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, push, set, get, onValue, remove, update } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyDMoBgr_Fwfb6mlhJkaW4s7csQMa95XLwg",
  authDomain: "fir-kaizen-app-gainup.firebaseapp.com",
  databaseURL: "https://fir-kaizen-app-gainup-default-rtdb.firebaseio.com",
  projectId: "fir-kaizen-app-gainup",
  storageBucket: "fir-kaizen-app-gainup.firebasestorage.app",
  messagingSenderId: "256675758555",
  appId: "1:256675758555:web:5f53bb089150e3281f27fe",
  measurementId: "G-TL1KH8DWMN"
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)

// ── Helper functions ──────────────────────────────────────────────────

// Save a new audit
export const saveAudit = async (auditData) => {
  const auditsRef = ref(db, 'audits')
  const newRef = push(auditsRef)
  await set(newRef, { ...auditData, id: newRef.key })
  return newRef.key
}

// Get all audits (one-time fetch)
export const getAudits = async () => {
  const auditsRef = ref(db, 'audits')
  const snapshot = await get(auditsRef)
  if (!snapshot.exists()) return []
  const data = snapshot.val()
  return Object.values(data).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

// Listen to audits in real-time
export const listenAudits = (callback) => {
  const auditsRef = ref(db, 'audits')
  return onValue(auditsRef, (snapshot) => {
    if (!snapshot.exists()) { callback([]); return }
    const data = snapshot.val()
    const list = Object.values(data).sort((a, b) => {
  if (a.timestamp && b.timestamp) return new Date(b.timestamp) - new Date(a.timestamp)
  return 0
})
    callback(list)
  })
}

// Save a new kaizen
export const saveKaizen = async (kaizenData) => {
  const kaizensRef = ref(db, 'kaizens')
  const newRef = push(kaizensRef)
  await set(newRef, { ...kaizenData, id: newRef.key })
  return newRef.key
}

// Get all kaizens (one-time fetch)
export const getKaizens = async () => {
  const kaizensRef = ref(db, 'kaizens')
  const snapshot = await get(kaizensRef)
  if (!snapshot.exists()) return []
  const data = snapshot.val()
  return Object.values(data).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

// Listen to kaizens in real-time
export const listenKaizens = (callback) => {
  const kaizensRef = ref(db, 'kaizens')
  return onValue(kaizensRef, (snapshot) => {
    if (!snapshot.exists()) { callback([]); return }
    const data = snapshot.val()
    const list = Object.values(data).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    callback(list)
  })
}

// Update a kaizen (for status changes, approvals etc)
export const updateKaizen = async (firebaseKey, updates) => {
  try {
    const kaizenRef = ref(db, `kaizens/${firebaseKey}`)
    const clean = JSON.parse(JSON.stringify(updates, (k, v) => v === undefined ? null : v))
    await set(kaizenRef, clean)
  } catch (err) {
    console.error('updateKaizen error:', err)
  }
}

// Delete an audit
export const deleteAudit = async (id) => {
  const auditRef = ref(db, `audits/${id}`)
  await remove(auditRef)
}

// Delete a kaizen
export const deleteKaizen = async (id) => {
  const kaizenRef = ref(db, `kaizens/${id}`)
  await remove(kaizenRef)
}

// ── All your existing static data (unchanged) ─────────────────────────

export const mockUsers = [
  { email: 'admin@gainup.com', password: 'admin123', role: 'Admin', name: 'Mr. Askar', designation: 'Captain', team: 'Management' },
  { email: 'md@gainup.com', password: 'md123', role: 'MD', name: 'MD', designation: 'Managing Director', team: 'Management' },
  { email: 'krishnan@gainup.com', password: 'krish123', role: 'AuditIncharge', name: 'Mr. Krishnan', designation: 'Internal Audit Incharge', team: 'Management' },
  { email: 'coord@gainup.com', password: 'coord123', role: 'Coordinator', name: 'Mr. Prasanth', designation: 'Coordinator', team: 'Management' },
  { email: 'jenifer@gainup.com', password: 'jenifer123', role: 'FiveS_Incharge', name: 'Mrs. Jenifer', designation: '5S Incharge', team: 'Management' },
  { email: 'sec@gainup.com', password: 'sec123', role: 'Coordinator', name: 'Mrs. Karthika', designation: 'Sourcing/Coordinator', team: 'Management' },
  { email: 'royallions@gainup.com', password: 'royal123', role: 'TeamLead', name: 'Royal Lions Lead', designation: 'Team Leader', team: 'Royal Lions' },
  { email: 'dragonforce@gainup.com', password: 'dragon123', role: 'TeamLead', name: 'Dragon Force Lead', designation: 'Team Leader', team: 'Dragon Force' },
  { email: 'goldentiger@gainup.com', password: 'tiger123', role: 'TeamLead', name: 'Golden Tiger Lead', designation: 'Team Leader', team: 'Golden Tiger' },
  { email: 'goldeneagle@gainup.com', password: 'eagle123', role: 'TeamLead', name: 'Golden Eagle Lead', designation: 'Team Leader', team: 'Golden Eagle' },
  { email: 'bison@gainup.com', password: 'bison123', role: 'TeamLead', name: 'Bison Warriors Lead', designation: 'Team Leader', team: 'Bison Warriors' },
  { email: 'penguins@gainup.com', password: 'peng123', role: 'TeamLead', name: 'Penguins Lead', designation: 'Team Leader', team: 'Penguins' },
  { email: 'phoenix@gainup.com', password: 'phoe123', role: 'TeamLead', name: 'Phoenix Squad Lead', designation: 'Team Leader', team: 'Phoenix Squad' },
  { email: 'storm@gainup.com', password: 'storm123', role: 'TeamLead', name: 'Storm Blades Lead', designation: 'Team Leader', team: 'Storm Blades' },
  { email: 'spartan@gainup.com', password: 'spart123', role: 'TeamLead', name: 'Spartan Kings Lead', designation: 'Team Leader', team: 'Spartan Kings' },
  { email: 'auditor@gainup.com', password: 'audit123', role: 'Auditor', name: 'Auditor 1', designation: 'Senior Auditor', team: 'Management' },
  { email: 'operator@gainup.com', password: 'oper123', role: 'Operator', name: 'Operator 1', designation: 'Machine Operator', team: 'Royal Lions' },
]

export const TEAMS = [
  'Royal Lions', 'Dragon Force', 'Golden Tiger', 'Golden Eagle',
  'Bison Warriors', 'Penguins', 'Phoenix Squad', 'Storm Blades', 'Spartan Kings',
]

export const AREAS = [
  'V Store', 'Non-V Store', 'Cutting Section', 'Stitching Section',
  'Quality Control', 'Packing', 'Dispatch', 'Maintenance', 'Admin Office', 'Others',
]

export const TEAMS_DEPARTMENTS = {
  'Royal Lions': ['Trim Store', 'Fabric Store'],
  'Dragon Force': ['Cutting', 'Super Market', 'I/CAD'],
  'Golden Tiger': ['Line 1-11', 'Line 12-22'],
  'Golden Eagle': ['Line 23-28', 'Line 29-33'],
  'Bison Warriors': ['Line 34-38', 'Line 39-44'],
  'Penguins': ['Pattern', 'Sampling'],
  'Phoenix Squad': ['Electric', 'Maintenance'],
  'Storm Blades': ['Security Gate', 'Canteen', 'Staff Tables'],
  'Spartan Kings': ['Passing-1', 'Passing-2', 'FGS/Non-FG'],
}

export const TEAMS_MEMBERS = {
  'Royal Lions': ['Roja', 'Jerry', 'Kumari', 'Akila', 'Ranjith', 'Mohan'],
  'Dragon Force': ['Deepa', 'Pugazhwaram', 'Sarswathi', 'Selvi', 'Kavitha'],
  'Golden Tiger': ['Deepa', 'Muthulakshmi', 'Principal', 'Savithri', 'Malathi', 'Shantha Kumari'],
  'Golden Eagle': ['Suganya', 'Indra', 'Nisha', 'Lalitha', 'Kalaiswari'],
  'Bison Warriors': ['Deepa', 'Narmadha', 'Jayanthi', 'Muthu Lakshmi', 'Shiva Lakshmi'],
  'Penguins': ['Priya', 'Sujeedha', 'Jayalakshmi', 'Karthika'],
  'Phoenix Squad': ['Babu', 'Sudha', 'Buvena', 'Tamil', 'Mukesh', 'Vinothi'],
  'Storm Blades': ['Suresh', 'Anitha', 'Priyanka', 'Manikar', 'Narmalar', 'Kathireesan', 'Swaminathan'],
  'Spartan Kings': ['Muthu', 'Muthuprandi', 'Geetha', 'Saraswathi', 'Ruban', 'Poorna', 'Muthunasar'],
}

export const KAIZEN_STAGES = [
  'Submitted', 'Reviewing', 'Approval',
  'Waiting to Implement', 'Wanting to Verify', 'Closed',
]

export const DESIGNATIONS = [
  'Captain', 'Coordinator', 'Secretary Coordinator', 'Dept Coordinator',
  'Team Leader', 'Zone Owner', 'Facilitator', 'Senior Auditor',
  'Auditor', 'Machine Operator', 'Helper', 'Others',
]

export const KAIZEN_CATEGORIES = [
  'Safety', 'Quality', 'Productivity', 'Cost Reduction',
  'Fabric Waste Reduction', 'Trims Management', 'Stitching Efficiency',
  'Machine Downtime', 'Worker Ergonomics', 'Energy Saving',
  'Delivery / Lead Time', 'Rejection Reduction',
]

export const KAIZEN_PROBLEM_TYPES = [
  'Machine Issue', 'Material Issue', 'Method Issue', 'Manpower Issue',
  'Environment Issue', 'Safety Hazard', 'Quality Defect', 'Waste / Excess',
  'Delay / Waiting', 'Other',
]

export const DEFAULT_CHECKLIST = {
  '1S': {
    label: 'Seiri (Sort)', totalMarks: 150, color: '#dc2626', bg: '#fee2e2',
    description: 'Remove all unnecessary items from the work area',
    items: [
      { id: 1, english: 'No unnecessary objects on the floor', tamil: 'தரையில் தேவையற்ற பொருள் இல்லாமல் இருத்தல்', marks: 10 },
      { id: 2, english: 'No unnecessary materials on panel, machine, window, wall tops', tamil: 'பேனல், மிஷின், சன்னல், சுவரின் மேல்புறம் தேவையற்ற பொருள்கள் இல்லாமல் இருத்தல்', marks: 10 },
      { id: 3, english: 'Tools Box, Self, Trolley, Table, Rack - no unnecessary items inside or on top', tamil: 'டூல்ஸ் பாக்ஸ், செல்ப், ட்ரால்லி, டேபிள், ரேக் உள்புறம் மற்றும் மேல்புறம் தேவையற்ற பொருட்கள் இல்லாமல் இருத்தல்', marks: 20 },
      { id: 4, english: 'No old posters, calendars, pictures, old checklists on the wall', tamil: 'பழைய போஸ்டர்கள், பழைய காலண்டர்கள், படங்கள், பழைய செக்லிஸ்ட் கிறுக்கல்கள் போன்றவை சுவரில் இல்லாமல் இருந்தால்', marks: 10 },
      { id: 5, english: 'All displays and boards are same size and height. No old papers. Info report with removal date and person name', tamil: 'அனைத்து டிஸ்பிளே மற்றும் கிராப் போர்டுகளில் ஒரே அளவில் ஒரே உயரத்தில் இருந்தால். பழைய பேப்பர்கள் இல்லாமல். தகவல் அறிக்கையை அகற்றும் தேதியுடன் இருத்தல்', marks: 15 },
      { id: 6, english: 'Items sorted and arranged according to their use', tamil: 'பயன்பாட்டிற்கு தகுந்தவாறு பொருட்களை வரிசைப்படுத்தி வைத்திருந்தால்', marks: 10 },
      { id: 7, english: 'No unused items left in department and other locations for long time', tamil: 'பயன்படாத பொருட்கள் அதிக நாட்கள் டிபார்ட்மென்ட் மற்றும் இதர இடங்களில் இருந்தால்', marks: 10 },
      { id: 8, english: 'Record maintained for plan to remove unwanted items, red-tag action and re-inspection', tamil: 'தேவையற்ற பொருட்களை அகற்றும் திட்டம், ரெட்டேக் பொருட்களை அகற்ற நடவடிக்கை, மற்றும் மறு ஆய்வு செய்தல் போன்றவற்றை ரெக்கார்ட் இருந்தால்', marks: 25 },
      { id: 9, english: 'Damaged equipment disposed properly', tamil: 'பழுது அடைந்த உபகரணங்களை அப்புறப்படுத்துதல்', marks: 10 },
      { id: 10, english: 'No items or garbage pending disposal', tamil: 'வெளியேற்றவேண்டிய பொருட்கள், குப்பைகள் இல்லாதிருத்தல்', marks: 5 },
      { id: 11, english: 'Unusable and substandard items removed from work area', tamil: 'பயன்பாட்டிற்கு தகாத பொருட்களை அகற்றுதல், மற்றும் தரம் குறைந்த பொருட்களை அகற்றுதல்', marks: 10 },
      { id: 12, english: 'No good items found in the trash can', tamil: 'குப்பைத் தொட்டியில் நல்ல பொருட்கள் இல்லாமல் இருந்தால்', marks: 5 },
      { id: 13, english: 'Disposal plan is well implemented and followed', tamil: 'தேவையற்ற பொருட்களை அகற்றும் திட்டம் நன்றாக நடைமுறையில் இருந்தால்', marks: 10 },
    ]
  },
  '2S': {
    label: 'Seiton (Set in Order)', totalMarks: 300, color: '#d97706', bg: '#fef9c3',
    description: 'Organize items so they are easy to find and use',
    items: [
      { id: 1, english: 'Guided facility details and pathways clearly marked', tamil: 'வழிகாட்டும் வசதிகள் விவரம் மற்றும் வழித்தடங்களை குறியிடுதல்', marks: 10 },
      { id: 2, english: 'Department and all building routes and names are available', tamil: 'டிபார்ட்மென்ட் மற்றும் அனைத்து பில்டிங் வழித்தடம் மற்றும் பெயர் இட்டிருந்தால்', marks: 10 },
      { id: 3, english: 'Light, Switch, Machine, Room, Rack - all properly named and labeled', tamil: 'பெயரிடுதல் - லைட், ஸ்விட்ச், மிஷின், அனைத்தும் ரூம், ரேக் (இதரம்)', marks: 10 },
      { id: 4, english: 'Count and color code details available for all machines', tamil: 'அனைத்து மிஷின்களுக்கும் கவுண்ட் மற்றும் கலர்கோடு விவரம்', marks: 10 },
      { id: 5, english: 'Materials, equipment and files stored according to use', tamil: 'பயன்பாட்டிற்கு ஏற்ப பொருட்கள், உபகரணங்கள் மற்றும் பைல்கள் பங்காக வைக்கும் விவரம்', marks: 15 },
      { id: 6, english: 'Space provided for storing mechanical use equipment', tamil: 'இயந்திர பயன்பாட்டிற்கான உபகரணங்கள் வைப்பதற்கு இடம் கொடுத்தல்', marks: 15 },
      { id: 7, english: 'List available for machine tools and files that can be easily retrieved', tamil: 'இயந்திர உபகரணங்கள் மற்றும் பைல்கள் எளிதாக எடுக்கும் வண்ணம் பட்டியல் இடுதல்', marks: 15 },
      { id: 8, english: 'Each item has a separate designated space', tamil: 'ஒவ்வொரு பொருட்களுக்கும் தனித்தனியாக இடம் கொடுக்கப்பட்டு இருந்தால்', marks: 15 },
      { id: 9, english: 'All equipment, tables, trolleys, info boards in X,Y order', tamil: 'அனைத்து உபகரணங்கள், டேபிள், ட்ரால்லி, தகவல் பலகை X,Y முறைப்படி முறைப்படுத்தப்பட்டிருந்தால்', marks: 15 },
      { id: 10, english: 'Table, Trolley, Machines, Cabinet, Bureau, Tools Box - all organized properly', tamil: 'டேபிள், ட்ரால்லி, இயந்திரங்கள், கபோர்டு, பீரோ, டூல்ஸ்பாக்ஸ்', marks: 15 },
      { id: 11, english: 'Low quality products easily identifiable and marked', tamil: 'தரம் குறைந்த பொருட்கள் எளிதில் தெரியும்படி அடையாளம் இருந்தால்', marks: 10 },
      { id: 12, english: 'Rejected items have name and reason for identification', tamil: 'நிராகரிக்கப்பட்ட பொருட்களில் பெயர் மற்றும் காரணங்களுக்கான அடையாளம் இருந்தால்', marks: 10 },
      { id: 13, english: 'Routes everywhere. Exits and emergency exits clearly visible', tamil: 'அனைத்து இடங்களிலும் வழித்தடங்களை அமைத்திருந்தால்', marks: 5 },
      { id: 14, english: 'Sign indicating the area where the doors open', tamil: 'கதவுகள் திறக்கும் பகுதி அடையாளம் இருந்தால்', marks: 5 },
      { id: 15, english: 'Path of machine parts is clearly marked', tamil: 'இயந்திர பாகங்கள் செல்லும் வழி தடம், அடையாளம் இருந்தால்', marks: 5 },
      { id: 16, english: 'Separate area for storing rejected and waste materials', tamil: 'நிராகரிக்கப்பட்ட, கழிவுபொருட்கள் வைப்பதற்கு தனியாக இடம் கொடுத்திருந்தால்', marks: 15 },
      { id: 17, english: 'Electrical parts like lights, fans, refrigerators have identification marks', tamil: 'எலக்ட்ரிக்கல் பாகங்கள் அடையாளம், பெயர் போன்றவை இருந்தால்', marks: 20 },
      { id: 18, english: 'All pipe lines and cable wires are straight and properly arranged', tamil: 'அனைத்து பைப் லைன் மற்றும் கேபிள்வயர்கள் நேராக ஒழுங்குபடுத்தப்பட்டிருந்தால்', marks: 15 },
      { id: 19, english: 'All items color coded for easy identification', tamil: 'அனைத்துப் பொருட்களும் எளிதான முறையில் தெரியும் வண்ணம் கலர்கோடு கொடுக்கப்பட்டிருந்தால்', marks: 20 },
      { id: 20, english: 'Materials, tools, files, notebooks neatly arranged and easy to access', tamil: 'நல்ல முறையில் வரிசைப்படுத்தி எளிதில் எடுக்கும் படி பொருட்கள், டூல்ஸ், பைல்கள் இருந்தால்', marks: 15 },
      { id: 21, english: 'Tracing board available to avoid searching for stop technician', tamil: 'ஸ்டாப் டெக்னீசியனை தேடுதல் தவிர்க்க ட்ரேசிங் போர்டு வைத்திருந்தால்', marks: 10 },
      { id: 22, english: 'All items given a name and ID. Broken and repair-needed items identified', tamil: 'அனைத்துப் பொருட்களும் பெயர் (ID) கொடுக்கப்பட்டிருந்தால்', marks: 20 },
      { id: 23, english: 'Things used regularly are properly named', tamil: 'எப்போதும் பயன்படுத்தும் பொருட்கள் பெயரிடுதல்', marks: 10 },
      { id: 24, english: 'Place for recyclable waste, waste for sale and defective goods', tamil: 'மீண்டும் பயன்பாட்டிற்குரிய வேஸ்ட், விற்பனைக்குரிய வேஸ்ட்கள் வைப்பதற்கான இடம் வழங்கப்பட்டிருந்தால்', marks: 10 },
    ]
  },
  '3S': {
    label: 'Seiso (Shine)', totalMarks: 150, color: '#2563eb', bg: '#dbeafe',
    description: 'Clean everything and keep it clean',
    items: [
      { id: 1, english: 'Cleaning schedule published with location and name of person responsible', tamil: 'சுத்தம் செய்யும் காலட்டவணை இடம் மற்றும் பொறுப்பாளர் பெயருடன் பட்டியல் வெளியிட்டிருந்தால்', marks: 30 },
      { id: 2, english: 'Machine and other equipment always maintained clean and in high quality condition', tamil: 'உயர்தரமான முறையில் மிஷின் மற்றும் இதர பொருட்கள் சுத்தமாக எப்போதும் பராமரிக்கப்பட்டிருந்தால்', marks: 10 },
      { id: 3, english: 'Garbage bin has disposal schedule, person in charge details, notice and location sign', tamil: 'குப்பை தொட்டியில் குப்பை அகற்றும் காலட்டவணை பொறுப்பாளர் விவரம் இருந்தால்', marks: 10 },
      { id: 4, english: 'Machine, furniture and racks cleaned. Preventive maintenance done', tamil: 'மிஷின், பார்னிச்சர், ரேக் போன்றவை சுத்தமாக இருந்தால். பிரிவென்டிவ் மெயின்டெனன்ஸ் பணி நடைபெறுகிறதா', marks: 30 },
      { id: 5, english: 'Floor, walls, windows, doors, pipes, computers, racks, notice boards are all clean', tamil: 'தரைப்பகுதி, சுவர்பகுதி, சன்னல், கதவுகள், பைப்லைன், கம்யூட்டர்கள், ரேக் சுத்தமாக இருந்தால்', marks: 30 },
      { id: 6, english: 'All necessary cleaning supplies available in department with name and quantity labels', tamil: 'சுத்தம் செய்ய தேவைப்படும் பொருள் அனைத்து டிபார்ட்மென்டிலும் இருந்தால்', marks: 20 },
      { id: 7, english: '5-minute cleaning schedule exists and is followed', tamil: '5 நிமிட காலட்டவணைப்படி சுத்தம் நடைபெற்றால் அதற்கான காலட்டவணை இருந்தால்', marks: 10 },
      { id: 8, english: 'Repair report card available to record repairs or defects found during cleaning', tamil: 'சுத்தம் நடைபெறும் போது பழுது மற்றும் குறைகள் எழுதுவதற்கு பழுது விவர அட்டை இருந்தால்', marks: 10 },
    ]
  },
  '4S': {
    label: 'Seiketsu (Standardize)', totalMarks: 200, color: '#7c3aed', bg: '#ede9fe',
    description: 'Create standards to maintain 1S 2S 3S consistently',
    items: [
      { id: 1, english: 'Boards and info reports provide uniform size for 5S. Pipeline color standardized', tamil: '5S நடைமுறைபடுத்தல் ஒரே மாதிரி அளவு அளிக்கும் வண்ணம் போர்டுகள் மற்றும் தகவல் அறிக்கைகள் இருப்பின்', marks: 30 },
      { id: 2, english: 'Rules of procedure published as bulletin and all checklists in place', tamil: 'நடைமுறை விதிகள் கொடுக்கப்பட்டு தகவல் அறிக்கையாக வெளியிடப்பட்டு அனைத்து செக்லிஸ்ட்களும் நடைமுறையில் இருந்தால்', marks: 30 },
      { id: 3, english: 'Warning signs set for prohibited areas, dos, donts, safe walkway, danger warnings', tamil: 'எச்சரிக்கை குறியிடுகள் நிர்ணயிக்கப்பட்டிருந்தால் - தடைசெய்யப்பட்ட பகுதி, செய்யக்கூடாதவை, பாதுகாப்பான நடைபாதை', marks: 20 },
      { id: 4, english: 'All information and signage are the same size and format throughout', tamil: 'அனைத்து தகவல் அறிக்கைகள் மற்றும் குறியிடுகள் ஒரே அளவில் ஒரே மாதிரியாக இருந்தால்', marks: 20 },
      { id: 5, english: 'Fire extinguisher in correct location, type identified, easy to remove, clearly visible', tamil: 'தீ அணைப்பான் சரியான இடம் கொடுக்கப்பட்டு வரையறுக்கப்பட்டுள்ளதா', marks: 30 },
      { id: 6, english: 'Pipeline cables are of specified colors', tamil: 'பைப் மற்றும் கேபிள்கள் நிர்ணயிக்கப்பட்ட கலர்களில் இருந்தால்', marks: 10 },
      { id: 7, english: 'Warning signs defined for all areas', tamil: 'எச்சரிக்கை குறியிடுகள் நிர்ணயிக்கப்பட்டிருந்தால் - தடை செய்யப்பட்ட பகுதி, செய்யக்கூடாதவை', marks: 20 },
      { id: 8, english: 'Color and image markings understandable by everyone. Safety awareness present', tamil: 'அனைவருக்கும் புரியும் வண்ணம் கலர் மற்றும் படத்துடன் நிர்ணயிக்கப்பட்டு இருந்தால்', marks: 10 },
      { id: 9, english: 'Details with dos and donts pictures published for all departments', tamil: 'அனைத்து டிபார்ட்மென்ட்றுக்கும் செய்யக்கூடிய மற்றும் செய்யக்கூடாதவற்றிக்கான படங்களுடன் கூடிய விவரங்கள் வெளியிடப்பட்டிருந்தால்', marks: 15 },
      { id: 10, english: 'New and innovative methods used to make work easier', tamil: 'புதிதாக எளிதாக வேலைசெய்யும் வகையில் ஏதேனும் முறைகள் கையாண்டால்', marks: 15 },
    ]
  },
  '5S': {
    label: 'Shitsuke (Sustain)', totalMarks: 200, color: '#0f766e', bg: '#ccfbf1',
    description: 'Make 5S a habit and culture in the workplace',
    items: [
      { id: 1, english: 'Team coordinators and leaders understand 5S - General awareness and active involvement', tamil: 'அணியின் ஒருங்கிணைப்பாளர் மற்றும் தலைவருக்கு 5S பற்றி புரிந்திருந்தால்', marks: 25 },
      { id: 2, english: 'Team members and workers understand 5S - General awareness and active involvement', tamil: 'அணியின் உறுப்பினர்களுக்கும் மற்றும் அங்கு பணிபுரிகின்ற நபர்களுக்கு 5S பற்றி புரிந்திருந்தால்', marks: 25 },
      { id: 3, english: 'Daily 5S practice - 5 minute schedule cleaning with department involvement', tamil: 'தினசரி நடைமுறையில் 5S கடைபிடிக்கும் விதம். 5நிமிட காலட்டவணைப்படி சுத்தம் நடைபெற்றால்', marks: 20 },
      { id: 4, english: 'Monthly team-wise audit conducted. Report reviewed. Deficiency correction report prepared', tamil: 'மாதம் ஒருமுறை அணிவாரியாக ஆய்வு மேற்கொண்டால், அணியின் அறிக்கை ஆய்வுசெய்தால்', marks: 20 },
      { id: 5, english: 'Training and counseling provided. Proof of training for new and old workers', tamil: 'பயிற்ச்சி வகுப்பு மற்றும் கலந்தாய்வு - புதிய மற்றும் பழைய தொழிலாளர்களுக்கு பயிற்ச்சி வழங்கியதற்கான ஆதாரம்', marks: 30 },
      { id: 6, english: 'New and innovative methods used to make work easily', tamil: 'புதிதாக எளிதாக ஏதேனும் முறைகள் கையாண்டால்', marks: 10 },
      { id: 7, english: '5S Monthly consultation - team and dept wise report, resolution, implementation evidence', tamil: '5S மாதாந்திர கலந்தாய்வு - அணி மற்றும் துறைவாரியாக கலந்தாய்விற்கான அறிக்கை', marks: 25 },
      { id: 8, english: 'Gallery and zone corners are identical in defined sizes', tamil: 'வரையறுக்கப்பட்ட அளவுகளில் ஒரே மாதிரியாக கேலரி மற்றும் ஜோன் கார்னர்கள் இருந்தால்', marks: 10 },
      { id: 9, english: '5S awareness pictures and boards present. Everyone has 5S cards', tamil: '5S விழிப்புணர்வு படங்கள் மற்றும் போர்டுகள் இருந்தால், அனைத்திடமும் 5S குறித்த அட்டைகள் இருந்தால்', marks: 20 },
      { id: 10, english: 'Awareness about 5S given in surroundings and public places', tamil: 'சுற்றுப்புறங்கள் மற்றும் பொதுஇடங்களில் 5S பற்றி விழிப்புணர்வு கொடுக்கப்பட்டிருந்தால்', marks: 15 },
    ]
  },
}