'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert } from 'lucide-react'

interface Props {
  deepLockError: string | null
  accessibilityWarning: boolean
  onDismissAccessibility: () => void
  onOpenAccessibilitySettings: () => void
}

export function FocusBanners({ deepLockError, accessibilityWarning, onDismissAccessibility, onOpenAccessibilitySettings }: Props) {
  return (
    <AnimatePresence>
      {deepLockError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="w-full max-w-lg mb-4 px-4 py-3 rounded-2xl border border-destructive/20 bg-destructive/10 flex items-center gap-3"
        >
          <ShieldAlert className="w-5 h-5 shrink-0 text-destructive" />
          <p className="flex-1 text-xs text-destructive/90 leading-relaxed">{deepLockError}</p>
        </motion.div>
      )}
      {accessibilityWarning && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="w-full max-w-lg mb-4 px-4 py-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 flex items-center gap-3"
        >
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400" />
          <p className="flex-1 text-xs text-amber-400/90 leading-relaxed">
            Accessibility is disabled. Deep Lock won&rsquo;t block distractions.
          </p>
          <button
            onClick={onOpenAccessibilitySettings}
            className="shrink-0 text-xs font-semibold text-amber-400 hover:text-amber-300 underline-offset-2 underline transition-colors"
          >
            Fix
          </button>
          <button
            onClick={onDismissAccessibility}
            className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center text-amber-400/60 hover:text-amber-400 transition-colors"
            aria-label="Dismiss accessibility warning"
          >
            <span className="text-lg leading-none">&times;</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
