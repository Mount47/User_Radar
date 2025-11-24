import { defineStore } from 'pinia'
import { getUiSettings, persistUiSettings } from '@/utils/auth'

export type ThemeMode = 'light' | 'dark' | 'auto'
export type LayoutMode = 'side' | 'top' | 'mix'

interface UiSettings {
  sidebarCollapsed: boolean
  theme: ThemeMode
  locale: string
  layout: LayoutMode
  keepAliveRoutes: string[]
}

const defaultSettings: UiSettings = {
  sidebarCollapsed: false,
  theme: 'light',
  locale: 'zh-CN',
  layout: 'side',
  keepAliveRoutes: []
}

const persistedSettings = getUiSettings<UiSettings>()

export const useAppStore = defineStore('app', {
  state: (): UiSettings => ({
    ...defaultSettings,
    ...(persistedSettings || {})
  }),

  actions: {
    toggleSidebar(force?: boolean) {
      const next =
        typeof force === 'boolean' ? force : !this.sidebarCollapsed
      this.sidebarCollapsed = next
      persistUiSettings(this.$state)
    },

    setTheme(theme: ThemeMode) {
      this.theme = theme
      persistUiSettings(this.$state)
    },

    setLocale(locale: string) {
      this.locale = locale
      persistUiSettings(this.$state)
    },

    setLayout(layout: LayoutMode) {
      this.layout = layout
      persistUiSettings(this.$state)
    },

    registerKeepAlive(routeName: string) {
      if (!this.keepAliveRoutes.includes(routeName)) {
        this.keepAliveRoutes.push(routeName)
        persistUiSettings(this.$state)
      }
    },

    removeKeepAlive(routeName: string) {
      this.keepAliveRoutes = this.keepAliveRoutes.filter((name) => name !== routeName)
      persistUiSettings(this.$state)
    }
  }
})
