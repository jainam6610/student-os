let deepLockPlugin: any = null
try {
  deepLockPlugin = require('@/lib/deep-lock/plugin').deepLockPlugin
} catch {}

export interface NativeFocusSessionState {
  hasActiveSession: boolean
  sessionId?: string
  status?: string
  startTime?: number
  endTime?: number
  plannedDuration?: number
  remainingMs?: number
  strict?: boolean
}

export interface NativeFocusCompletion {
  sessionId: string
  actualDurationMs: number
  plannedDuration: number
  startTime?: number
  endTime?: number
}

export const nativeBridge = {
  async start(durationMinutes: number, whitelist: string[] = [], strict = false): Promise<string | null> {
    if (!deepLockPlugin?.startDeepLock) return null
    try {
      const result = await deepLockPlugin.startDeepLock(whitelist, 'deep-lock', durationMinutes, strict)
      if (result?.success === false) console.warn('[NativeBridge] optional Deep Lock start failed:', result.error)
      return result?.success === false ? null : result?.sessionId ?? null
    } catch (e) { console.warn('[NativeBridge] optional Deep Lock start failed:', e) }
    return null
  },

  async pause(): Promise<void> {
    if (!deepLockPlugin?.pauseDeepLock) return
    try { await deepLockPlugin.pauseDeepLock() } catch (e) { console.warn('[NativeBridge] pause failed:', e) }
  },

  async resume(): Promise<void> {
    if (!deepLockPlugin?.resumeDeepLock) return
    try { await deepLockPlugin.resumeDeepLock() } catch (e) { console.warn('[NativeBridge] resume failed:', e) }
  },

  async stop(): Promise<void> {
    if (!deepLockPlugin?.stopDeepLock) return
    try { await deepLockPlugin.stopDeepLock() } catch (e) { console.warn('[NativeBridge] stop failed:', e) }
  },

  async getSessionState(): Promise<NativeFocusSessionState | null> {
    if (!deepLockPlugin?.getSessionState) return null
    try { return await deepLockPlugin.getSessionState() } catch (e) {
      console.warn('[NativeBridge] session state unavailable:', e)
      return null
    }
  },

  onSessionCompleted(handler: (completion: NativeFocusCompletion) => void): () => void {
    if (!deepLockPlugin?.addListener) return () => {}
    try {
      const listener = deepLockPlugin.addListener('sessionCompleted', handler)
      return () => listener?.remove?.()
    } catch (e) {
      console.warn('[NativeBridge] completion listener unavailable:', e)
      return () => {}
    }
  },

  /**
   * Fires when the native session state changes (e.g. Pause/Stop tapped on the
   * persistent notification). Keeps the in-app timer authoritative-synced.
   */
  onSessionStateChanged(handler: (state: string) => void): () => void {
    if (!deepLockPlugin?.addListener) return () => {}
    try {
      const listener = deepLockPlugin.addListener('focusSessionStateChanged', (data: { state?: string }) => {
        handler(data?.state ?? '')
      })
      return () => listener?.remove?.()
    } catch (e) {
      console.warn('[NativeBridge] session state listener unavailable:', e)
      return () => {}
    }
  },

  /**
   * Drains completions finished natively while React was unmounted. Idempotent
   * with the live `sessionCompleted` listener — callers dedupe by sessionId.
   */
  async consumePendingCompletion(): Promise<NativeFocusCompletion[]> {
    if (!deepLockPlugin?.consumePendingCompletion) return []
    try {
      const res = await deepLockPlugin.consumePendingCompletion()
      const arr = res?.completions
      if (!Array.isArray(arr)) return []
      return arr
        .map((c: any): NativeFocusCompletion => ({
          sessionId: typeof c?.sessionId === 'string' ? c.sessionId : '',
          actualDurationMs: Number(c?.actualDurationMs) || 0,
          plannedDuration: Number(c?.plannedDuration) || 0,
          startTime: c?.startTime != null ? Number(c.startTime) : undefined,
          endTime: c?.endTime != null ? Number(c.endTime) : undefined,
        }))
        .filter((c) => c.sessionId)
    } catch (e) {
      console.warn('[NativeBridge] pending completion drain failed:', e)
      return []
    }
  },
}
