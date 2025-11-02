import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

export default function ProtectedRoute() {
  const { token, user } = useSelector(s => s.auth)
  const location = useLocation()
  if (!token || !user) return <Navigate to="/login" state={{ from: location }} replace />
  return <Outlet />
}
