import http from '../httpClient'

/**
 * Authentication / profile related endpoints.
 */
export const authApi = {
  login(credentials: Record<string, unknown>) {
    return http.post('/api/auth/login', credentials)
  },

  refresh(token: string) {
    return http.post('/api/auth/refresh', {}, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
  },

  logout(token: string) {
    return http.post(
      '/api/auth/logout',
      {},
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }
    )
  },

  profile() {
    return http.get('/api/me/profile')
  },

  myPersons() {
    return http.get('/api/me/persons')
  },

  myDevices() {
    return http.get('/api/me/devices')
  },

  myAlerts(params: Record<string, unknown> = {}) {
    return http.get('/api/me/alerts', params)
  }
}

export default authApi
