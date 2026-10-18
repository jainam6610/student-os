// ─────────────────────────────────────────────────────────
//  Student OS — Wake Lock Hook
//  Prevents device sleep during focus sessions (Android/PWA)
// ─────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'

// Use optional chaining for wake lock as newer TS includes it in lib.dom
interface WakeLockSentinel {
  release: () => Promise<void>
  released: boolean
  type: 'screen'
  addEventListener: (event: 'release', handler: () => void) => void
  removeEventListener: (event: 'release', handler: () => void) => void
}

export function useWakeLock(enabled: boolean) {
  const [isSupported, setIsSupported] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const sentinelRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    setIsSupported('wakeLock' in navigator)
  }, [])

  useEffect(() => {
    if (!isSupported || !enabled) {
      if (sentinelRef.current && !sentinelRef.current.released) {
        sentinelRef.current.release().catch(() => {})
        sentinelRef.current = null
        setIsActive(false)
      }
      return
    }

    let removeReleaseListener: (() => void) | null = null

    const requestWakeLock = async () => {
      try {
        const wl = (navigator as any).wakeLock
        if (!wl) return

        const sentinel = await (wl.request as (type: 'screen') => Promise<WakeLockSentinel>)('screen')
        sentinelRef.current = sentinel
        setIsActive(true)

        const handleRelease = () => {
          setIsActive(false)
          sentinelRef.current = null
        }

        sentinel.addEventListener('release', handleRelease)
        removeReleaseListener = () => {
          sentinel.removeEventListener('release', handleRelease)
        }
      } catch {
        setIsActive(false)
        sentinelRef.current = null
      }
    }

    requestWakeLock()

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        enabled &&
        (!sentinelRef.current || sentinelRef.current.released)
      ) {
        requestWakeLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (removeReleaseListener) removeReleaseListener()
      if (sentinelRef.current && !sentinelRef.current.released) {
        sentinelRef.current.release().catch(() => {})
        sentinelRef.current = null
      }
    }
  }, [isSupported, enabled])

  return { isSupported, isActive }
}
