import http from '../httpClient'

/**
 * 
 */
export const deviceStatusApi = {
  deviceOverview() {
    return http.get('/api/device-status/overview')
  },

  deviceStatus(deviceId) {
    return http.get(`/api/device-status/${deviceId}`)
  },

  unboundDevices() {
    return http.get('/api/device-status/unbound')
  },

  mappingCandidates() {
    return http.get('/api/device-status/all-for-mapping')
  }
}

export default deviceStatusApi
