import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios.js'
import { toast } from 'react-toastify'
import { motion } from 'framer-motion'
import {
  HiMagnifyingGlass,
  HiFunnel,
  HiUsers,
  HiCheckCircle,
  HiNoSymbol,
  HiUserCircle,
  HiEnvelope,
  HiIdentification,
  HiAcademicCap,
  HiPlus
} from 'react-icons/hi2'

export default function ManageStudents() {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const { data } = await api.get('/admin/students')
      setStudents(data)
    } catch (error) {
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (id, status) => {
    const action = status === 'banned' ? 'ban' : 'approve'
    if (!confirm(`Are you sure you want to ${action} this student?`)) return

    try {
      const { data } = await api.patch(`/admin/students/${id}/status`, { status })
      setStudents(prev => prev.map(s => s._id === id ? data : s))
      toast.success(`Student ${action}ned successfully`)
    } catch (e) {
      toast.error(`Failed to ${action} student`)
    }
  }

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.studentId && student.studentId.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = filterStatus === 'All' || student.status === filterStatus.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: students.length,
    active: students.filter(s => s.status === 'active').length,
    banned: students.filter(s => s.status === 'banned').length
  }

  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Get avatar color based on name
  const getAvatarColor = (name) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-yellow-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-teal-500'
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 dark:border-slate-700 dark:border-t-primary-500"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">Loading students...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Manage Students</h1>
          <p className="text-slate-600 dark:text-slate-400">View and manage student accounts and enrollments</p>
        </div>
        <button
          onClick={() => navigate('/admin/add-student')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-lg hover:shadow-xl"
        >
          <HiPlus className="w-5 h-5" />
          Add Student
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Students</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/30 rounded-lg flex items-center justify-center">
              <HiUsers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Active Students</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-950/30 rounded-lg flex items-center justify-center">
              <HiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Banned Students</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.banned}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-950/30 rounded-lg flex items-center justify-center">
              <HiNoSymbol className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or student ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <HiFunnel className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all appearance-none"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Banned">Banned</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Students Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Student ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                        <HiUsers className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 font-medium">No students found</p>
                      <p className="text-sm text-slate-500 dark:text-slate-500">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-full ${getAvatarColor(student.name)} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white font-semibold text-sm">
                            {getInitials(student.name)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{student.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <HiEnvelope className="w-4 h-4 text-slate-400" />
                        {student.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <HiIdentification className="w-4 h-4 text-slate-400" />
                        {student.studentId || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${student.status === 'active'
                          ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                        }`}>
                        {student.status === 'active' ? (
                          <>
                            <HiCheckCircle className="w-3.5 h-3.5" />
                            Active
                          </>
                        ) : (
                          <>
                            <HiNoSymbol className="w-3.5 h-3.5" />
                            Banned
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {student.status === 'active' ? (
                          <button
                            onClick={() => updateStatus(student._id, 'banned')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-950/50 transition-colors text-sm font-medium"
                          >
                            <HiNoSymbol className="w-4 h-4" />
                            Ban
                          </button>
                        ) : (
                          <button
                            onClick={() => updateStatus(student._id, 'active')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-950/50 transition-colors text-sm font-medium"
                          >
                            <HiCheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Count */}
        {filteredStudents.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Showing <span className="font-semibold text-slate-900 dark:text-white">{filteredStudents.length}</span> of{' '}
              <span className="font-semibold text-slate-900 dark:text-white">{students.length}</span> students
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}