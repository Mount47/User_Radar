import http from '../httpClient'

const FALL_BASE = '/api/fall-alerts'
const VITAL_ALERT_BASE = '/api/vitals-alerts'

export const fallAlertApi = {
  health() {
    return http.get(`${FALL_BASE}/health`)
  },

  list(params: Record<string, unknown> = {}) {
    return http.get(FALL_BASE, params)
  },

  listActive() {
    return http.get(`${FALL_BASE}/active`)
  },

  getById(id: string) {
    return http.get(`${FALL_BASE}/${id}`)
  },

  activeByDevice(deviceId: string) {
    return http.get(`${FALL_BASE}/device/${deviceId}/active`)
  },

  activeByPerson(personId: string) {
    return http.get(`${FALL_BASE}/person/${personId}/active`)
  },

  range(params: Record<string, unknown> = {}) {
    return http.get(`${FALL_BASE}/timerange`, params)
  },

  rangeByDevice(deviceId: string, params: Record<string, unknown> = {}) {
    return http.get(`${FALL_BASE}/device/${deviceId}/timerange`, params)
  },

  rangeByPerson(personId: string, params: Record<string, unknown> = {}) {
    return http.get(`${FALL_BASE}/person/${personId}/timerange`, params)
  },

  markPending(id: string, payload: Record<string, unknown> = {}) {
    return http.post(`${FALL_BASE}/${id}/pending`, payload)
  },

  markResolved(id: string, payload: Record<string, unknown> = {}) {
    return http.post(`${FALL_BASE}/${id}/resolved`, payload)
  },

  markFalseAlarm(id: string, payload: Record<string, unknown> = {}) {
    return http.post(`${FALL_BASE}/${id}/false-alarm`, payload)
  },

  statistics(params: Record<string, unknown> = {}) {
    return http.get(`${FALL_BASE}/statistics`, params)
  }
}

export const vitalsAlertApi = {
  list(params: Record<string, unknown> = {}) {
    return http.get(VITAL_ALERT_BASE, params)
  },

  getById(id: string) {
    return http.get(`${VITAL_ALERT_BASE}/${id}`)
  },

  byDevice(deviceId: string, params: Record<string, unknown> = {}) {
    return http.get(`${VITAL_ALERT_BASE}/device/${deviceId}`, params)
  },

  byPerson(personId: string, params: Record<string, unknown> = {}) {
    return http.get(`${VITAL_ALERT_BASE}/person/${personId}`, params)
  },

  range(params: Record<string, unknown> = {}) {
    return http.get(`${VITAL_ALERT_BASE}/timerange`, params)
  }
}

export default {
  fallAlertApi,
  vitalsAlertApi
}
