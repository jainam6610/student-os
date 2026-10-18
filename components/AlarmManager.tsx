'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, AlarmClock, ChevronDown } from 'lucide-react'
import Alarm, { type AlarmEventData } from '@/lib/plugins/alarm-plugin'
import { useToast } from '@/components/ui/toast'
import { useStore } from '@/lib/store'

type AlarmState = {
  entityId: string
  title: string
  body: string
  habitId: string
} | null

export function AlarmManager() {
  const [alarm, setAlarm] = useState<AlarmState>(null)
  const [showOverlay, setShowOverlay] = useState(false)
  const [bannerVisible, setBannerVisible] = useState(false)
  const alarmRef = useRef<AlarmState>(null)
  const { showToast } = useToast()
  const setActiveView = useStore((s) => s.setActiveView)

  const clearAlarm = useCallback(() => {
    setAlarm(null)
    setShowOverlay(false)
    setBannerVisible(false)
    alarmRef.current = null
  }, [])

  const handleDismiss = useCallback(async () => {
    try { await Alarm.dismissAlarm() } catch { /* ignore */ }
    clearAlarm()
    showToast({ type: 'success', title: 'Alarm dismissed', description: '' })
  }, [clearAlarm, showToast])

  const handleSnooze = useCallback(async (minutes: number) => {
    try { await Alarm.snoozeAlarm({ minutes }) } catch { /* ignore */ }
    clearAlarm()
    showToast({ type: 'info', title: `Alarm snoozed for ${minutes} min`, description: '' })
  }, [clearAlarm, showToast])

  const reopenOverlay = useCallback(() => {
    setShowOverlay(true)
    setBannerVisible(false)
  }, [])

  useEffect(() => {
    let removeListener: (() => void) | undefined

    Alarm.getActiveAlarm().then((result) => {
      if (result.active && result.entityId) {
        const data: AlarmState = {
          entityId: result.entityId!,
          title: result.title || 'Alarm',
          body: result.body || '',
          habitId: result.habitId || '',
        }
        alarmRef.current = data
        setAlarm(data)
        setShowOverlay(true)
      }
    }).catch(() => {})

    Alarm.addListener('alarmFired', (data: AlarmEventData) => {
      const alarmData: AlarmState = {
        entityId: data.entityId,
        title: data.title,
        body: data.body,
        habitId: data.habitId,
      }
      alarmRef.current = alarmData
      setAlarm(alarmData)
      setShowOverlay(true)
    }).then((handle: any) => {
      removeListener = handle.remove ?? handle.removeListener
    }).catch(() => {})

    return () => { removeListener?.() }
  }, [])

  useEffect(() => {
    if (!showOverlay && alarm) {
      setBannerVisible(true)
    } else {
      setBannerVisible(false)
    }
  }, [showOverlay, alarm])

  // Explainer toast right before the OS exact-alarm screen opens.
  useEffect(() => {
    const handler = () => {
      showToast({ type: 'info', title: 'Allow exact alarms', description: 'Needed to fire your reminders at precise times.' })
    }
    window.addEventListener('exact-alarm-permission-requested', handler)
    return () => window.removeEventListener('exact-alarm-permission-requested', handler)
  }, [showToast])

  const isActive = alarm !== null

  return (
    <>
      {/* Full-screen overlay */}
      <AnimatePresence>
        {showOverlay && alarm && (
          <motion.div
            key="alarm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-screen flex flex-col items-center justify-center bg-black/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="glass-card w-[88vw] max-w-sm p-8 text-center space-y-6"
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="flex justify-center"
              >
                <div className="w-20 h-20 rounded-full bg-error/15 flex items-center justify-center">
                  <Bell className="w-10 h-10 text-error" />
                </div>
              </motion.div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Alarm</p>
                <p className="text-2xl font-bold">{alarm.title}</p>
                {alarm.body && (
                  <p className="text-sm text-muted-foreground">{alarm.body}</p>
                )}
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleDismiss}
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-[0.97] transition-all"
                >
                  Dismiss
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSnooze(5)}
                    className="flex-1 h-10 rounded-xl bg-secondary text-foreground font-medium text-xs hover:bg-secondary/80 active:scale-[0.97] transition-all border border-border/40"
                  >
                    Snooze 5 min
                  </button>
                  <button
                    onClick={() => handleSnooze(10)}
                    className="flex-1 h-10 rounded-xl bg-secondary text-foreground font-medium text-xs hover:bg-secondary/80 active:scale-[0.97] transition-all border border-border/40"
                  >
                    Snooze 10 min
                  </button>
                </div>
                <button
                  onClick={() => { setShowOverlay(false); setBannerVisible(true) }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                >
                  Minimize
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emergency banner */}
      <AnimatePresence>
        {bannerVisible && isActive && alarm && (
          <motion.div
            key="alarm-banner"
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-banner bg-error/90 backdrop-blur-md text-error-foreground px-4 py-3 shadow-lg"
          >
            <div className="flex items-center justify-between max-w-5xl mx-auto">
              <div className="flex items-center gap-3 min-w-0">
                <Bell className="w-5 h-5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{alarm.title}</p>
                  <p className="text-xs opacity-80">Alarm is ringing</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleSnooze(5)}
                  className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-medium transition-colors"
                >
                  Snooze
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-semibold transition-colors"
                >
                  Dismiss
                </button>
                <button
                  onClick={reopenOverlay}
                  className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
                  aria-label="Open alarm controls"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB when banner is visible */}
      <AnimatePresence>
        {bannerVisible && isActive && (
          <motion.button
            key="alarm-fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={reopenOverlay}
            className="fixed bottom-24 right-6 z-fab w-14 h-14 rounded-full bg-error shadow-xl shadow-error/30 flex items-center justify-center text-error-foreground"
            aria-label="Return to alarm"
          >
            <Bell className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}
