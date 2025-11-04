import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getProfile, updateProfile } from '../../slices/profileSlice.js'
import { toast } from 'react-toastify'
import { motion } from 'framer-motion'
import { HiPencil, HiCheck, HiXMark, HiCamera } from 'react-icons/hi2'
import { useNavigate } from 'react-router-dom'
import { logout } from '../../slices/authSlice.js'
import {HiArrowRightOnRectangle } from 'react-icons/hi2'

function ChangePasswordButton({ authUser }) {
  const navigate = useNavigate()
  const handle = () => {
    const path = authUser?.role === 'admin' ? '/admin/change-password' : '/student/change-password'
    navigate(path)
  }
  return (
    <button onClick={handle} className="btn btn-outline hidden sm:inline">
      Change Password
    </button>
  )
}

export default function Profile() {
  const dispatch = useDispatch()
  const { user, loading } = useSelector(s => s.profile)
  const authUser = useSelector(s => s.auth.user)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    password: '',
    avatar: '',
  })

  useEffect(() => {
    if (!user && authUser) {
      dispatch(getProfile())
    } else if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        studentId: user.studentId || '',
        password: '',
        avatar: user.avatar || '',
      })
    }
  }, [dispatch, user, authUser])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const updateData = { ...formData }
    if (!updateData.password) delete updateData.password
    if (!updateData.avatar) delete updateData.avatar

    const res = await dispatch(updateProfile(updateData))
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success('Profile updated successfully!')
      setIsEditing(false)
      setFormData({ ...formData, password: '' })
    } else {
      toast.error(res.payload || 'Failed to update profile')
    }
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        studentId: user.studentId || '',
        password: '',
        avatar: user.avatar || '',
      })
    }
    setIsEditing(false)
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }
  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const displayUser = user || authUser
  if (!displayUser) {
    return (
      <div className="card text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        <p className="mt-4 text-slate-600 dark:text-slate-400">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
              {formData.avatar || displayUser.avatar ? (
                <img
                  src={formData.avatar || displayUser.avatar}
                  alt={displayUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                displayUser.name?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            {isEditing && (
              <label className="absolute bottom-0 right-0 bg-primary-500 text-white rounded-full p-2 cursor-pointer hover:bg-primary-600 transition-colors">
                <HiCamera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {displayUser.name}
            </h2>
            <p className="text-slate-600 dark:text-slate-400">{displayUser.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium capitalize">
              {displayUser.role}
            </span>
          </div>
          {!isEditing && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-primary flex items-center gap-2"
              >
                <HiPencil className="w-4 h-4" />
                Edit Profile
              </button>
              <ChangePasswordButton authUser={authUser} />
            </div>
          )}
        </div>
      </motion.div>

      {/* Profile Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Profile Information</h3>
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Student ID</label>
              <input
                className="input"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              />
            </div>
            {/* Password changes handled on the separate Change Password page */}
            <div className="flex gap-2 pt-2">
              <button type="submit" className="btn btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
                <HiCheck className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-outline flex items-center justify-center gap-2"
              >
                <HiXMark className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Name</p>
              <p className="font-medium text-slate-900 dark:text-white">{displayUser.name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Student ID</p>
              <p className="font-medium text-slate-900 dark:text-white">{displayUser.studentId || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Email</p>
              <p className="font-medium text-slate-900 dark:text-white">{displayUser.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Role</p>
              <p className="font-medium text-slate-900 dark:text-white capitalize">{displayUser.role}</p>
            </div>
            <div>
              <button
                  onClick={handleLogout}
                  className="btn btn-outline btn-sm flex items-center gap-2"
                >
                  <HiArrowRightOnRectangle className="w-4 h-4" />
                  <span className="hidden lg:inline">Logout</span>
                </button>
            </div>
            
          </div>
          
        )}
      </motion.div>
    </div>
  )
}
