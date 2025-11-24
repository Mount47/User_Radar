export const STORAGE_KEYS = {
  accessToken: 'radar.access_token',
  refreshToken: 'radar.refresh_token',
  userProfile: 'radar.user_profile',
  roles: 'radar.roles',
  menus: 'radar.menus',
  uiSettings: 'radar.ui_settings'
} as const

export const API_BASE_URL =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL
    : '/api'

export const WS_BASE_URL =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_WS_BASE_URL
    ? import.meta.env.VITE_WS_BASE_URL
    : (() => {
        if (typeof window === 'undefined') {
          return 'ws://localhost:5173'
        }
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        return `${protocol}//${window.location.host}`
      })()

export const ALERT_LEVELS = {
  low: { label: '低', color: 'success' },
  medium: { label: '中', color: 'warning' },
  high: { label: '高', color: 'error' },
  critical: { label: '危机', color: 'error' }
} as const

export const DEVICE_MODELS = {
  TI_6843: 'TI_6843',
  R60_ABD1: 'R60_ABD1',
  ECG_PATCH: 'ECG_PATCH'
} as const

export const ROLE_MAP = {
  SUPER_ADMIN: '超级管理员',
  ADMIN: '管理员',
  OPERATOR: '操作员',
  DOCTOR: '医生',
  NURSE: '护士',
  GUEST: '访客'
} as const

export const WS_ENDPOINTS = {
  vitalSigns: '/ws/v1/vitals',
  posture: '/ws/v1/postures',
  ecg: '/ws/v1/ecg',
  r60abd1: '/ws/v1/devices/r60abd1',
  ti6843Vital: '/ws/v1/ti6843/vital',
  ti6843Posture: '/ws/v1/ti6843/posture',
  fallAlert: '/ws/v1/alerts/fall'
} as const

export const REALTIME_TOPICS = {
  deviceStatus: '/topic/device/status',
  alerts: '/topic/alerts',
  diagnostics: '/topic/diagnostics'
} as const

export const CACHE_TTL = {
  persons: 60 * 1000,
  devices: 60 * 1000,
  mappings: 2 * 60 * 1000
} as const

export type AlertLevel = keyof typeof ALERT_LEVELS
