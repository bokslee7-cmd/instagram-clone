import type { DirectMessage, DirectThread, DirectThreadDetail } from '../types'
import { apiClient } from './client'
import { isForbidden, isNotFound, isUnprocessable } from './httpErrors'

export async function getThreads(): Promise<DirectThread[]> {
  const { data } = await apiClient.get<DirectThread[]>('/direct/threads')
  return data
}

export async function getUnreadThreadCount(): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>('/direct/threads/unread-count')
  return data.count
}

export async function getThreadDetail(threadId: number): Promise<DirectThreadDetail | undefined> {
  try {
    const { data } = await apiClient.get<DirectThreadDetail>(`/direct/threads/${threadId}`)
    return data
  } catch (error) {
    if (isNotFound(error) || isForbidden(error)) return undefined
    throw error
  }
}

export async function startThread(username: string): Promise<DirectThread | undefined> {
  try {
    const { data } = await apiClient.post<DirectThread>('/direct/threads', { username })
    return data
  } catch (error) {
    if (isNotFound(error) || isUnprocessable(error)) return undefined
    throw error
  }
}

export async function sendMessage(threadId: number, content: string): Promise<DirectMessage> {
  const { data } = await apiClient.post<DirectMessage>(`/direct/threads/${threadId}/messages`, { content })
  return data
}
