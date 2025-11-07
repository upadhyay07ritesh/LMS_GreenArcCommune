import { useEffect, useState } from 'react'
import api from '../../api/axios.js'
import { motion } from 'framer-motion'
import { HiUsers, HiBookOpen, HiCheckCircle, HiChartBar, HiArrowTrendingUp, HiClock } from 'react-icons/hi2'

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 dark:border-slate-700 dark:border-t-primary-500"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Students',
      value: stats?.totalStudents ?? 0,
      icon: HiUsers,
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-500',
      lightBg: 'bg-blue-50 dark:bg-blue-950/30',
      textColor: 'text-blue-600 dark:text-blue-400',
      change: '+12%',
      trend: 'up'
    },
    {
      label: 'Total Courses',
      value: stats?.totalCourses ?? 0,
      icon: HiBookOpen,
      gradient: 'from-primary-500 to-primary-600',
      iconBg: 'bg-primary-600',
      lightBg: 'bg-primary-50 dark:bg-primary-950/30',
      textColor: 'text-primary-600 dark:text-primary-400',
      change: '+8%',
      trend: 'up'
    },
    {
      label: 'Active Courses',
      value: stats?.activeCourses ?? 0,
      icon: HiCheckCircle,
      gradient: 'from-green-500 to-green-600',
      iconBg: 'bg-green-500',
      lightBg: 'bg-green-50 dark:bg-green-950/30',
      textColor: 'text-green-600 dark:text-green-400',
      change: '+5%',
      trend: 'up'
    },
    {
      label: 'Total Enrollments',
      value: stats?.totalEnrollments ?? 0,
      icon: HiChartBar,
      gradient: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-500',
      lightBg: 'bg-purple-50 dark:bg-purple-950/30',
      textColor: 'text-purple-600 dark:text-purple-400',
      change: '+18%',
      trend: 'up'
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <HiClock className="w-4 h-4" />
            Overview of your LMS platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-primary-50 dark:bg-primary-950/30 rounded-lg border border-primary-200 dark:border-primary-800">
            <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">Last updated</p>
            <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">Just now</p>
          </div>
        </div>
      </div>

      {/* Stats Grid - Enhanced Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              {/* Gradient Background Effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
              
              <div className="relative">
                {/* Icon */}
                <div className={`${stat.lightBg} w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-7 h-7 ${stat.textColor}`} />
                </div>

                {/* Label */}
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {stat.label}
                </p>

                {/* Value */}
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {stat.value.toLocaleString()}
                  </p>
                  
                  {/* Trend Badge */}
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                    stat.trend === 'up' 
                      ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' 
                      : 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                  }`}>
                    <HiArrowTrendingUp className={`w-3 h-3 ${stat.trend === 'down' ? 'rotate-180' : ''}`} />
                    <span className="text-xs font-semibold">{stat.change}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Quick Actions</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Manage your platform efficiently</p>
          </div>
          
          <div className="p-6 space-y-3">
            <a 
              href="/admin/courses" 
              className="group flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-950/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <HiBookOpen className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    Manage Courses
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Create, edit, or delete courses</p>
                </div>
              </div>
              <HiArrowTrendingUp className="w-5 h-5 text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 group-hover:translate-x-1 transition-all rotate-90" />
            </a>

            <a 
              href="/admin/students" 
              className="group flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <HiUsers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Manage Students
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">View and manage student accounts</p>
                </div>
              </div>
              <HiArrowTrendingUp className="w-5 h-5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all rotate-90" />
            </a>

            <a 
              href="/admin/analytics" 
              className="group flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <HiChartBar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    View Analytics
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Detailed analytics and reports</p>
                </div>
              </div>
              <HiArrowTrendingUp className="w-5 h-5 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-1 transition-all rotate-90" />
            </a>
          </div>
        </motion.div>

        {/* Platform Status Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Platform Status</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Real-time platform metrics</p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Active Students */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Active Students</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats?.activeStudents ?? 0}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(((stats?.activeStudents ?? 0) / (stats?.totalStudents ?? 1)) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {Math.round(((stats?.activeStudents ?? 0) / (stats?.totalStudents ?? 1)) * 100)}% of total students
              </p>
            </div>

            {/* Published Courses */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Published Courses</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats?.activeCourses ?? 0} / {stats?.totalCourses ?? 0}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(((stats?.activeCourses ?? 0) / (stats?.totalCourses ?? 1)) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {Math.round(((stats?.activeCourses ?? 0) / (stats?.totalCourses ?? 1)) * 100)}% courses are active
              </p>
            </div>

            {/* System Health */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">System Health</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">Operational</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}