import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export function GuestOnlyRoute() {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const location = useLocation()

  if (accessToken && user) {
    // 로그인/회원가입 성공 시 리다이렉트를 여기서 전담한다(단일 지점).
    // useAuth의 mutation onSuccess에서 별도로 navigate()를 호출하면 이 컴포넌트가
    // 아직 /login에 마운트된 채로 isAuthenticated=true로 재렌더링되면서 즉시
    // "/"로 다시 내비게이트해버려 의도한 목적지(예: /admin)를 덮어써버리는
    // 레이스 컨디션이 생긴다. 리다이렉트 소스를 하나로 두어 이를 없앤다.
    //
    // 명시적으로 가려던 곳(from)이 있으면 그곳을 우선하고, 없으면 계정 종류에
    // 따라 기본 목적지를 분기한다: 관리자는 관리자 콘솔로, 일반 회원은 자신의
    // 프로필 페이지로 이동한다.
    const from = (location.state as { from?: { pathname: string } } | null)?.from
    const defaultPath = user.is_admin ? '/admin' : `/${user.username}`
    return <Navigate to={from?.pathname ?? defaultPath} replace />
  }

  return <Outlet />
}
