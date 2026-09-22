import { useQuery } from '@tanstack/react-query'
import { SquarePen } from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Avatar } from '../common/Avatar'
import { Skeleton } from '../common/Skeleton'
import { formatRelativeTime } from '../../utils/time'
import { useAuthStore } from '../../store/authStore'
import * as messagesApi from '../../api/messages'

interface ThreadListProps {
  activeThreadId?: number
  onNewMessage: () => void
}

export function ThreadList({ activeThreadId, onNewMessage }: ThreadListProps) {
  const currentUserId = useAuthStore((s) => s.user?.id)
  const { data: threads, isLoading } = useQuery({
    queryKey: ['direct-threads'],
    queryFn: messagesApi.getThreads,
    refetchInterval: 5000,
  })

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 shrink-0">
        <h1 className="text-base font-semibold">메시지</h1>
        <button onClick={onNewMessage} aria-label="새 메시지">
          <SquarePen size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="w-14 h-14 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
          ))}

        {!isLoading && threads?.length === 0 && (
          <div className="text-center text-neutral-400 py-16 px-6">
            <p className="mb-3">아직 대화가 없습니다.</p>
            <button onClick={onNewMessage} className="text-sm font-semibold text-sky-500">
              새 메시지 보내기
            </button>
          </div>
        )}

        {threads?.map((thread) => {
          const isUnread = thread.unread_count > 0
          const isMine = thread.last_message?.sender_id === currentUserId
          const preview = thread.last_message
            ? `${isMine ? '나: ' : ''}${thread.last_message.content}`
            : '대화를 시작해보세요'

          return (
            <Link
              key={thread.id}
              to={`/direct/t/${thread.id}`}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors',
                activeThreadId === thread.id && 'bg-neutral-100',
              )}
            >
              <Avatar src={thread.participant.avatar_url} alt={thread.participant.username} size="lg" />
              <div className="flex-1 min-w-0">
                <p className={clsx('text-sm truncate', isUnread && 'font-semibold')}>
                  {thread.participant.username}
                </p>
                <p className={clsx('text-xs truncate', isUnread ? 'text-neutral-900 font-semibold' : 'text-neutral-500')}>
                  {preview}
                  {thread.last_message && ` · ${formatRelativeTime(thread.last_message.created_at)}`}
                </p>
              </div>
              {isUnread && <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
