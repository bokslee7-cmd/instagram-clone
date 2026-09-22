import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import * as postsApi from '../api/posts'
import type { Post } from '../types'
import { updatePostInCache } from '../utils/postsCache'

export function useLikePost() {
  const queryClient = useQueryClient()

  const toggleLike = useCallback(
    (post: Post) => {
      const nextLiked = !post.is_liked
      updatePostInCache(queryClient, post.id, (p) => ({
        ...p,
        is_liked: nextLiked,
        like_count: p.like_count + (nextLiked ? 1 : -1),
      }))

      const request = nextLiked ? postsApi.likePost(post.id) : postsApi.unlikePost(post.id)
      request.catch(() => {
        updatePostInCache(queryClient, post.id, (p) => ({
          ...p,
          is_liked: post.is_liked,
          like_count: post.like_count,
        }))
      })
    },
    [queryClient],
  )

  return { toggleLike }
}
