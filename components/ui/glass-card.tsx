'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  className?: string
  children?: React.ReactNode
  hover?: boolean
  elevated?: boolean
  glass?: boolean
  interactive?: boolean
  selected?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps & React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, hover = false, elevated = false, glass = true, interactive = false, selected = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-selected={interactive ? selected : undefined}
        onKeyDown={interactive ? (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            ;(props as any).onClick?.(e)
          }
        } : undefined}
        className={cn(
          glass ? 'glass-card' : elevated ? 'card-elevated' : 'card-surface',
          hover && [
            'cursor-pointer',
            'transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
            'hover:-translate-y-0.5 hover:shadow-lg',
            'active:translate-y-0 active:scale-[0.99]',
          ],
          interactive && [
            'cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
            'hover:border-primary/30 active:scale-[0.98]',
          ],
          selected && [
            'border-primary/50 bg-primary/10 shadow-sm',
          ],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'
