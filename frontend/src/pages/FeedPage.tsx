import { useInfiniteQuery } from '@tanstack/react-query'
import * as postsApi from '../api/posts'
import { PostCard } from '../components/post/PostCard'
import { PostCardSkeleton } from '../components/common/Skeleton'
import { SuggestedUsers } from '../components/common/SuggestedUsers'
import { GuestBanner } from '../components/common/GuestBanner'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import { useAuthStore } from '../store/authStore'

export function FeedPage() {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken && !!s.user)

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['posts', 'feed', isAuthenticated],
    queryFn: ({ pageParam }) => postsApi.getFeed(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
  })

  const sentinelRef = useInfiniteScroll({
    hasMore: !!hasNextPage,
    onLoadMore: fetchNextPage,
    disabled: isFetchingNextPage,
  })

  const posts = data?.pages.flatMap((page) => page.items) ?? []

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-[630px] px-0 sm:px-4 py-4">
        {!isAuthenticated && <GuestBanner />}

        {isLoading && (
          <>
            <PostCardSkeleton />
            <PostCardSkeleton />
          </>
        )}

        {!isLoading && posts.length === 0 && (
          <div className="text-center py-24 text-neutral-400">
            <p className="font-semibold">피드가 비어있습니다</p>
            <p className="text-sm mt-1">다른 사용자를 팔로우하고 게시물을 확인해보세요.</p>
          </div>
        )}

        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        <div ref={sentinelRef} className="h-8" />
        {isFetchingNextPage && <PostCardSkeleton />}
      </div>

      <SuggestedUsers />
    </div>
  )
}
