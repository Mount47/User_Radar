import http from '../httpClient'

/**
 * User management endpoints (admin area).
 */
export const userApi = {
  list() {
    return http.get('/api/users')
  },

  getById(id) {
    return http.get(`/api/users/${id}`)
  },

  create(payload) {
    return http.post('/api/users', payload)
  },

  update(id, payload) {
    return http.put(`/api/users/${id}`, payload)
  },

  remove(id) {
    return http.delete(`/api/users/${id}`)
  },

  resetPassword(id, payload) {
    return http.post(`/api/users/${id}/reset-password`, payload)
  },

  lock(id) {
    return http.post(`/api/users/${id}/lock`)
  },

  unlock(id) {
    return http.post(`/api/users/${id}/unlock`)
  }
}

export default userApi
