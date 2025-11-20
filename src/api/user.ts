import type {
  AlertStatus,
  CaregiverAlert,
  CaregiverDevice,
  CaregiverPerson,
  CaregiverProfile,
  DetectionSummary,
  DeviceStatusOverview,
  HistoryBucket,
  PersonDeviceMapping,
  RealtimeSnapshot,
  VitalDataPoint
} from '@/types'
import client from './client'
import {
  mockFetchAlerts,
  mockFetchDevices,
  mockFetchHistory,
  mockFetchHistoryBuckets,
  mockFetchPersons,
  mockFetchProfile,
  mockFetchRealtimeSnapshot,
  mockFetchDeviceOverview,
  mockFetchDetections,
  mockLogin,
  mockUpdateAlertStatus,
  mockFetchPersonDirectory,
  mockFetchDeviceDirectory,
  mockFetchMappings
} from '@/mock/dataService'

const DEFAULT_HISTORY_HOURS = 24

function resolveRange(hours = DEFAULT_HISTORY_HOURS) {
  const end = new Date()
  const start = new Date(end.getTime() - hours * 60 * 60 * 1000)
  return { start: start.toISOString(), end: end.toISOString() }
}

function buildBucketsFromPoints(points: VitalDataPoint[], hours: number): HistoryBucket[] {
  const buckets: Record<string, HistoryBucket> = {}
  const ordered = [...points].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  ordered.forEach((point) => {
    const hour = new Date(point.timestamp)
    hour.setMinutes(0, 0, 0)
    const key = hour.toISOString()
    if (!buckets[key]) {
      buckets[key] = {
        timestamp: key,
        heartRateAvg: 0,
        breathRateAvg: 0,
        motionAvg: 0,
        eventCount: 0
      }
    }
    buckets[key].heartRateAvg += Number(point.heartRate ?? 0)
    buckets[key].breathRateAvg += Number(point.breathRate ?? 0)
    buckets[key].motionAvg += Number(point.motion ?? 0)
    buckets[key].eventCount += 1
  })

  const limitTs = new Date().getTime() - hours * 60 * 60 * 1000
  return Object.values(buckets)
    .filter((bucket) => new Date(bucket.timestamp).getTime() >= limitTs)
    .map((bucket) => ({
      ...bucket,
      heartRateAvg: bucket.eventCount ? bucket.heartRateAvg / bucket.eventCount : 0,
      breathRateAvg: bucket.eventCount ? bucket.breathRateAvg / bucket.eventCount : 0,
      motionAvg: bucket.eventCount ? bucket.motionAvg / bucket.eventCount : 0
    }))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}

export interface LoginResponse {
  token: string
  username: string
  role: string
  expiresIn: number
  accessiblePersons: number
}

interface Credentials {
  username: string
  password: string
}

export interface AlertQuery {
  personId?: string
  status?: string
  category?: string
}

export async function loginUser(payload: Credentials): Promise<LoginResponse> {
  try {
    const { data } = await client.post<LoginResponse>('/auth/login', payload)
    return data
  } catch (error) {
    console.warn('登录接口不可用，使用模拟数据', error)
    return mockLogin(payload)
  }
}

export async function fetchCaregiverProfile(): Promise<CaregiverProfile> {
  try {
    const { data } = await client.get<CaregiverProfile>('/me/profile')
    return data
  } catch (error) {
    console.warn('获取概览失败，使用模拟数据回退', error)
    return mockFetchProfile()
  }
}

export async function fetchCaregiverPersons(): Promise<CaregiverPerson[]> {
  try {
    const { data } = await client.get<CaregiverPerson[]>('/me/persons')
    return data
  } catch (error) {
    console.warn('获取人员列表失败，使用模拟数据回退', error)
    return mockFetchPersons()
  }
}

export async function fetchCaregiverDevices(): Promise<CaregiverDevice[]> {
  try {
    const { data } = await client.get<CaregiverDevice[]>('/me/devices')
    return data
  } catch (error) {
    console.warn('获取设备列表失败，使用模拟数据回退', error)
    return mockFetchDevices()
  }
}

export async function fetchCaregiverAlerts(limit = 20, filters: AlertQuery = {}): Promise<CaregiverAlert[]> {
  try {
    const { data } = await client.get<CaregiverAlert[]>('/me/alerts', {
      params: { limit, ...filters }
    })
    return data
  } catch (error) {
    console.warn('获取告警失败，使用模拟数据回退', error)
    return mockFetchAlerts(limit, filters)
  }
}

export async function fetchPersonHistory(
  personId: string,
  hours = DEFAULT_HISTORY_HOURS,
  deviceId?: string
): Promise<VitalDataPoint[]> {
  const { start, end } = resolveRange(hours)
  try {
    const target = deviceId
      ? `/ti6843/vital/data/historical/device/${deviceId}/timerange`
      : `/ti6843/vital/data/person/${personId}/data/timerange`
    const { data } = await client.get<VitalDataPoint[]>(target, { params: { start, end } })
    return data ?? []
  } catch (error) {
    console.warn('获取历史趋势失败，使用模拟数据回退', error)
    return mockFetchHistory(personId)
  }
}

export async function fetchRealtimeSnapshot(personId: string): Promise<RealtimeSnapshot> {
  try {
    const { data } = await client.get<RealtimeSnapshot>(
      `/ti6843/vital/data/person/${personId}/realtime`
    )
    return data ?? ({} as RealtimeSnapshot)
  } catch (error) {
    console.warn('获取实时数据失败，使用模拟数据回退', error)
    return mockFetchRealtimeSnapshot(personId)
  }
}

export async function fetchHistoryBuckets(
  personId: string,
  hours = DEFAULT_HISTORY_HOURS,
  deviceId?: string
): Promise<HistoryBucket[]> {
  try {
    const points = await fetchPersonHistory(personId, hours, deviceId)
    return buildBucketsFromPoints(points, hours)
  } catch (error) {
    console.warn('获取历史统计失败，使用模拟数据回退', error)
    return mockFetchHistoryBuckets(personId)
  }
}

export async function fetchDeviceStatusOverview(): Promise<DeviceStatusOverview> {
  try {
    const { data } = await client.get<DeviceStatusOverview>('/device-status/overview')
    return data
  } catch (error) {
    console.warn('设备状态概览接口不可用，使用模拟数据回退', error)
    return mockFetchDeviceOverview()
  }
}

export async function fetchDetectionSummaries(): Promise<DetectionSummary[]> {
  try {
    const { data } = await client.get<DetectionSummary[]>(
      '/detection/status/with-person'
    )
    return data?.map((item) => ({
      ...item,
      detectionId: item.detectionId || `${item.deviceId}-${item.personId || 'unbound'}`,
      updatedAt: item.updatedAt || item.lastUpdateTime || new Date().toISOString()
    }))
  } catch (error) {
    console.warn('检测概览接口不可用，使用模拟数据回退', error)
    return mockFetchDetections()
  }
}

export async function updateAlertStatus(alertId: number, status: AlertStatus): Promise<CaregiverAlert> {
  try {
    const { data } = await client.post<CaregiverAlert>(`/alerts/${alertId}/status`, { status })
    return data
  } catch (error) {
    console.warn('更新告警状态失败，使用模拟数据回退', error)
    return mockUpdateAlertStatus(alertId, status)
  }
}

export async function fetchPersonDirectory(): Promise<CaregiverPerson[]> {
  try {
    const { data } = await client.get<CaregiverPerson[]>('/persons')
    return data ?? []
  } catch (error) {
    console.warn('获取人员管理列表失败，使用模拟数据回退', error)
    return mockFetchPersonDirectory()
  }
}

export async function fetchDeviceDirectory(params?: {
  page?: number
  size?: number
  modelType?: string
  status?: string
  location?: string
}): Promise<CaregiverDevice[]> {
  try {
    const { data } = await client.get<any>('/radar/devices', { params })
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.content)) return data.content
    if (Array.isArray(data?.items)) return data.items
    return []
  } catch (error) {
    console.warn('获取设备管理列表失败，使用模拟数据回退', error)
    return mockFetchDeviceDirectory()
  }
}

export async function fetchPersonDeviceMappings(): Promise<PersonDeviceMapping[]> {
  try {
    const { data } = await client.get<PersonDeviceMapping[]>('/person-device-mappings')
    return data ?? []
  } catch (error) {
    console.warn('获取绑定关系失败，使用模拟数据回退', error)
    return mockFetchMappings()
  }
}
