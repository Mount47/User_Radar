import http from '../httpClient'

const FALL_BASE = '/api/fall-alerts'
const VITAL_ALERT_BASE = '/api/vitals-alerts'

export const fallAlertApi = {
  health() {
    return http.get(`${FALL_BASE}/health`)
  },

  list(params = {}) {
    return http.get(FALL_BASE, params)
  },

  listActive() {
    return http.get(`${FALL_BASE}/active`)
  },

  getById(id) {
    return http.get(`${FALL_BASE}/${id}`)
  },

  activeByDevice(deviceId) {
    return http.get(`${FALL_BASE}/device/${deviceId}/active`)
  },

  activeByPerson(personId) {
    return http.get(`${FALL_BASE}/person/${personId}/active`)
  },

  range(params = {}) {
    return http.get(`${FALL_BASE}/timerange`, params)
  },

  rangeByDevice(deviceId, params = {}) {
    return http.get(`${FALL_BASE}/device/${deviceId}/timerange`, params)
  },

  rangeByPerson(personId, params = {}) {
    return http.get(`${FALL_BASE}/person/${personId}/timerange`, params)
  },

  markPending(id, payload = {}) {
    return http.post(`${FALL_BASE}/${id}/pending`, payload)
  },

  markResolved(id, payload = {}) {
    return http.post(`${FALL_BASE}/${id}/resolved`, payload)
  },

  markFalseAlarm(id, payload = {}) {
    return http.post(`${FALL_BASE}/${id}/false-alarm`, payload)
  },

  statistics(params = {}) {
    return http.get(`${FALL_BASE}/statistics`, params)
  }
}

export const vitalsAlertApi = {
  list(params = {}) {
    return http.get(VITAL_ALERT_BASE, params)
  },

  getById(id) {
    return http.get(`${VITAL_ALERT_BASE}/${id}`)
  },

  byDevice(deviceId, params = {}) {
    return http.get(`${VITAL_ALERT_BASE}/device/${deviceId}`, params)
  },

  byPerson(personId, params = {}) {
    return http.get(`${VITAL_ALERT_BASE}/person/${personId}`, params)
  },

  range(params = {}) {
    return http.get(`${VITAL_ALERT_BASE}/timerange`, params)
  }
}

export default {
  fallAlertApi,
  vitalsAlertApi
}
