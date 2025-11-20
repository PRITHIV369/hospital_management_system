
import React, { useEffect, useMemo, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { motion } from 'framer-motion'
import axios from "axios";

const uid = (prefix = '') => `${prefix}${Math.random().toString(36).slice(2, 9)}`
const todayISO = () => new Date().toISOString().slice(0, 10)
const toLocalDateTimeInput = (d = new Date()) => {
  const dt = new Date(d)
  const pad = (n) => String(n).padStart(2, '0')
  const yyyy = dt.getFullYear()
  const mm = pad(dt.getMonth() + 1)
  const dd = pad(dt.getDate())
  const hh = pad(dt.getHours())
  const min = pad(dt.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

const ls = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : fallback
    } catch {
      return fallback
    }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
  }
}

const initSamplePatients = () => {
  const cached = ls.get('patients', null)
  if (cached) return cached

  const names = ['Asha','Rakesh','Maya','John Doe','Fatima','Arjun','Lina Gomez','Paul']
  const data = names.map((n, i) => ({
    id: `P-${1000 + i}`,
    name: n,
    age: 20 + (i * 5) % 60,
    gender: ['F','M'][i % 2],
    phone: `+91-90000${(10000 + i).toString().slice(-5)}`,
    email: `${n.split(' ')[0].toLowerCase()}@example.com`,
    notes: 'No critical allergies',
    createdAt: new Date(Date.now() - i * 86400000).toISOString()
  }))
  ls.set('patients', data)
  return data
}

const initSampleAppointments = () => {
  const cached = ls.get('appointments', null)
  if (cached) return cached

  const pats = initSamplePatients()
  const data = pats.map((p, i) => ({
    id: `A-${2000 + i}`,
    patientId: p.id,
    title: 'General Consultation',
    doctor: ['Dr. Suraj', 'Dr. Sen', 'Dr. Alex'][i % 3],
    datetime: new Date(Date.now() + i * 86400000).toISOString(),
    status: ['Scheduled', 'Completed', 'Cancelled'][i % 3]
  }))
  ls.set('appointments', data)
  return data
}

const initSampleMedicines = () => {
  const cached = ls.get('medicines', null)
  if (cached) return cached

  const meds = ['Paracetamol','Amoxicillin','Metformin','Amlodipine','Cetirizine']
  const data = meds.map((m, i) => ({ id: `M-${300 + i}`, name: m, stock: 20 + i * 5, price: 10 + i * 15 }))
  ls.set('medicines', data)
  return data
}

const IconBox = ({ children }) => (
  <div className="w-8 h-8 rounded-md inline-flex items-center justify-center text-sm bg-white/10 text-white">
    {children}
  </div>
)

const Pill = ({ children, color = 'bg-gray-100 text-gray-800' }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs ${color}`}>{children}</span>
)

const btnPrimary = 'px-3 py-1 rounded shadow-sm bg-blue-600 text-white hover:bg-blue-700 transition'
const btnSecondary = 'px-3 py-1 rounded border hover:bg-gray-50 transition'
const btnDanger = 'px-3 py-1 rounded text-red-600 hover:bg-red-50 transition'

function Sidebar({ collapsed = false }) {
  return (
    <aside className={`bg-blue-600 text-white w-72 ${collapsed ? 'hidden' : ''} min-h-screen p-4 flex flex-col`}>
      <div className="mb-6">
        <div className="text-2xl font-bold">MediDash</div>
        <div className="text-sm text-white/80 mt-1">Clinic: Sunshine Health</div>
      </div>

      <nav className="flex-1 space-y-1">
        <Link to="/" className="block px-3 py-2 rounded hover:bg-white/10 transition">Dashboard</Link>
        <Link to="/patients" className="block px-3 py-2 rounded hover:bg-white/10 transition">Patients</Link>
        <Link to="/appointments" className="block px-3 py-2 rounded hover:bg-white/10 transition">Appointments</Link>
        <Link to="/medicines" className="block px-3 py-2 rounded hover:bg-white/10 transition">Medicines</Link>
        <Link to="/analytics" className="block px-3 py-2 rounded hover:bg-white/10 transition">Analytics</Link>
        <Link to="/reports" className="block px-3 py-2 rounded hover:bg-white/10 transition">Reports</Link>
      </nav>

      <div className="mt-6 text-sm text-white/80">
        <div className="mb-1">Address</div>
        <div className="text-xs">42, Tech Park Road</div>
      </div>
    </aside>
  )
}

function Header({ onSearch = () => {}, onLogout = () => {} }) {
  return (
    <header className="flex items-center justify-between p-4 bg-white shadow-sm">
      <div className="flex items-center gap-3">
        <input
          type="search"
          placeholder="Search patients, doctors, appointments..."
          onChange={e => onSearch(e.target.value)}
          className="border rounded px-3 py-2 w-96 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="px-3 py-1 border rounded">Notifications</button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-200" />
          <div className="text-sm">
            <div className="font-semibold">Admin</div>
            <div className="text-xs text-gray-500">admin@clinic.com</div>
          </div>
        </div>
        <button onClick={onLogout} className={btnSecondary}>Sign Out</button>
      </div>
    </header>
  )
}

function Dashboard({ patients, appointments, medicines }) {
  const totalPatients = patients.length
  const upcoming = appointments.filter(a => new Date(a.datetime) > Date.now()).length
  const lowStock = medicines.filter(m => m.stock < 10).length
  const recentPatients = patients.slice(0, 6)
  const todaysAppointments = appointments
    .filter(a => new Date(a.datetime).toISOString().slice(0, 10) === todayISO()).slice(0, 6)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="text-sm text-gray-500">Today • {new Date().toLocaleDateString()}</div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Total Patients</div>
          <div className="text-2xl font-bold">{totalPatients}</div>
          <div className="mt-2 text-xs text-gray-400">Active records</div>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Upcoming Appointments</div>
          <div className="text-2xl font-bold">{upcoming}</div>
          <div className="mt-2 text-xs text-gray-400">Scheduled appointments</div>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Low Stock Medicines</div>
          <div className="text-2xl font-bold">{lowStock}</div>
          <div className="mt-2 text-xs text-gray-400">Stock below threshold</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <section className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-3">Recent Patients</h3>
          <ul className="space-y-2 max-h-48 overflow-auto">
            {recentPatients.map(p => (
              <li key={p.id} className="flex justify-between items-center p-2 border rounded">
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.email} • {p.phone}</div>
                </div>
                <div className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</div>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-3">Today's Appointments</h3>
          <ul className="space-y-2 max-h-48 overflow-auto">
            {todaysAppointments.length ? todaysAppointments.map(a => (
              <li key={a.id} className="flex justify-between items-center p-2 border rounded">
                <div>
                  <div className="font-semibold">{a.title} - {a.doctor}</div>
                  <div className="text-xs text-gray-500">{a.patientId} • {new Date(a.datetime).toLocaleTimeString()}</div>
                </div>
                <div className="text-sm text-gray-400">{a.status}</div>
              </li>
            )) : <div className="text-sm text-gray-500">No appointments today</div>}
          </ul>
        </section>
      </div>
    </motion.div>
  )
}

function PatientsPage({ patients, setPatients }) {
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', age: '', gender: '', phone: '', email: '', notes: '' })

  useEffect(() => {
    if (editing) setForm(editing)
    else setForm({ name: '', age: '', gender: '', phone: '', email: '', notes: '' })
  }, [editing])

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(filter.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(filter.toLowerCase())
  )

  const addOrUpdate = () => {
    if (!form.name) return alert('Name required')
    if (editing && editing.id) {
      const updated = patients.map(p => p.id === editing.id ? { ...p, ...form } : p)
      setPatients(updated); ls.set('patients', updated); setEditing(null)
    } else {
      const newP = { id: uid('P-'), createdAt: new Date().toISOString(), ...form }
      const updated = [newP, ...patients]
      setPatients(updated); ls.set('patients', updated); setEditing(null)
    }
    setForm({ name: '', age: '', gender: '', phone: '', email: '', notes: '' })
  }

  const remove = (id) => {
    if (!confirm('Delete patient?')) return
    const updated = patients.filter(p => p.id !== id)
    setPatients(updated); ls.set('patients', updated)
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Patients</h1>
        <div className="flex gap-2">
          <input placeholder="Search by name or email" value={filter} onChange={e => setFilter(e.target.value)} className="border px-3 py-2 rounded w-72" />
          <button onClick={() => setEditing({})} className={btnPrimary}>+ New Patient</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white p-4 rounded shadow overflow-auto max-h-[65vh]">
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm text-gray-500"><th>Name</th><th>Age</th><th>Email</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="py-2">{p.name}</td>
                  <td>{p.age}</td>
                  <td>{p.email}</td>
                  <td className="text-right">
                    <button onClick={() => setEditing(p)} className="mr-2 text-sm text-blue-600">Edit</button>
                    <button onClick={() => remove(p.id)} className="text-sm text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-3">{editing ? 'Edit Patient' : 'Add Patient'}</h3>
          <div className="space-y-2">
            <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border px-3 py-2 rounded" />
            <input placeholder="Age" type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} className="w-full border px-3 py-2 rounded" />
            <input placeholder="Gender" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="w-full border px-3 py-2 rounded" />
            <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full border px-3 py-2 rounded" />
            <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border px-3 py-2 rounded" />
            <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full border px-3 py-2 rounded" />
            <div className="flex gap-2 mt-2">
              <button onClick={addOrUpdate} className={btnPrimary}>Save</button>
              <button onClick={() => { setEditing(null); setForm({ name: '', age: '', gender: '', phone: '', email: '', notes: '' }) }} className={btnSecondary}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AppointmentsPage({ appointments, setAppointments, patients }) {
  const [form, setForm] = useState({ title: '', patientId: '', doctor: '', datetime: toLocalDateTimeInput(), status: 'Scheduled' })

  useEffect(() => {
    setForm(f => ({ ...f, datetime: toLocalDateTimeInput() }))
  }, [])

  const add = () => {
    if (!form.patientId) return alert('Choose patient')
    const newA = { ...form, id: uid('A-') }
    const updated = [newA, ...appointments]
    setAppointments(updated); ls.set('appointments', updated)
    setForm({ title: '', patientId: '', doctor: '', datetime: toLocalDateTimeInput(), status: 'Scheduled' })
  }

  const changeStatus = (id, status) => {
    const updated = appointments.map(a => a.id === id ? { ...a, status } : a)
    setAppointments(updated); ls.set('appointments', updated)
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Appointments</h1>

      <div className="bg-white p-4 rounded shadow">
        <div className="grid grid-cols-4 gap-3">
          <select value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })} className="border px-3 py-2 rounded">
            <option value="">Select patient</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <input placeholder="Doctor" value={form.doctor} onChange={e => setForm({ ...form, doctor: e.target.value })} className="border px-3 py-2 rounded" />
          <input type="datetime-local" value={form.datetime} onChange={e => setForm({ ...form, datetime: e.target.value })} className="border px-3 py-2 rounded" />
          <button onClick={add} className={btnPrimary}>Add</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow overflow-auto max-h-[65vh]">
        <table className="w-full">
          <thead className="text-sm text-gray-500"><tr><th>Patient</th><th>Doctor</th><th>Time</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {appointments.map(a => (
              <tr key={a.id} className="border-t hover:bg-gray-50">
                <td className="py-2">{patients.find(p => p.id === a.patientId)?.name || a.patientId}</td>
                <td>{a.doctor}</td>
                <td>{new Date(a.datetime).toLocaleString()}</td>
                <td><Pill>{a.status}</Pill></td>
                <td className="text-right">
                  <button onClick={() => changeStatus(a.id, 'Completed')} className="mr-2 text-sm">Complete</button>
                  <button onClick={() => changeStatus(a.id, 'Cancelled')} className="text-sm text-red-600">Cancel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MedicinesPage({ medicines, setMedicines }) {
  const [form, setForm] = useState({ name: '', stock: 0, price: 0 })

  const add = () => {
    if (!form.name) return alert('Provide medicine name')
    const newM = { id: uid('M-'), ...form }
    const updated = [newM, ...medicines]
    setMedicines(updated); ls.set('medicines', updated)
    setForm({ name: '', stock: 0, price: 0 })
  }

  const inc = (id) => {
    const updated = medicines.map(m => m.id === id ? { ...m, stock: m.stock + 1 } : m)
    setMedicines(updated); ls.set('medicines', updated)
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Medicines</h1>

      <div className="bg-white p-4 rounded shadow">
        <div className="grid grid-cols-3 gap-3">
          <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="border px-3 py-2 rounded" />
          <input placeholder="Stock" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} className="border px-3 py-2 rounded" />
          <input placeholder="Price" type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} className="border px-3 py-2 rounded" />
        </div>
        <div className="mt-3"><button onClick={add} className={btnPrimary}>Add Medicine</button></div>
      </div>

      <div className="bg-white p-4 rounded shadow overflow-auto max-h-[65vh]">
        <table className="w-full text-left">
          <thead className="text-sm text-gray-500"><tr><th>Name</th><th>Stock</th><th>Price</th><th></th></tr></thead>
          <tbody>
            {medicines.map(m => (
              <tr key={m.id} className="border-t hover:bg-gray-50">
                <td className="py-2">{m.name}</td>
                <td>{m.stock}</td>
                <td>{m.price}</td>
                <td className="text-right"><button onClick={() => inc(m.id)} className="text-sm">+1</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AnalyticsPage({ patients, appointments, medicines }) {
  const patientsByGender = useMemo(() => {
    const map = {}
    patients.forEach(p => map[p.gender] = (map[p.gender] || 0) + 1)
    return Object.keys(map).map(k => ({ name: k || 'U', value: map[k] }))
  }, [patients])

  const appointmentsByDoctor = useMemo(() => {
    const map = {}
    appointments.forEach(a => map[a.doctor] = (map[a.doctor] || 0) + 1)
    return Object.entries(map).map(([k, v]) => ({ name: k, value: v }))
  }, [appointments])

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Analytics</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Patients by Gender</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={patientsByGender} dataKey="value" nameKey="name" outerRadius={80} label>
                  {patientsByGender.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Appointments by Doctor</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={appointmentsByDoctor}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name"/><YAxis/><Tooltip/><Legend/><Bar dataKey="value" /></BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow col-span-2">
          <h3 className="font-semibold mb-2">Medicine Stock Overview</h3>
          <table className="w-full text-left border-t">
            <thead className="text-sm text-gray-500"><tr><th>Medicine</th><th>Stock</th><th>Price</th></tr></thead>
            <tbody>
              {medicines.map(m => (<tr key={m.id} className="border-t"><td className="py-2">{m.name}</td><td>{m.stock}</td><td>{m.price}</td></tr>))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ReportsPage({ patients, appointments }) {
  const downloadCSV = (data, filename = 'export.csv') => {
    if (!data || !data.length) return alert('No data to export')
    const keys = Object.keys(data[0] || {})
    const rows = [keys.join(','), ...data.map(d => keys.map(k => `"${String(d[k]||'').replace(/"/g, '""')}"`).join(','))]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Reports</h1>
      <div className="bg-white p-4 rounded shadow">
        <div className="flex gap-2">
          <button onClick={() => downloadCSV(patients, 'patients.csv')} className={btnPrimary}>Export Patients CSV</button>
          <button onClick={() => downloadCSV(appointments, 'appointments.csv')} className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition">Export Appointments CSV</button>
          <button onClick={() => alert('PDF Export stub - integrate jsPDF or server-side renderer for production')} className={btnSecondary}>Export PDF (stub)</button>
        </div>
      </div>
    </div>
  )
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')

  const handleLogin=async(e)=>{
    e.preventDefault();
    try{
        const res=await axios.post("http://127.0.0.1:8000/auth/login",{
            email:email,
            password:pass
        }
        )
        if(res.status===200){
            onLogin({ email })
        }
    }
    catch(err){
        console.log("Error");
    }
  }

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 to-indigo-600">
      <div className="bg-white p-8 rounded shadow w-96">
        <h2 className="text-xl font-bold mb-4">MediDash/Sign in</h2>
        <label className="block text-sm text-gray-600 mb-1">Email</label>
        <input className="w-full border px-3 py-2 rounded mb-3" value={email} onChange={e => setEmail(e.target.value)} />
        <label className="block text-sm text-gray-600 mb-1">Password</label>
        <input type="password" className="w-full border px-3 py-2 rounded mb-4" value={pass} onChange={e => setPass(e.target.value)} />
        <div className="flex gap-2">
          <button className={btnPrimary} onClick={handleLogin}>Login</button>
          <button className={btnSecondary} onClick={() => { setEmail('guest@clinic.com'); setPass('guest') }}>Guest</button>
        </div>
      </div>
    </div>
  )
}

export default function HospitalManagementReact_App() {
  const [patients, setPatients] = useState(() => initSamplePatients())
  const [appointments, setAppointments] = useState(() => initSampleAppointments())
  const [medicines, setMedicines] = useState(() => initSampleMedicines())
  const [user, setUser] = useState(() => ls.get('user', null))
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => ls.set('patients', patients), [patients])
  useEffect(() => ls.set('appointments', appointments), [appointments])
  useEffect(() => ls.set('medicines', medicines), [medicines])

  const handleLogin = (u) => {
    ls.set('user', u); setUser(u)
  }
  const handleLogout = () => {
    ls.set('user', null); setUser(null)
  }

  if (!user) return <Login onLogin={handleLogin} />

  return (
    <Router>
      <div className="flex min-h-screen bg-gray-100 text-gray-800">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header onSearch={setSearchQuery} onLogout={handleLogout} />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard patients={patients} appointments={appointments} medicines={medicines} />} />
              <Route path="/patients" element={<PatientsPage patients={patients} setPatients={setPatients} />} />
              <Route path="/appointments" element={<AppointmentsPage appointments={appointments} setAppointments={setAppointments} patients={patients} />} />
              <Route path="/medicines" element={<MedicinesPage medicines={medicines} setMedicines={setMedicines} />} />
              <Route path="/analytics" element={<AnalyticsPage patients={patients} appointments={appointments} medicines={medicines} />} />
              <Route path="/reports" element={<ReportsPage patients={patients} appointments={appointments} />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}
