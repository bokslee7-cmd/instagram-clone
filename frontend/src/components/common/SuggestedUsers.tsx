import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Avatar } from './Avatar'
import { useAuthStore } from '../../store/authStore'
import * as usersApi from '../../api/users'

export function SuggestedUsers() {
  const currentUser = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['suggested-users', currentUser?.username],
    // 별도 추천 알고리즘 엔드포인트는 없으므로, 나를 팔로우하는 사람(맞팔 후보) 목록을 대신 보여준다.
    queryFn: () => usersApi.getFollowers(currentUser!.username, 1, 5),
    enabled: !!currentUser,
  })

  if (!currentUser) return null

  const suggestions = (data?.items ?? []).filter((u) => u.id !== currentUser.id).slice(0, 5)

  return (
    <div className="hidden lg:block w-72 shrink-0 px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/${currentUser.username}`}>
          <Avatar src={currentUser.avatar_url} alt={currentUser.username} size="md" />
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/${currentUser.username}`} className="text-sm font-semibold block truncate">
            {currentUser.username}
          </Link>
          <p className="text-xs text-neutral-400 truncate">{currentUser.full_name}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-neutral-400">회원님을 위한 추천</span>
        <button className="text-xs font-semibold">모두 보기</button>
      </div>

      <ul className="space-y-3">
        {suggestions.map((user) => (
          <li key={user.id} className="flex items-center gap-3">
            <Link to={`/${user.username}`}>
              <Avatar src={user.avatar_url} alt={user.username} size="sm" />
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/${user.username}`} className="text-sm font-semibold block truncate">
                {user.username}
              </Link>
              <p className="text-xs text-neutral-400 truncate">회원님을 위한 추천</p>
            </div>
            <button
              onClick={async () => {
                await usersApi.followUser(user.username)
                queryClient.invalidateQueries({ queryKey: ['suggested-users'] })
                queryClient.invalidateQueries({ queryKey: ['posts', 'feed'] })
              }}
              className="text-xs font-semibold text-sky-500"
            >
              팔로우
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
