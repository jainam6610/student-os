import { useStore } from '@/lib/store'

function ensureDisclosureAccepted(): boolean {
  const { prominentDisclosureAccepted } = useStore.getState()
  if (!prominentDisclosureAccepted) {
    console.error('Attempted permission request before disclosure shown')
    return false
  }
  return true
}

export interface ForegroundAppEvent {
  packageName: string
  appName: string
}

export interface BlockedAppEvent {
  packageName: string
  appName: string
  timestamp: number
}

export interface DeepLockStatus {
  accessibilityEnabled: boolean
  usageAccessGranted: boolean
  notificationPermissionGranted: boolean
  dndGranted: boolean
  batteryOptimizationIgnored: boolean
  serviceRunning: boolean
  sessionActive: boolean
  sessionState: string
  todayFocusMs: number
  todayDistractions: number
  totalFocusMs: number
  sessionContext?: {
    elapsedMinutes: number
    remainingMinutes: number
    totalMinutes: number
    interruptionCount: number
    streak: number
  }
}

export interface NativeSessionState {
  hasActiveSession: boolean
  sessionId?: string
  status?: string
  startTime?: number
  endTime?: number
  plannedDuration?: number
  totalPausedDuration?: number
  version?: number
  remainingMs?: number
  actualDurationMs?: number
  streak?: number
}

export interface SessionCompletedEvent {
  sessionId: string
  actualDurationMs: number
  plannedDuration: number
  streak: number
}

export interface DeepLockPluginInterface {
  startDeepLock(whitelist: string[], mode?: 'deep-lock' | 'hardcore', durationMinutes?: number, strict?: boolean): Promise<{ success: boolean; error?: string; sessionId?: string; endTime?: number; startTime?: number }>
  stopDeepLock(): Promise<{ success: boolean; error?: string }>
  setMode(mode: 'deep-lock' | 'hardcore'): Promise<void>
  updateWhitelist(whitelist: string[]): Promise<{ success: boolean; error?: string }>
  isAccessibilityServiceEnabled(): Promise<{ enabled: boolean }>
  openAccessibilitySettings(): Promise<void>
  setProminentDisclosureAccepted(accepted: boolean): Promise<void>
  requestScreenPinning(): Promise<void>
  getCurrentForegroundApp(): Promise<{ packageName: string }>
  isServiceRunning(): Promise<{ running: boolean }>
  addListener(event: 'foregroundAppChanged', handler: (event: ForegroundAppEvent) => void): { remove: () => void }
  addListener(event: 'blockedAppAttempt', handler: (event: BlockedAppEvent) => void): { remove: () => void }
  addListener(event: 'sessionCompleted', handler: (event: SessionCompletedEvent) => void): { remove: () => void }
  // New permission methods
  isDndAccessGranted(): Promise<{ granted: boolean }>
  openDndSettings(): Promise<void>
  enableDnd(): Promise<{ success: boolean; error?: string }>
  disableDnd(): Promise<{ success: boolean; error?: string }>
  isBatteryOptimizationIgnored(): Promise<{ ignored: boolean }>
  requestIgnoreBatteryOptimization(): Promise<void>
  openBatteryOptimizationSettings(): Promise<void>
  // Onboarding sync methods
  setOnboardingComplete(): Promise<{ success: boolean }>
  setTheme(theme: string, accentColor?: string): Promise<{ success: boolean }>
  getTheme(): Promise<{ theme: string; accentColor: string }>
  getOnboardingConfig(): Promise<{ onboardingCompleted: boolean; theme: string; accentColor: string }>
  // Focus timer sync
  pauseDeepLock(): Promise<{ success: boolean; remainingMs?: number }>
  resumeDeepLock(): Promise<{ success: boolean; endTime?: number; totalPausedDuration?: number }>
  // Session state
  getSessionState(): Promise<NativeSessionState>
  consumePendingCompletion(): Promise<{ completions: SessionCompletedEvent[] }>
  getMonotonicClock(): Promise<{ elapsedRealtime: number; currentTimeMillis: number }>
  forceComplete(): Promise<{ success: boolean }>
  forceStop(): Promise<{ success: boolean }>
  // App management
  openAppManagement(): Promise<{ success: boolean; error?: string }>
  // Notification permission
  isNotificationPermissionGranted(): Promise<{ granted: boolean }>
  requestNotificationPermission(): Promise<{ granted: boolean; deniedPermanently?: boolean }>
  openNotificationSettings(): Promise<void>
  // Full-screen intent permission (A14+)
  checkFullScreenIntent(): Promise<{ granted: boolean }>
  // Usage Access permission
  isUsageAccessGranted(): Promise<{ granted: boolean }>
  openUsageAccessSettings(): Promise<void>
  // Data clearing
  clearAllData(): Promise<{ success: boolean; error?: string }>
  // Combined status
  getDeepLockStatus(): Promise<DeepLockStatus>
}

type EventHandler = (data: any) => void

let eventListeners: Map<string, Set<EventHandler>> = new Map()
let nativeListeners: Map<string, { remove: () => void }> = new Map()
let nativePluginPromise: Promise<any> | null = null
let nativePlugin: any = null

async function getNativePlugin(): Promise<any> {
  if (nativePlugin) return nativePlugin
  if (nativePluginPromise) return nativePluginPromise
  nativePluginPromise = (async () => {
    try {
      const { registerPlugin, Capacitor } = await import('@capacitor/core')
      if (!Capacitor.isNativePlatform()) return null
      const rawPlugin = registerPlugin('DeepLock') as object
      nativePlugin = new Proxy(rawPlugin, {
        get(target, prop, receiver) {
          if (prop === 'then') return undefined
          return Reflect.get(target, prop, receiver)
        },
      })
      return nativePlugin
    } catch {
      return null
    }
  })()
  return nativePluginPromise
}

export const deepLockPlugin: DeepLockPluginInterface = {
  async startDeepLock(whitelist: string[], mode?: 'deep-lock' | 'hardcore', durationMinutes?: number, strict?: boolean): Promise<{ success: boolean; error?: string; sessionId?: string; endTime?: number; startTime?: number }> {
    const plugin = await getNativePlugin()
    if (!plugin) return { success: false, error: 'Not on native Android platform' }

    try {
      const result = await plugin.startDeepLock({ whitelist, mode, durationMinutes, strict: !!strict })
      return { success: result?.success ?? true, error: result?.error, sessionId: result?.sessionId, endTime: result?.endTime, startTime: result?.startTime }
    } catch (e: any) {
      return { success: false, error: e.message || 'Unknown error' }
    }
  },

  async setMode(mode: 'deep-lock' | 'hardcore'): Promise<void> {
    const plugin = await getNativePlugin()
    if (!plugin) return
    try { await plugin.setMode({ mode }) } catch { /* silent */ }
  },

  async stopDeepLock(): Promise<{ success: boolean; error?: string }> {
    const plugin = await getNativePlugin()
    if (!plugin) return { success: false, error: 'Not on native Android platform' }
    try {
      const result = await plugin.stopDeepLock()
      return { success: result?.success === true, error: result?.error }
    } catch (e: any) {
      return { success: false, error: e.message || 'Unknown error' }
    }
  },

  async updateWhitelist(whitelist: string[]): Promise<{ success: boolean; error?: string }> {
    const plugin = await getNativePlugin()
    if (!plugin) return { success: false, error: 'Not on native Android platform' }
    try {
      const result = await plugin.updateWhitelist({ whitelist })
      return { success: result.success ?? true }
    } catch (e: any) {
      return { success: false, error: e.message || 'Unknown error' }
    }
  },

  async isAccessibilityServiceEnabled(): Promise<{ enabled: boolean }> {
    const plugin = await getNativePlugin()
    if (!plugin) return { enabled: false }
    try { return await plugin.isAccessibilityServiceEnabled() } catch { return { enabled: false } }
  },

  async openAccessibilitySettings(): Promise<void> {
    if (!ensureDisclosureAccepted()) return
    const plugin = await getNativePlugin()
    if (!plugin) return
    try {
      await plugin.setProminentDisclosureAccepted({ accepted: true })
      await plugin.openAccessibilitySettings()
    } catch { /* silent */ }
  },

  async setProminentDisclosureAccepted(accepted: boolean): Promise<void> {
    const plugin = await getNativePlugin()
    if (!plugin) return
    try { await plugin.setProminentDisclosureAccepted({ accepted }) } catch { /* silent */ }
  },

  async requestScreenPinning(): Promise<void> {
    const plugin = await getNativePlugin()
    if (!plugin) return
    try { await plugin.requestScreenPinning() } catch { /* silent */ }
  },

  async getCurrentForegroundApp(): Promise<{ packageName: string }> {
    const plugin = await getNativePlugin()
    if (!plugin) return { packageName: '' }
    try { return await plugin.getCurrentForegroundApp() } catch { return { packageName: '' } }
  },

  async isServiceRunning(): Promise<{ running: boolean }> {
    const plugin = await getNativePlugin()
    if (!plugin) return { running: false }
    try { return await plugin.isServiceRunning() } catch { return { running: false } }
  },

  async isDndAccessGranted(): Promise<{ granted: boolean }> {
    const plugin = await getNativePlugin()
    if (!plugin) return { granted: false }
    try { return await plugin.isDndAccessGranted() } catch { return { granted: false } }
  },

  async openDndSettings(): Promise<void> {
    const plugin = await getNativePlugin()
    if (!plugin) return
    try { await plugin.openDndSettings() } catch { /* silent */ }
  },

  async enableDnd(): Promise<{ success: boolean; error?: string }> {
    const plugin = await getNativePlugin()
    if (!plugin) return { success: false, error: 'Not on native platform' }
    try { return await plugin.enableDnd() } catch (e: any) { return { success: false, error: e.message } }
  },

  async disableDnd(): Promise<{ success: boolean; error?: string }> {
    const plugin = await getNativePlugin()
    if (!plugin) return { success: false, error: 'Not on native platform' }
    try { return await plugin.disableDnd() } catch (e: any) { return { success: false, error: e.message } }
  },

  async isBatteryOptimizationIgnored(): Promise<{ ignored: boolean }> {
    const plugin = await getNativePlugin()
    if (!plugin) return { ignored: true }
    try { return await plugin.isBatteryOptimizationIgnored() } catch { return { ignored: false } }
  },

  async requestIgnoreBatteryOptimization(): Promise<void> {
    const plugin = await getNativePlugin()
    if (!plugin) return
    try { await plugin.requestIgnoreBatteryOptimization() } catch { /* silent */ }
  },

  async openBatteryOptimizationSettings(): Promise<void> {
    const plugin = await getNativePlugin()
    if (!plugin) return
    try { await plugin.openBatteryOptimizationSettings() } catch { /* silent */ }
  },

  async setOnboardingComplete(): Promise<{ success: boolean }> {
    const plugin = await getNativePlugin()
    if (!plugin) return { success: false }
    try {
      const result = await plugin.setOnboardingComplete({ complete: true })
      return { success: result.success ?? true }
    } catch { return { success: false } }
  },

  async setTheme(theme: string, accentColor?: string): Promise<{ success: boolean }> {
    const plugin = await getNativePlugin()
    if (!plugin) return { success: false }
    try {
      const result = await plugin.setTheme({ theme, accentColor: accentColor ?? 'purple' })
      return { success: result.success ?? true }
    } catch { return { success: false } }
  },

  async getTheme(): Promise<{ theme: string; accentColor: string }> {
    const plugin = await getNativePlugin()
    if (!plugin) return { theme: 'system', accentColor: 'purple' }
    try { return await plugin.getTheme() } catch { return { theme: 'system', accentColor: 'purple' } }
  },

  async getOnboardingConfig(): Promise<{ onboardingCompleted: boolean; theme: string; accentColor: string }> {
    const plugin = await getNativePlugin()
    if (!plugin) return { onboardingCompleted: false, theme: 'system', accentColor: 'purple' }
    try { return await plugin.getOnboardingConfig() } catch { return { onboardingCompleted: false, theme: 'system', accentColor: 'purple' } }
  },

  async pauseDeepLock(): Promise<{ success: boolean; remainingMs?: number }> {
    const plugin = await getNativePlugin()
    if (!plugin) return { success: false }
    try {
      const result = await plugin.pauseDeepLock()
      return { success: true, remainingMs: result.remainingMs }
    } catch { return { success: false } }
  },

  async resumeDeepLock(): Promise<{ success: boolean; endTime?: number; totalPausedDuration?: number }> {
    const plugin = await getNativePlugin()
    if (!plugin) return { success: false }
    try {
      const result = await plugin.resumeDeepLock()
      return { success: true, endTime: result.endTime, totalPausedDuration: result.totalPausedDuration }
    } catch { return { success: false } }
  },

  async getSessionState(): Promise<NativeSessionState> {
    const plugin = await getNativePlugin()
    if (!plugin) return { hasActiveSession: false }
    try { return await plugin.getSessionState() } catch { return { hasActiveSession: false } }
  },

  async consumePendingCompletion(): Promise<{ completions: SessionCompletedEvent[] }> {
    const plugin = await getNativePlugin()
    if (!plugin?.consumePendingCompletion) return { completions: [] }
    try {
      const r = await plugin.consumePendingCompletion()
      return { completions: Array.isArray(r?.completions) ? r.completions : [] }
    } catch { return { completions: [] } }
  },

  async getMonotonicClock(): Promise<{ elapsedRealtime: number; currentTimeMillis: number }> {
    const plugin = await getNativePlugin()
    if (!plugin) return { elapsedRealtime: 0, currentTimeMillis: 0 }
    try { return await plugin.getMonotonicClock() } catch { return { elapsedRealtime: 0, currentTimeMillis: 0 } }
  },

  async forceComplete(): Promise<{ success: boolean }> {
    const plugin = await getNativePlugin()
    if (!plugin) return { success: false }
    try { return await plugin.forceComplete() } catch { return { success: false } }
  },

  async forceStop(): Promise<{ success: boolean }> {
    const plugin = await getNativePlugin()
    if (!plugin) return { success: false }
    try { return await plugin.forceStop() } catch { return { success: false } }
  },

  async isNotificationPermissionGranted(): Promise<{ granted: boolean }> {
    const plugin = await getNativePlugin()
    if (!plugin) return { granted: true }
    try { return await plugin.isNotificationPermissionGranted() } catch { return { granted: false } }
  },

  async requestNotificationPermission(): Promise<{ granted: boolean; deniedPermanently?: boolean }> {
    const plugin = await getNativePlugin()
    if (!plugin) return { granted: true }
    try { return await plugin.requestNotificationPermission() } catch { return { granted: false } }
  },

  async openNotificationSettings(): Promise<void> {
    const plugin = await getNativePlugin()
    if (!plugin) return
    try { await plugin.openNotificationSettings() } catch { /* silent */ }
  },

  async checkFullScreenIntent(): Promise<{ granted: boolean }> {
    // Web / unsupported: treat as granted so no UI nags.
    const plugin = await getNativePlugin()
    if (!plugin) return { granted: true }
    try { return await plugin.checkFullScreenIntent() } catch { return { granted: true } }
  },

  async isUsageAccessGranted(): Promise<{ granted: boolean }> {
    const plugin = await getNativePlugin()
    if (!plugin) return { granted: false }
    try { return await plugin.isUsageAccessGranted() } catch { return { granted: false } }
  },

  async openUsageAccessSettings(): Promise<void> {
    // ponytail: Usage Access has its own Android settings screen and its own
    // grant journey. Only the Accessibility Service routes through the
    // disclosure gate — do not gate this on prominentDisclosureAccepted.
    const plugin = await getNativePlugin()
    if (!plugin) return
    try { await plugin.openUsageAccessSettings() } catch { /* silent */ }
  },

  async clearAllData(): Promise<{ success: boolean; error?: string }> {
    const plugin = await getNativePlugin()
    if (!plugin) return { success: false, error: 'Not on native platform' }
    try {
      await plugin.clearAllData()
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e?.message ?? 'Failed to clear native data' }
    }
  },

  async openAppManagement(): Promise<{ success: boolean; error?: string }> {
    const plugin = await getNativePlugin()
    if (!plugin) return { success: false, error: 'Not on native platform' }
    try { return await plugin.openAppManagement() } catch (e: any) { return { success: false, error: e.message } }
  },

  async getDeepLockStatus(): Promise<DeepLockStatus> {
    const plugin = await getNativePlugin()
    if (!plugin) return {
      accessibilityEnabled: false, usageAccessGranted: false,
      notificationPermissionGranted: true,
      dndGranted: false, batteryOptimizationIgnored: true, serviceRunning: false,
      sessionActive: false, sessionState: 'idle', todayFocusMs: 0,
      todayDistractions: 0, totalFocusMs: 0,
    }
    try { return await plugin.getDeepLockStatus() }
    catch { return {
      accessibilityEnabled: false, usageAccessGranted: false,
      notificationPermissionGranted: true,
      dndGranted: false, batteryOptimizationIgnored: true, serviceRunning: false,
      sessionActive: false, sessionState: 'idle', todayFocusMs: 0,
      todayDistractions: 0, totalFocusMs: 0,
    }}
  },

  addListener(event: string, handler: EventHandler): { remove: () => void } {
    if (!eventListeners.has(event)) {
      eventListeners.set(event, new Set())
      getNativePlugin().then((plugin) => {
        if (plugin) {
          plugin.addListener(event, (data: any) => {
            const handlers = eventListeners.get(event)
            if (handlers) handlers.forEach((h) => h(data))
          }).then((handle: { remove: () => void }) => {
            nativeListeners.set(event, handle)
          }).catch((err: any) => {
            console.error(`[DeepLockPlugin] Failed to register native listener for '${event}':`, err)
          })
        }
      }).catch(() => {})
    }
    eventListeners.get(event)!.add(handler)
    return {
      remove: () => {
        const handlers = eventListeners.get(event)
        if (handlers) {
          handlers.delete(handler)
          if (handlers.size === 0) {
            eventListeners.delete(event)
            const native = nativeListeners.get(event)
            if (native) {
              native.remove()
              nativeListeners.delete(event)
            }
          }
        }
      },
    }
  },
}

export function getDistractionLabel(count: number): string {
  if (count === 0) return 'No distractions'
  if (count === 1) return '1 distraction'
  return `${count} distractions`
}

export function formatTimeOutside(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`
}
