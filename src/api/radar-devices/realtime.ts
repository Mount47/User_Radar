import http from '../httpClient'

const DETECTION_BASE = '/api/detection'

export const detectionApi = {
  statusByDevice(deviceId) {
    return http.get(`${DETECTION_BASE}/status/${deviceId}`)
  },

  allStatuses() {
    return http.get(`${DETECTION_BASE}/status/all`)
  },

  statusesByModel(modelType) {
    return http.get(`${DETECTION_BASE}/status/model-type/${modelType}`)
  },

  statusesWithPerson() {
    return http.get(`${DETECTION_BASE}/status/with-person`)
  }
}

export const deviceStatusStreamApi = {
  heartbeat(deviceId) {
    return http.get(`/api/device-status/${deviceId}`)
  }
}

export default {
  detectionApi,
  deviceStatusStreamApi
}
