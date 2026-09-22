import { useMutation, useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { Modal } from '../common/Modal'
import { Avatar } from '../common/Avatar'
import { Skeleton } from '../common/Skeleton'
import { useDebounce } from '../../hooks/useDebounce'
import * as usersApi from '../../api/users'
import * as messagesApi from '../../api/messages'
import { useAuthStore } from '../../store/authStore'

interface NewMessageModalProps {
  onClose: () => void
  onThreadReady: (threadId: number) => void
}

export function NewMessageModal({ onClose, onThreadReady }: NewMessageModalProps) {
  const currentUserId = useAuthStore((s) => s.user?.id)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['search', 'users', debouncedQuery],
    queryFn: () => usersApi.searchUsers(debouncedQuery),
    enabled: debouncedQuery.trim().length > 0,
  })

  const startThreadMutation = useMutation({
    mutationFn: (username: string) => messagesApi.startThread(username),
    onSuccess: (thread) => {
      if (thread) onThreadReady(thread.id)
    },
  })

  const candidates = results.filter((u) => u.id !== currentUserId)

  return (
    <Modal isOpen onClose={onClose} className="w-full max-w-sm">
      <div className="border-b border-neutral-200 py-3 text-center font-semibold text-sm">새 메시지</div>
      <div className="p-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색"
            autoFocus
            aria-label="받는 사람 검색"
            className="w-full bg-neutral-100 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none"
          />
        </div>
      </div>

      <div className="max-h-96 min-h-40 overflow-y-auto px-2 pb-2">
        {isFetching &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="w-11 h-11 rounded-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}

        {!isFetching && debouncedQuery && candidates.length === 0 && (
          <p className="text-sm text-neutral-400 text-center py-8">검색 결과가 없습니다.</p>
        )}

        {!debouncedQuery && <p className="text-sm text-neutral-400 text-center py-8">사용자를 검색해보세요.</p>}

        {candidates.map((user) => (
          <button
            key={user.id}
            onClick={() => startThreadMutation.mutate(user.username)}
            disabled={startThreadMutation.isPending}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 disabled:opacity-60"
          >
            <Avatar src={user.avatar_url} alt={user.username} />
            <div className="text-left">
              <p className="text-sm font-semibold">{user.username}</p>
              <p className="text-xs text-neutral-500">{user.full_name}</p>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  )
}
