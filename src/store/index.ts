import type { App } from 'vue'
import { createPinia } from 'pinia'
import { useAuthStore } from './modules/auth'
import { useAppStore } from './modules/app'
import { useEntityStore } from './modules/device'
import { useRealtimeStore } from './modules/realtime'

const pinia = createPinia()

export const setupStore = (app: App) => {
  app.use(pinia)
  return pinia
}

export const useStore = () => ({
  auth: useAuthStore(),
  app: useAppStore(),
  entity: useEntityStore(),
  realtime: useRealtimeStore()
})

export type RootStore = {
  auth: ReturnType<typeof useAuthStore>
  app: ReturnType<typeof useAppStore>
  entity: ReturnType<typeof useEntityStore>
  realtime: ReturnType<typeof useRealtimeStore>
}

export {
  useAuthStore,
  useAppStore,
  useEntityStore,
  useRealtimeStore
}
