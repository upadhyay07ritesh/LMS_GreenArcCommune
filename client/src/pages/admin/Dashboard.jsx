import { useEffect, useState } from 'react'
import api from '../../api/axios.js'
import { motion } from 'framer-motion'
import { HiUsers, HiBookOpen, HiCheckCircle, HiChartBar } from 'react-icons/hi2'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const { data } = await api.get('/admin/analytics')
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="card text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        <p className="mt-4 text-slate-600 dark:text-slate-400">Loading dashboard...</p>
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Students',
      value: stats?.totalStudents ?? 0,
      icon: HiUsers,
      color: 'bg-blue-500',
      bgGradient: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Total Courses',
      value: stats?.totalCourses ?? 0,
      icon: HiBookOpen,
      color: 'bg-primary-600',
      bgGradient: 'from-primary-500 to-primary-600',
    },
    {
      label: 'Active Courses',
      value: stats?.activeCourses ?? 0,
      icon: HiCheckCircle,
      color: 'bg-green-500',
      bgGradient: 'from-green-500 to-green-600',
    },
    {
      label: 'Total Enrollments',
      value: stats?.totalEnrollments ?? 0,
      icon: HiChartBar,
      color: 'bg-yellow-500',
      bgGradient: 'from-yellow-500 to-yellow-600',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">GAC  Admin Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400">Overview of LMS platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="card bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-4 rounded-xl shadow-lg`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Additional Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <a href="/admin/courses" className="block p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <p className="font-medium text-slate-900 dark:text-white">Manage Courses</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Create, edit, or delete courses</p>
            </a>
            <a href="/admin/students" className="block p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <p className="font-medium text-slate-900 dark:text-white">Manage Students</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">View and manage student accounts</p>
            </a>
            <a href="/admin/analytics" className="block p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <p className="font-medium text-slate-900 dark:text-white">View Analytics</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Detailed analytics and reports</p>
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Platform Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Active Students</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {stats?.activeStudents ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Published Courses</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {stats?.activeCourses ?? 0} / {stats?.totalCourses ?? 0}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}