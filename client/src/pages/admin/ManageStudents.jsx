import { useEffect, useState } from 'react'
import api from '../../api/axios.js'
import { toast } from 'react-toastify'

export default function ManageStudents() {
  const [students, setStudents] = useState([])

  const load = async () => {
    const { data } = await api.get('/admin/students')
    setStudents(data)
  }

  useEffect(()=>{ load() }, [])

  const updateStatus = async (id, status) => {
    try {
      const { data } = await api.patch(`/admin/students/${id}/status`, { status })
      setStudents(prev => prev.map(s => s._id === id ? data : s))
      toast.success('Status updated')
    } catch (e) {
      toast.error('Failed to update')
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Manage Students</h2>
      {students.map(s => (
        <div key={s._id} className="card flex items-center justify-between">
          <div>
            <p className="font-semibold">{s.name}</p>
            <p className="text-sm text-slate-600">{s.email} · ID: {s.studentId || '-'}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${s.status==='active'?'text-green-600':'text-red-600'}`}>{s.status}</span>
            {s.status === 'active' ? (
              <button className="btn btn-outline" onClick={()=>updateStatus(s._id, 'banned')}>Ban</button>
            ) : (
              <button className="btn btn-primary" onClick={()=>updateStatus(s._id, 'active')}>Approve</button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
