import { create } from 'zustand'
import type { CurrentUser } from '../types'

interface AuthState {
  user: CurrentUser | null
  accessToken: string | null
  isBootstrapped: boolean
  setAccessToken: (token: string | null) => void
  setUser: (user: CurrentUser | null) => void
  login: (user: CurrentUser, token: string) => void
  logout: () => void
  setBootstrapped: (value: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isBootstrapped: false,
  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  login: (user, token) => set({ user, accessToken: token }),
  logout: () => set({ user: null, accessToken: null }),
  setBootstrapped: (value) => set({ isBootstrapped: value }),
}))
