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
  PersonDeviceMapping,
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
  fetchDeviceDirectory,
  fetchPersonHistory,
  fetchPersonDeviceMappings,
  fetchPersonDirectory,
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
  const personDirectory = ref<CaregiverPerson[]>([])
  const deviceDirectory = ref<CaregiverDevice[]>([])
  const mappings = ref<PersonDeviceMapping[]>([])
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

  function resolvePrimaryDevice(personId: string) {
    const target = persons.value.find((item) => item.personId === personId)
    if (!target) return null
    const vitalDevice = target.devices.find((item) =>
      (item.modelType || '').toLowerCase().includes('vital')
    )
    return vitalDevice?.deviceId || target.devices[0]?.deviceId || null
  }

  function buildBuckets(personId: string) {
    const source = histories.value[personId] || []
    if (!source.length) {
      bucketedHistory.value = { ...bucketedHistory.value, [personId]: [] }
      return
    }
    const grouped: Record<string, HistoryBucket> = {}
    const cutoff = Date.now() - historyRangeHours.value * 60 * 60 * 1000
    source
      .filter((item) => new Date(item.timestamp).getTime() >= cutoff)
      .forEach((item) => {
        const hour = new Date(item.timestamp)
        hour.setMinutes(0, 0, 0)
        const key = hour.toISOString()
        if (!grouped[key]) {
          grouped[key] = {
            timestamp: key,
            heartRateAvg: 0,
            breathRateAvg: 0,
            motionAvg: 0,
            eventCount: 0
          }
        }
        grouped[key].heartRateAvg += Number(item.heartRate ?? 0)
        grouped[key].breathRateAvg += Number(item.breathRate ?? 0)
        grouped[key].motionAvg += Number(item.motion ?? 0)
        grouped[key].eventCount += 1
      })

    const buckets = Object.values(grouped)
      .map((bucket) => ({
        ...bucket,
        heartRateAvg: bucket.eventCount ? bucket.heartRateAvg / bucket.eventCount : 0,
        breathRateAvg: bucket.eventCount ? bucket.breathRateAvg / bucket.eventCount : 0,
        motionAvg: bucket.eventCount ? bucket.motionAvg / bucket.eventCount : 0
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    bucketedHistory.value = { ...bucketedHistory.value, [personId]: buckets }
  }

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

  function normalizeDevices(list: CaregiverDevice[]) {
    return list.map((item) => ({
      ...item,
      persons: item.persons || []
    }))
  }

  function buildMappingFallback(deviceList = deviceDirectory.value, personList = personDirectory.value) {
    if (!deviceList.length && devices.value.length) {
      deviceList = devices.value
    }
    if (!personList.length && persons.value.length) {
      personList = persons.value
    }
    const map: PersonDeviceMapping[] = []
    deviceList.forEach((device, deviceIndex) => {
      const links = device.persons?.length ? device.persons : [{ personId: 'UNBOUND', personName: '未绑定' }]
      links.forEach((person, personIdx) => {
        map.push({
          mappingId: `${device.deviceId}-${person.personId}-${personIdx}`,
          personId: person.personId,
          personName: person.personName,
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          modelType: device.modelType,
          status: device.status,
          updatedAt: device.lastHeartbeat,
          location: device.location,
          createdAt: new Date(Date.now() - (deviceIndex + personIdx + 1) * 3600000).toISOString()
        })
      })
    })
    if (!map.length && personList.length) {
      personList.forEach((person, idx) => {
        map.push({
          mappingId: `person-${person.personId}-${idx}`,
          personId: person.personId,
          personName: person.personName,
          deviceId: person.devices[0]?.deviceId || 'UNBOUND',
          deviceName: person.devices[0]?.deviceName,
          modelType: person.devices[0]?.modelType,
          status: 'OFFLINE',
          location: '未知',
          createdAt: person.latestOverview?.collectedAt,
          updatedAt: person.latestOverview?.collectedAt
        })
      })
    }
    return map
  }

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
    personDirectory.value = []
    deviceDirectory.value = []
    mappings.value = []
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
      const [
        profileData,
        personData,
        deviceData,
        alertData,
        overviewData,
        detectionData,
        directoryPersons,
        directoryDevices,
        mappingData
      ] = await Promise.all([
        fetchCaregiverProfile(),
        fetchCaregiverPersons(),
        fetchCaregiverDevices(),
        fetchCaregiverAlerts(50),
        fetchDeviceStatusOverview(),
        fetchDetectionSummaries(),
        fetchPersonDirectory(),
        fetchDeviceDirectory({ size: 100 }),
        fetchPersonDeviceMappings()
      ])
      profile.value = profileData
      persons.value = personData
      devices.value = normalizeDevices(deviceData)
      personDirectory.value = directoryPersons?.length ? directoryPersons : personData
      deviceDirectory.value = directoryDevices?.length ? normalizeDevices(directoryDevices) : devices.value
      mappings.value = mappingData?.length ? mappingData : buildMappingFallback()
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
    deviceDirectory.value = deviceDirectory.value.length ? deviceDirectory.value : devices.value
    await refreshDeviceOverview()
  }

  async function refreshPersonDirectory() {
    personDirectory.value = await fetchPersonDirectory()
  }

  async function refreshDeviceDirectory(params?: {
    page?: number
    size?: number
    modelType?: string
    status?: string
    location?: string
  }) {
    deviceDirectory.value = normalizeDevices(await fetchDeviceDirectory(params))
  }

  async function refreshMappings() {
    const data = await fetchPersonDeviceMappings()
    mappings.value = data.length ? data : buildMappingFallback()
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
    const deviceId = resolvePrimaryDevice(id) || undefined
    histories.value = {
      ...histories.value,
      [id]: await fetchPersonHistory(id, historyRangeHours.value, deviceId)
    }
    buildBuckets(id)
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
    if (!histories.value[id]) {
      await fetchHistoryForSelection(id)
      return
    }
    buildBuckets(id)
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
    fetchHistoryForSelection()
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
    personDirectory,
    deviceDirectory,
    mappings,
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
    refreshPersonDirectory,
    refreshDeviceDirectory,
    refreshAlerts,
    refreshDeviceOverview,
    refreshDetections,
    refreshMappings,
    fetchHistoryForSelection,
    fetchRealtimeForSelection,
    refreshHistoryBuckets,
    selectPerson,
    setHistoryRange,
    setAlertFilter,
    changeAlertStatus
  }
})
