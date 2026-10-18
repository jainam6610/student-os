'use client'

import { motion } from 'framer-motion'
import { formatTime } from '../utils/format'

const RING_RADIUS = 148
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

interface Props {
  secondsRemaining: number
  plannedDuration: number
  isRunning: boolean
  isPaused: boolean
  progressPercent: number
}

export function FocusTimerDisplay({ secondsRemaining, plannedDuration, isRunning, isPaused, progressPercent }: Props) {
  const offset = RING_CIRCUMFERENCE - (progressPercent / 100) * RING_CIRCUMFERENCE
  const display = formatTime(secondsRemaining)

  const statusLabel = isRunning ? 'Focusing' : isPaused ? 'Paused' : 'Deep Work'

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-xs aspect-square">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 320 320" aria-hidden="true">
        <circle
          cx="160" cy="160" r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-border/30"
        />
        <motion.circle
          cx="160" cy="160" r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="text-primary"
          animate={isRunning ? { opacity: [0.85, 1, 0.85] } : { opacity: isPaused ? 0.6 : 0.4 }}
          transition={isRunning ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
        />
      </svg>

      <div className="relative z-10 flex flex-col items-center pointer-events-none select-none">
        <motion.span
          key={display}
          initial={{ scale: 1.02, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="text-[64px] md:text-[88px] text-foreground tracking-tighter leading-none tabular-nums"
          role="timer"
          aria-live="polite"
          aria-atomic="true"
          aria-valuenow={secondsRemaining}
          aria-valuemin={0}
          aria-valuemax={plannedDuration}
        >
          {display}
        </motion.span>
        <motion.span
          animate={isRunning ? { opacity: [0.4, 0.7, 0.4] } : { opacity: 0.5 }}
          transition={isRunning ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
          className="text-[10px] text-primary uppercase tracking-[0.3em] font-semibold mt-1"
        >
          {statusLabel}
        </motion.span>
      </div>
    </div>
  )
}
