import { STORAGE_KEYS } from './constants'

const hasWindow = typeof window !== 'undefined'

const getStorage = (remember = true) => {
  if (!hasWindow) {
    return null
  }
  return remember ? window.localStorage : window.sessionStorage
}

const read = (key: string) => {
  if (!hasWindow) return null
  return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key)
}

const write = (key: string, value: string | null, remember = true) => {
  const storage = getStorage(remember)
  if (!storage) return
  if (value === null || value === undefined) {
    storage.removeItem(key)
    return
  }
  storage.setItem(key, value)
}

const readJson = <T>(key: string): T | null => {
  const value = read(key)
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

const writeJson = (key: string, value: unknown, remember = true) => {
  write(key, value ? JSON.stringify(value) : null, remember)
}

export const persistAccessToken = (token: string | null, remember = true) => {
  write(STORAGE_KEYS.accessToken, token, remember)
}

export const persistRefreshToken = (token: string | null, remember = true) => {
  write(STORAGE_KEYS.refreshToken, token, remember)
}

export const persistUserProfile = <T>(profile: T | null, remember = true) => {
  writeJson(STORAGE_KEYS.userProfile, profile, remember)
}

export const persistRoles = (roles: string[], remember = true) => {
  writeJson(STORAGE_KEYS.roles, roles, remember)
}

export const persistMenus = (menus: string[], remember = true) => {
  writeJson(STORAGE_KEYS.menus, menus, remember)
}

export const getAccessToken = () => read(STORAGE_KEYS.accessToken)
export const getRefreshToken = () => read(STORAGE_KEYS.refreshToken)
export const getUserProfile = <T>() => readJson<T>(STORAGE_KEYS.userProfile)
export const getRoles = () => readJson<string[]>(STORAGE_KEYS.roles) ?? []
export const getMenus = () => readJson<string[]>(STORAGE_KEYS.menus) ?? []

export const clearAuthStorage = () => {
  if (!hasWindow) return
  const keys = [
    STORAGE_KEYS.accessToken,
    STORAGE_KEYS.refreshToken,
    STORAGE_KEYS.userProfile,
    STORAGE_KEYS.roles,
    STORAGE_KEYS.menus
  ]
  keys.forEach((key) => {
    window.localStorage.removeItem(key)
    window.sessionStorage.removeItem(key)
  })
}

export const persistUiSettings = (settings: Record<string, any>) => {
  writeJson(STORAGE_KEYS.uiSettings, settings, true)
}

export const getUiSettings = <T>() => readJson<T>(STORAGE_KEYS.uiSettings)
