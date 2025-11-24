import { ALERT_LEVELS } from './constants'

export const formatBpm = (value?: number | null) => {
  if (value === null || value === undefined) return '-- bpm'
  return `${Number(value).toFixed(0)} bpm`
}

export const formatBreathRate = (value?: number | null) => {
  if (value === null || value === undefined) return '-- rpm'
  return `${Number(value).toFixed(0)} rpm`
}

export const formatTemperature = (value?: number | null) => {
  if (value === null || value === undefined) return '-- ℃'
  return `${Number(value).toFixed(1)} ℃`
}

export const formatPercentage = (value?: number | null) => {
  if (value === null || value === undefined) return '--'
  return `${Number(value).toFixed(0)}%`
}

export const formatBoolean = (value?: boolean | null, truthy = '是', falsy = '否') => {
  if (value === null || value === undefined) return '--'
  return value ? truthy : falsy
}

export const formatAlertLevel = (level?: keyof typeof ALERT_LEVELS) => {
  if (!level) return { label: '未知', color: 'info' }
  return ALERT_LEVELS[level] ?? { label: level, color: 'info' }
}
