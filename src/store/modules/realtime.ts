import { defineStore } from 'pinia'
import type { ManagedWebSocket, ManagedWebSocketOptions, SocketStatus } from '@/utils/ws'
import { logger } from '@/utils/logger'

type Listener = (payload: unknown) => void
type Builder = (options?: ManagedWebSocketOptions) => ManagedWebSocket

interface RealtimeState {
  connections: Record<string, ManagedWebSocket | null>
  statuses: Record<string, SocketStatus>
  lastPayloads: Record<string, unknown>
  listeners: Record<string, Set<Listener>>
}

export const useRealtimeStore = defineStore('realtime', {
  state: (): RealtimeState => ({
    connections: {},
    statuses: {},
    lastPayloads: {},
    listeners: {}
  }),

  getters: {
    isConnected: (state) => (topic: string) => state.statuses[topic] === 'open',
    latestPayload: (state) => (topic: string) => state.lastPayloads[topic]
  },

  actions: {
    subscribe(topic: string, builder: Builder, options?: ManagedWebSocketOptions) {
      this.unsubscribe(topic)
      const socket = builder({
        ...options,
        onMessage: (payload, event) => {
          this.lastPayloads[topic] = payload
          this.listeners[topic]?.forEach((listener) => listener(payload))
          options?.onMessage?.(payload, event)
        },
        onStatusChange: (status) => {
          this.statuses[topic] = status
          options?.onStatusChange?.(status)
        }
      })
      this.connections[topic] = socket
      this.statuses[topic] = 'connecting'
      return socket
    },

    unsubscribe(topic: string) {
      const socket = this.connections[topic]
      if (socket) {
        socket.close()
      }
      delete this.connections[topic]
      delete this.statuses[topic]
      delete this.lastPayloads[topic]
    },

    registerListener(topic: string, listener: Listener) {
      if (!this.listeners[topic]) {
        this.listeners[topic] = new Set()
      }
      this.listeners[topic]?.add(listener)
      return () => this.listeners[topic]?.delete(listener)
    },

    broadcast(topic: string, payload: unknown) {
      const socket = this.connections[topic]
      if (!socket) {
        logger.warn(`No realtime connection for topic ${topic}`)
        return
      }
      socket.send(payload)
    },

    disconnectAll() {
      Object.keys(this.connections).forEach((topic) => this.unsubscribe(topic))
      this.listeners = {}
    }
  }
})
