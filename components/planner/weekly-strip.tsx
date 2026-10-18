'use client'

import { format, isSameDay, isToday } from 'date-fns'
import { motion } from 'framer-motion'

import { staggerItem } from '@/components/motion'
import { cn } from '@/lib/utils'

interface WeeklyStripProps {
  days: Date[]
  currentDate: Date
  onSelect: (date: Date) => void
}

export function WeeklyStrip({ days, currentDate, onSelect }: WeeklyStripProps) {
  return (
    <motion.nav variants={staggerItem} className="flex gap-2 overflow-x-auto no-scrollbar py-1">
      {days.map((day) => {
        const active = isSameDay(day, currentDate)
        return (
          <motion.button
            key={day.toISOString()}
            type="button"
            onClick={() => onSelect(day)}
            whileHover={{ scale: active ? 1 : 1.02 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'flex flex-col items-center justify-center rounded-2xl text-center transition-all duration-300',
              active
                ? 'min-w-[56px] h-24 bg-primary/10 border border-primary/30 text-primary shadow-[0_0_30px_rgba(205,189,255,0.15)]'
                : 'min-w-[48px] h-20 bg-surface-container-high/30 border border-transparent text-muted-foreground hover:bg-surface-container-high/50'
            )}
          >
            <span className={cn(
              'text-[10px] uppercase tracking-widest font-semibold',
              active ? 'text-primary/70' : 'text-muted-foreground/60'
            )}>
              {format(day, 'EEE')}
            </span>
            <span className={cn(
              'font-bold leading-none mt-1',
              active ? 'text-2xl text-foreground' : 'text-xl',
              isToday(day) && !active && 'text-primary/80'
            )}>
              {format(day, 'd')}
            </span>
          </motion.button>
        )
      })}
    </motion.nav>
  )
}
