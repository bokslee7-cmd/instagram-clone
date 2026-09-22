import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Modal } from '../common/Modal'
import { Avatar } from '../common/Avatar'
import { Skeleton } from '../common/Skeleton'
import * as usersApi from '../../api/users'

interface FollowListModalProps {
  username: string
  type: 'followers' | 'following'
  onClose: () => void
}

export function FollowListModal({ username, type, onClose }: FollowListModalProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['follow-list', username, type],
    queryFn: () => (type === 'followers' ? usersApi.getFollowers(username) : usersApi.getFollowing(username)),
  })

  return (
    <Modal isOpen onClose={onClose} className="w-full max-w-sm">
      <div className="border-b border-neutral-200 py-3 text-center font-semibold text-sm">
        {type === 'followers' ? '팔로워' : '팔로잉'}
      </div>
      <div className="max-h-96 overflow-y-auto p-2">
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="w-11 h-11 rounded-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        {data?.items.map((user) => (
          <Link
            key={user.id}
            to={`/${user.username}`}
            onClick={onClose}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50"
          >
            <Avatar src={user.avatar_url} alt={user.username} />
            <div className="text-left">
              <p className="text-sm font-semibold">{user.username}</p>
              <p className="text-xs text-neutral-500">{user.full_name}</p>
            </div>
          </Link>
        ))}
        {!isLoading && data?.items.length === 0 && (
          <p className="text-sm text-neutral-400 text-center py-8">목록이 비어 있습니다.</p>
        )}
      </div>
    </Modal>
  )
}
