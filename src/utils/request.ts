import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { API_BASE_URL } from './constants'
import {
  getAccessToken,
  persistAccessToken,
  persistRefreshToken,
  clearAuthStorage
} from './auth'
import { normalizeError } from './errorHandler'
import { logger } from './logger'

export interface RequestContext extends AxiosInstance {}

const createService = (): RequestContext => {
  const service = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    withCredentials: true
  })

  service.interceptors.request.use((config: AxiosRequestConfig) => {
    const token = getAccessToken()
    if (token) {
      config.headers = {
        ...(config.headers || {}),
        Authorization: config.headers?.Authorization ?? `Bearer ${token}`
      }
    }
    return config
  })

  service.interceptors.response.use(
    (response: AxiosResponse) => response.data ?? response,
    async (error) => {
      const normalized = normalizeError(error)

      if (normalized.status === 401) {
        logger.warn('Received 401, clearing auth storage')
        clearAuthStorage()
      }

      return Promise.reject(normalized)
    }
  )

  return service
}

export const request = createService()

export const updateTokens = (accessToken?: string | null, refreshToken?: string | null) => {
  if (accessToken !== undefined) {
    persistAccessToken(accessToken)
  }
  if (refreshToken !== undefined) {
    persistRefreshToken(refreshToken)
  }
  logger.debug('Tokens updated via request helper')
}

export default request
