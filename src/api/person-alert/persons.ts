import http from '../httpClient'

/**
 * Person management endpoints.
 */
export const personApi = {
  list() {
    return http.get('/api/persons')
  },

  getById(personId: string) {
    return http.get(`/api/persons/${personId}`)
  },

  search(query: string) {
    return http.get('/api/persons/search', { name: query })
  },

  listByDepartment(department: string) {
    return http.get(`/api/persons/department/${encodeURIComponent(department)}`)
  },

  create(payload: Record<string, unknown>) {
    return http.post('/api/persons', payload)
  },

  update(personId: string, payload: Record<string, unknown>) {
    return http.put(`/api/persons/${personId}`, payload)
  },

  remove(personId: string) {
    return http.delete(`/api/persons/${personId}`)
  }
}

export default personApi
