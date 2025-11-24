import http from '../httpClient'

const DEVICE_BASE = '/api/ti6843/posture/devices'
const DATA_BASE = '/api/ti6843/posture/data'

export const ti6843PostureApi = {
  listDevices() {
    return http.get(DEVICE_BASE)
  },

  getDevice(deviceId: string) {
    return http.get(`${DEVICE_BASE}/${deviceId}`)
  },

  createDevice(payload: Record<string, unknown>) {
    return http.post(DEVICE_BASE, payload)
  },

  updateDevice(deviceId: string, payload: Record<string, unknown>) {
    return http.put(`${DEVICE_BASE}/${deviceId}`, payload)
  },

  deleteDevice(deviceId: string) {
    return http.delete(`${DEVICE_BASE}/${deviceId}`)
  },

  devicesByType(type: string) {
    return http.get(`${DEVICE_BASE}/type/${type}`)
  },

  devicesByStatus(status: string) {
    return http.get(`${DEVICE_BASE}/status/${status}`)
  },

  devicesByLocation(location: string) {
    return http.get(`${DEVICE_BASE}/location/${location}`)
  },

  health() {
    return http.get('/api/ti6843/posture/health')
  },

  realtimeByDevice(deviceId: string) {
    return http.get(`${DATA_BASE}/realtime/${deviceId}`)
  },

  realtimeByPerson(personId: string) {
    return http.get(`${DATA_BASE}/person/${personId}/realtime`)
  },

  latestSamplesByDevice(deviceId: string, params: Record<string, unknown> = {}) {
    return http.get(`${DATA_BASE}/data/device/${deviceId}`, params)
  },

  samplesByDeviceInRange(deviceId: string, params: Record<string, unknown>) {
    return http.get(`${DATA_BASE}/data/device/${deviceId}/timerange`, params)
  },

  samplesByPerson(personId: string, params: Record<string, unknown> = {}) {
    return http.get(`${DATA_BASE}/person/${personId}/data`, params)
  },

  samplesByPersonInRange(personId: string, params: Record<string, unknown> = {}) {
    return http.get(`${DATA_BASE}/person/${personId}/data/timerange`, params)
  },

  historicalByDevice(deviceId: string, params: Record<string, unknown> = {}) {
    return http.get(`${DATA_BASE}/historical/device/${deviceId}/timerange`, params)
  },

  historicalByPerson(personId: string, params: Record<string, unknown> = {}) {
    return http.get(`${DATA_BASE}/person/${personId}/historical`, params)
  },

  historicalSummary(params: Record<string, unknown> = {}) {
    return http.get(`${DATA_BASE}/historical/summary`, params)
  },

  historicalSummaryByPerson(personId: string, params: Record<string, unknown> = {}) {
    return http.get(`${DATA_BASE}/person/${personId}/historical/summary`, params)
  },

  healthStatus() {
    return http.get(`${DATA_BASE}/health`)
  },

  debugHistorical(personId: string) {
    return http.get(`${DATA_BASE}/debug/historical/person/${personId}`)
  }
}

export default ti6843PostureApi
