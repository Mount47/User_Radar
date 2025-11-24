import http from '../httpClient'

/**
 * Radar device & status endpoints.
 */
export const deviceApi = {
  list(params: Record<string, unknown> = {}) {
    return http.get('/api/radar/devices', params)
  },

  listAll() {
    return http.get('/api/radar/devices/list')
  },

  getById(deviceId: string) {
    return http.get(`/api/radar/devices/${deviceId}`)
  },

  create(payload: Record<string, unknown>) {
    return http.post('/api/radar/devices', payload)
  },

  update(deviceId: string, payload: Record<string, unknown>) {
    return http.put(`/api/radar/devices/${deviceId}`, payload)
  },

  remove(deviceId: string) {
    return http.delete(`/api/radar/devices/${deviceId}`)
  }
}

export default deviceApi
