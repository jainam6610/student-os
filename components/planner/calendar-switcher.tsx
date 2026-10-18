'use client'

import { motion } from 'framer-motion'

import { staggerItem } from '@/components/motion'
import { cn } from '@/lib/utils'

export type PlannerViewMode = 'day' | 'week' | 'month' | 'agenda' | 'syllabus'

interface CalendarSwitcherProps {
  value: PlannerViewMode
  onChange: (value: PlannerViewMode) => void
}

const OPTIONS: PlannerViewMode[] = ['day', 'week', 'month', 'agenda', 'syllabus']

export function CalendarSwitcher({ value, onChange }: CalendarSwitcherProps) {
  return (
    <motion.div variants={staggerItem} className="inline-flex rounded-2xl bg-secondary p-1">
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            'rounded-xl px-3 py-2 text-xs font-medium capitalize transition-colors touch-target-sm',
            value === option
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          aria-pressed={value === option}
        >
          {option}
        </button>
      ))}
    </motion.div>
  )
}
