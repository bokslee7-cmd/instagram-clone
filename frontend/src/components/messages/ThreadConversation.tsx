import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Avatar } from '../common/Avatar'
import { Spinner } from '../common/Spinner'
import { formatRelativeTime } from '../../utils/time'
import { useAuthStore } from '../../store/authStore'
import * as messagesApi from '../../api/messages'

interface ThreadConversationProps {
  threadId: number
}

export function ThreadConversation({ threadId }: ThreadConversationProps) {
  const queryClient = useQueryClient()
  const currentUserId = useAuthStore((s) => s.user?.id)
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['direct-thread', threadId],
    queryFn: () => messagesApi.getThreadDetail(threadId),
    refetchInterval: 2000,
  })

  const sendMutation = useMutation({
    mutationFn: (content: string) => messagesApi.sendMessage(threadId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['direct-thread', threadId] })
      queryClient.invalidateQueries({ queryKey: ['direct-threads'] })
    },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [data?.messages.length])

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['direct-threads', 'unread-count'] })
  }, [threadId, queryClient])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed || sendMutation.isPending) return
    setDraft('')
    sendMutation.mutate(trimmed)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-400 text-sm">
        존재하지 않는 대화입니다.
      </div>
    )
  }

  const { thread, messages } = data

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 shrink-0">
        <Link to="/direct/inbox" className="md:hidden" aria-label="목록으로">
          <ArrowLeft size={22} />
        </Link>
        <Link to={`/${thread.participant.username}`} className="flex items-center gap-3">
          <Avatar src={thread.participant.avatar_url} alt={thread.participant.username} />
          <span className="text-sm font-semibold">{thread.participant.username}</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
        {messages.length === 0 && (
          <p className="text-center text-neutral-400 text-sm py-8">
            {thread.participant.username}님에게 메시지를 보내보세요.
          </p>
        )}

        {messages.map((message, i) => {
          const isMine = message.sender_id === currentUserId
          const prev = messages[i - 1]
          const showAvatar = !isMine && prev?.sender_id !== message.sender_id

          return (
            <div key={message.id} className={clsx('flex items-end gap-2', isMine ? 'justify-end' : 'justify-start')}>
              {!isMine && (
                <div className="w-6 shrink-0">
                  {showAvatar && <Avatar src={thread.participant.avatar_url} alt={thread.participant.username} size="xs" />}
                </div>
              )}
              <div
                className={clsx(
                  'max-w-[70%] rounded-2xl px-3.5 py-2 text-sm break-words',
                  isMine ? 'bg-sky-500 text-white rounded-br-sm' : 'bg-neutral-100 text-neutral-900 rounded-bl-sm',
                )}
                title={formatRelativeTime(message.created_at)}
              >
                {message.content}
              </div>
            </div>
          )
        })}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-3 border-t border-neutral-200 px-4 py-3 shrink-0">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="메시지 보내기..."
          aria-label="메시지 입력"
          className="flex-1 bg-neutral-100 rounded-full px-4 py-2.5 text-sm outline-none placeholder:text-neutral-400"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sendMutation.isPending}
          aria-label="보내기"
          className="text-sky-500 disabled:text-sky-200 shrink-0"
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  )
}
