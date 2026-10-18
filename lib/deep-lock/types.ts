export type FocusShieldMode = 'normal' | 'deep-lock'

export interface DistractionRecord {
  id: string
  sessionId: string
  packageName: string
  appName: string
  timestamp: number
  resolved: boolean
  duration: number
}

export interface DistractionSessionStats {
  totalDistractions: number
  blockedApps: string[]
  timeOutsideMs: number
  resumed: boolean
}

export interface WhitelistApp {
  packageName: string
  appName: string
  selected: boolean
  system: boolean
}

export interface DeepLockState {
  active: boolean
  accessibilityEnabled: boolean
  serviceRunning: boolean
  currentForegroundApp: string
}
