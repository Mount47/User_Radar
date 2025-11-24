import axios from 'axios'
import type { AxiosRequestHeaders } from 'axios'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 10000
})

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    const headers = (config.headers || {}) as AxiosRequestHeaders
    headers.Authorization = `Bearer ${token}`
    config.headers = headers
  }
  return config
})

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('Request failed', error)
    return Promise.reject(error)
  }
)

export default request
