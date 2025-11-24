import http from '../httpClient'

const DEVICE_BASE = '/api/ti6843/posture/devices'
const DATA_BASE = '/api/ti6843/posture/data'

export const ti6843PostureApi = {
  listDevices() {
    return http.get(DEVICE_BASE)
  },

  getDevice(deviceId) {
    return http.get(`${DEVICE_BASE}/${deviceId}`)
  },

  createDevice(payload) {
    return http.post(DEVICE_BASE, payload)
  },

  updateDevice(deviceId, payload) {
    return http.put(`${DEVICE_BASE}/${deviceId}`, payload)
  },

  deleteDevice(deviceId) {
    return http.delete(`${DEVICE_BASE}/${deviceId}`)
  },

  devicesByType(type) {
    return http.get(`${DEVICE_BASE}/type/${type}`)
  },

  devicesByStatus(status) {
    return http.get(`${DEVICE_BASE}/status/${status}`)
  },

  devicesByLocation(location) {
    return http.get(`${DEVICE_BASE}/location/${location}`)
  },

  health() {
    return http.get('/api/ti6843/posture/health')
  },

  realtimeByDevice(deviceId) {
    return http.get(`${DATA_BASE}/realtime/${deviceId}`)
  },

  realtimeByPerson(personId) {
    return http.get(`${DATA_BASE}/person/${personId}/realtime`)
  },

  latestSamplesByDevice(deviceId, params = {}) {
    return http.get(`${DATA_BASE}/data/device/${deviceId}`, params)
  },

  samplesByDeviceInRange(deviceId, params) {
    return http.get(`${DATA_BASE}/data/device/${deviceId}/timerange`, params)
  },

  samplesByPerson(personId, params = {}) {
    return http.get(`${DATA_BASE}/person/${personId}/data`, params)
  },

  samplesByPersonInRange(personId, params = {}) {
    return http.get(`${DATA_BASE}/person/${personId}/data/timerange`, params)
  },

  historicalByDevice(deviceId, params = {}) {
    return http.get(`${DATA_BASE}/historical/device/${deviceId}/timerange`, params)
  },

  historicalByPerson(personId, params = {}) {
    return http.get(`${DATA_BASE}/person/${personId}/historical`, params)
  },

  historicalSummary(params = {}) {
    return http.get(`${DATA_BASE}/historical/summary`, params)
  },

  historicalSummaryByPerson(personId, params = {}) {
    return http.get(`${DATA_BASE}/person/${personId}/historical/summary`, params)
  },

  healthStatus() {
    return http.get(`${DATA_BASE}/health`)
  },

  debugHistorical(personId) {
    return http.get(`${DATA_BASE}/debug/historical/person/${personId}`)
  }
}

export default ti6843PostureApi
