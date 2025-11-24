import {
  vitalSignsWS,
  postureWS,
  ecgWS,
  r60abd1WS,
  ti6843VitalWS,
  ti6843PostureWS,
  fallAlertWS
} from '@/utils/websocket'

/**
 * Thin wrappers so Vue components can import from a single API module.
 */
export const wsApi = {
  radarStream(deviceId: string) {
    return r60abd1WS(deviceId)
  },

  ti6843Vital(deviceId: string) {
    return ti6843VitalWS(deviceId)
  },

  ti6843Posture(deviceId: string) {
    return ti6843PostureWS(deviceId)
  },

  fallAlert() {
    return fallAlertWS()
  },

  vitalSigns(deviceId: string) {
    return vitalSignsWS(deviceId)
  },

  posture(deviceId: string) {
    return postureWS(deviceId)
  },

  ecg(deviceId: string) {
    return ecgWS(deviceId)
  }
}

export default wsApi
