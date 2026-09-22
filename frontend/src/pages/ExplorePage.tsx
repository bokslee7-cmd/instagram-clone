import { useInfiniteQuery } from '@tanstack/react-query'
import * as postsApi from '../api/posts'
import { PostGrid } from '../components/post/PostGrid'
import { GridSkeleton } from '../components/common/Skeleton'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'

export function ExplorePage() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['posts', 'explore'],
    queryFn: ({ pageParam }) => postsApi.getExplore(pageParam),
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
    <div className="max-w-[935px] mx-auto py-1 md:py-6 px-0 md:px-4">
      {isLoading ? <GridSkeleton count={12} /> : <PostGrid posts={posts} />}
      <div ref={sentinelRef} className="h-8" />
    </div>
  )
}
