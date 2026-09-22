import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type { PaginatedResult, Post } from '../types'

type FeedPage = PaginatedResult<Post>

export function updatePostInCache(queryClient: QueryClient, postId: number, updater: (post: Post) => Post) {
  queryClient.setQueriesData<InfiniteData<FeedPage> | undefined>({ queryKey: ['posts'] }, (data) => {
    if (!data || !('pages' in data)) return data
    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        items: page.items.map((post) => (post.id === postId ? updater(post) : post)),
      })),
    }
  })

  queryClient.setQueriesData<Post | undefined>({ queryKey: ['post', postId] }, (post) => (post ? updater(post) : post))
}
