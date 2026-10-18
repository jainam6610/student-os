'use client'

import { motion } from 'framer-motion'
import { PartyPopper } from 'lucide-react'
import { useStore } from '@/lib/store'
import { getCompletionMessage } from '@/lib/insights'
import type { CompletionData } from '../service/FocusTypes'
import { formatMinutes } from '../utils/format'

interface Props {
  completionData: CompletionData
  isOnBreak?: boolean
  onStartAnother: () => void
  onReturnHome: () => void
  onSkipBreak?: () => void
  onDismiss: () => void
}

export function FocusCompletion({ completionData, isOnBreak, onStartAnother, onReturnHome, onSkipBreak, onDismiss }: Props) {
  const data = completionData
  const motivationStyle = useStore((s) => s.motivationStyle)
  const mainChallenge = useStore((s) => s.mainChallenge)
  const completedSessions = useStore((s) => s.focusSessions.filter((s) => s.completed).length)
  const message = getCompletionMessage({
    score: data.score,
    duration: data.duration,
    motivationStyle,
    mainChallenge,
    sessionNumber: completedSessions,
  })

  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="relative flex flex-col items-center justify-center min-h-[80vh] px-6 py-12 safe-bottom"
      onClick={onDismiss}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.2 }}
        className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-6"
      >
        <PartyPopper className="w-12 h-12 text-primary" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-3xl font-bold text-foreground text-center"
      >
        Session Complete!
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-muted-foreground mt-2 text-center"
      >
        {message}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex gap-6 mt-10"
      >
        <div className="flex flex-col items-center">
          <div className="text-2xl font-bold text-foreground">{formatMinutes(data.duration)}</div>
          <div className="text-xs text-muted-foreground mt-1">Duration</div>
        </div>
        <div className="w-px bg-border" />
        <div className="flex flex-col items-center">
          <div className="text-2xl font-bold text-foreground">{data.score}%</div>
          <div className="text-xs text-muted-foreground mt-1">Focus Score</div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="flex flex-col gap-3 w-full max-w-xs mt-10"
      >
        {isOnBreak ? (
          <>
            <motion.button
              onClick={(e) => { e.stopPropagation(); onSkipBreak?.() }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 bg-primary text-primary-foreground font-semibold text-base rounded-2xl shadow-lg"
            >
              Skip Break
            </motion.button>
            <motion.button
              onClick={(e) => { e.stopPropagation(); onReturnHome() }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3 text-muted-foreground font-medium text-sm rounded-2xl border border-border"
            >
              Return Home
            </motion.button>
          </>
        ) : (
          <>
            <motion.button
              onClick={(e) => { e.stopPropagation(); onStartAnother() }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 bg-primary text-primary-foreground font-semibold text-base rounded-2xl shadow-lg"
            >
              Start Another Session
            </motion.button>
            <motion.button
              onClick={(e) => { e.stopPropagation(); onReturnHome() }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3 text-muted-foreground font-medium text-sm rounded-2xl border border-border"
            >
              Return Home
            </motion.button>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
