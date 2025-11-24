import http from '../httpClient'

/**
 * Person management endpoints.
 */
export const personApi = {
  list() {
    return http.get('/api/persons')
  },

  getById(personId) {
    return http.get(`/api/persons/${personId}`)
  },

  search(query) {
    return http.get('/api/persons/search', { name: query })
  },

  listByDepartment(department) {
    return http.get(`/api/persons/department/${encodeURIComponent(department)}`)
  },

  create(payload) {
    return http.post('/api/persons', payload)
  },

  update(personId, payload) {
    return http.put(`/api/persons/${personId}`, payload)
  },

  remove(personId) {
    return http.delete(`/api/persons/${personId}`)
  }
}

export default personApi
