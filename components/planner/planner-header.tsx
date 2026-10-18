'use client'

import { motion } from 'framer-motion'

import { staggerItem } from '@/components/motion'

interface PlannerHeaderProps {
  completionPercent: number
}

export function PlannerHeader({ completionPercent }: PlannerHeaderProps) {
  return (
    <motion.section variants={staggerItem} className="flex items-end justify-between gap-4">
      <div className="space-y-0.5">
        <p className="text-[10px] uppercase tracking-[0.3em] text-primary opacity-60 font-semibold">Planner</p>
        <h1 className="text-[28px] md:text-[32px] font-medium tracking-tighter text-foreground leading-none">
          My Day
        </h1>
      </div>
    </motion.section>
  )
}
