import type { AdminPaginatedResult, AdminStats, AdminUser, Post } from '../types'
import { apiClient } from './client'

export async function getStats(): Promise<AdminStats> {
  const { data } = await apiClient.get<AdminStats>('/admin/stats')
  return data
}

export async function getUsers(page = 1, size = 20, q?: string): Promise<AdminPaginatedResult<AdminUser>> {
  const { data } = await apiClient.get<AdminPaginatedResult<AdminUser>>('/admin/users', {
    params: { page, size, q: q || undefined },
  })
  return data
}

export async function deactivateUser(userId: number): Promise<void> {
  await apiClient.delete(`/admin/users/${userId}`)
}

export async function getPosts(page = 1, size = 20): Promise<AdminPaginatedResult<Post>> {
  const { data } = await apiClient.get<AdminPaginatedResult<Post>>('/admin/posts', {
    params: { page, size },
  })
  return data
}

export async function deletePost(postId: number): Promise<void> {
  await apiClient.delete(`/posts/${postId}`)
}
