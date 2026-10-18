import { useEffect, useRef } from 'react'
import { App } from '@capacitor/app'
import { useStore } from '@/lib/store'
import { MotivationPopup } from './MotivationPopup'
import {
  dismissMotivation,
  showMotivation,
  showMotivationMessage,
  useMotivationPopup,
} from '@/lib/motivation/useMotivationPopup'
import { syncMotivationAlarms } from '@/lib/motivation/scheduler'
import { focusService } from '@/Focus/service/FocusService'
import Alarm from '@/lib/plugins/alarm-plugin'

const PENDING_FRESH_MS = 15 * 60 * 1000

export function MotivationManager() {
  const { current, dismiss } = useMotivationPopup()
  const deepLockActive = useStore(s => s.deepLockActive)
  const setActiveView = useStore(s => s.setActiveView)

  const lastDeepLockActive = useRef(deepLockActive)
  const lastStatus = useRef<string | undefined>(undefined)

  // Surface a native "thought" notification inside the app when the user taps it.
  useEffect(() => {
    const checkPendingThought = async () => {
      try {
        const res = await Alarm.getPendingThought()
        if (!res.found || !res.title) return
        const fresh = res.firedAtMs && Date.now() - res.firedAtMs < PENDING_FRESH_MS
        // Consume immediately so nothing double-shows; retry suppression
        // happens via markThoughtHandled once the card is actually rendered.
        await Alarm.clearPendingThought()
        if (!fresh) return
        // ponytail: debug log removed
        const m = /^(\S+)\s+(.*)$/.exec(res.title)
        showMotivationMessage({
          id: `thought-${res.firedAtMs ?? Date.now()}`,
          category: 'grind',
          emoji: m ? m[1] : '✨',
          title: m ? m[2] : res.title,
          body: res.body ?? '',
        })
        // Thought takeover lands the student directly in Focus — no detours.
        setActiveView('focus')
        if (res.entityId) {
          void Alarm.markThoughtHandled({ entityId: res.entityId }).catch(() => {})
        }
      } catch (e) {
        console.warn('[Motivation] pending thought check failed:', e)
      }
    }

    void checkPendingThought()
    let handle: { remove: () => void } | null = null
    App.addListener('appStateChange', (state) => {
      if (state.isActive) void checkPendingThought()
    }).then(h => { handle = h as unknown as { remove: () => void } })
    return () => { handle?.remove() }
  }, [setActiveView])

  // Recreate one-shot native alarms whenever the app starts if enabled.
  useEffect(() => {
    const {
      motivationEnabled,
      motivationTimes,
      motivationDays,
      recentMotivationIds,
    } = useStore.getState()

    if (motivationEnabled && motivationTimes.length > 0) {
      void syncMotivationAlarms(
        motivationTimes,
        motivationDays,
        motivationEnabled,
        recentMotivationIds
      )
    }
  }, [])

  return (
    <MotivationPopup
      message={current}
      onDismiss={dismiss}
      onStartFocus={current ? () => { dismissMotivation(); setActiveView('focus') } : undefined}
    />
  )
}
