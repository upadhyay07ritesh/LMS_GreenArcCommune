import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../slices/authSlice.js'
import { motion } from 'framer-motion'
import DarkModeToggle from '../components/DarkModeToggle.jsx'
import NotificationBanner from '../components/NotificationBanner.jsx'
import AdminMessages from '../pages/admin/AdminMessages.jsx'
import { HiHome, HiBookOpen, HiUsers, HiChartBar, HiLink, HiArrowRightOnRectangle, HiBars3, HiXMark, HiShieldCheck } from 'react-icons/hi2'
import { useState } from 'react'

export default function AdminLayout() {
  const dispatch = useDispatch()
  const { user } = useSelector(s => s.auth)
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: HiHome },
    { path: '/admin/courses', label: 'Courses', icon: HiBookOpen },
    { path: '/admin/students', label: 'Students', icon: HiUsers },
    { path: '/admin/analytics', label: 'Analytics', icon: HiChartBar },
    { path: "/admin/course-live-sessions", label: "Course Live Sessions", icon: HiLink },

  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <NotificationBanner />
      
      {/* Navbar */}
      <header className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-40 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
                <HiShieldCheck className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white hidden sm:block">
                Admin Panel
              </h1>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              <DarkModeToggle />
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Admin</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn btn-outline flex items-center gap-2"
                >
                  <HiArrowRightOnRectangle className="w-4 h-4" />
                  <span className="hidden lg:inline">Logout</span>
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {mobileMenuOpen ? (
                  <HiXMark className="w-6 h-6" />
                ) : (
                  <HiBars3 className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            <nav className="px-4 py-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="px-4 py-2 mb-2">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Admin</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <HiArrowRightOnRectangle className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
        <AdminMessages />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-slate-600 dark:text-slate-400">
            <p>© 2025 GreenArc Commune LMS - Admin Portal</p>
          </div>
        </div>
      </footer>
    </div>
  )
}