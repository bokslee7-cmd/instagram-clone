import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export function AdminRoute() {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const location = useLocation()

  if (!accessToken || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (!user.is_admin) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
