import { defineStore } from 'pinia'
import { authApi } from '@/api'
import {
  getAccessToken,
  getRefreshToken,
  getUserProfile,
  getRoles,
  getMenus,
  persistAccessToken,
  persistRefreshToken,
  persistUserProfile,
  persistRoles,
  persistMenus,
  clearAuthStorage
} from '@/utils/auth'
import { normalizeError } from '@/utils/errorHandler'
import { logger } from '@/utils/logger'

export interface UserProfile {
  id: string | number
  username: string
  displayName?: string
  avatar?: string
  roles?: string[]
  permissions?: string[]
  [key: string]: any
}

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: UserProfile | null
  roles: string[]
  menus: string[]
  loading: boolean
  lastSyncedAt: number | null
}

export interface LoginPayload {
  username: string
  password: string
  remember?: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: getAccessToken(),
    refreshToken: getRefreshToken(),
    user: getUserProfile<UserProfile>(),
    roles: getRoles(),
    menus: getMenus(),
    loading: false,
    lastSyncedAt: null
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    displayName: (state) => state.user?.displayName || state.user?.username || '',
    permissions: (state) => state.user?.permissions ?? []
  },

  actions: {
    async login(payload: LoginPayload) {
      this.loading = true
      try {
        const { remember = true, ...credentials } = payload
        const response = await authApi.login(credentials)
        this.persistSession(response, remember)
        await this.fetchProfile()
        return this.user
      } catch (error) {
        throw normalizeError(error)
      } finally {
        this.loading = false
      }
    },

    async fetchProfile(force = false) {
      if (!this.token) return null
      if (!force && this.user && this.lastSyncedAt && Date.now() - this.lastSyncedAt < 30_000) {
        return this.user
      }
      try {
        const profile = await authApi.profile()
        this.user = profile ?? null
        this.roles = profile?.roles ?? this.roles
        persistUserProfile(this.user)
        persistRoles(this.roles)
        this.lastSyncedAt = Date.now()
        return profile
      } catch (error) {
        throw normalizeError(error)
      }
    },

    async refresh(force = false) {
      if (!this.refreshToken) return
      if (!force && !this.isAuthenticated) return
      try {
        const result = await authApi.refresh(this.refreshToken)
        this.persistSession(result, true)
      } catch (error) {
        logger.warn('Refresh token failed', error)
        this.reset()
        throw normalizeError(error)
      }
    },

    async logout() {
      if (!this.token) {
        this.reset()
        return
      }
      try {
        await authApi.logout(this.token)
      } catch (error) {
        logger.warn('Logout request failed', error)
      } finally {
        this.reset()
      }
    },

    persistSession(
      payload: Record<string, any> | null,
      remember = true
    ) {
      const nextToken = payload?.accessToken || payload?.token || null
      const nextRefresh = payload?.refreshToken || payload?.refresh_token || null
      const profile = payload?.user || payload?.profile || this.user
      const roles = payload?.roles || profile?.roles || this.roles || []
      const menus = payload?.menus || this.menus || []

      this.token = nextToken
      this.refreshToken = nextRefresh
      this.user = profile ?? null
      this.roles = roles
      this.menus = menus
      this.lastSyncedAt = Date.now()

      persistAccessToken(this.token, remember)
      persistRefreshToken(this.refreshToken, remember)
      persistUserProfile(this.user, remember)
      persistRoles(this.roles, remember)
      persistMenus(this.menus, remember)
    },

    restore() {
      this.token = getAccessToken()
      this.refreshToken = getRefreshToken()
      this.user = getUserProfile<UserProfile>()
      this.roles = getRoles()
      this.menus = getMenus()
    },

    reset() {
      clearAuthStorage()
      this.$reset()
    }
  }
})
