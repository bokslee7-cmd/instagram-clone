import type { CurrentUser } from '../types'
import { apiClient } from './client'

export interface LoginPayload {
  usernameOrEmail: string
  password: string
}

export interface SignupPayload {
  username: string
  email: string
  password: string
}

interface TokenResponse {
  access_token: string
  token_type: string
}

async function fetchMeWithToken(accessToken: string): Promise<CurrentUser> {
  const { data } = await apiClient.get<CurrentUser>('/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return data
}

export async function login({
  usernameOrEmail,
  password,
}: LoginPayload): Promise<{ user: CurrentUser; accessToken: string }> {
  const { data } = await apiClient.post<TokenResponse>('/auth/login', {
    username_or_email: usernameOrEmail,
    password,
  })
  const user = await fetchMeWithToken(data.access_token)
  return { user, accessToken: data.access_token }
}

export async function signup({
  username,
  email,
  password,
}: SignupPayload): Promise<{ user: CurrentUser; accessToken: string }> {
  const { data } = await apiClient.post<TokenResponse>('/auth/signup', { username, email, password })
  const user = await fetchMeWithToken(data.access_token)
  return { user, accessToken: data.access_token }
}

export async function fetchMe(): Promise<CurrentUser> {
  const { data } = await apiClient.get<CurrentUser>('/auth/me')
  return data
}

export async function refreshAccessToken(): Promise<string> {
  const { data } = await apiClient.post<TokenResponse>('/auth/refresh')
  return data.access_token
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}
