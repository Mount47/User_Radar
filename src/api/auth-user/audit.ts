import http from '../httpClient'

const AUDIT_BASE = '/api/admin/audit-logs'

export const auditLogApi = {
  list(params = {}) {
    return http.get(AUDIT_BASE, params)
  }
}

export default auditLogApi
