'use client'

import { useState, useEffect, useCallback } from 'react'
import type { FocusSession, CompletionData } from '../service/FocusTypes'
import { focusService } from '../service/FocusService'
import { focusEventBus } from '../service/FocusEvents'
import { useStore } from '@/lib/store'

export function useFocus() {
  const [session, setSession] = useState<FocusSession | null>(() => focusService.getSnapshot())
  const [completionData, setCompletionData] = useState<CompletionData | null>(null)
  const [isOnBreak, setIsOnBreak] = useState(false)

  const timerSettings = useStore(s => s.timerSettings)
  const focusSessions = useStore(s => s.focusSessions)

  useEffect(() => {
    setSession(focusService.getSnapshot())
    focusService.syncFromService()

    const unsubscribe = focusService.subscribe(setSession)

    void focusService.reconcileNativeState().then(() => {
      focusService.syncFromService()
      setSession(focusService.getSnapshot())
    })

    const unsubs = [
      focusEventBus.on('sessionStarted', (e) => {
        setCompletionData(null)
        setIsOnBreak(e.session.kind === 'break')
      }),
      focusEventBus.on('sessionCompleted', (e) => {
        const s = e.session
        const score = s.plannedDuration > 0
          ? Math.min(100, Math.round((s.elapsed / s.plannedDuration) * 100))
          : 0

        // A completed break just ends the cycle — never auto-start another break.
        if (s.kind === 'break') {
          setIsOnBreak(false)
          setCompletionData({ duration: Math.round(s.elapsed / 60), score, interrupted: false })
          return
        }

        if (timerSettings.autoBreak) {
          // Only count focus sessions toward the long-break cadence.
          const completedCount = focusSessions.filter(fs => fs.completed && fs.type !== 'break').length
          const isLongBreak = timerSettings.longBreakFrequency > 0
            && completedCount > 0
            && completedCount % timerSettings.longBreakFrequency === 0
          const breakMinutes = isLongBreak ? timerSettings.breakDuration * 3 : timerSettings.breakDuration
          setIsOnBreak(true)
          focusService.start(breakMinutes, 'break')
          return
        }

        setCompletionData({ duration: Math.round(s.elapsed / 60), score, interrupted: false })
      }),
      focusEventBus.on('sessionStopped', (e) => {
        const s = e.session
        const score = s.plannedDuration > 0
          ? Math.min(100, Math.round((s.elapsed / s.plannedDuration) * 100))
          : 0
        setIsOnBreak(false)
        setCompletionData({ duration: Math.round(s.elapsed / 60), score, interrupted: true })
      }),
    ]
    return () => {
      unsubscribe()
      unsubs.forEach(u => u())
    }
  }, [timerSettings, focusSessions])

  const start = useCallback((durationMinutes: number) => {
    setIsOnBreak(false)
    focusService.start(durationMinutes)
  }, [])

  const pause = useCallback(() => {
    focusService.pause()
  }, [])

  const resume = useCallback(() => {
    focusService.resume()
  }, [])

  const stop = useCallback(() => {
    focusService.stop()
  }, [])

  const dismissCompletion = useCallback(() => {
    setCompletionData(null)
  }, [])

  const skipBreak = useCallback(() => {
    focusService.stop()
    setIsOnBreak(false)
  }, [])

  const status = session?.status ?? 'idle'
  const isRunning = status === 'running'
  const isPaused = status === 'paused'
  const isIdle = status === 'idle'
  const hasActiveSession = isRunning || isPaused
  const secondsRemaining = session?.remaining ?? 0
  const progressPercent = session && session.plannedDuration > 0
    ? ((session.plannedDuration - secondsRemaining) / session.plannedDuration) * 100
    : 0

  return {
    session,
    status,
    isRunning,
    isPaused,
    isIdle,
    hasActiveSession,
    isOnBreak,
    secondsRemaining,
    progressPercent,
    completionData,
    start,
    pause,
    resume,
    stop,
    skipBreak,
    dismissCompletion,
  }
}
