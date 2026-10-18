import { useSyncExternalStore, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { pickMessage, type MotivationCategory,
         type MotivationMessage } from './messages'

// Module-level singleton state: every hook instance shares one popup.
let _current: MotivationMessage | null = null
const _listeners = new Set<() => void>()

function _notify() {
  _listeners.forEach(fn => fn())
}

function _getSnapshot() {
  return _current
}

function _subscribe(fn: () => void) {
  _listeners.add(fn)
  return () => { _listeners.delete(fn) }
}

// Throttle (global, not per-instance). force=true bypasses it.
const THROTTLE_KEY = 'student-os-last-popup'
const THROTTLE_MS = 30 * 60 * 1000

function _isThrottled(): boolean {
  const last = parseInt(localStorage.getItem(THROTTLE_KEY) ?? '0')
  return Date.now() - last < THROTTLE_MS
}

function _stampThrottle() {
  localStorage.setItem(THROTTLE_KEY, String(Date.now()))
}

export function showMotivation(
  category: MotivationCategory,
  force = false // true = bypass throttle + enabled gate (Preview button)
): void {
  const {
    motivationEnabled, recentMotivationIds, addRecentMotivationId,
  } = useStore.getState()

  if (!motivationEnabled && !force) return
  if (!force && _isThrottled()) return

  const recentIds = recentMotivationIds ?? []
  const msg = pickMessage(category, recentIds)
  addRecentMotivationId(msg.id)

  if (!force) _stampThrottle()

  _current = msg
  _notify()
}

export function dismissMotivation(): void {
  _current = null
  _notify()
}

/** Show one specific message (e.g. a native notification's thought), bypassing pick/throttle. */
export function showMotivationMessage(msg: MotivationMessage): void {
  _current = msg
  _notify()
}

export function useMotivationPopup() {
  const current = useSyncExternalStore(_subscribe, _getSnapshot, () => null)
  const soundEnabled = useStore(s => s.motivationEnabled)

  const show = useCallback((
    category: MotivationCategory,
    force = false,
  ) => {
    showMotivation(category, force)
  }, [])

  const dismiss = useCallback(() => dismissMotivation(), [])

  return { current, show, dismiss, soundEnabled }
}
