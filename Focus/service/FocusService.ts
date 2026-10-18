import type { FocusSession } from './FocusTypes'
import { focusEventBus } from './FocusEvents'
import { nativeBridge, type NativeFocusCompletion, type NativeFocusSessionState } from './NativeBridge'
import { useStore } from '@/lib/store'

function statusToEventType(status: FocusSession['status'], alreadyRunning: boolean): import('./FocusTypes').FocusEventType {
  if (status === 'running') return alreadyRunning ? 'sessionResumed' : 'sessionStarted'
  if (status === 'paused') return 'sessionPaused'
  if (status === 'completed') return 'sessionCompleted'
  if (status === 'cancelled') return 'sessionStopped'
  return 'tick'
}

const ACTIVE_SESSION_KEY = 'student-os-active-focus-session'

class FocusService {
  private _session: FocusSession | null = null
  private _onSessionCompleted: ((session: FocusSession) => void) | null = null
  private readonly subscribers = new Set<(session: FocusSession | null) => void>()
  private readonly reportedSessionIds = new Set<string>()
  private intervalId: ReturnType<typeof setInterval> | null = null
  private _plannedMs = 0
  private _accumulatedMs = 0
  private _segmentStart = 0
  private _pausedAccumulatedMs = 0
  private _pausedSegmentStart = 0
  private _pauseCount = 0
  private _isRunning = false
  private _completed = false
  private _sessionId = ''
  private _kind: 'focus' | 'break' = 'focus'
  private _strict = false
  private _nativeSessionId: string | null = null
  private initialized = false
  private removeNativeCompletionListener: (() => void) | null = null
  private removeNativeStateListener: (() => void) | null = null

  set onComplete(cb: ((session: FocusSession) => void) | null) {
    this._onSessionCompleted = cb
  }

  get session(): FocusSession | null {
    return this._session
  }

  /** Strict mode is snapshotted at session start; mid-session toggling has no effect. */
  get strict(): boolean {
    return this._strict
  }

  getSnapshot = (): FocusSession | null => this._session

  /** Re-sync subscribers after navigation/remount; restarts tick loop if session is running. */
  syncFromService(): void {
    this.ensureIntervalRunning()
    this.publishSnapshot()
  }

  subscribe(listener: (session: FocusSession | null) => void): () => void {
    this.subscribers.add(listener)
    listener(this._session)
    return () => this.subscribers.delete(listener)
  }

  private ensureIntervalRunning(): void {
    if (this._isRunning && !this._completed && this._session && this.intervalId === null) {
      this.startInterval()
    }
  }

  private publishSnapshot(): void {
    this.subscribers.forEach((listener) => listener(this._session))
  }

  private currentElapsedMs(): number {
    if (this._isRunning && this._segmentStart > 0) {
      return this._accumulatedMs + (Date.now() - this._segmentStart)
    }
    return this._accumulatedMs
  }

  /** Live pause/break time: accumulated + the currently-open pause segment. */
  private currentPausedMs(): number {
    if (!this._isRunning && this._pausedSegmentStart > 0) {
      return this._pausedAccumulatedMs + (Date.now() - this._pausedSegmentStart)
    }
    return this._pausedAccumulatedMs
  }

  getPausedElapsedMs(): number {
    return this.currentPausedMs()
  }

  private makeSession(status: FocusSession['status']): FocusSession {
    const elapsed = this.currentElapsedMs()
    const remaining = Math.max(0, this._plannedMs - elapsed)
    const now = Date.now()
    return {
      sessionId: this._sessionId,
      kind: this._kind,
      status,
      startTime: this._session?.startTime ?? Date.now(),
      endTime: status === 'completed' || status === 'cancelled' ? now : now + remaining,
      plannedDuration: Math.round(this._plannedMs / 1000),
      elapsed: Math.round(elapsed / 1000),
      remaining: Math.floor(remaining / 1000),
      pausedDuration: Math.round(this.currentPausedMs() / 1000),
      pauseCount: this._pauseCount,
      completed: status === 'completed',
      interrupted: status === 'cancelled',
    }
  }

  private emit(type: FocusSession['status']): void {
    const s = this.makeSession(type)
    this._session = s
    this.publishSnapshot()
    const eventType = statusToEventType(type, this._isRunning)
    focusEventBus.emit({ type: eventType, session: s, remaining: s.remaining, elapsed: s.elapsed })
  }

  private startInterval(): void {
    this.stopInterval()
    this.intervalId = setInterval(() => {
      if (this._isRunning && this.currentElapsedMs() >= this._plannedMs) {
        this.completeSession()
      } else {
        this.emit('running')
      }
    }, 200)
  }

  private stopInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private clearSession(): void {
    this._session = null
    this._accumulatedMs = 0
    this._plannedMs = 0
    this._segmentStart = 0
    this._pausedAccumulatedMs = 0
    this._pausedSegmentStart = 0
    this._pauseCount = 0
    this._isRunning = false
    this._strict = false
    this._nativeSessionId = null
    this.publishSnapshot()
    this.clearPersistedSession()
  }

  private persistSession(): void {
    if (typeof window === 'undefined') return
    try {
      if (this._session) {
        localStorage.setItem(
          ACTIVE_SESSION_KEY,
          JSON.stringify({
            sessionId: this._sessionId,
            nativeSessionId: this._nativeSessionId,
            kind: this._kind,
            plannedMs: this._plannedMs,
            accumulatedMs: this._accumulatedMs,
            segmentStart: this._segmentStart,
            pausedAccumulatedMs: this._pausedAccumulatedMs,
            pausedSegmentStart: this._pausedSegmentStart,
            pauseCount: this._pauseCount,
            isRunning: this._isRunning,
          })
        )
      } else {
        localStorage.removeItem(ACTIVE_SESSION_KEY)
      }
    } catch { /* storage full/quota — non-fatal */ }
  }

  private clearPersistedSession(): void {
    if (typeof window === 'undefined') return
    try { localStorage.removeItem(ACTIVE_SESSION_KEY) } catch {}
  }

  // ponytail: elapsed is recomputed from persisted wall-clock timestamps
  // (segmentStart/accumulatedMs), so only transitions need persisting — no
  // throttled tick writes. pagehide persists on refresh/close for the web
  // case; on Android native reconcile stays authoritative.
  private restoreSession(): void {
    if (typeof window === 'undefined') return
    let raw: string | null = null
    try { raw = localStorage.getItem(ACTIVE_SESSION_KEY) } catch { return }
    if (!raw) return
    try {
      const s = JSON.parse(raw) as {
        sessionId?: string
        nativeSessionId?: string | null
        kind?: string
        plannedMs?: number
        accumulatedMs?: number
        segmentStart?: number
        pausedAccumulatedMs?: number
        pausedSegmentStart?: number
        pauseCount?: number
        isRunning?: boolean
      }
      const plannedMs = typeof s.plannedMs === 'number' ? s.plannedMs : 0
      if (plannedMs <= 0) { this.clearPersistedSession(); return }
      this._sessionId = typeof s.sessionId === 'string' && s.sessionId ? s.sessionId : ''
      this._nativeSessionId = typeof s.nativeSessionId === 'string' ? s.nativeSessionId : null
      this._kind = s.kind === 'break' ? 'break' : 'focus'
      this._plannedMs = plannedMs
      this._accumulatedMs = typeof s.accumulatedMs === 'number' ? s.accumulatedMs : 0
      this._pausedAccumulatedMs = typeof s.pausedAccumulatedMs === 'number' ? s.pausedAccumulatedMs : 0
      this._pauseCount = typeof s.pauseCount === 'number' ? s.pauseCount : 0
      this._isRunning = Boolean(s.isRunning)
      this._segmentStart = this._isRunning
        ? (typeof s.segmentStart === 'number' ? s.segmentStart : Date.now())
        : 0
      this._pausedSegmentStart = this._isRunning
        ? 0
        : (typeof s.pausedSegmentStart === 'number' ? s.pausedSegmentStart : Date.now())
      this._completed = false
      // If the session already elapsed while we were away, let the tick loop
      // finish it through the normal completion path so the wired onComplete
      // handler still records the session (finishSession is _completed-guarded
      // and thus idempotent against a concurrent native completion).
      if (this.currentElapsedMs() >= this._plannedMs) {
        this._isRunning = true
        this._segmentStart = 0
        this._accumulatedMs = this._plannedMs
      }
      this._session = this.makeSession(this._isRunning ? 'running' : 'paused')
      this.publishSnapshot()
      if (this._isRunning) this.startInterval()
      else this.ensureIntervalRunning()
    } catch {
      this.clearPersistedSession()
    }
  }

  private handlePageHide = (): void => { this.persistSession() }

  private reportTerminalSession(session: FocusSession): void {
    try {
      const shouldReport = Boolean(session.sessionId)
        && !this.reportedSessionIds.has(session.sessionId)
        // Manual stop with zero elapsed should not create a Trends entry.
        && !(session.interrupted && session.elapsed <= 0)

      if (shouldReport) {
        this.reportedSessionIds.add(session.sessionId)
        if (this._nativeSessionId) this.reportedSessionIds.add(this._nativeSessionId)
        this._onSessionCompleted?.(session)
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Focus] Failed to report terminal session.', error)
      }
    } finally {
      this.clearSession()
    }
  }

  private finishSession(status: 'completed' | 'cancelled', elapsedMs = this.currentElapsedMs(), stopNative = true): void {
    if (this._completed || !this._session) return
    this._completed = true
    this.stopInterval()
    this._isRunning = false
    this._segmentStart = 0
    this._accumulatedMs = Math.min(this._plannedMs, Math.max(0, elapsedMs))
    const terminal = this.makeSession(status)
    this._session = terminal
    this.publishSnapshot()
    // Report + clear internal state BEFORE dispatching the terminal event.
    // Listeners (e.g. auto-break) call focusService.start() synchronously; doing
    // this first clears _session so the start() guard no longer bails.
    this.reportTerminalSession(terminal)
    focusEventBus.emit({
      type: statusToEventType(status, false),
      session: terminal,
      remaining: terminal.remaining,
      elapsed: terminal.elapsed,
    })
    if (stopNative) void nativeBridge.stop()
  }

  private completeSession(): void {
    this.finishSession('completed', this._plannedMs)
  }

  init(): void {
    if (this.initialized) return
    this.initialized = true
    this.removeNativeCompletionListener = nativeBridge.onSessionCompleted((completion) => {
      this.completeFromNative(completion)
    })
    this.removeNativeStateListener = nativeBridge.onSessionStateChanged((state) => {
      this.applyNativeState(state)
    })
    // Restore JS snapshot first; native (if any) is authoritative and overwrites
    // via reconcileNativeState. Both guard through finishSession/_completed.
    this.restoreSession()
    void this.reconcileNativeState().then(() => this.pullPendingCompletions())

    if (typeof window !== 'undefined') {
      window.addEventListener('visibilitychange', this.handleVisibilityChange)
      window.addEventListener('pagehide', this.handlePageHide)
    }
  }

  private handleVisibilityChange = (): void => {
    if (typeof document === 'undefined' || document.visibilityState !== 'visible') return
    void this.reconcileNativeState().then(() => this.pullPendingCompletions())
  }

  async reconcileNativeState(): Promise<void> {
    const native = await nativeBridge.getSessionState()
    if (!native?.hasActiveSession || !native.sessionId) return
    this.applyNativeSnapshot(native)
  }

  /** Drains native completions that finished while React was unmounted. */
  private async pullPendingCompletions(): Promise<void> {
    const items = await nativeBridge.consumePendingCompletion()
    for (const c of items) this.completeFromNative(c)
  }

  /**
   * Mirrors a native-initiated state change (Pause/Stop tapped on the persistent
   * notification calls FocusSessionManager directly, bypassing the JS timer).
   * Pure local mutation — never calls back into native to avoid a feedback loop.
   */
  private applyNativeState(state: string): void {
    if (state === 'paused') {
      if (this._isRunning) {
        this.stopInterval()
        if (this._segmentStart > 0) this._accumulatedMs += Date.now() - this._segmentStart
        this._segmentStart = 0
        this._isRunning = false
        this._pausedSegmentStart = Date.now()
        this._pauseCount += 1
        this.emit('paused')
        this.persistSession()
      }
    } else if (state === 'active') {
      if (!this._isRunning && this._session && this.currentElapsedMs() < this._plannedMs) {
        if (this._pausedSegmentStart > 0) {
          this._pausedAccumulatedMs += Date.now() - this._pausedSegmentStart
          this._pausedSegmentStart = 0
        }
        this._segmentStart = Date.now()
        this._isRunning = true
        this.emit('running')
        this.startInterval()
        this.persistSession()
      }
    } else if (state === 'inactive') {
      // Native session ended with no completion record → treat as cancelled.
      if (this._session && !this._completed) {
        this.finishSession('cancelled', undefined, false)
      }
    }
  }

  private applyNativeSnapshot(native: NativeFocusSessionState): void {
    const plannedMs = native.plannedDuration ?? 0
    const remainingMs = native.remainingMs ?? Math.max(0, (native.endTime ?? Date.now()) - Date.now())
    const isPaused = native.status === 'paused'
    const isRunning = native.status === 'active'
    if (plannedMs <= 0 || (!isPaused && !isRunning)) return
    // Never resurrect a session that was already reported/completed, and never
    // let a stale native snapshot clobber a live, different JS session.
    if (!native.sessionId || this.reportedSessionIds.has(native.sessionId)) return
    if (this._session && this._sessionId !== native.sessionId && this._nativeSessionId !== native.sessionId) return

    this.stopInterval()
    this._sessionId = native.sessionId
    this._nativeSessionId = native.sessionId
    this._kind = 'focus'
    this._plannedMs = plannedMs
    this._accumulatedMs = Math.min(plannedMs, Math.max(0, plannedMs - remainingMs))
    this._segmentStart = isRunning ? Date.now() : 0
    this._isRunning = isRunning
    this._strict = Boolean(native.strict)
    this._completed = false
    this._session = {
      sessionId: this._sessionId,
      kind: 'focus',
      status: isPaused ? 'paused' : 'running',
      startTime: native.startTime ?? Date.now() - this._accumulatedMs,
      endTime: native.endTime ?? Date.now() + remainingMs,
      plannedDuration: Math.round(plannedMs / 1000),
      elapsed: Math.round(this._accumulatedMs / 1000),
      remaining: Math.floor(remainingMs / 1000),
      pausedDuration: 0,
      pauseCount: 0,
      completed: false,
      interrupted: false,
    }
    this.publishSnapshot()
    if (isRunning) this.startInterval()
    else this.ensureIntervalRunning()
  }

  private completeFromNative(completion: NativeFocusCompletion): void {
    if (!completion.sessionId || this.reportedSessionIds.has(completion.sessionId)) return

    const matchesCurrentSession = this._sessionId === completion.sessionId || this._nativeSessionId === completion.sessionId
    if (this._session && !matchesCurrentSession) return

    if (!this._session) {
      const plannedMs = Math.max(0, completion.plannedDuration)
      const elapsedMs = Math.min(plannedMs, Math.max(0, completion.actualDurationMs))
      this.stopInterval()
      this._sessionId = completion.sessionId
      this._nativeSessionId = completion.sessionId
      this._plannedMs = plannedMs
      this._accumulatedMs = elapsedMs
      this._segmentStart = 0
      this._isRunning = false
      this._completed = false
      this._session = {
        sessionId: completion.sessionId,
        kind: 'focus',
        status: 'running',
        startTime: completion.startTime ?? Date.now() - elapsedMs,
        endTime: completion.endTime ?? Date.now(),
        plannedDuration: Math.round(plannedMs / 1000),
        elapsed: Math.round(elapsedMs / 1000),
        remaining: Math.max(0, Math.floor((plannedMs - elapsedMs) / 1000)),
        pausedDuration: 0,
        pauseCount: 0,
        completed: false,
        interrupted: false,
      }
    }
    this.finishSession('completed', Math.min(this._plannedMs, Math.max(0, completion.actualDurationMs)), false)
  }

  start(durationMinutes: number, kind: 'focus' | 'break' = 'focus'): void {
    if (this._session) return
    this._sessionId = crypto.randomUUID()
    this._nativeSessionId = null
    this._kind = kind
    this._strict = kind === 'focus' && Boolean(useStore.getState().timerSettings?.strictFocus)
    this._plannedMs = durationMinutes * 60 * 1000
    this._accumulatedMs = 0
    this._pausedAccumulatedMs = 0
    this._pausedSegmentStart = 0
    this._pauseCount = 0
    this._segmentStart = Date.now()
    this._completed = false
    this.emit('running')
    this._isRunning = true
    this.startInterval()
    this.persistSession()
    // Breaks never arm native blocking (Deep Lock). Focus sessions arm it as
    // an optional layer whose availability must never gate the timer itself.
    if (kind === 'break') return
    const jsSessionId = this._sessionId
    const whitelist = useStore.getState().whitelistedApps ?? []
    void nativeBridge.start(durationMinutes, whitelist, this._strict).then((nativeSessionId) => {
      if (this._sessionId === jsSessionId) this._nativeSessionId = nativeSessionId
    })
  }

  pause(): void {
    if (!this._isRunning) return
    this.stopInterval()
    if (this._segmentStart > 0) this._accumulatedMs += Date.now() - this._segmentStart
    this._segmentStart = 0
    this._isRunning = false
    this._pausedSegmentStart = Date.now()
    this._pauseCount += 1
    this.emit('paused')
    this.persistSession()
    nativeBridge.pause()
  }

  resume(): void {
    if (this._isRunning || this._strict || this.currentElapsedMs() >= this._plannedMs) return
    if (this._pausedSegmentStart > 0) {
      this._pausedAccumulatedMs += Date.now() - this._pausedSegmentStart
      this._pausedSegmentStart = 0
    }
    this._segmentStart = Date.now()
    this._isRunning = true
    this.emit('running')
    nativeBridge.resume()
    this.startInterval()
    this.persistSession()
  }

  stop(): void {
    this.finishSession('cancelled')
  }

  destroy(): void {
    this.stopInterval()
    this.removeNativeCompletionListener?.()
    this.removeNativeCompletionListener = null
    this.removeNativeStateListener?.()
    this.removeNativeStateListener = null
    if (typeof window !== 'undefined') {
       window.removeEventListener('visibilitychange', this.handleVisibilityChange)
      window.removeEventListener('pagehide', this.handlePageHide)
    }
    this.clearSession()
    this._onSessionCompleted = null
    this._completed = false
    this._sessionId = ''
    this._nativeSessionId = null
    this._pauseCount = 0
    this._pausedAccumulatedMs = 0
    this._pausedSegmentStart = 0
    this._strict = false
    this.initialized = false
  }
}

export const focusService = new FocusService()
