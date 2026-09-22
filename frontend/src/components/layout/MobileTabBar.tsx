import { useQuery } from '@tanstack/react-query'
import { Heart, Home, PlusSquare, Search, UserCircle2 } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { Avatar } from '../common/Avatar'
import { useAuthStore } from '../../store/authStore'
import { useUiStore } from '../../store/uiStore'
import { useRequireAuth } from '../../hooks/useRequireAuth'
import * as notificationsApi from '../../api/notifications'

export function MobileTabBar() {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  const openCreatePostModal = useUiStore((s) => s.openCreatePostModal)
  const { requireAuth } = useRequireAuth()

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30_000,
    enabled: !!user,
  })

  const items = [
    { to: '/', icon: Home },
    { to: '/search', icon: Search },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-center justify-around h-14 bg-white border-t border-neutral-200">
      {items.map(({ to, icon: Icon }) => {
        const isActive = location.pathname === to
        return (
          <NavLink key={to} to={to} className="p-2">
            <Icon size={26} fill={isActive ? 'currentColor' : 'none'} />
          </NavLink>
        )
      })}

      <button onClick={() => requireAuth(openCreatePostModal)} className="p-2">
        <PlusSquare size={26} />
      </button>

      <NavLink to="/notifications" className="relative p-2">
        <Heart size={26} fill={location.pathname === '/notifications' ? 'currentColor' : 'none'} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] leading-none rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </NavLink>

      {user ? (
        <NavLink to={`/${user.username}`} className="p-2">
          <Avatar
            src={user.avatar_url}
            alt={user.username}
            size="xs"
            className={clsx(location.pathname === `/${user.username}` && 'ring-2 ring-neutral-900')}
          />
        </NavLink>
      ) : (
        <NavLink to="/login" state={{ from: location }} className="p-2">
          <UserCircle2 size={26} />
        </NavLink>
      )}
    </nav>
  )
}
