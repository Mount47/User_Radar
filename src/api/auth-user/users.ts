import http from '../httpClient'

/**
 * User management endpoints (admin area).
 */
export const userApi = {
  list() {
    return http.get('/api/users')
  },

  getById(id: string) {
    return http.get(`/api/users/${id}`)
  },

  create(payload: Record<string, unknown>) {
    return http.post('/api/users', payload)
  },

  update(id: string, payload: Record<string, unknown>) {
    return http.put(`/api/users/${id}`, payload)
  },

  remove(id: string) {
    return http.delete(`/api/users/${id}`)
  },

  resetPassword(id: string, payload: Record<string, unknown>) {
    return http.post(`/api/users/${id}/reset-password`, payload)
  },

  lock(id: string) {
    return http.post(`/api/users/${id}/lock`)
  },

  unlock(id: string) {
    return http.post(`/api/users/${id}/unlock`)
  }
}

export default userApi
