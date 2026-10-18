'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export function Loader({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16', className)} role="status" aria-label="Loading">
      <motion.div
        initial={{ scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center"
      >
        <div className="relative mb-3">
          <motion.div
            className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="w-5 h-5 text-primary" />
          </motion.div>
          <motion.div
            className="absolute -inset-1 rounded-full border border-primary/20"
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary/40"
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
