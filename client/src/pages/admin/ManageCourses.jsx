import { useEffect, useState } from 'react'
import api from '../../api/axios.js'
import { toast } from 'react-toastify'

const emptyCourse = {
  title: '',
  description: '',
  thumbnail: '',
  category: 'Other',
  difficulty: 'Beginner',
  instructor: 'Admin',
  published: false,
  contents: []
}

export default function ManageCourses() {
  const [courses, setCourses] = useState([])
  const [form, setForm] = useState(emptyCourse)
  const [editingId, setEditingId] = useState(null)
  const [uploading, setUploading] = useState(false)

  const load = async () => {
    const { data } = await api.get('/courses')
    setCourses(data)
  }
  useEffect(()=>{ load() }, [])

  const saveCourse = async () => {
    try {
      if (editingId) {
        const { data } = await api.put(`/courses/${editingId}`, form)
        setCourses(prev => prev.map(c => c._id === editingId ? data : c))
        toast.success('Course updated')
      } else {
        const { data } = await api.post('/courses', form)
        setCourses(prev => [data, ...prev])
        toast.success('Course created')
      }
      setForm(emptyCourse)
      setEditingId(null)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed')
    }
  }

  const editCourse = (c) => {
    setEditingId(c._id)
    setForm({
      title: c.title || '',
      description: c.description || '',
      thumbnail: c.thumbnail || '',
      category: c.category || 'Other',
      difficulty: c.difficulty || 'Beginner',
      instructor: c.instructor || 'Admin',
      published: c.published || false,
      contents: c.contents || []
    })
  }

  const delCourse = async (id) => {
    if (!confirm('Delete this course?')) return
    await api.delete(`/courses/${id}`)
    setCourses(prev => prev.filter(c => c._id !== id))
    toast.success('Deleted')
  }

  const addContent = (type) => {
    setForm(f => ({...f, contents: [...(f.contents||[]), { title: '', type, url: '', quiz: { questions: [] }}]}))
  }

  const handleUpload = async (file, idx) => {
    try {
      setUploading(true)
      const fd = new FormData(); fd.append('file', file)
      const { data } = await api.post('/admin/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm(f => {
        const copy = { ...f }
        copy.contents[idx].url = data.url
        return copy
      })
      toast.success('Uploaded')
    } catch (e) {
      toast.error('Upload failed')
    } finally { setUploading(false) }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card">
        <h3 className="font-semibold mb-3">{editingId? 'Edit' : 'Create'} Course</h3>
        <div className="space-y-3">
          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e)=>setForm({...form, title: e.target.value})} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={(e)=>setForm({...form, description: e.target.value})} />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={(e)=>setForm({...form, category: e.target.value})}>
                <option value="Programming">Programming</option>
                <option value="Design">Design</option>
                <option value="Business">Business</option>
                <option value="Marketing">Marketing</option>
                <option value="Science">Science</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Difficulty</label>
              <select className="input" value={form.difficulty} onChange={(e)=>setForm({...form, difficulty: e.target.value})}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Instructor</label>
            <input className="input" value={form.instructor} onChange={(e)=>setForm({...form, instructor: e.target.value})} placeholder="Instructor name" />
          </div>
          <div>
            <label className="label">Thumbnail URL (optional)</label>
            <input className="input" type="url" value={form.thumbnail} onChange={(e)=>setForm({...form, thumbnail: e.target.value})} placeholder="https://example.com/image.jpg" />
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.published} onChange={(e)=>setForm({...form, published: e.target.checked})} /> Published
          </label>

          <div className="border rounded p-3">
            <div className="flex gap-2 mb-3">
              <button className="btn btn-outline" onClick={()=>addContent('video')}>+ Video</button>
              <button className="btn btn-outline" onClick={()=>addContent('pdf')}>+ PDF</button>
              <button className="btn btn-outline" onClick={()=>addContent('quiz')}>+ Quiz</button>
            </div>
            <div className="space-y-3">
              {(form.contents||[]).map((c, idx) => (
                <div key={idx} className="border rounded p-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Content Title</label>
                      <input className="input" value={c.title} onChange={(e)=>{
                        const copy = { ...form }; copy.contents[idx].title = e.target.value; setForm(copy)
                      }} />
                    </div>
                    <div>
                      <label className="label">Type</label>
                      <select className="input" value={c.type} onChange={(e)=>{
                        const copy = { ...form }; copy.contents[idx].type = e.target.value; setForm(copy)
                      }}>
                        <option value="video">video</option>
                        <option value="pdf">pdf</option>
                        <option value="quiz">quiz</option>
                      </select>
                    </div>
                  </div>

                  {(c.type === 'video' || c.type === 'pdf') && (
                    <div className="mt-2">
                      <label className="label">File</label>
                      <div className="flex items-center gap-2">
                        <input type="file" onChange={(e)=> e.target.files[0] && handleUpload(e.target.files[0], idx)} />
                        {uploading && <span className="text-xs">Uploading...</span>}
                        {c.url && <a className="text-primary underline text-sm" href={c.url} target="_blank" rel="noreferrer">Open</a>}
                      </div>
                    </div>
                  )}

                  {c.type === 'quiz' && (
                    <div className="mt-2 text-sm text-slate-600">Add quiz questions later (MVP)</div>
                  )}

                  <div className="mt-2 text-xs text-slate-500">URL: {c.url || '-'}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={saveCourse}>{editingId? 'Update' : 'Create'}</button>
            {editingId && <button className="btn btn-outline" onClick={()=>{setEditingId(null); setForm(emptyCourse)}}>Cancel</button>}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {courses.map(c => (
          <div key={c._id} className="card flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold">{c.title}</p>
              <p className="text-sm text-slate-600">{c.description}</p>
              <span className={`text-xs inline-block mt-1 ${c.published? 'text-green-600' : 'text-slate-500'}`}>{c.published? 'Published' : 'Draft'}</span>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-outline" onClick={()=>editCourse(c)}>Edit</button>
              <button className="btn btn-outline" onClick={()=>delCourse(c._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
