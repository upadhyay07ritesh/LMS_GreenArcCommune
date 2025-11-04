import { useState, useMemo, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import api from '../../api/axios.js'
import { useNavigate } from 'react-router-dom'
import { HiEye, HiEyeSlash, HiShieldCheck, HiLockClosed } from 'react-icons/hi2'

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const navigate = useNavigate()
  const user = useSelector((s) => s.auth.user)
  const currentRef = useRef(null)
  const newRef = useRef(null)
  const confirmRef = useRef(null)
  const errorRef = useRef(null)
  const successRef = useRef(null)
  const modalRef = useRef(null)
  const [showModal, setShowModal] = useState(false)

  // password strength: simple heuristic
  const strength = useMemo(() => {
    if (!newPassword) return { score: 0, label: 'Empty' }
    let score = 0
    if (newPassword.length >= 8) score++
    if (/[A-Z]/.test(newPassword)) score++
    if (/[0-9]/.test(newPassword)) score++
    if (/[^A-Za-z0-9]/.test(newPassword)) score++
    const label = score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong'
    return { score, label }
  }, [newPassword])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    // Client-side validations with focus management for accessibility
    if (!currentPassword) {
      setError('Current password is required')
      currentRef.current?.focus()
      return
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      newRef.current?.focus()
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      confirmRef.current?.focus()
      return
    }
    setLoading(true)
    try {
      const { data } = await api.patch('/profile/password', { currentPassword, newPassword })
      setSuccess(data.message || 'Password changed')
      // show accessible success modal, focus it, then redirect
      setShowModal(true)
      setTimeout(() => {
        setShowModal(false)
        if (user?.role === 'admin') navigate('/admin')
        else navigate('/student')
      }, 1200)
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  // When error appears, move focus to error region for screen readers
  useEffect(() => {
    if (error) {
      errorRef.current?.focus()
    }
  }, [error])

  // When success appears, move focus to success region
  useEffect(() => {
    if (success) {
      successRef.current?.focus()
    }
  }, [success])

  // focus modal when it appears
  useEffect(() => {
    if (showModal) {
      modalRef.current?.focus()
    }
  }, [showModal])

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-lg bg-primary-600 flex items-center justify-center text-white">
          <HiShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Change Password</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Securely update your account password</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        {error && (
          <div
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            aria-live="assertive"
            className="text-sm text-red-600 dark:text-red-400 p-3 rounded bg-red-50 dark:bg-red-900/20"
          >
            {error}
          </div>
        )}
        {success && (
          <div
            ref={successRef}
            tabIndex={-1}
            role="status"
            aria-live="polite"
            className="text-sm text-green-700 dark:text-green-300 p-3 rounded bg-green-50 dark:bg-green-900/20"
          >
            {success}
          </div>
        )}

        <div>
          <label className="block text-sm text-slate-700 dark:text-slate-300">Current Password</label>
          <div className="relative mt-1">
            <input
              id="currentPassword"
              ref={currentRef}
              type={showCurrent ? 'text' : 'password'}
              required
              aria-required="true"
              aria-invalid={error ? true : false}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="block w-full p-3 rounded border bg-transparent"
            />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-2 top-2 text-slate-500">
              {showCurrent ? <HiEyeSlash className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-700 dark:text-slate-300">New Password</label>
          <div className="relative mt-1">
            <input
              id="newPassword"
              ref={newRef}
              type={showNew ? 'text' : 'password'}
              required
              aria-required="true"
              aria-invalid={newPassword && newPassword.length < 6}
              aria-describedby="password-strength"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="block w-full p-3 rounded border bg-transparent"
            />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-2 top-2 text-slate-500">
              {showNew ? <HiEyeSlash className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
            </button>
          </div>
          <div className="mt-2 flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between text-xs">
              <div className="text-slate-500 dark:text-slate-400">Strength: <span className="font-medium">{strength.label}</span></div>
              <div className="w-32 h-2 bg-slate-100 rounded overflow-hidden">
                <div className={`h-full bg-primary-500 rounded transition-all`} style={{ width: `${(strength.score / 4) * 100}%` }} />
              </div>
            </div>
            {/* Live description for screen readers */}
            <div id="password-strength" aria-live="polite" className="sr-only">
              Password strength is {strength.label}. {strength.score < 2 ? 'Consider adding numbers, uppercase letters or special characters.' : ''}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-700 dark:text-slate-300">Confirm New Password</label>
          <div className="relative mt-1">
            <input
              id="confirmPassword"
              ref={confirmRef}
              type={showConfirm ? 'text' : 'password'}
              required
              aria-required="true"
              aria-invalid={confirmPassword && confirmPassword !== newPassword}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full p-3 rounded border bg-transparent"
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-2 top-2 text-slate-500">
              {showConfirm ? <HiEyeSlash className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
            </button>
          </div>
          {confirmPassword && confirmPassword !== newPassword && (
            <p className="mt-2 text-xs text-red-600">Passwords do not match</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading || !newPassword || newPassword !== confirmPassword || newPassword.length < 6} className="px-4 py-2 bg-primary-600 text-white rounded disabled:opacity-60">{loading ? 'Saving...' : 'Change Password'}</button>
          <button type="button" onClick={() => { if (user?.role === 'admin') navigate('/admin'); else navigate('/student') }} className="px-4 py-2 border rounded">Cancel</button>
        </div>
        {/* Success modal (simple animated) */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div
              ref={modalRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              className="relative bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg transform transition-all duration-200 ease-out"
              style={{ minWidth: 320 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-green-600 text-white flex items-center justify-center">
                  <HiLockClosed className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Password updated</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Your password was changed successfully.</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
