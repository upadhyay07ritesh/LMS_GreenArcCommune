import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import { meThunk } from '../slices/authSlice.js'

export default function ProtectedRoute() {
  const dispatch = useDispatch()
  const { token: reduxToken, user } = useSelector(s => s.auth)
  const location = useLocation()
  const [checking, setChecking] = useState(false)
  const [tried, setTried] = useState(false)

  const storedToken =
    reduxToken || localStorage.getItem('adminToken') || localStorage.getItem('token')

  useEffect(() => {
    if (storedToken && !user && !checking && !tried) {
      setChecking(true)
      dispatch(meThunk())
        .finally(() => {
          setChecking(false)
          setTried(true)
        })
    }
  }, [storedToken, user, checking, tried, dispatch])

  if (!storedToken) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (checking || (storedToken && !user && !tried)) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-500">
        Checking session...
      </div>
    )
  }

  if (storedToken && tried && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
