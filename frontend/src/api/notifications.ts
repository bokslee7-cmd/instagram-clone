import type { AppNotification, PaginatedResult } from '../types'
import { apiClient } from './client'

export async function getNotifications(cursor?: string, limit = 20): Promise<PaginatedResult<AppNotification>> {
  const { data } = await apiClient.get<PaginatedResult<AppNotification>>('/notifications', {
    params: { cursor, limit },
  })
  return data
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>('/notifications/unread-count')
  return data.count
}

export async function markNotificationRead(id: number): Promise<void> {
  await apiClient.patch(`/notifications/${id}/read`)
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch('/notifications/read-all')
}
