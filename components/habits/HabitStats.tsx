'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { staggerItem } from '@/components/motion'
import { Zap, CheckCheck, Target, Flame } from 'lucide-react'

interface HabitStatsProps {
  currentStreak: number
  longestStreak: number
  completionRate: number
  totalHabits: number
  completedToday: number
  remainingToday: number
}

export const HabitStats = memo(function HabitStats({
  currentStreak,
  longestStreak,
  completionRate,
  totalHabits,
  completedToday,
  remainingToday,
}: HabitStatsProps) {
  const stats = [
    {
      icon: <Zap className={cn('mb-2 text-lg', 'text-primary')} />,
      label: 'Current Streak',
      value: `${currentStreak}`,
      suffix: 'days',
      bgColor: 'border-primary/20',
    },
    {
      icon: <CheckCheck className={cn('mb-2 text-lg', 'text-tertiary')} />,
      label: 'Completion Rate',
      value: `${completionRate}%`,
      suffix: 'overall',
      bgColor: 'border-tertiary/20',
    },
    {
      icon: <Target className={cn('mb-2 text-lg', 'text-primary')} />,
      label: 'Today',
      value: `${completedToday}/${totalHabits}`,
      suffix: remainingToday > 0 ? `${remainingToday} left` : 'Done!',
      bgColor: 'border-primary/20',
    },
    {
      icon: <Flame className={cn('mb-2 text-lg', 'text-tertiary')} />,
      label: 'Best Streak',
      value: `${longestStreak}`,
      suffix: 'days',
      bgColor: 'border-tertiary/20',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          variants={staggerItem}
          initial="initial"
          animate="animate"
          className={cn(
            'glass-elevated rounded-xl p-4 border',
            stat.bgColor
          )}
        >
          {stat.icon}
          <p className="text-xl font-bold text-on-surface">{stat.value}</p>
          <p className="text-xs text-on-surface-variant font-medium uppercase tracking-tight mt-0.5">
            {stat.label}
          </p>
          <p className="text-[10px] text-on-surface-variant/60 mt-0.5">{stat.suffix}</p>
        </motion.div>
      ))}
    </div>
  )
})
