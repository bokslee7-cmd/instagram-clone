import { useQuery } from '@tanstack/react-query'
import { Compass, Heart, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import * as messagesApi from '../../api/messages'

export function TopNav() {
  const user = useAuthStore((s) => s.user)

  const { data: unreadMessageCount = 0 } = useQuery({
    queryKey: ['direct-threads', 'unread-count'],
    queryFn: messagesApi.getUnreadThreadCount,
    refetchInterval: 15_000,
    enabled: !!user,
  })

  return (
    <header className="md:hidden sticky top-0 z-20 flex items-center justify-between h-14 px-4 bg-white border-b border-neutral-200">
      <span className="font-logo text-3xl">Instagram</span>
      <div className="flex items-center gap-4">
        <Link to="/explore" aria-label="탐색">
          <Compass size={26} />
        </Link>
        <Link to="/notifications" aria-label="알림">
          <Heart size={26} />
        </Link>
        <Link to="/direct/inbox" aria-label="메시지" className="relative">
          <Send size={24} />
          {unreadMessageCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] leading-none rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-0.5">
              {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
