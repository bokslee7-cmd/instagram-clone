import axios from 'axios'

export function isStatus(error: unknown, status: number): boolean {
  return axios.isAxiosError(error) && error.response?.status === status
}

export function isNotFound(error: unknown): boolean {
  return isStatus(error, 404)
}

export function isForbidden(error: unknown): boolean {
  return isStatus(error, 403)
}

export function isUnprocessable(error: unknown): boolean {
  return isStatus(error, 422)
}
