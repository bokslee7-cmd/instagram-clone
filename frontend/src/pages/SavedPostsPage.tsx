import { useInfiniteQuery } from '@tanstack/react-query'
import * as postsApi from '../api/posts'
import { PostGrid } from '../components/post/PostGrid'
import { GridSkeleton } from '../components/common/Skeleton'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'

export function SavedPostsPage() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['posts', 'saved'],
    queryFn: ({ pageParam }) => postsApi.getSavedPosts(pageParam),
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
    <div className="max-w-[935px] mx-auto py-6 px-4">
      <h1 className="text-lg font-semibold mb-4">저장된 게시물</h1>
      {isLoading ? (
        <GridSkeleton />
      ) : posts.length === 0 ? (
        <p className="text-center text-neutral-400 py-24">저장한 게시물이 없습니다.</p>
      ) : (
        <>
          <PostGrid posts={posts} />
          <div ref={sentinelRef} className="h-8" />
        </>
      )}
    </div>
  )
}
