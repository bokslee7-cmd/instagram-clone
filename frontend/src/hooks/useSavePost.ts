import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import * as postsApi from '../api/posts'
import type { Post } from '../types'
import { updatePostInCache } from '../utils/postsCache'

export function useSavePost() {
  const queryClient = useQueryClient()

  const toggleSave = useCallback(
    (post: Post) => {
      const nextSaved = !post.is_saved
      updatePostInCache(queryClient, post.id, (p) => ({ ...p, is_saved: nextSaved }))

      const request = nextSaved ? postsApi.savePost(post.id) : postsApi.unsavePost(post.id)
      request
        .then(() => queryClient.invalidateQueries({ queryKey: ['posts', 'saved'] }))
        .catch(() => {
          updatePostInCache(queryClient, post.id, (p) => ({ ...p, is_saved: post.is_saved }))
        })
    },
    [queryClient],
  )

  return { toggleSave }
}
