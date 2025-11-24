import {
  vitalSignsWS,
  postureWS,
  ecgWS,
  r60abd1WS,
  ti6843VitalWS,
  ti6843PostureWS,
  fallAlertWS
} from '@/utils/ws'

/**
 * Thin wrappers so Vue components can import from a single API module.
 */
export const wsApi = {
  radarStream(deviceId) {
    return r60abd1WS(deviceId)
  },

  ti6843Vital(deviceId) {
    return ti6843VitalWS(deviceId)
  },

  ti6843Posture(deviceId) {
    return ti6843PostureWS(deviceId)
  },

  fallAlert() {
    return fallAlertWS()
  },

  vitalSigns(deviceId) {
    return vitalSignsWS(deviceId)
  },

  posture(deviceId) {
    return postureWS(deviceId)
  },

  ecg(deviceId) {
    return ecgWS(deviceId)
  }
}

export default wsApi
