import { WS_BASE_URL, WS_ENDPOINTS } from './constants'
import { getAccessToken } from './auth'
import { logger } from './logger'

export type SocketStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error'

export interface ManagedWebSocketOptions {
  protocols?: string | string[]
  autoConnect?: boolean
  autoReconnect?: boolean
  reconnectDelay?: number
  heartbeatInterval?: number
  onMessage?: (payload: unknown, rawEvent: MessageEvent) => void
  onStatusChange?: (status: SocketStatus) => void
  parse?: (data: MessageEvent['data']) => unknown
}

const DEFAULT_OPTIONS: ManagedWebSocketOptions = {
  autoReconnect: true,
  reconnectDelay: 3000,
  heartbeatInterval: 25_000,
  autoConnect: true
}

const supportsWebSocket = typeof WebSocket !== 'undefined'

export class ManagedWebSocket {
  private socket?: WebSocket
  private reconnectTimer?: ReturnType<typeof setTimeout>
  private heartbeatTimer?: ReturnType<typeof setInterval>
  private status: SocketStatus = 'idle'
  private manualClose = false

  constructor(
    private readonly urlBuilder: () => string,
    private readonly options: ManagedWebSocketOptions = DEFAULT_OPTIONS
  ) {
    if (this.options.autoConnect !== false) {
      this.connect()
    }
  }

  private updateStatus(status: SocketStatus) {
    this.status = status
    this.options.onStatusChange?.(status)
  }

  private scheduleReconnect() {
    if (!this.options.autoReconnect || this.manualClose) return
    if (this.reconnectTimer) return
    this.updateStatus('connecting')
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined
      this.connect()
    }, this.options.reconnectDelay ?? DEFAULT_OPTIONS.reconnectDelay!)
  }

  private buildUrl() {
    const rawUrl = this.urlBuilder()
    const token = getAccessToken()
    if (!token) return rawUrl
    const separator = rawUrl.includes('?') ? '&' : '?'
    return `${rawUrl}${separator}token=${encodeURIComponent(token)}`
  }

  connect() {
    if (!supportsWebSocket) {
      logger.warn('WebSocket is not supported in this environment')
      return
    }
    this.cleanup()
    this.manualClose = false
    this.updateStatus('connecting')
    const finalUrl = this.buildUrl()
    this.socket = new WebSocket(finalUrl, this.options.protocols)
    this.socket.onopen = this.onOpen
    this.socket.onmessage = this.onMessage
    this.socket.onerror = this.onError
    this.socket.onclose = this.onClose
  }

  private onOpen = () => {
    this.updateStatus('open')
    this.startHeartbeat()
    logger.debug('WebSocket connected', { url: this.socket?.url })
  }

  private onMessage = (event: MessageEvent) => {
    const payload = this.options.parse
      ? this.options.parse(event.data)
      : safeJsonParse(event.data)
    this.options.onMessage?.(payload, event)
  }

  private onError = (event: Event) => {
    logger.error('WebSocket error', event)
    this.updateStatus('error')
  }

  private onClose = (event: CloseEvent) => {
    logger.info('WebSocket closed', event)
    this.stopHeartbeat()
    this.updateStatus('closed')
    this.scheduleReconnect()
  }

  send(payload: unknown) {
    if (!this.socket || this.status !== 'open') {
      logger.warn('Attempted to send data while socket is not open')
      return
    }
    const data =
      typeof payload === 'string' ? payload : JSON.stringify(payload, null, 0)
    this.socket.send(data)
  }

  close() {
    this.manualClose = true
    this.cleanup()
    this.updateStatus('closed')
  }

  private startHeartbeat() {
    if (!this.options.heartbeatInterval) return
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }))
      }
    }, this.options.heartbeatInterval)
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = undefined
    }
  }

  private cleanup() {
    this.stopHeartbeat()
    if (this.socket) {
      this.socket.onopen = null
      this.socket.onmessage = null
      this.socket.onerror = null
      this.socket.onclose = null
      this.socket.close()
      this.socket = undefined
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = undefined
    }
  }
}

const buildWsUrl = (
  endpoint: string,
  params?: Record<string, string | number | undefined>
) => {
  const url = new URL(endpoint, WS_BASE_URL)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      url.searchParams.append(key, String(value))
    })
  }
  return url.toString()
}

const safeJsonParse = (payload: any) => {
  if (typeof payload !== 'string') return payload
  try {
    return JSON.parse(payload)
  } catch {
    return payload
  }
}

export const createDeviceStream = (
  endpoint: string,
  deviceId?: string | number,
  options?: ManagedWebSocketOptions
) =>
  new ManagedWebSocket(
    () => buildWsUrl(endpoint, deviceId ? { deviceId } : undefined),
    options
  )

export const vitalSignsWS = (deviceId: string, options?: ManagedWebSocketOptions) =>
  createDeviceStream(WS_ENDPOINTS.vitalSigns, deviceId, options)

export const postureWS = (deviceId: string, options?: ManagedWebSocketOptions) =>
  createDeviceStream(WS_ENDPOINTS.posture, deviceId, options)

export const ecgWS = (deviceId: string, options?: ManagedWebSocketOptions) =>
  createDeviceStream(WS_ENDPOINTS.ecg, deviceId, options)

export const r60abd1WS = (deviceId: string, options?: ManagedWebSocketOptions) =>
  createDeviceStream(WS_ENDPOINTS.r60abd1, deviceId, options)

export const ti6843VitalWS = (deviceId: string, options?: ManagedWebSocketOptions) =>
  createDeviceStream(WS_ENDPOINTS.ti6843Vital, deviceId, options)

export const ti6843PostureWS = (deviceId: string, options?: ManagedWebSocketOptions) =>
  createDeviceStream(WS_ENDPOINTS.ti6843Posture, deviceId, options)

export const fallAlertWS = (options?: ManagedWebSocketOptions) =>
  new ManagedWebSocket(() => buildWsUrl(WS_ENDPOINTS.fallAlert), options)
