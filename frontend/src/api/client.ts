import axios from 'axios'
import { useAuthStore } from '../store/authStore'

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<string | null> | null = null

const AUTH_ENDPOINTS_WITHOUT_RETRY = ['/auth/login', '/auth/signup', '/auth/refresh']

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const isAuthEndpoint = AUTH_ENDPOINTS_WITHOUT_RETRY.some((path) => originalRequest?.url?.includes(path))

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true
      if (!refreshPromise) {
        refreshPromise = apiClient
          .post('/auth/refresh')
          .then((res) => res.data.access_token as string)
          .catch(() => null)
          .finally(() => {
            refreshPromise = null
          })
      }
      const newToken = await refreshPromise
      if (newToken) {
        useAuthStore.getState().setAccessToken(newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalRequest)
      }
      useAuthStore.getState().logout()
    }

    // 백엔드 에러 응답의 detail 메시지를 error.message로 그대로 노출해
    // 화면에서 별도 매핑 없이 catch(error).message로 바로 표시할 수 있게 한다.
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') {
      error.message = detail
    }

    return Promise.reject(error)
  },
)
