'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Timer, Flame, Target } from 'lucide-react'
import { formatMinutes } from '../utils/format'

interface Props {
  isIdle: boolean
  hasActiveSession: boolean
  todayFocusTime: number
  currentStreak: number
  dailyGoal: number
  progressToday: number
}

export function FocusStatsRow({ isIdle, hasActiveSession, todayFocusTime, currentStreak, dailyGoal, progressToday }: Props) {
  if (hasActiveSession) return null

  return (
    <AnimatePresence>
      {isIdle && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mt-8 flex items-center gap-5"
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high/30 backdrop-blur-sm border border-border/10">
            <Timer className="w-3 h-3 text-primary/60" />
            <span className="text-[11px] text-muted-foreground/60 font-medium">{formatMinutes(todayFocusTime)} today</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high/30 backdrop-blur-sm border border-border/10">
            <Flame className="w-3 h-3 text-primary/60" />
            <span className="text-[11px] text-muted-foreground/60 font-medium">{currentStreak} day streak</span>
          </div>
          {dailyGoal > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high/30 backdrop-blur-sm border border-border/10">
              <Target className="w-3 h-3 text-primary/60" />
              <span className="text-[11px] text-muted-foreground/60 font-medium">{Math.round(progressToday)}% goal</span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
