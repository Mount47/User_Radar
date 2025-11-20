export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE'
export type AlertCategory = 'VITALS' | 'POSTURE' | 'DEVICE'
export type AlertStatus = 'ACTIVE' | 'ACKED' | 'RESOLVED' | 'IGNORED'

export interface CaregiverProfile {
  username: string
  role: string
  personCount: number
  deviceCount: number
  serverTime: string
}

export interface CaregiverPersonDevice {
  deviceId: string
  deviceName: string
  modelType?: string
}

export interface CaregiverPerson {
  personId: string
  personName: string
  age: number
  gender: 'M' | 'F'
  department: string
  devices: CaregiverPersonDevice[]
  tags?: string[]
  latestOverview?: {
    heartRate?: number
    breathRate?: number
    motion?: number
    posture?: string
    collectedAt?: string
  }
  lastAlertAt?: string
}

export interface CaregiverDevice {
  deviceId: string
  deviceName: string
  modelType: string
  status: DeviceStatus
  location: string
  persons: Array<{ personId: string; personName: string }>
  signalQuality?: number
  lastHeartbeat?: string
}

export interface PersonDeviceMapping {
  mappingId: string
  personId: string
  personName?: string
  deviceId: string
  deviceName?: string
  modelType?: string
  status: DeviceStatus
  createdAt?: string
  updatedAt?: string
  location?: string
}

export interface CaregiverAlert {
  alertId: number
  personId: string
  personName: string
  deviceId: string
  alertType: string
  severity: AlertSeverity
  detectedAt: string
  acknowledged?: boolean
  description?: string
  category?: AlertCategory
  status?: AlertStatus
}

export interface RealtimeSnapshot {
  personId: string
  heartRate: number
  breathRate: number
  motion: number
  posture: string
  occupancy: boolean
  confidence: number
  lastUpdated: string
  trend: Array<{ label: string; value: number; delta: number }>
}

export interface HistoryBucket {
  timestamp: string
  heartRateAvg: number
  breathRateAvg: number
  motionAvg: number
  eventCount: number
}

export interface VitalDataPoint {
  timestamp: string
  heartRate: number
  breathRate: number
  motion: number
  occupancy?: number
}

export interface DeviceStatusOverview {
  totalDevices: number
  online: number
  offline: number
  maintenance: number
  activeMappings: number
  unboundDevices: number
  avgHeartbeatDelaySec: number
}

export type DetectionType = 'VITAL' | 'POSTURE' | 'PRESENCE'

export interface DetectionSummary {
  detectionId: string
  deviceId: string
  deviceName: string
  modelType: string
  personId?: string
  personName?: string
  detectionType: DetectionType
  presence: boolean
  posture?: string
  heartRate?: number
  breathRate?: number
  fallRisk?: boolean
  anomalyTag?: string
  updatedAt: string
  lastUpdateTime?: string
}
