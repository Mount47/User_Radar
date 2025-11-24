import http from '../httpClient'

const DEVICE_BASE = '/api/ti6843/vital/devices'
const DATA_BASE = '/api/ti6843/vital/data'

export const ti6843VitalApi = {
  // Device management
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

  // Realtime data
  realtimeByDevice(deviceId) {
    return http.get(`${DATA_BASE}/realtime/${deviceId}`)
  },

  realtimeByPerson(personId) {
    return http.get(`${DATA_BASE}/person/${personId}/realtime`)
  },

  // Sliding-window data snapshots
  latestSamplesByDevice(deviceId, params = {}) {
    return http.get(`${DATA_BASE}/data/device/${deviceId}`, params)
  },

  samplesByDeviceInRange(deviceId, params) {
    return http.get(`${DATA_BASE}/data/device/${deviceId}/timerange`, params)
  },

  samplesByPerson(personId, params = {}) {
    return http.get(`${DATA_BASE}/person/${personId}/data`, params)
  },

  samplesByPersonInRange(personId, params) {
    return http.get(`${DATA_BASE}/person/${personId}/data/timerange`, params)
  },

  // Historical aggregation
  historical(params = {}) {
    return http.get(`${DATA_BASE}/historical`, params)
  },

  historicalByDevice(deviceId, params) {
    return http.get(`${DATA_BASE}/historical/device/${deviceId}/timerange`, params)
  },

  historicalByPerson(personId, params) {
    return http.get(`${DATA_BASE}/person/${personId}/historical`, params)
  },

  historicalByPersonRange(personId, params) {
    return http.get(`${DATA_BASE}/person/${personId}/historical/timerange`, params)
  },

  historicalSummary(params = {}) {
    return http.get(`${DATA_BASE}/historical/summary`, params)
  },

  historicalSummaryByPerson(personId, params = {}) {
    return http.get(`${DATA_BASE}/person/${personId}/historical/summary`, params)
  }
}

export default ti6843VitalApi
