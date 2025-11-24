import http from '../httpClient'

/**
 * Person ↔ Device mapping endpoints.
 */
export const mappingApi = {
  listActive() {
    return http.get('/api/person-device-mappings')
  },

  getById(id: string) {
    return http.get(`/api/person-device-mappings/${id}`)
  },

  create(payload: Record<string, unknown>) {
    return http.post('/api/person-device-mappings', payload)
  },

  update(id: string, payload: Record<string, unknown>) {
    return http.put(`/api/person-device-mappings/${id}`, payload)
  },

  deleteById(id: string) {
    return http.delete(`/api/person-device-mappings/${id}`)
  },

  deleteByDevice(deviceId: string) {
    return http.delete(`/api/person-device-mappings/device/${deviceId}`)
  },

  deleteByPerson(personId: string) {
    return http.delete(`/api/person-device-mappings/person/${personId}`)
  },

  deleteBatch(payload: Record<string, unknown>) {
    return http.delete('/api/person-device-mappings/batch', {}, { data: payload })
  },

  swap(payload: Record<string, unknown>) {
    return http.post('/api/person-device-mappings/swap', payload)
  },

  swapPersons(payload: Record<string, unknown>) {
    return http.post('/api/person-device-mappings/swap-persons', payload)
  },

  batchSafeUpdate(payload: Record<string, unknown>) {
    return http.put('/api/person-device-mappings/batch-safe', payload)
  },

  batchUpdate(payload: Record<string, unknown>) {
    return http.put('/api/person-device-mappings/batch', payload)
  },

  multiBind(payload: Record<string, unknown>) {
    return http.post('/api/person-device-mappings/multi-bind', payload)
  },

  createWithMetadata(payload: Record<string, unknown>) {
    return http.post('/api/person-device-mappings/create', payload)
  },

  switchDevice(payload: Record<string, unknown>) {
    return http.post('/api/person-device-mappings/switch', payload)
  },

  deactivate(id: string) {
    return http.put(`/api/person-device-mappings/${id}/deactivate`)
  },

  reactivate(id: string) {
    return http.put(`/api/person-device-mappings/${id}/reactivate`)
  },

  inactiveList() {
    return http.get('/api/person-device-mappings/inactive')
  },

  cleanupInactive(payload: Record<string, unknown> = {}) {
    return http.delete('/api/person-device-mappings/cleanup', {}, { data: payload })
  },

  devicesByPerson(personId: string) {
    return http.get(`/api/person-device-mappings/person/${personId}/devices`)
  },

  devicesByPersonAndModel(personId: string, modelType: string) {
    return http.get(
      `/api/person-device-mappings/person/${personId}/devices/model-type/${modelType}`
    )
  },

  mappingsByPerson(personId: string) {
    return http.get(`/api/person-device-mappings/person/${personId}/mappings`)
  },

  mappingsByPersonAndModel(personId: string, modelType: string) {
    return http.get(
      `/api/person-device-mappings/person/${personId}/mappings/model-type/${modelType}`
    )
  },

  mappingsByDevice(deviceId: string) {
    return http.get(`/api/person-device-mappings/device/${deviceId}/all`)
  },

  activeByModel(modelType: string) {
    return http.get(`/api/person-device-mappings/active/model-type/${modelType}`)
  },

  statistics() {
    return http.get('/api/person-device-mappings/statistics')
  },

  hasActiveMapping(deviceId: string) {
    return http.get(`/api/person-device-mappings/device/${deviceId}/has-active`)
  }
}

export default mappingApi
