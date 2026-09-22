import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { LogOut, Settings } from 'lucide-react'
import { Avatar } from '../common/Avatar'
import { Button } from '../common/Button'
import { FollowListModal } from './FollowListModal'
import { useFollow } from '../../hooks/useFollow'
import { useRequireAuth } from '../../hooks/useRequireAuth'
import { useAuth } from '../../hooks/useAuth'
import * as messagesApi from '../../api/messages'
import type { User } from '../../types'

interface ProfileHeaderProps {
  user: User
  isOwnProfile: boolean
}

export function ProfileHeader({ user, isOwnProfile }: ProfileHeaderProps) {
  const [listModal, setListModal] = useState<'followers' | 'following' | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)
  const { follow, unfollow, isLoading } = useFollow(user.username)
  const { requireAuth } = useRequireAuth()
  const { logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isSettingsOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isSettingsOpen])

  const startThreadMutation = useMutation({
    mutationFn: () => messagesApi.startThread(user.username),
    onSuccess: (thread) => {
      if (thread) navigate(`/direct/t/${thread.id}`)
    },
  })

  return (
    <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 px-4 py-8">
      <div className="flex justify-center sm:block">
        <Avatar src={user.avatar_url} alt={user.username} size="xl" />
      </div>

      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <h1 className="text-xl">{user.username}</h1>
          {isOwnProfile ? (
            <Link to={`/${user.username}/edit`}>
              <Button variant="secondary">프로필 편집</Button>
            </Link>
          ) : user.is_following ? (
            <Button variant="secondary" isLoading={isLoading} onClick={() => requireAuth(() => unfollow())}>
              팔로잉
            </Button>
          ) : (
            <Button variant="primary" isLoading={isLoading} onClick={() => requireAuth(() => follow())}>
              팔로우
            </Button>
          )}
          {!isOwnProfile && (
            <Button
              variant="secondary"
              isLoading={startThreadMutation.isPending}
              onClick={() => requireAuth(() => startThreadMutation.mutate())}
            >
              메시지 보내기
            </Button>
          )}
          {isOwnProfile && (
            <div className="relative" ref={settingsRef}>
              <button aria-label="설정" onClick={() => setIsSettingsOpen((open) => !open)}>
                <Settings size={24} />
              </button>
              {isSettingsOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-10">
                  <Link
                    to={`/${user.username}/edit`}
                    className="block px-4 py-2 text-sm hover:bg-neutral-100"
                    onClick={() => setIsSettingsOpen(false)}
                  >
                    프로필 편집
                  </Link>
                  <button
                    onClick={() => {
                      setIsSettingsOpen(false)
                      logout()
                    }}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-neutral-100"
                  >
                    <LogOut size={16} />
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-8 mb-4 text-sm">
          <span>
            <strong>{user.post_count.toLocaleString()}</strong> 게시물
          </span>
          <button onClick={() => setListModal('followers')}>
            <strong>{user.follower_count.toLocaleString()}</strong> 팔로워
          </button>
          <button onClick={() => setListModal('following')}>
            <strong>{user.following_count.toLocaleString()}</strong> 팔로잉
          </button>
        </div>

        <div className="text-sm space-y-0.5">
          {user.full_name && <p className="font-semibold">{user.full_name}</p>}
          {user.bio && <p className="whitespace-pre-line text-neutral-700">{user.bio}</p>}
          {user.website && (
            <a href={user.website} target="_blank" rel="noreferrer" className="text-sky-900 font-semibold block">
              {user.website.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>
      </div>

      {listModal && <FollowListModal username={user.username} type={listModal} onClose={() => setListModal(null)} />}
    </div>
  )
}
