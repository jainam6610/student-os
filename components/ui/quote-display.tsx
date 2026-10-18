'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useDailyQuote } from '@/hooks/use-daily-quote'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

interface QuoteDisplayProps {
  variant?: 'default' | 'subtle'
  className?: string
}

export function QuoteDisplay({ variant = 'default', className }: QuoteDisplayProps) {
  const quote = useDailyQuote()
  const prefersReduced = useReducedMotion()

  const anim = prefersReduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } }

  return (
    <div className={cn('relative', className)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={quote.text}
          initial={anim.initial}
          animate={anim.animate}
          exit={anim.exit}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {variant === 'subtle' ? (
            <p className="text-xs text-muted-foreground/50 italic leading-relaxed">
              &ldquo;{quote.text}&rdquo;
            </p>
          ) : (
            <div>
              <p className="text-sm italic leading-relaxed text-muted-foreground/70">
                &ldquo;{quote.text}&rdquo;
              </p>
              {quote.author && (
                <p className="text-[10px] text-muted-foreground/30 uppercase tracking-[0.15em] mt-1.5">
                  {quote.author}
                </p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}