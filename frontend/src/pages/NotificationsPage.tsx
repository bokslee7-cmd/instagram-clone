import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, MessageCircle, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import * as notificationsApi from '../api/notifications'
import { Avatar } from '../components/common/Avatar'
import { Skeleton } from '../components/common/Skeleton'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import { formatRelativeTime } from '../utils/time'
import type { AppNotification } from '../types'

const ICON_MAP: Record<AppNotification['type'], typeof Heart> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
}

const TEXT_MAP: Record<AppNotification['type'], string> = {
  like: '님이 회원님의 게시물을 좋아합니다.',
  comment: '님이 회원님의 게시물에 댓글을 남겼습니다.',
  follow: '님이 회원님을 팔로우하기 시작했습니다.',
}

export function NotificationsPage() {
  const queryClient = useQueryClient()

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['notifications', 'list'],
    queryFn: ({ pageParam }) => notificationsApi.getNotifications(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
  })

  const sentinelRef = useInfiniteScroll({
    hasMore: !!hasNextPage,
    onLoadMore: fetchNextPage,
    disabled: isFetchingNextPage,
  })

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const notifications = data?.pages.flatMap((page) => page.items) ?? []

  return (
    <div className="max-w-xl mx-auto py-4 px-2">
      <div className="flex items-center justify-between px-2 mb-2">
        <h1 className="text-lg font-semibold">알림</h1>
        <button onClick={() => markAllMutation.mutate()} className="text-sm text-sky-500 font-semibold">
          모두 읽음 처리
        </button>
      </div>

      {isLoading &&
        Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-3">
            <Skeleton className="w-11 h-11 rounded-full" />
            <Skeleton className="h-3 flex-1" />
          </div>
        ))}

      {!isLoading && notifications.length === 0 && (
        <p className="text-center text-neutral-400 py-24">아직 알림이 없습니다.</p>
      )}

      <ul>
        {notifications.map((n) => {
          const Icon = ICON_MAP[n.type]
          const target = n.post ? `/p/${n.post.id}` : `/${n.actor.username}`
          return (
            <li key={n.id}>
              <Link
                to={target}
                onClick={() => !n.is_read && markReadMutation.mutate(n.id)}
                className={clsx(
                  'flex items-center gap-3 px-2 py-3 rounded-lg hover:bg-neutral-50',
                  !n.is_read && 'bg-sky-50',
                )}
              >
                <div className="relative">
                  <Avatar src={n.actor.avatar_url} alt={n.actor.username} />
                  <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                    <Icon
                      size={14}
                      className={clsx(
                        n.type === 'like' && 'text-red-500 fill-red-500',
                        n.type === 'follow' && 'text-sky-500',
                        n.type === 'comment' && 'text-neutral-700',
                      )}
                    />
                  </span>
                </div>
                <p className="text-sm flex-1">
                  <span className="font-semibold">{n.actor.username}</span>
                  {TEXT_MAP[n.type]}{' '}
                  <span className="text-neutral-400">{formatRelativeTime(n.created_at)}</span>
                </p>
                {n.post && (
                  <img src={n.post.images[0]?.image_url} alt="" className="w-11 h-11 object-cover rounded" />
                )}
              </Link>
            </li>
          )
        })}
      </ul>

      <div ref={sentinelRef} className="h-8" />
    </div>
  )
}
