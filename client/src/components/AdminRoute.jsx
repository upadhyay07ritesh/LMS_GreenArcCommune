import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

export default function AdminRoute() {
  const { token, user } = useSelector(s => s.auth)
  const location = useLocation()
  if (!token || !user) return <Navigate to="/login" state={{ from: location }} replace />
  if (user.role !== 'admin') return <Navigate to="/student" replace />
  return <Outlet />
}
