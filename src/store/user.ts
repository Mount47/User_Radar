import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  CaregiverAlert,
  CaregiverDevice,
  CaregiverPerson,
  CaregiverProfile,
  DetectionSummary,
  DeviceStatusOverview,
  HistoryBucket,
  PersonDeviceMapping,
  RealtimeSnapshot,
  VitalDataPoint,
  AlertStatus
} from '@/types'
import {
  mockFetchAlerts,
  mockFetchDeviceDirectory,
  mockFetchDeviceOverview,
  mockFetchDevices,
  mockFetchDetections,
  mockFetchHistory,
  mockFetchHistoryBuckets,
  mockFetchMappings,
  mockFetchPersonDirectory,
  mockFetchPersons,
  mockFetchProfile,
  mockFetchRealtimeSnapshot,
  mockUpdateAlertStatus
} from '@/mock/dataService'

interface LoginPayload {
  username: string
  password: string
}

interface AlertFilters {
  category: string
  status: string
  personScope: string
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const profile = ref<CaregiverProfile | null>(null)
  const persons = ref<CaregiverPerson[]>([])
  const devices = ref<CaregiverDevice[]>([])
  const mappings = ref<PersonDeviceMapping[]>([])
  const alerts = ref<CaregiverAlert[]>([])
  const detectionSummaries = ref<DetectionSummary[]>([])
  const deviceOverview = ref<DeviceStatusOverview | null>(null)
  const histories = ref<Record<string, VitalDataPoint[]>>({})
  const bucketedHistory = ref<Record<string, HistoryBucket[]>>({})
  const realtimeSnapshots = ref<Record<string, RealtimeSnapshot>>({})
  const personDirectory = ref<CaregiverPerson[]>([])
  const deviceDirectory = ref<CaregiverDevice[]>([])

  const loading = ref(false)
  const selectedPersonId = ref<string | null>(null)
  const historyRangeHours = ref(6)
  const alertFilters = ref<AlertFilters>({ category: 'all', status: 'all', personScope: 'all' })

  const isAuthenticated = computed(() => !!token.value)
  const username = computed(() => profile.value?.username || '')

  const summaryStats = computed(() => ({
    personCount: profile.value?.personCount || persons.value.length,
    deviceCount: profile.value?.deviceCount || devices.value.length,
    role: profile.value?.role || '访客',
    serverTime: profile.value?.serverTime || ''
  }))

  const activePerson = computed(() => {
    const targetId = selectedPersonId.value || persons.value[0]?.personId
    return persons.value.find((person) => person.personId === targetId) || null
  })

  const activeRealtime = computed(() => {
    const personId = activePerson.value?.personId
    if (!personId) return null
    return realtimeSnapshots.value[personId] || null
  })

  const scopedAlerts = computed(() => {
    return alerts.value.filter((alert) => {
      const matchCategory = alertFilters.value.category === 'all'
        ? true
        : (alert.category || '').toUpperCase() === alertFilters.value.category.toUpperCase()
      const matchStatus = alertFilters.value.status === 'all'
        ? true
        : (alert.status || 'ACTIVE') === alertFilters.value.status
      const matchPerson = alertFilters.value.personScope === 'all'
        ? true
        : alert.personId === alertFilters.value.personScope
      return matchCategory && matchStatus && matchPerson
    })
  })

  const alertStats = computed(() => {
    const total = scopedAlerts.value.length
    const active = scopedAlerts.value.filter((item) => item.status === 'ACTIVE').length
    const critical = scopedAlerts.value.filter(
      (item) => item.severity === 'CRITICAL' || item.severity === 'HIGH'
    ).length
    return { total, active, critical }
  })

  const isReady = computed(
    () => isAuthenticated.value && persons.value.length > 0 && devices.value.length > 0
  )

  async function login(payload: LoginPayload) {
    loading.value = true
    try {
      // In a real app, call auth API. Here we mock success and hydrate initial scope.
      token.value = 'mock-token'
      localStorage.setItem('token', token.value)
      await hydrateScope()
      const profileResponse = await mockFetchProfile()
      profile.value = {
        ...profileResponse,
        username: payload.username || profileResponse.username
      }
      const firstPerson = persons.value[0]
      if (!selectedPersonId.value && firstPerson) {
        selectedPersonId.value = firstPerson.personId
      }
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = null
    profile.value = null
    persons.value = []
    devices.value = []
    mappings.value = []
    alerts.value = []
    detectionSummaries.value = []
    histories.value = {}
    bucketedHistory.value = {}
    realtimeSnapshots.value = {}
    selectedPersonId.value = null
    localStorage.removeItem('token')
  }

  async function hydrateScope() {
    const [profileRes, personRes, deviceRes] = await Promise.all([
      mockFetchProfile(),
      mockFetchPersons(),
      mockFetchDevices()
    ])
    profile.value = profileRes
    persons.value = personRes
    devices.value = deviceRes
    const firstPerson = personRes[0]
    if (!selectedPersonId.value && firstPerson) {
      selectedPersonId.value = firstPerson.personId
    }
  }

  async function refreshAlerts() {
    alerts.value = await mockFetchAlerts(50)
  }

  async function refreshDevices() {
    devices.value = await mockFetchDevices()
  }

  async function refreshPersonDirectory(_params?: Record<string, unknown>) {
    personDirectory.value = await mockFetchPersonDirectory()
  }

  async function refreshDeviceDirectory(_params?: Record<string, unknown>) {
    deviceDirectory.value = await mockFetchDeviceDirectory()
  }

  async function refreshDeviceOverview() {
    deviceOverview.value = await mockFetchDeviceOverview()
  }

  async function refreshDetections() {
    detectionSummaries.value = await mockFetchDetections()
  }

  async function refreshMappings() {
    mappings.value = await mockFetchMappings()
  }

  async function setAlertFilter(filters: Partial<AlertFilters>) {
    alertFilters.value = { ...alertFilters.value, ...filters }
    if (!alerts.value.length) {
      await refreshAlerts()
    }
  }

  async function changeAlertStatus(alertId: number, status: AlertStatus) {
    const updated = await mockUpdateAlertStatus(alertId, status)
    alerts.value = alerts.value.map((item) => (item.alertId === alertId ? updated : item))
  }

  function selectPerson(personId: string) {
    selectedPersonId.value = personId
    fetchRealtimeForSelection(personId)
    fetchHistoryForSelection(personId)
  }

  async function fetchHistoryForSelection(personId?: string) {
    const target = personId || activePerson.value?.personId
    if (!target) return
    const data = await mockFetchHistory(target)
    histories.value = { ...histories.value, [target]: data }
  }

  async function refreshHistoryBuckets(personId?: string) {
    const target = personId || activePerson.value?.personId
    if (!target) return
    const data = await mockFetchHistoryBuckets(target)
    bucketedHistory.value = { ...bucketedHistory.value, [target]: data }
  }

  async function fetchRealtimeForSelection(personId?: string) {
    const target = personId || activePerson.value?.personId
    if (!target) return
    const data = await mockFetchRealtimeSnapshot(target)
    realtimeSnapshots.value = { ...realtimeSnapshots.value, [target]: data }
  }

  function setHistoryRange(hours: number) {
    historyRangeHours.value = hours
  }

  const publicApi = {
    token,
    profile,
    persons,
    devices,
    mappings,
    alerts,
    detectionSummaries,
    deviceOverview,
    histories,
    bucketedHistory,
    realtimeSnapshots,
    personDirectory,
    deviceDirectory,
    loading,
    selectedPersonId,
    historyRangeHours,
    alertFilters,
    isAuthenticated,
    isReady,
    username,
    summaryStats,
    activePerson,
    activeRealtime,
    scopedAlerts,
    alertStats,
    login,
    logout,
    hydrateScope,
    refreshAlerts,
    refreshDevices,
    refreshPersonDirectory,
    refreshDeviceDirectory,
    refreshDeviceOverview,
    refreshDetections,
    refreshMappings,
    setAlertFilter,
    changeAlertStatus,
    selectPerson,
    fetchHistoryForSelection,
    refreshHistoryBuckets,
    fetchRealtimeForSelection,
    setHistoryRange
  }

  return publicApi
})
