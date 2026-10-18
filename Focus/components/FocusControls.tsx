'use client'

import { motion } from 'framer-motion'
import { Pause, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  status: string
  isRunning: boolean
  isPaused: boolean
  isIdle: boolean
  isStrict?: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
}

export function FocusControls({ status, isRunning, isPaused, isIdle, isStrict = false, onStart, onPause, onResume, onStop }: Props) {
  const handleMainAction = () => {
    if (isRunning) onPause()
    else if (isPaused) {
      if (isStrict) onStop()
      else onResume()
    } else {
      onStart()
    }
  }

  const mainLabel = isRunning
    ? 'Active Focus'
    : isPaused
    ? isStrict
      ? 'End Session (Strict)'
      : 'Resume Session'
    : 'Start Session'
  const mainAria = isRunning
    ? 'Pause focus session'
    : isPaused
    ? isStrict
      ? 'End focus session'
      : 'Resume focus session'
    : 'Start focus session'

  const canStop = isRunning || isPaused

  return (
    <div className="mt-8 w-full flex flex-col items-center gap-10">
      <motion.button
        onClick={handleMainAction}
        aria-label={mainAria}
        className={cn(
          'px-14 py-4 rounded-full border border-primary/20 text-primary font-medium tracking-widest text-sm uppercase backdrop-blur-[30px] transition-all duration-500 hover:border-primary/40 active:scale-95',
          isRunning && 'bg-primary/5 border-primary/60 shadow-[0_0_40px_rgba(205,189,255,0.15)]',
          isPaused && isStrict && 'text-destructive border-destructive/40 hover:border-destructive/60'
        )}
        style={{ WebkitBackdropFilter: 'blur(30px)' }}
      >
        {mainLabel}
      </motion.button>

      <div className="flex items-center gap-16">
        <button
          onClick={onPause}
          disabled={!isRunning}
          aria-label="Pause focus session"
          className="group flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity disabled:opacity-10 min-h-[44px] min-w-[44px]"
        >
          <Pause className="w-5 h-5" aria-hidden="true" />
          <span className="text-[9px] uppercase tracking-widest font-medium">Pause</span>
        </button>
        <button
          onClick={onStop}
          disabled={!canStop}
          aria-label="Stop focus session"
          className="group flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity disabled:opacity-10 min-h-[44px] min-w-[44px]"
        >
          <Square className="w-5 h-5" aria-hidden="true" />
          <span className="text-[9px] uppercase tracking-widest font-medium">Stop</span>
        </button>
      </div>
    </div>
  )
}
