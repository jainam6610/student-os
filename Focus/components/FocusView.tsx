'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { useWakeLock } from '@/hooks/use-wake-lock'
import { useFocus } from '../hooks/useFocus'
import { FocusHeader } from './FocusHeader'
import { FocusTimerDisplay } from './FocusTimerDisplay'
import { FocusControls } from './FocusControls'
import { FocusPresetSheet } from './FocusPresetSheet'
import { FocusCompletion } from './FocusCompletion'
import { FocusBanners } from './FocusBanners'
import { FocusSessionInfo } from './FocusSessionInfo'
import { FocusStatsRow } from './FocusStatsRow'
import { FocusBrainCanvas } from './FocusBrainCanvas'
import { CanvasErrorBoundary } from '@/components/focus/canvas-error-boundary'
import { AmbientPlayer } from './AmbientPlayer'
import { ambientAudio } from '@/lib/AmbientAudioService'
import { focusEventBus } from '../service/FocusEvents'
import { focusService } from '../service/FocusService'

const DEFAULT_DURATION_SECONDS = 60 * 60

export function FocusView() {
  const {
    session, status, isRunning, isPaused, isIdle, hasActiveSession,
    isOnBreak, secondsRemaining, progressPercent,
    completionData,
    start, pause, resume, stop, skipBreak, dismissCompletion,
  } = useFocus()

  useEffect(() => {
    // Preload ambient tracks on mount so the audio element is ready.
    // When sessionStarted fires (synchronously from a click handler),
    // play() can call audio.play() directly via the fast-resume path,
    // staying inside the user-gesture context required by Android WebView.
    const store = useStore.getState()
    if (store.ambientSoundEnabled) {
      void ambientAudio.loadTracks()
    }

    const unsubs = [
      focusEventBus.on('sessionCompleted', () => ambientAudio.stop()),
      focusEventBus.on('sessionStopped', () => ambientAudio.stop()),
      focusEventBus.on('sessionStarted', () => {
        const s = useStore.getState()
        if (s.ambientSoundEnabled && s.musicSettings?.autoPlay) {
          if (ambientAudio.getState().hasTracks) {
            ambientAudio.setVolume(s.ambientVolume)
            void ambientAudio.play()
          }
        }
      }),
    ]
    return () => {
      unsubs.forEach((u) => u())
      ambientAudio.stop()
    }
  }, [])

  const userName = useStore((s) => s.userName)
  const timerSettings = useStore((s) => s.timerSettings)
  const dailyGoal = useStore((s) => s.dailyGoal)
  const preferredFocusDuration = useStore((s) => s.preferredFocusDuration)
  const currentStreak = useStore((s) => s.progress?.currentStreak ?? 0)
  const sessionCount = useStore((s) => s.focusSessions?.length ?? 0)
  const setShowAccessibilityDisclosure = useStore((s) => s.setShowAccessibilityDisclosure)
  const accessibilityServiceEnabled = useStore((s) => s.accessibilityServiceEnabled)

  const todayFocusTime = useStore((s) =>
    (s.focusSessions ?? [])
      .filter((fs: any) => fs.endTime && fs.type !== 'break' && new Date(fs.endTime).toDateString() === new Date().toDateString())
      .reduce((acc: number, fs: any) => acc + fs.duration, 0)
  )

  useWakeLock(isRunning && timerSettings?.keepScreenAwake)

  const [pendingDuration, setPendingDuration] = useState(
    () => (preferredFocusDuration > 0 ? preferredFocusDuration : DEFAULT_DURATION_SECONDS / 60) * 60
  )
  const [showBottomSheet, setShowBottomSheet] = useState(false)
  const [justStarted, setJustStarted] = useState(false)
  const [dismissedAccessibilityWarning, setDismissedAccessibilityWarning] = useState(false)

  // Live break stopwatch: ticks only while paused so the countdown stays calm.
  const [, setBreakTick] = useState(0)
  useEffect(() => {
    if (!isPaused) return
    const id = setInterval(() => setBreakTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [isPaused])
  const breakSeconds = isPaused ? Math.floor(focusService.getPausedElapsedMs() / 1000) : 0
  const breakClock = `${Math.floor(breakSeconds / 60)}:${String(breakSeconds % 60).padStart(2, '0')}`

  // Keep the idle timer in sync with the user's configured default duration
  // (settings + hydration) without clobbering an active session.
  useEffect(() => {
    if (hasActiveSession) return
    setPendingDuration((preferredFocusDuration > 0 ? preferredFocusDuration : DEFAULT_DURATION_SECONDS / 60) * 60)
  }, [preferredFocusDuration, hasActiveSession])

  const effectiveDuration = session ? session.plannedDuration : pendingDuration
  const sessionNum = sessionCount + 1
  const progressToday = dailyGoal > 0 ? Math.min((todayFocusTime / dailyGoal) * 100, 100) : 0

  const handleStart = useCallback(() => {
    start(pendingDuration / 60)
    setJustStarted(true)
  }, [start, pendingDuration])

  const handlePresetSelect = useCallback((durationSeconds: number) => {
    setPendingDuration(durationSeconds)
    setShowBottomSheet(false)
  }, [])

  useEffect(() => {
    if (!justStarted) return
    const timeout = setTimeout(() => setJustStarted(false), 1500)
    return () => clearTimeout(timeout)
  }, [justStarted])

  const handleReturnHome = useCallback(() => {
    useStore.getState().setActiveView('dashboard')
  }, [])

  const handleStartAnother = useCallback(() => {
    dismissCompletion()
  }, [dismissCompletion])

  if (completionData) {
    return (
      <FocusCompletion
        completionData={completionData}
        isOnBreak={isOnBreak}
        onStartAnother={handleStartAnother}
        onReturnHome={handleReturnHome}
        onSkipBreak={skipBreak}
        onDismiss={dismissCompletion}
      />
    )
  }

  return (
    <div className="relative flex flex-col min-h-[calc(100dvh-120px)] lg:min-h-[calc(100dvh-48px)] safe-bottom">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <CanvasErrorBoundary>
          <FocusBrainCanvas />
        </CanvasErrorBoundary>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
      </div>

      <FocusHeader userName={userName} onOpenPresets={() => setShowBottomSheet(true)} isIdle={isIdle} />

      <main className="relative z-10 flex flex-col items-center justify-center flex-1 px-5 pt-24 pb-32">
        <FocusBanners
          deepLockError={null}
          accessibilityWarning={accessibilityServiceEnabled === false && !dismissedAccessibilityWarning}
          onDismissAccessibility={() => setDismissedAccessibilityWarning(true)}
          onOpenAccessibilitySettings={() => setShowAccessibilityDisclosure(true)}
        />

        <FocusTimerDisplay
          secondsRemaining={hasActiveSession ? secondsRemaining : Math.ceil(pendingDuration)}
          plannedDuration={effectiveDuration}
          isRunning={isRunning}
          isPaused={isPaused}
          progressPercent={hasActiveSession ? progressPercent : 0}
        />

        {isOnBreak && hasActiveSession && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20"
          >
            <span className="text-xs font-medium text-green-600 dark:text-green-400">Break in progress</span>
          </motion.div>
        )}

        {isPaused && !isOnBreak && hasActiveSession && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20"
          >
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 tabular-nums">Break {breakClock}</span>
          </motion.div>
        )}

        <AmbientPlayer />

        <FocusControls
          status={status}
          isRunning={isRunning}
          isPaused={isPaused}
          isIdle={isIdle}
          isStrict={focusService.strict}
          onStart={handleStart}
          onPause={pause}
          onResume={resume}
          onStop={stop}
        />

        <FocusSessionInfo
          hasActiveSession={hasActiveSession}
          isIdle={isIdle}
          secondsRemaining={secondsRemaining}
          sessionNum={sessionNum}
          plannedDuration={effectiveDuration}
        />

        <FocusStatsRow
          isIdle={isIdle}
          hasActiveSession={hasActiveSession}
          todayFocusTime={todayFocusTime}
          currentStreak={currentStreak}
          dailyGoal={dailyGoal}
          progressToday={progressToday}
        />
      </main>

      <FocusPresetSheet
        open={showBottomSheet}
        selectedDuration={pendingDuration}
        onSelect={handlePresetSelect}
        onClose={() => setShowBottomSheet(false)}
      />


      <AnimatePresence>
        {justStarted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-modal-backdrop pointer-events-none flex items-center justify-center"
          >
            <motion.div
              animate={{ scale: [1, 1.5, 2], opacity: [0.3, 0.15, 0] }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="w-40 h-40 rounded-full bg-primary/20"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
