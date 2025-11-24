import http from '../httpClient'

/**
 * Person ↔ Device mapping endpoints.
 */
export const mappingApi = {
  listActive() {
    return http.get('/api/person-device-mappings')
  },

  getById(id) {
    return http.get(`/api/person-device-mappings/${id}`)
  },

  create(payload) {
    return http.post('/api/person-device-mappings', payload)
  },

  update(id, payload) {
    return http.put(`/api/person-device-mappings/${id}`, payload)
  },

  deleteById(id) {
    return http.delete(`/api/person-device-mappings/${id}`)
  },

  deleteByDevice(deviceId) {
    return http.delete(`/api/person-device-mappings/device/${deviceId}`)
  },

  deleteByPerson(personId) {
    return http.delete(`/api/person-device-mappings/person/${personId}`)
  },

  deleteBatch(payload) {
    return http.delete('/api/person-device-mappings/batch', {}, { data: payload })
  },

  swap(payload) {
    return http.post('/api/person-device-mappings/swap', payload)
  },

  swapPersons(payload) {
    return http.post('/api/person-device-mappings/swap-persons', payload)
  },

  batchSafeUpdate(payload) {
    return http.put('/api/person-device-mappings/batch-safe', payload)
  },

  batchUpdate(payload) {
    return http.put('/api/person-device-mappings/batch', payload)
  },

  multiBind(payload) {
    return http.post('/api/person-device-mappings/multi-bind', payload)
  },

  createWithMetadata(payload) {
    return http.post('/api/person-device-mappings/create', payload)
  },

  switchDevice(payload) {
    return http.post('/api/person-device-mappings/switch', payload)
  },

  deactivate(id) {
    return http.put(`/api/person-device-mappings/${id}/deactivate`)
  },

  reactivate(id) {
    return http.put(`/api/person-device-mappings/${id}/reactivate`)
  },

  inactiveList() {
    return http.get('/api/person-device-mappings/inactive')
  },

  cleanupInactive(payload = {}) {
    return http.delete('/api/person-device-mappings/cleanup', {}, { data: payload })
  },

  devicesByPerson(personId) {
    return http.get(`/api/person-device-mappings/person/${personId}/devices`)
  },

  devicesByPersonAndModel(personId, modelType) {
    return http.get(
      `/api/person-device-mappings/person/${personId}/devices/model-type/${modelType}`
    )
  },

  mappingsByPerson(personId) {
    return http.get(`/api/person-device-mappings/person/${personId}/mappings`)
  },

  mappingsByPersonAndModel(personId, modelType) {
    return http.get(
      `/api/person-device-mappings/person/${personId}/mappings/model-type/${modelType}`
    )
  },

  mappingsByDevice(deviceId) {
    return http.get(`/api/person-device-mappings/device/${deviceId}/all`)
  },

  activeByModel(modelType) {
    return http.get(`/api/person-device-mappings/active/model-type/${modelType}`)
  },

  statistics() {
    return http.get('/api/person-device-mappings/statistics')
  },

  hasActiveMapping(deviceId) {
    return http.get(`/api/person-device-mappings/device/${deviceId}/has-active`)
  }
}

export default mappingApi
