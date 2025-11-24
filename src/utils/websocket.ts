/**
 * Lightweight WebSocket helpers used by the API layer.
 * They keep a consistent entry point even while the backend is mocked.
 */
const defaultWsBase = (import.meta.env.VITE_WS_BASE as string) || 'ws://localhost:5173/ws'

function buildUrl(path: string) {
  return `${defaultWsBase.replace(/\/$/, '')}/${path}`
}

function createSocket(topic: string): WebSocket {
  const url = buildUrl(topic)
  const socket = new WebSocket(url)
  socket.addEventListener('error', (event) => {
    console.error('WebSocket error', event)
  })
  return socket
}

export function vitalSignsWS(deviceId: string) {
  return createSocket(`vitals/${deviceId}`)
}

export function postureWS(deviceId: string) {
  return createSocket(`posture/${deviceId}`)
}

export function ecgWS(deviceId: string) {
  return createSocket(`ecg/${deviceId}`)
}

export function r60abd1WS(deviceId: string) {
  return createSocket(`r60abd1/${deviceId}`)
}

export function ti6843VitalWS(deviceId: string) {
  return createSocket(`ti6843/vital/${deviceId}`)
}

export function ti6843PostureWS(deviceId: string) {
  return createSocket(`ti6843/posture/${deviceId}`)
}

export function fallAlertWS() {
  return createSocket('alerts/fall')
}
