import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_USER_API ?? '/api',
  timeout: 10000
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('pilot-user-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default client
