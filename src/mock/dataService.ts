import type {
  AlertStatus,
  CaregiverAlert,
  CaregiverDevice,
  CaregiverPerson,
  CaregiverProfile,
  DetectionSummary,
  DeviceStatusOverview,
  HistoryBucket,
  RealtimeSnapshot,
  VitalDataPoint
} from '@/types'

const now = new Date()

const caregiverProfile: CaregiverProfile = {
  username: 'care01',
  role: 'ROLE_USER',
  personCount: 3,
  deviceCount: 5,
  serverTime: now.toISOString()
}

const persons: CaregiverPerson[] = [
  {
    personId: 'P1001',
    personName: '王阿姨',
    age: 82,
    gender: 'F',
    department: '3F · 颐养区',
    tags: ['夜间重点', '高血压'],
    devices: [
      { deviceId: 'R60-A1', deviceName: '卧室雷达', modelType: 'R60ABD1' },
      { deviceId: 'TI-V1', deviceName: '生命体征', modelType: 'TI6843 Vital' }
    ],
    latestOverview: {
      heartRate: 72,
      breathRate: 16,
      motion: 6,
      posture: '平躺',
      collectedAt: now.toISOString()
    },
    lastAlertAt: new Date(now.getTime() - 35 * 60 * 1000).toISOString()
  },
  {
    personId: 'P1002',
    personName: '王宁',
    age: 79,
    gender: 'M',
    department: '5F · 康复区',
    tags: ['术后康复'],
    devices: [
      { deviceId: 'R60-A5', deviceName: '床位雷达', modelType: 'R60ABD1' },
      { deviceId: 'TI-V4', deviceName: '生命体征', modelType: 'TI6843 Vital' }
    ],
    latestOverview: {
      heartRate: 90,
      breathRate: 21,
      motion: 14,
      posture: '坐姿',
      collectedAt: new Date(now.getTime() - 2 * 60 * 1000).toISOString()
    },
    lastAlertAt: new Date(now.getTime() - 8 * 60 * 1000).toISOString()
  },
  {
    personId: 'P1003',
    personName: '宋杞',
    age: 88,
    gender: 'M',
    department: '2F · 失智专区',
    tags: ['离床看护', '跌倒风险'],
    devices: [
      { deviceId: 'TI-V7', deviceName: '生命体征', modelType: 'TI6843 Vital' },
      { deviceId: 'TI-P1', deviceName: '姿态雷达', modelType: 'TI6843 Posture' }
    ],
    latestOverview: {
      heartRate: 66,
      breathRate: 15,
      motion: 3,
      posture: '站立',
      collectedAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString()
    },
    lastAlertAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString()
  }
]

const devices: CaregiverDevice[] = [
  {
    deviceId: 'R60-A1',
    deviceName: '卧室雷达',
    modelType: 'R60ABD1',
    status: 'ONLINE',
    location: '301 床位 A',
    signalQuality: 92,
    lastHeartbeat: now.toISOString(),
    persons: [{ personId: 'P1001', personName: '王阿姨' }]
  },
  {
    deviceId: 'R60-A5',
    deviceName: '床位雷达',
    modelType: 'R60ABD1',
    status: 'OFFLINE',
    location: '503 床位 B',
    signalQuality: 48,
    lastHeartbeat: new Date(now.getTime() - 12 * 60 * 1000).toISOString(),
    persons: [{ personId: 'P1002', personName: '王宁' }]
  },
  {
    deviceId: 'TI-V1',
    deviceName: '生命体征传感器',
    modelType: 'TI6843 Vital',
    status: 'ONLINE',
    location: '301 床头',
    signalQuality: 88,
    lastHeartbeat: now.toISOString(),
    persons: [{ personId: 'P1001', personName: '王阿姨' }]
  },
  {
    deviceId: 'TI-V4',
    deviceName: '生命体征传感器',
    modelType: 'TI6843 Vital',
    status: 'ONLINE',
    location: '503 床头',
    signalQuality: 80,
    lastHeartbeat: new Date(now.getTime() - 1 * 60 * 1000).toISOString(),
    persons: [{ personId: 'P1002', personName: '王宁' }]
  },
  {
    deviceId: 'TI-P1',
    deviceName: '姿态雷达',
    modelType: 'TI6843 Posture',
    status: 'MAINTENANCE',
    location: '2F 公共走廊',
    signalQuality: 76,
    lastHeartbeat: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
    persons: [{ personId: 'P1003', personName: '宋杞' }]
  }
]

let alerts: CaregiverAlert[] = [
  {
    alertId: 987,
    personId: 'P1001',
    personName: '王阿姨',
    deviceId: 'TI-V1',
    alertType: 'HEART_TACHY',
    severity: 'HIGH',
    detectedAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    acknowledged: false,
    category: 'VITALS',
    status: 'ACTIVE',
    description: '心率持续高于 110 bpm'
  },
  {
    alertId: 988,
    personId: 'P1002',
    personName: '王宁',
    deviceId: 'R60-A5',
    alertType: 'PRESENCE_LOSS',
    severity: 'CRITICAL',
    detectedAt: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
    acknowledged: false,
    category: 'POSTURE',
    status: 'ACTIVE',
    description: '检测到离床超过 3 分钟'
  },
  {
    alertId: 989,
    personId: 'P1003',
    personName: '宋杞',
    deviceId: 'TI-P1',
    alertType: 'FALL_RISK',
    severity: 'MEDIUM',
    detectedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    acknowledged: true,
    category: 'POSTURE',
    status: 'ACKED',
    description: '姿态模型识别跌倒趋势'
  },
  {
    alertId: 990,
    personId: 'P1001',
    personName: '王阿姨',
    deviceId: 'TI-V1',
    alertType: 'BREATH_APNEA',
    severity: 'LOW',
    detectedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
    acknowledged: true,
    category: 'VITALS',
    status: 'RESOLVED',
    description: '凌晨出现短暂停呼，已平复'
  }
]

function generateHistory(personId: string): VitalDataPoint[] {
  const seed = personId.charCodeAt(personId.length - 1)
  return Array.from({ length: 48 }, (_, index) => {
    const timestamp = new Date(now.getTime() - index * 30 * 60 * 1000)
    return {
      timestamp: timestamp.toISOString(),
      heartRate: 60 + ((seed + index * 4) % 25),
      breathRate: 14 + ((seed + index * 2) % 8),
      motion: (seed + index * 3) % 20,
      occupancy: (seed + index) % 3 !== 0 ? 1 : 0
    }
  }).reverse()
}

const historyMap: Record<string, VitalDataPoint[]> = Object.fromEntries(
  persons.map((person) => [person.personId, generateHistory(person.personId)])
)

const realtimeSnapshots: Record<string, RealtimeSnapshot> = Object.fromEntries(
  persons.map((person, idx) => [
    person.personId,
    {
      personId: person.personId,
      heartRate: person.latestOverview?.heartRate || 0,
      breathRate: person.latestOverview?.breathRate || 0,
      motion: person.latestOverview?.motion || 0,
      posture: person.latestOverview?.posture || '未知',
      occupancy: idx !== 1,
      confidence: Number((0.85 + idx * 0.05).toFixed(2)),
      lastUpdated: person.latestOverview?.collectedAt || now.toISOString(),
      trend: [
        {
          label: '心率',
          value: person.latestOverview?.heartRate || 0,
          delta: idx === 1 ? 5 : -2
        },
        {
          label: '呼吸',
          value: person.latestOverview?.breathRate || 0,
          delta: idx === 2 ? -1 : 2
        },
        {
          label: '体动',
          value: person.latestOverview?.motion || 0,
          delta: idx === 0 ? 1 : -3
        }
      ]
    }
  ])
)

const historyBuckets: Record<string, HistoryBucket[]> = Object.fromEntries(
  persons.map((person) => [
    person.personId,
    Array.from({ length: 14 }, (_, index) => {
      const timestamp = new Date(now.getTime() - index * 60 * 60 * 1000)
      return {
        timestamp: timestamp.toISOString(),
        heartRateAvg: (person.latestOverview?.heartRate || 70) + ((index % 4) - 1) * 2,
        breathRateAvg: (person.latestOverview?.breathRate || 16) + ((index % 3) - 1) * 1.2,
        motionAvg: Math.max(0, (person.latestOverview?.motion || 6) + ((index % 2) - 0.5) * 4),
        eventCount: index % 5 === 0 ? 1 : 0
      }
    }).reverse()
  ])
)

function computeDeviceOverview(): DeviceStatusOverview {
  const base = { totalDevices: devices.length, online: 0, offline: 0, maintenance: 0 }
  let heartbeatDelaySum = 0
  devices.forEach((device) => {
    base[device.status.toLowerCase() as 'online' | 'offline' | 'maintenance'] += 1
    if (device.lastHeartbeat) {
      heartbeatDelaySum += Math.max(0, (now.getTime() - Date.parse(device.lastHeartbeat)) / 1000)
    }
  })
  const activeMappings = devices.reduce((sum, device) => sum + device.persons.length, 0)
  const unboundDevices = devices.filter((device) => device.persons.length === 0).length
  const avgHeartbeatDelaySec = devices.length ? Math.round(heartbeatDelaySum / devices.length) : 0
  return {
    ...base,
    activeMappings,
    unboundDevices,
    avgHeartbeatDelaySec
  }
}

function generateDetections(): DetectionSummary[] {
  return devices.map((device, index) => {
    const bound = device.persons[0]
    const person = bound ? persons.find((item) => item.personId === bound.personId) : undefined
    const overview = person?.latestOverview
    const detectionType = device.modelType.includes('Posture')
      ? 'POSTURE'
      : device.modelType.includes('R60')
        ? 'PRESENCE'
        : 'VITAL'
    const presence = detectionType === 'PRESENCE' ? device.status === 'ONLINE' && index % 3 !== 1 : true
    const fallRisk = detectionType === 'POSTURE' ? index % 2 === 0 && presence : false
    const anomalyTag =
      detectionType === 'POSTURE' && fallRisk ? '跌倒待确认' : detectionType === 'PRESENCE' && !presence ? '无人' : undefined

    return {
      detectionId: `${device.deviceId}-${index}`,
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      modelType: device.modelType,
      personId: bound?.personId,
      personName: bound?.personName,
      detectionType,
      presence,
      posture: overview?.posture,
      heartRate: overview?.heartRate,
      breathRate: overview?.breathRate,
      fallRisk,
      anomalyTag,
      updatedAt: new Date(now.getTime() - index * 5 * 60 * 1000).toISOString()
    }
  })
}

let detectionSnapshots = generateDetections()

function delay(ms = 260) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function mockLogin(credentials: { username: string; password: string }) {
  await delay()
  return {
    token: btoa(credentials.username + '-' + Date.now()),
    username: credentials.username,
    role: 'ROLE_USER',
    expiresIn: 86400000,
    accessiblePersons: persons.length
  }
}

export async function mockFetchProfile() {
  await delay()
  return {
    ...caregiverProfile,
    serverTime: new Date().toISOString()
  }
}

export async function mockFetchPersons() {
  await delay()
  return persons
}

export async function mockFetchDevices() {
  await delay()
  return devices
}

interface AlertFilterParams {
  personId?: string
  status?: string
  category?: string
}

export async function mockFetchAlerts(limit = 20, filters: AlertFilterParams = {}) {
  await delay(200)
  const scoped = alerts
    .filter((item) => (!filters.personId ? true : item.personId === filters.personId))
    .filter((item) => (!filters.status ? true : item.status === filters.status))
    .filter((item) => (!filters.category ? true : item.category === filters.category))
  return scoped
    .slice()
    .sort((a, b) => Date.parse(b.detectedAt) - Date.parse(a.detectedAt))
    .slice(0, limit)
}

export async function mockFetchHistory(personId: string) {
  await delay(200)
  return historyMap[personId] || []
}

export async function mockFetchRealtimeSnapshot(personId: string) {
  await delay(180)
  return (
    realtimeSnapshots[personId] || {
      personId,
      heartRate: 0,
      breathRate: 0,
      motion: 0,
      posture: '未知',
      occupancy: false,
      confidence: 0,
      lastUpdated: new Date().toISOString(),
      trend: []
    }
  )
}

export async function mockFetchHistoryBuckets(personId: string) {
  await delay(160)
  return historyBuckets[personId] || []
}

export async function mockFetchDeviceOverview() {
  await delay(140)
  return computeDeviceOverview()
}

export async function mockFetchDetections() {
  await delay(180)
  detectionSnapshots = generateDetections()
  return detectionSnapshots
}

export async function mockUpdateAlertStatus(alertId: number, status: AlertStatus) {
  await delay(120)
  alerts = alerts.map((item) =>
    item.alertId === alertId
      ? {
          ...item,
          status,
          acknowledged: status !== 'ACTIVE'
        }
      : item
  )
  const updated = alerts.find((item) => item.alertId === alertId)
  if (!updated) {
    throw new Error('Alert not found')
  }
  return updated
}
