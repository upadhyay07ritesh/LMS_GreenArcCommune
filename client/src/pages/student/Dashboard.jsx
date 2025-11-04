import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { myEnrollments, fetchCourses } from '../../slices/courseSlice.js'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiBookOpen, HiAcademicCap, HiCheckCircle, HiArrowRight, HiChartBar } from 'react-icons/hi2'

export default function Dashboard() {
  const dispatch = useDispatch()
  const { enrollments, items } = useSelector(s => s.courses)
  const { user } = useSelector(s => s.auth)

  useEffect(() => {
    dispatch(myEnrollments())
    dispatch(fetchCourses())
  }, [dispatch])

  const totalEnrollments = enrollments.length
  const completedCourses = enrollments.filter(e => e.progress === 100).length
  const inProgressCourses = enrollments.filter(e => e.progress > 0 && e.progress < 100).length
  const avgProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
    : 0

  const stats = [
    { label: 'Total Enrollments', value: totalEnrollments, icon: HiBookOpen, color: 'bg-blue-500' },
    { label: 'In Progress', value: inProgressCourses, icon: HiChartBar, color: 'bg-yellow-500' },
    { label: 'Completed', value: completedCourses, icon: HiCheckCircle, color: 'bg-green-500' },
  { label: 'Avg Progress', value: `${avgProgress}%`, icon: HiAcademicCap, color: 'bg-primary-600' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white"
      >
        <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.name}! 👋</h2>
        <p className="text-primary-100">Continue your learning journey and track your progress.</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Enrollments */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">My Courses</h3>
            <Link
              to="/student/courses"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
            >
              View all
              <HiArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {enrollments.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <HiBookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No enrollments yet.</p>
                <Link to="/student/courses" className="text-primary-600 dark:text-primary-400 hover:underline mt-2 inline-block">
                  Browse courses
                </Link>
              </div>
            ) : (
              enrollments.slice(0, 5).map((e) => (
                <Link
                  key={e.id}
                  to={`/student/courses/${e.course._id}`}
                  className="block p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                      {e.course.title}
                    </h4>
                    <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                      {e.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${e.progress}%` }}
                    />
                  </div>
                </Link>
              ))
            )}
          </div>
        </motion.div>

        {/* Available Courses */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Available Courses</h3>
            <Link
              to="/student/courses"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
            >
              View all
              <HiArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <HiBookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No courses available.</p>
              </div>
            ) : (
              items.slice(0, 5).map((c) => (
                <Link
                  key={c._id}
                  to={`/student/courses/${c._id}`}
                  className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-md transition-all group"
                >
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                      {c.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {c.category} • {c.difficulty}
                    </p>
                  </div>
                  <HiArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                </Link>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}