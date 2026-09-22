import type { Comment, PaginatedResult } from '../types'
import { apiClient } from './client'

export async function getComments(postId: number, cursor?: string, limit = 20): Promise<PaginatedResult<Comment>> {
  const { data } = await apiClient.get<PaginatedResult<Comment>>(`/posts/${postId}/comments`, {
    params: { cursor, limit },
  })
  return data
}

export interface CreateCommentPayload {
  postId: number
  content: string
  parentId?: number | null
}

export async function createComment({ postId, content, parentId = null }: CreateCommentPayload): Promise<Comment> {
  const { data } = await apiClient.post<Comment>(`/posts/${postId}/comments`, {
    content,
    parent_id: parentId,
  })
  return data
}

export async function deleteComment(commentId: number): Promise<void> {
  await apiClient.delete(`/comments/${commentId}`)
}

export async function likeComment(commentId: number): Promise<void> {
  await apiClient.post(`/comments/${commentId}/like`)
}
