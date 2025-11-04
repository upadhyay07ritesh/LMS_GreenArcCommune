import { useState } from 'react'
import api from '../../api/axios.js'
import { useNavigate } from 'react-router-dom'

export default function AddAdmin() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const payload = { name: name.trim(), email: email.trim() }
      const { data } = await api.post('/admin-management/admins', payload)
      setSuccess('Admin created successfully.')
      // Optionally redirect to admin list
      setTimeout(() => navigate('/admin/students'), 800)
    } catch (err) {
      console.error('Failed to add admin', err)
      setError(err?.response?.data?.message || err.message || 'Failed to add admin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">Add Admin</h2>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded">{error}</div>
        )}
        {success && (
          <div className="text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 p-3 rounded">{success}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2"
            placeholder="Full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2"
            placeholder="admin@example.com"
          />
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-60">
            {loading ? 'Creating...' : 'Create Admin'}
          </button>
          <button type="button" onClick={() => navigate('/admin')} className="px-4 py-2 border rounded">Cancel</button>
        </div>
      </form>
    </div>
  )
}
