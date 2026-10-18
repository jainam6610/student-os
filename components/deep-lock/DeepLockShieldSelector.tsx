'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { deepLockPlugin } from '@/lib/deep-lock/plugin'
import type { FocusShieldMode } from '@/lib/deep-lock/types'
import { Settings } from 'lucide-react'

interface Props {
  embedded?: boolean
  onModeChange?: (mode: FocusShieldMode) => void
}

export function DeepLockShieldSelector({ embedded, onModeChange }: Props) {
  const focusShieldMode = useStore((s) => s.focusShieldMode)
  const setFocusShieldMode = useStore((s) => s.setFocusShieldMode)
  const setShowFocusShieldSetup = useStore((s) => s.setShowFocusShieldSetup)
  const [showAccessibilityInfo, setShowAccessibilityInfo] = useState(false)

  const isDeepLock = focusShieldMode === 'deep-lock'

  const handleToggle = useCallback(() => {
    const next: FocusShieldMode = isDeepLock ? 'normal' : 'deep-lock'
    if (next === 'deep-lock') {
      deepLockPlugin.isAccessibilityServiceEnabled().then(({ enabled }) => {
        if (!enabled) {
          setShowFocusShieldSetup(true)
        }
        setShowAccessibilityInfo(!enabled)
      })
    } else {
      setShowAccessibilityInfo(false)
    }
    setFocusShieldMode(next)
    onModeChange?.(next)
  }, [isDeepLock, setFocusShieldMode, onModeChange, setShowFocusShieldSetup])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Deep Lock</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isDeepLock ? 'Blocking distracting apps during focus' : 'No app blocking'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDeepLock && (
            <button
              onClick={() => setShowFocusShieldSetup(true)}
              className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
              aria-label="Deep Lock settings"
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <motion.button
            onClick={handleToggle}
            whileTap={{ scale: 0.95 }}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              isDeepLock ? 'bg-primary' : 'bg-border'
            }`}
            role="switch"
            aria-checked={isDeepLock}
            aria-label="Toggle Deep Lock"
          >
            <motion.div
              animate={{ x: isDeepLock ? 28 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
            />
          </motion.button>
        </div>
      </div>

      {showAccessibilityInfo && (
        <div
          onClick={() => setShowFocusShieldSetup(true)}
          className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 space-y-1 cursor-pointer hover:bg-amber-500/15 transition-colors"
        >
          <p className="font-semibold">Permissions needed</p>
          <p className="opacity-80">Tap to open Focus Shield Setup</p>
        </div>
      )}
    </div>
  )
}
