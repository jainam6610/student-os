'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'glass'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium',
          'transition-[transform,opacity,background-color,border-color,box-shadow] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:opacity-50 disabled:cursor-not-allowed',
  variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] shadow-lg shadow-primary/15',
  variant === 'secondary' && 'bg-secondary hover:bg-secondary/80 active:scale-[0.97] text-foreground border border-border/60',
  variant === 'ghost' && 'hover:bg-secondary active:bg-secondary/70 text-muted-foreground hover:text-foreground',
  variant === 'destructive' && 'bg-destructive text-destructive-foreground hover:opacity-90 active:scale-[0.97] shadow-sm shadow-destructive/20',
  variant === 'glass' && 'bg-glass-bg backdrop-blur-xl border border-glass-border text-foreground hover:bg-surface-variant/50 active:scale-[0.97] hover:border-primary/30 shadow-sm',
  size === 'sm' && 'h-10 px-3 text-xs rounded-xl',
  size === 'md' && 'h-11 px-4 text-sm rounded-xl',
  size === 'lg' && 'h-12 px-5 text-sm rounded-xl',
  size === 'xl' && 'h-14 px-6 text-base rounded-2xl',
          className
        )}
        {...props}
      >
        {loading && <Spinner />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
