import type { CurrentUser, PaginatedResult, User } from '../types'
import { apiClient } from './client'
import { isNotFound } from './httpErrors'

export async function getProfile(username: string): Promise<User | undefined> {
  try {
    const { data } = await apiClient.get<User>(`/users/${encodeURIComponent(username)}`)
    return data
  } catch (error) {
    if (isNotFound(error)) return undefined
    throw error
  }
}

export interface UpdateProfilePayload {
  username?: string
  full_name?: string
  email?: string
  bio?: string
  website?: string
  is_private?: boolean
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<CurrentUser> {
  const { data } = await apiClient.patch<CurrentUser>('/users/me', payload)
  return data
}

export async function uploadAvatar(image: File): Promise<CurrentUser> {
  const formData = new FormData()
  formData.append('image', image)
  const { data } = await apiClient.post<CurrentUser>('/users/me/avatar', formData)
  return data
}

export async function followUser(username: string): Promise<void> {
  await apiClient.post(`/follows/${encodeURIComponent(username)}`)
}

export async function unfollowUser(username: string): Promise<void> {
  await apiClient.delete(`/follows/${encodeURIComponent(username)}`)
}

export async function getFollowers(username: string, page = 1, size = 20): Promise<PaginatedResult<User>> {
  const { data } = await apiClient.get<PaginatedResult<User>>(
    `/users/${encodeURIComponent(username)}/followers`,
    { params: { page, size } },
  )
  return data
}

export async function getFollowing(username: string, page = 1, size = 20): Promise<PaginatedResult<User>> {
  const { data } = await apiClient.get<PaginatedResult<User>>(
    `/users/${encodeURIComponent(username)}/following`,
    { params: { page, size } },
  )
  return data
}

export async function searchUsers(query: string): Promise<User[]> {
  if (!query.trim()) return []
  const { data } = await apiClient.get<User[]>('/search/users', { params: { q: query } })
  return data
}
