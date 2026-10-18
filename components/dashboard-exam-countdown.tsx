'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { getPrimaryExam, getCountdown, URGENCY_COLORS } from '@/lib/exam-countdown'
import { ArrowRight, Pin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { memo } from 'react'

export const DashboardExamCountdown = memo(function DashboardExamCountdown() {
  const exams = useStore((s) => s.exams)
  const setActiveView = useStore((s) => s.setActiveView)
  const pinExam = useStore((s) => s.pinExam)
  const [tick, setTick] = useState(0)

  const exam = getPrimaryExam(exams)
  const countdown = exam ? getCountdown(exam.date) : null

  useEffect(() => {
    if (!countdown || countdown.isPast) return
    const interval = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(interval)
  }, [countdown, tick])

  if (!exam || !countdown || countdown.isPast) return null

  const urgency = URGENCY_COLORS[countdown.urgency]

  const getMicroCopy = () => {
    if (countdown.isToday) return "Today's the day. Trust your prep."
    if (countdown.totalDays <= 7) return "Final sprint. You've got this."
    if (countdown.totalDays <= 30) return "Revision window open."
    return "Plenty of runway — stay consistent."
  }

  // Format with leading zeros for flip-clock style
  const dd = String(countdown.days).padStart(2, '0')
  const hh = String(countdown.hours).padStart(2, '0')
  const mm = String(countdown.minutes).padStart(2, '0')

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("glass-card p-4 sm:p-5 border-l-4", urgency.border)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0 pr-4">
          <button
            onClick={() => setActiveView('exams')}
            className="text-base sm:text-lg font-semibold text-foreground hover:text-primary transition-colors truncate w-full text-left"
          >
            {exam.title}
          </button>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{exam.subject}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => pinExam(exam.id)}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            aria-label={exam.isPinned ? 'Unpin exam' : 'Pin exam'}
          >
            <Pin className={cn('w-4 h-4', exam.isPinned ? 'text-primary fill-primary/20' : 'text-muted-foreground')} />
          </button>
          <button
            onClick={() => setActiveView('exams')}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
            aria-label="View all exams"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-6">
        {/* Flip-clock Style Counter */}
        <div className={cn("text-2xl font-bold tabular-nums tracking-widest flex items-center gap-1", urgency.text)}>
          <span>{dd}</span><span className="opacity-50 text-base font-normal -mt-0.5">:</span>
          <span>{hh}</span><span className="opacity-50 text-base font-normal -mt-0.5">:</span>
          <span>{mm}</span>
        </div>
      </div>

      {/* Micro-copy context */}
      <p className="text-xs font-medium text-muted-foreground/80 mt-2">
        {getMicroCopy()}
      </p>
    </motion.div>
  )
})