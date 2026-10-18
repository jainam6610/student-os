'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { formatMinutes, getEstimatedEnd } from '../utils/format'

interface Props {
  hasActiveSession: boolean
  isIdle: boolean
  secondsRemaining: number
  sessionNum: number
  plannedDuration: number
}

export function FocusSessionInfo({ hasActiveSession, isIdle, secondsRemaining, sessionNum, plannedDuration }: Props) {
  return (
    <AnimatePresence>
      {hasActiveSession && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
          className="mt-8 flex items-center gap-6 text-[11px] text-muted-foreground/50"
        >
          <span>Session #{sessionNum}</span>
          <span className="w-px h-3 bg-border/30" />
          <span>{formatMinutes(Math.ceil(secondsRemaining / 60))} remaining</span>
          {secondsRemaining > 0 && (
            <>
              <span className="w-px h-3 bg-border/30" />
              <span>Done by {getEstimatedEnd(secondsRemaining * 1000)}</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
