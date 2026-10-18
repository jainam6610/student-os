import { cn } from '@/lib/utils'

interface BadgeProps {
  variant?: 'default' | 'high' | 'medium' | 'low' | 'success' | 'warning'
  className?: string
  children: React.ReactNode
}

export function Badge({ variant = 'default', className, children }: BadgeProps) {
  return (
    <span role="status" className={cn(
      'inline-flex items-center text-[11px] px-1.5 py-0.5 rounded-md font-medium',
      variant === 'high' && 'text-destructive bg-destructive/5',
      variant === 'medium' && 'text-chart-4 bg-chart-4/5',
      variant === 'low' && 'text-muted-foreground bg-secondary',
      variant === 'success' && 'text-success bg-success/5',
      variant === 'warning' && 'text-warning bg-warning/5',
      variant === 'default' && 'text-muted-foreground bg-secondary',
      className
    )}>
      {children}
    </span>
  )
}
