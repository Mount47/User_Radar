import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  AlertCategory,
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
import {
  fetchCaregiverAlerts,
  fetchCaregiverDevices,
  fetchCaregiverPersons,
  fetchCaregiverProfile,
  fetchDetectionSummaries,
  fetchDeviceStatusOverview,
  fetchHistoryBuckets,
  fetchPersonHistory,
  fetchRealtimeSnapshot,
  loginUser,
  updateAlertStatus
} from '@/api/user'

interface Credentials {
  username: string
  password: string
}

const TOKEN_KEY = 'pilot-user-token'
type AlertFilterState = {
  status: AlertStatus | 'ALL'
  category: AlertCategory | 'ALL'
  personScope: 'CURRENT' | 'ALL'
}

const ALERT_FILTER_DEFAULT: AlertFilterState = {
  status: 'ACTIVE',
  category: 'ALL',
  personScope: 'CURRENT'
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const username = ref<string>('访客')
  const profile = ref<CaregiverProfile | null>(null)
  const persons = ref<CaregiverPerson[]>([])
  const devices = ref<CaregiverDevice[]>([])
  const alerts = ref<CaregiverAlert[]>([])
  const histories = ref<Record<string, VitalDataPoint[]>>({})
  const realtimeSnapshots = ref<Record<string, RealtimeSnapshot>>({})
  const bucketedHistory = ref<Record<string, HistoryBucket[]>>({})
  const deviceOverview = ref<DeviceStatusOverview | null>(null)
  const detectionSummaries = ref<DetectionSummary[]>([])
  const selectedPersonId = ref<string | null>(null)
  const historyRangeHours = ref(24)
  const alertFilters = ref<AlertFilterState>({ ...ALERT_FILTER_DEFAULT })
  const loading = ref(false)

  const isAuthenticated = computed(() => Boolean(token.value))
  const activePerson = computed(() => {
    const targetId = selectedPersonId.value || persons.value[0]?.personId
    return persons.value.find((item) => item.personId === targetId) || null
  })
  const scopedAlerts = computed(() => {
    return alerts.value.filter((item) => {
      const matchPerson =
        alertFilters.value.personScope === 'ALL' || !selectedPersonId.value
          ? true
          : item.personId === selectedPersonId.value
      const matchCategory =
        alertFilters.value.category === 'ALL' || !item.category
          ? alertFilters.value.category === 'ALL'
          : item.category === alertFilters.value.category
      const matchStatus =
        alertFilters.value.status === 'ALL' || !item.status
          ? alertFilters.value.status === 'ALL'
          : item.status === alertFilters.value.status
      return matchPerson && matchCategory && matchStatus
    })
  })
  const activeRealtime = computed(() => {
    const id = activePerson.value?.personId
    return id ? realtimeSnapshots.value[id] || null : null
  })
  const summaryStats = computed(() => ({
    personCount: profile.value?.personCount ?? persons.value.length,
    deviceCount: profile.value?.deviceCount ?? devices.value.length,
    serverTime: profile.value?.serverTime ?? null,
    role: profile.value?.role ?? 'VISITOR'
  }))
  const alertStats = computed(() => ({
    total: alerts.value.length,
    active: alerts.value.filter((item) => (item.status ?? 'ACTIVE') === 'ACTIVE').length,
    critical: alerts.value.filter((item) => item.severity === 'CRITICAL' || item.severity === 'HIGH').length
  }))

  async function login(payload: Credentials) {
    loading.value = true
    try {
      const session = await loginUser(payload)
      token.value = session.token
      username.value = session.username
      localStorage.setItem(TOKEN_KEY, session.token)
      await hydrateScope()
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = null
    username.value = '访客'
    localStorage.removeItem(TOKEN_KEY)
    profile.value = null
    persons.value = []
    devices.value = []
    alerts.value = []
    histories.value = {}
    realtimeSnapshots.value = {}
    bucketedHistory.value = {}
    deviceOverview.value = null
    detectionSummaries.value = []
    selectedPersonId.value = null
    alertFilters.value = { ...ALERT_FILTER_DEFAULT }
  }

  async function hydrateScope() {
    if (!token.value) return
    loading.value = true
    try {
      const [profileData, personData, deviceData, alertData, overviewData, detectionData] = await Promise.all([
        fetchCaregiverProfile(),
        fetchCaregiverPersons(),
        fetchCaregiverDevices(),
        fetchCaregiverAlerts(50),
        fetchDeviceStatusOverview(),
        fetchDetectionSummaries()
      ])
      profile.value = profileData
      persons.value = personData
      devices.value = deviceData
      alerts.value = alertData
      deviceOverview.value = overviewData
      detectionSummaries.value = detectionData

      const defaultPersonId =
        selectedPersonId.value && personData.some((p) => p.personId === selectedPersonId.value)
          ? selectedPersonId.value
          : personData[0]?.personId || null
      selectedPersonId.value = defaultPersonId

      if (defaultPersonId) {
        await Promise.all([
          fetchHistoryForSelection(defaultPersonId),
          fetchRealtimeForSelection(defaultPersonId),
          refreshHistoryBuckets(defaultPersonId),
          refreshAlerts(defaultPersonId)
        ])
      } else {
        await refreshAlerts()
      }
    } finally {
      loading.value = false
    }
  }

  async function refreshDevices() {
    devices.value = await fetchCaregiverDevices()
    await refreshDeviceOverview()
  }

  async function refreshAlerts(personId?: string) {
    const resolvedPerson =
      personId ??
      (alertFilters.value.personScope === 'ALL' ? undefined : selectedPersonId.value || undefined)
    alerts.value = await fetchCaregiverAlerts(50, {
      personId: resolvedPerson || undefined,
      status: alertFilters.value.status === 'ALL' ? undefined : alertFilters.value.status,
      category: alertFilters.value.category === 'ALL' ? undefined : alertFilters.value.category
    })
  }

  async function fetchHistoryForSelection(personId?: string) {
    const id = personId || selectedPersonId.value
    if (!id) return
    histories.value = {
      ...histories.value,
      [id]: await fetchPersonHistory(id)
    }
  }

  async function fetchRealtimeForSelection(personId?: string) {
    const id = personId || selectedPersonId.value
    if (!id) return
    realtimeSnapshots.value = {
      ...realtimeSnapshots.value,
      [id]: await fetchRealtimeSnapshot(id)
    }
  }

  async function refreshHistoryBuckets(personId?: string) {
    const id = personId || selectedPersonId.value
    if (!id) return
    bucketedHistory.value = {
      ...bucketedHistory.value,
      [id]: await fetchHistoryBuckets(id)
    }
  }

  async function refreshDeviceOverview() {
    deviceOverview.value = await fetchDeviceStatusOverview()
  }

  async function refreshDetections() {
    detectionSummaries.value = await fetchDetectionSummaries()
  }

  async function setAlertFilter(partial: Partial<AlertFilterState>) {
    alertFilters.value = { ...alertFilters.value, ...partial }
    await refreshAlerts()
  }

  async function changeAlertStatus(alertId: number, status: AlertStatus) {
    const updated = await updateAlertStatus(alertId, status)
    alerts.value = alerts.value.map((item) => (item.alertId === alertId ? updated : item))
    await refreshAlerts()
  }

  function selectPerson(personId: string) {
    selectedPersonId.value = personId
    refreshAlerts(personId)
    fetchHistoryForSelection(personId)
    fetchRealtimeForSelection(personId)
    refreshHistoryBuckets(personId)
  }

  function setHistoryRange(hours: number) {
    historyRangeHours.value = hours
    refreshHistoryBuckets()
  }

  if (token.value) {
    hydrateScope()
  }

  return {
    token,
    username,
    profile,
    persons,
    devices,
    alerts,
    histories,
    realtimeSnapshots,
    bucketedHistory,
    deviceOverview,
    detectionSummaries,
    selectedPersonId,
    historyRangeHours,
    alertFilters,
    loading,
    isAuthenticated,
    activePerson,
    scopedAlerts,
    activeRealtime,
    summaryStats,
    alertStats,
    login,
    logout,
    hydrateScope,
    refreshDevices,
    refreshAlerts,
    refreshDeviceOverview,
    refreshDetections,
    fetchHistoryForSelection,
    fetchRealtimeForSelection,
    refreshHistoryBuckets,
    selectPerson,
    setHistoryRange,
    setAlertFilter,
    changeAlertStatus
  }
})
