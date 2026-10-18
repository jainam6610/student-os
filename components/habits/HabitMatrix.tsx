'use client'

import { useMemo, memo } from 'react'
import { motion } from 'framer-motion'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, addMonths } from 'date-fns'
import { type Habit, habitIconEmoji } from '@/lib/habits/types'
import { isHabitDueOnDate } from '@/lib/habits/utils'
import { cn } from '@/lib/utils'
import { staggerItem } from '@/components/motion'
import { ChevronLeft, ChevronRight, Brain } from 'lucide-react'

interface HabitMatrixProps {
  habits: Habit[]
  currentMonth: Date
  onPrevMonth: () => void
  onNextMonth: () => void
  onToggleDay: (habitId: string, date: string) => void
}

export const HabitMatrix = memo(function HabitMatrix({
  habits,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onToggleDay,
}: HabitMatrixProps) {
  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits])

  const monthLabel = format(currentMonth, 'MMMM yyyy')

  const completedDays = useMemo(() => {
    const dates = new Set<string>()
    for (const h of activeHabits) {
      for (const d of h.completedDates) {
        const monthPrefix = format(currentMonth, 'yyyy-MM')
        if (d.startsWith(monthPrefix)) dates.add(d)
      }
    }
    return dates.size
  }, [activeHabits, currentMonth])

  const totalDaysSoFar = daysInMonth.filter((d) => d <= new Date()).length

  return (
    <motion.div variants={staggerItem} initial="initial" animate="animate" className="glass-elevated rounded-xl p-5 overflow-hidden">
      {/* Month Selector */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPrevMonth}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full glass-card hover:bg-primary/10 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4 text-primary" />
        </button>
        <div className="text-center">
          <h3 className="text-base font-semibold text-on-surface">{monthLabel}</h3>
          <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
            {completedDays} Days Complete
          </p>
        </div>
        <button
          onClick={onNextMonth}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full glass-card hover:bg-primary/10 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4 text-primary" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex justify-end items-center gap-3 mb-4 text-[10px] uppercase tracking-widest text-on-surface-variant">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-sm bg-surface-variant" /> Missed
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-sm bg-primary/40" /> Partial
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-sm bg-primary" /> Done
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <div className="min-w-[640px] space-y-3">
          {/* Header days */}
          <div className="flex items-center">
            <div className="w-28 flex-shrink-0" />
            <div className="flex flex-1 justify-between">
              {daysInMonth.map((d, i) => (
                <div key={i} className="w-8 text-center text-[10px] font-medium text-on-surface-variant leading-[44px]">
                  {format(d, 'd')}
                </div>
              ))}
            </div>
          </div>

          {/* Habit rows */}
          {activeHabits.length === 0 ? (
            <div className="py-8 text-center">
              <Brain className="w-8 h-8 text-on-surface-variant/30" />
              <p className="text-xs text-on-surface-variant/60 mt-2">No active habits</p>
            </div>
          ) : (
            activeHabits.map((habit) => (
              <div key={habit.id} className="flex items-center group">
                <div className="w-28 flex-shrink-0 flex items-center gap-2 overflow-hidden">
                    <span className="text-sm shrink-0 leading-none">{habitIconEmoji(habit.icon)}</span>
                  <span className="text-xs font-medium text-on-surface truncate">{habit.name}</span>
                </div>
                <div className="flex flex-1 justify-between">
                  {daysInMonth.map((d, i) => {
                    const dateStr = format(d, 'yyyy-MM-dd')
                    const isCompleted = habit.completedDates.includes(dateStr)
                    const isFuture = d > new Date()
                    const isDue = isHabitDueOnDate(habit, dateStr)
                    const isToday = dateStr === format(new Date(), 'yyyy-MM-dd')

                    const getIntensity = () => {
                      if (isCompleted) return 'bg-primary ice-glow'
                      if (isFuture || !isDue) return 'bg-surface-variant/30'
                      return 'bg-surface-variant'
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => onToggleDay(habit.id, dateStr)}
                        disabled={isFuture}
                        className={cn(
                          'w-8 h-8 rounded-sm transition-all hover:scale-125',
                          getIntensity(),
                          isToday && 'ring-1 ring-primary/50'
                        )}
                        title={`${format(d, 'MMM d')}: ${isCompleted ? 'Completed' : isFuture ? 'Future' : 'Missed'}`}
                        aria-label={`${habit.name} on ${format(d, 'MMM d')}`}
                      />
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <p className="text-[10px] text-on-surface-variant tracking-[0.2em] uppercase opacity-50">
          Scroll horizontally to view full month
        </p>
      </div>
    </motion.div>
  )
})
