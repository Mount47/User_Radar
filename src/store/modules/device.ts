import { defineStore } from 'pinia'
import { personApi, deviceApi, mappingApi } from '@/api'
import { CACHE_TTL } from '@/utils/constants'
import { isStale } from '@/utils/date'
import { normalizeError } from '@/utils/errorHandler'

export interface PersonSummary {
  id: string | number
  name: string
  department?: string
  [key: string]: any
}

export interface DeviceSummary {
  id: string | number
  code: string
  model?: string
  status?: string
  [key: string]: any
}

export interface PersonDeviceMapping {
  id: string | number
  personId: string | number
  deviceId: string | number
  active: boolean
  [key: string]: any
}

interface EntityState {
  selectedPersonId: string | number | null
  selectedDeviceId: string | number | null
  persons: PersonSummary[]
  devices: DeviceSummary[]
  mappings: PersonDeviceMapping[]
  lastFetched: {
    persons: number | null
    devices: number | null
    mappings: number | null
  }
  recentPersonIds: (string | number)[]
  recentDeviceIds: (string | number)[]
  loading: {
    persons: boolean
    devices: boolean
    mappings: boolean
  }
}

const MAX_RECENT = 6

export const useEntityStore = defineStore('entityCache', {
  state: (): EntityState => ({
    selectedPersonId: null,
    selectedDeviceId: null,
    persons: [],
    devices: [],
    mappings: [],
    lastFetched: {
      persons: null,
      devices: null,
      mappings: null
    },
    recentPersonIds: [],
    recentDeviceIds: [],
    loading: {
      persons: false,
      devices: false,
      mappings: false
    }
  }),

  getters: {
    selectedPerson(state) {
      return state.persons.find((item) => item.id === state.selectedPersonId) || null
    },
    selectedDevice(state) {
      return state.devices.find((item) => item.id === state.selectedDeviceId) || null
    }
  },

  actions: {
    async fetchPersons(force = false) {
      if (!force && !isStale(this.lastFetched.persons || undefined, CACHE_TTL.persons)) {
        return this.persons
      }
      this.loading.persons = true
      try {
        const list = await personApi.list()
        this.persons = list ?? []
        this.lastFetched.persons = Date.now()
        return this.persons
      } catch (error) {
        throw normalizeError(error)
      } finally {
        this.loading.persons = false
      }
    },

    async fetchDevices(force = false) {
      if (!force && !isStale(this.lastFetched.devices || undefined, CACHE_TTL.devices)) {
        return this.devices
      }
      this.loading.devices = true
      try {
        const list = await deviceApi.list()
        this.devices = list?.records || list || []
        this.lastFetched.devices = Date.now()
        return this.devices
      } catch (error) {
        throw normalizeError(error)
      } finally {
        this.loading.devices = false
      }
    },

    async fetchMappings(force = false) {
      if (!force && !isStale(this.lastFetched.mappings || undefined, CACHE_TTL.mappings)) {
        return this.mappings
      }
      this.loading.mappings = true
      try {
        const list = await mappingApi.listActive()
        this.mappings = list ?? []
        this.lastFetched.mappings = Date.now()
        return this.mappings
      } catch (error) {
        throw normalizeError(error)
      } finally {
        this.loading.mappings = false
      }
    },

    async refreshAll(force = false) {
      await Promise.all([
        this.fetchPersons(force),
        this.fetchDevices(force),
        this.fetchMappings(force)
      ])
    },

    setSelectedPerson(personId: string | number | null) {
      this.selectedPersonId = personId
      if (personId) {
        this.trackRecent('person', personId)
      }
    },

    setSelectedDevice(deviceId: string | number | null) {
      this.selectedDeviceId = deviceId
      if (deviceId) {
        this.trackRecent('device', deviceId)
      }
    },

    trackRecent(type: 'person' | 'device', id: string | number) {
      const key = type === 'person' ? 'recentPersonIds' : 'recentDeviceIds'
      const list = this[key] as (string | number)[]
      const filtered = list.filter((item) => item !== id)
      filtered.unshift(id)
      this[key] = filtered.slice(0, MAX_RECENT)
    },

    upsertMapping(mapping: PersonDeviceMapping) {
      const index = this.mappings.findIndex((item) => item.id === mapping.id)
      if (index >= 0) {
        this.mappings.splice(index, 1, mapping)
      } else {
        this.mappings.unshift(mapping)
      }
    },

    removeMapping(id: string | number) {
      this.mappings = this.mappings.filter((item) => item.id !== id)
    }
  }
})
