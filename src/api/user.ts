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
  mockUpdateAlertStatus
} from '@/mock/dataService'

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

export async function fetchPersonHistory(personId: string): Promise<VitalDataPoint[]> {
  try {
    const { data } = await client.get<VitalDataPoint[]>(`/persons/${personId}/history`)
    return data ?? []
  } catch (error) {
    console.warn('获取历史趋势失败，使用模拟数据回退', error)
    return mockFetchHistory(personId)
  }
}

export async function fetchRealtimeSnapshot(personId: string): Promise<RealtimeSnapshot> {
  try {
    const { data } = await client.get<RealtimeSnapshot>(`/persons/${personId}/realtime`)
    return data ?? ({} as RealtimeSnapshot)
  } catch (error) {
    console.warn('获取实时数据失败，使用模拟数据回退', error)
    return mockFetchRealtimeSnapshot(personId)
  }
}

export async function fetchHistoryBuckets(personId: string): Promise<HistoryBucket[]> {
  try {
    const { data } = await client.get<HistoryBucket[]>(`/persons/${personId}/history/buckets`)
    return data ?? []
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
    const { data } = await client.get<DetectionSummary[]>('/detections/summary')
    return data
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
