import type { AxiosRequestConfig, Method } from 'axios'
import request from '@/utils/request'

type Payload = Record<string, unknown>

type RequestFn = <T = any>(
  url: string,
  payload?: Payload,
  config?: AxiosRequestConfig
) => Promise<T>

/**
 * Lightweight wrapper around the shared axios instance.
 * Keeps method signatures consistent and allows per-call overrides.
 */
const createRequest = (method: Method): RequestFn => (url, payload = {}, config = {}) =>
  request({
    url,
    method,
    ...(method === 'get' || method === 'delete'
      ? { params: payload }
      : { data: payload }),
    ...config
  })

export const http = {
  get: createRequest('get'),
  post: createRequest('post'),
  put: createRequest('put'),
  patch: createRequest('patch'),
  delete: createRequest('delete')
}

export default http
