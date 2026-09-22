import type { PaginatedResult, Post } from '../types'
import { apiClient } from './client'
import { isNotFound } from './httpErrors'

export async function getFeed(cursor?: string, limit = 6): Promise<PaginatedResult<Post>> {
  const { data } = await apiClient.get<PaginatedResult<Post>>('/posts/feed', { params: { cursor, limit } })
  return data
}

export async function getExplore(cursor?: string, limit = 12): Promise<PaginatedResult<Post>> {
  const { data } = await apiClient.get<PaginatedResult<Post>>('/posts/explore', { params: { cursor, limit } })
  return data
}

export async function getSavedPosts(cursor?: string, limit = 12): Promise<PaginatedResult<Post>> {
  const { data } = await apiClient.get<PaginatedResult<Post>>('/posts/saved', { params: { cursor, limit } })
  return data
}

export async function getUserPosts(username: string, cursor?: string, limit = 12): Promise<PaginatedResult<Post>> {
  const { data } = await apiClient.get<PaginatedResult<Post>>(
    `/users/${encodeURIComponent(username)}/posts`,
    { params: { cursor, limit } },
  )
  return data
}

export async function getPostById(postId: number): Promise<Post | undefined> {
  try {
    const { data } = await apiClient.get<Post>(`/posts/${postId}`)
    return data
  } catch (error) {
    if (isNotFound(error)) return undefined
    throw error
  }
}

export async function likePost(postId: number): Promise<void> {
  await apiClient.post(`/posts/${postId}/like`)
}

export async function unlikePost(postId: number): Promise<void> {
  await apiClient.delete(`/posts/${postId}/like`)
}

export async function savePost(postId: number): Promise<void> {
  await apiClient.post(`/posts/${postId}/save`)
}

export async function unsavePost(postId: number): Promise<void> {
  await apiClient.delete(`/posts/${postId}/save`)
}

export interface CreatePostPayload {
  caption?: string
  location?: string
  images: File[]
}

export async function createPost({ caption, location, images }: CreatePostPayload): Promise<Post> {
  const formData = new FormData()
  if (caption) formData.append('caption', caption)
  if (location) formData.append('location', location)
  images.forEach((file) => formData.append('images', file))

  const { data } = await apiClient.post<Post>('/posts', formData)
  return data
}

export async function deletePost(postId: number): Promise<void> {
  await apiClient.delete(`/posts/${postId}`)
}
