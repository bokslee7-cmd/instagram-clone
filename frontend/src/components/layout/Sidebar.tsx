import { useQuery } from '@tanstack/react-query'
import { LogOut, ShieldCheck } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { NAV_ITEMS } from './NavLinks'
import { Avatar } from '../common/Avatar'
import { Button } from '../common/Button'
import { useAuthStore } from '../../store/authStore'
import { useUiStore } from '../../store/uiStore'
import { useAuth } from '../../hooks/useAuth'
import { useRequireAuth } from '../../hooks/useRequireAuth'
import * as notificationsApi from '../../api/notifications'
import * as messagesApi from '../../api/messages'

export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  const openCreatePostModal = useUiStore((s) => s.openCreatePostModal)
  const { logout } = useAuth()
  const { requireAuth } = useRequireAuth()

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30_000,
    enabled: !!user,
  })

  const { data: unreadMessageCount = 0 } = useQuery({
    queryKey: ['direct-threads', 'unread-count'],
    queryFn: messagesApi.getUnreadThreadCount,
    refetchInterval: 15_000,
    enabled: !!user,
  })

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-neutral-200 px-3 py-6">
      <div className="px-3 mb-8">
        <span className="font-logo text-3xl">Instagram</span>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.to === location.pathname || (item.to === '/direct/inbox' && location.pathname.startsWith('/direct'))
          const Icon = item.icon

          if (item.action === 'create') {
            return (
              <button
                key={item.label}
                onClick={() => requireAuth(openCreatePostModal)}
                className="flex items-center gap-4 px-3 py-3 rounded-lg text-base hover:bg-neutral-100 transition-colors"
              >
                <Icon size={26} />
                <span>{item.label}</span>
              </button>
            )
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={clsx(
                'relative flex items-center gap-4 px-3 py-3 rounded-lg text-base hover:bg-neutral-100 transition-colors',
                isActive && 'font-semibold',
              )}
            >
              <span className="relative">
                <Icon size={26} fill={isActive ? 'currentColor' : 'none'} />
                {item.label === '알림' && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] leading-none rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
                {item.label === '메시지' && unreadMessageCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] leading-none rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                  </span>
                )}
              </span>
              <span>{item.label}</span>
            </NavLink>
          )
        })}

        {user && (
          <NavLink
            to={`/${user.username}`}
            className={clsx(
              'flex items-center gap-4 px-3 py-3 rounded-lg text-base hover:bg-neutral-100 transition-colors',
              location.pathname === `/${user.username}` && 'font-semibold',
            )}
          >
            <Avatar src={user.avatar_url} alt={user.username} size="xs" />
            <span>프로필</span>
          </NavLink>
        )}

        {user?.is_admin && (
          <NavLink
            to="/admin"
            className="flex items-center gap-4 px-3 py-3 rounded-lg text-base hover:bg-neutral-100 transition-colors text-sky-600"
          >
            <ShieldCheck size={26} />
            <span>관리자 콘솔</span>
          </NavLink>
        )}
      </nav>

      {user ? (
        <button
          onClick={() => logout()}
          className="flex items-center gap-4 px-3 py-3 rounded-lg text-base hover:bg-neutral-100 transition-colors text-neutral-500"
        >
          <LogOut size={24} />
          <span>로그아웃</span>
        </button>
      ) : (
        <div className="px-3 py-2 space-y-2">
          <Link to="/login" state={{ from: location }}>
            <Button fullWidth>로그인</Button>
          </Link>
          <Link to="/signup" state={{ from: location }}>
            <Button variant="secondary" fullWidth>
              회원가입
            </Button>
          </Link>
        </div>
      )}
    </aside>
  )
}
