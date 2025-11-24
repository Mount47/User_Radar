export { http } from './httpClient'

// Auth & User
export { authApi } from './auth-user/auth'
export { userApi } from './auth-user/users'
export { auditLogApi } from './auth-user/audit'

// Person & Alert
export { personApi } from './person-alert/persons'
export { mappingApi } from './person-alert/mappings'
export { fallAlertApi, vitalsAlertApi } from './person-alert/alerts'

// Radar Devices
export { deviceApi } from './radar-devices/devices'
export { ti6843VitalApi } from './radar-devices/ti6843Vital'
export { ti6843PostureApi } from './radar-devices/ti6843Posture'
export { detectionApi, deviceStatusStreamApi } from './radar-devices/realtime'
export { wsApi } from './websocket'

// Diagnostics
export { diagnosticsApi } from './diagnostics/diagnostics'
