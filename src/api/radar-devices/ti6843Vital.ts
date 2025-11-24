import http from '../httpClient'

const DEVICE_BASE = '/api/ti6843/vital/devices'
const DATA_BASE = '/api/ti6843/vital/data'

export const ti6843VitalApi = {
  // Device management
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

  // Realtime data
  realtimeByDevice(deviceId: string) {
    return http.get(`${DATA_BASE}/realtime/${deviceId}`)
  },

  realtimeByPerson(personId: string) {
    return http.get(`${DATA_BASE}/person/${personId}/realtime`)
  },

  // Sliding-window data snapshots
  latestSamplesByDevice(deviceId: string, params: Record<string, unknown> = {}) {
    return http.get(`${DATA_BASE}/data/device/${deviceId}`, params)
  },

  samplesByDeviceInRange(deviceId: string, params: Record<string, unknown>) {
    return http.get(`${DATA_BASE}/data/device/${deviceId}/timerange`, params)
  },

  samplesByPerson(personId: string, params: Record<string, unknown> = {}) {
    return http.get(`${DATA_BASE}/person/${personId}/data`, params)
  },

  samplesByPersonInRange(personId: string, params: Record<string, unknown>) {
    return http.get(`${DATA_BASE}/person/${personId}/data/timerange`, params)
  },

  // Historical aggregation
  historical(params: Record<string, unknown> = {}) {
    return http.get(`${DATA_BASE}/historical`, params)
  },

  historicalByDevice(deviceId: string, params: Record<string, unknown>) {
    return http.get(`${DATA_BASE}/historical/device/${deviceId}/timerange`, params)
  },

  historicalByPerson(personId: string, params: Record<string, unknown>) {
    return http.get(`${DATA_BASE}/person/${personId}/historical`, params)
  },

  historicalByPersonRange(personId: string, params: Record<string, unknown>) {
    return http.get(`${DATA_BASE}/person/${personId}/historical/timerange`, params)
  },

  historicalSummary(params: Record<string, unknown> = {}) {
    return http.get(`${DATA_BASE}/historical/summary`, params)
  },

  historicalSummaryByPerson(personId: string, params: Record<string, unknown> = {}) {
    return http.get(`${DATA_BASE}/person/${personId}/historical/summary`, params)
  }
}

export default ti6843VitalApi
