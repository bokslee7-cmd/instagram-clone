import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import * as authApi from '../api/auth'
import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const { user, accessToken, login: setLoggedIn, logout: clearAuth } = useAuthStore()
  const navigate = useNavigate()

  // 로그인/회원가입 성공 후 목적지 이동은 GuestOnlyRoute가 전담한다.
  // (isAuthenticated로 전환되는 순간 그 컴포넌트가 location.state.from을 읽어
  // 리다이렉트한다 — 여기서 별도로 navigate()를 호출하면 레이스 컨디션이 생긴다.)
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ user, accessToken }) => {
      setLoggedIn(user, accessToken)
    },
  })

  const signupMutation = useMutation({
    mutationFn: authApi.signup,
    onSuccess: ({ user, accessToken }) => {
      setLoggedIn(user, accessToken)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clearAuth()
      navigate('/login', { replace: true })
    },
  })

  return {
    user,
    accessToken,
    isAuthenticated: !!accessToken && !!user,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error as Error | null,
    signup: signupMutation.mutateAsync,
    isSigningUp: signupMutation.isPending,
    signupError: signupMutation.error as Error | null,
    logout: logoutMutation.mutate,
  }
}
