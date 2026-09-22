import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Lock } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import * as usersApi from '../api/users'
import * as postsApi from '../api/posts'
import { ProfileHeader } from '../components/profile/ProfileHeader'
import { ProfileTabs, type ProfileTab } from '../components/profile/ProfileTabs'
import { PostGrid } from '../components/post/PostGrid'
import { GridSkeleton, Skeleton } from '../components/common/Skeleton'
import { useAuthStore } from '../store/authStore'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'

export function ProfilePage() {
  const { username = '' } = useParams<{ username: string }>()
  const currentUser = useAuthStore((s) => s.user)
  const isOwnProfile = currentUser?.username === username
  const [tab, setTab] = useState<ProfileTab>('posts')

  const { data: user, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => usersApi.getProfile(username),
  })

  const isLocked = !!user?.is_private && !isOwnProfile && !user.is_following

  const postsQuery = useInfiniteQuery({
    queryKey: ['posts', 'user', username],
    queryFn: ({ pageParam }) => postsApi.getUserPosts(username, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: !isLocked && tab === 'posts',
  })

  const savedQuery = useInfiniteQuery({
    queryKey: ['posts', 'saved'],
    queryFn: ({ pageParam }) => postsApi.getSavedPosts(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: isOwnProfile && tab === 'saved',
  })

  const activeQuery = tab === 'saved' ? savedQuery : postsQuery
  const sentinelRef = useInfiniteScroll({
    hasMore: !!activeQuery.hasNextPage,
    onLoadMore: activeQuery.fetchNextPage,
    disabled: activeQuery.isFetchingNextPage,
  })

  if (isProfileLoading) {
    return (
      <div className="max-w-[935px] mx-auto px-4 py-8">
        <div className="flex gap-10">
          <Skeleton className="w-36 h-36 rounded-full" />
          <div className="flex-1 space-y-4 pt-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <div className="text-center py-24 text-neutral-400">사용자를 찾을 수 없습니다.</div>
  }

  const posts = activeQuery.data?.pages.flatMap((page) => page.items) ?? []

  return (
    <div className="max-w-[935px] mx-auto">
      <ProfileHeader user={user} isOwnProfile={isOwnProfile} />
      <ProfileTabs active={tab} onChange={setTab} showSaved={isOwnProfile} />

      <div className="py-4">
        {isLocked ? (
          <div className="flex flex-col items-center gap-3 py-24 text-neutral-500">
            <Lock size={48} />
            <p className="font-semibold text-lg">비공개 계정입니다</p>
            <p className="text-sm">사진을 보려면 팔로우하세요.</p>
          </div>
        ) : activeQuery.isLoading ? (
          <GridSkeleton />
        ) : posts.length === 0 ? (
          <div className="text-center py-24 text-neutral-400">
            <p className="font-semibold">
              {tab === 'saved' ? '저장한 게시물이 없습니다' : '아직 게시물이 없습니다'}
            </p>
          </div>
        ) : (
          <>
            <PostGrid posts={posts} />
            <div ref={sentinelRef} className="h-8" />
          </>
        )}
      </div>
    </div>
  )
}
