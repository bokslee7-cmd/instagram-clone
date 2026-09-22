import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export function useRequireAuth() {
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => !!s.accessToken && !!s.user)

  const requireAuth = useCallback(
    (action: () => void) => {
      if (isAuthenticated) {
        action()
        return
      }
      navigate('/login', { state: { from: location } })
    },
    [isAuthenticated, navigate, location],
  )

  return { requireAuth, isAuthenticated }
}
