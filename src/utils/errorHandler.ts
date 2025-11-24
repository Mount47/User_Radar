import type { AxiosError } from 'axios'
import { logger } from './logger'

export interface ErrorPayload {
  message: string
  status?: number
  code?: string | number
  details?: unknown
}

export class ApiError extends Error {
  status?: number
  code?: string | number
  details?: unknown

  constructor(payload: ErrorPayload) {
    super(payload.message)
    this.status = payload.status
    this.code = payload.code
    this.details = payload.details
  }
}

export const normalizeError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error
  }

  if (isAxiosError(error)) {
    const { response, request, message } = error
    const payload: ErrorPayload = {
      message:
        response?.data?.message ||
        response?.data?.error ||
        response?.statusText ||
        message ||
        '网络请求失败',
      status: response?.status,
      code: response?.data?.code
    }
    if (response?.data) {
      payload.details = response.data
    } else if (request) {
      payload.details = { request }
    }
    const normalized = new ApiError(payload)
    logger.error('API error captured', normalized)
    return normalized
  }

  if (error instanceof Error) {
    logger.error('Unexpected runtime error', error)
    return new ApiError({ message: error.message })
  }

  logger.error('Unknown error type', error)
  return new ApiError({ message: '未知错误' })
}

export const handleApiError = (error: unknown): never => {
  throw normalizeError(error)
}

const isAxiosError = (error: any): error is AxiosError => !!error?.isAxiosError
