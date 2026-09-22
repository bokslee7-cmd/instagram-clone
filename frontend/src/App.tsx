import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import * as authApi from './api/auth'
import { Spinner } from './components/common/Spinner'
import { AppRoutes } from './router'
import { useAuthStore } from './store/authStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// 마운트 시 /api/auth/refresh(HttpOnly 쿠키)로 세션을 복구한다.
// 유효한 세션이 없으면(비로그인 상태) 조용히 실패하고 게스트로 진행한다.
function useAuthBootstrap() {
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped)
  const setAccessToken = useAuthStore((s) => s.setAccessToken)
  const setUser = useAuthStore((s) => s.setUser)
  const setBootstrapped = useAuthStore((s) => s.setBootstrapped)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const accessToken = await authApi.refreshAccessToken()
        if (cancelled) return
        setAccessToken(accessToken)
        const user = await authApi.fetchMe()
        if (cancelled) return
        setUser(user)
      } catch {
        // 유효한 리프레시 토큰이 없음 - 게스트로 진행
      } finally {
        if (!cancelled) setBootstrapped(true)
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [setAccessToken, setUser, setBootstrapped])

  return isBootstrapped
}

function App() {
  const isBootstrapped = useAuthBootstrap()

  if (!isBootstrapped) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
