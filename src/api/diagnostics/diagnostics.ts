import http from '../httpClient'

/**
 * Diagnostics-focused endpoints: device status dashboards & system health checks.
 */
export const diagnosticsApi = {

  databaseConnectivity() {
    return http.get('/api/test/db')
  },

  databaseInfo() {
    return http.get('/api/test/db/info')
  },

  databaseQueryCheck() {
    return http.get('/api/test/db/query')
  },

  systemInfo() {
    return http.get('/api/test/system')
  }
}

export default diagnosticsApi
