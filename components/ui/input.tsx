import { forwardRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  floating?: boolean
  icon?: React.ReactNode
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, id, floating, icon, error, value, onChange, ...props }, ref) => {
    const [focused, setFocused] = useState(false)
    const hasValue = value !== undefined && value !== '' && (typeof value === 'string' ? value.length > 0 : true)

    if (floating) {
      return (
        <div className={cn(
          'relative flex items-center gap-3 rounded-2xl border-2 bg-surface-container-low transition-all duration-200',
          error ? 'border-destructive' : focused ? 'border-primary' : 'border-border/60',
          icon && 'pl-4',
          className
        )}>
          {icon && (
            <span className={cn(
              'shrink-0 transition-colors duration-200',
              error ? 'text-destructive' : focused ? 'text-primary' : 'text-muted-foreground'
            )}>
              {icon}
            </span>
          )}
          <div className="relative flex-1">
            <input
              ref={ref}
              id={id}
              value={value}
              onChange={onChange}
              onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
              onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
              className={cn(
                'peer w-full bg-transparent pt-5 pb-2 text-base font-medium outline-none text-foreground',
                'placeholder-transparent disabled:cursor-not-allowed disabled:opacity-50',
              )}
              placeholder={label || props.placeholder}
              {...props}
            />
            {label && (
              <label
                htmlFor={id}
                className={cn(
                  'absolute left-0 top-1/2 -translate-y-1/2 text-sm transition-all duration-200 pointer-events-none origin-left',
                  'peer-focus:text-xs peer-focus:top-2.5 peer-focus:-translate-y-0 peer-focus:text-primary',
                  hasValue && 'text-xs top-2.5 -translate-y-0',
                  !hasValue && !focused && 'text-muted-foreground',
                  focused || hasValue ? 'text-muted-foreground/70' : 'text-muted-foreground'
                )}
              >
                {label}
              </label>
            )}
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        </div>
      )
    }

    return (
      <div>
        {label && <label htmlFor={id} className="text-sm font-medium mb-1.5 block">{label}</label>}
        <input
          ref={ref}
          id={id}
          value={value}
          onChange={onChange}
          className={cn(
            'h-11 w-full rounded-2xl border-2 bg-surface-container-low px-4 text-base font-medium outline-none transition-all',
            error ? 'border-destructive focus:border-destructive focus:ring-destructive/30' : 'border-border/60 focus:border-primary focus:ring-2 focus:ring-ring/30',
            'placeholder:text-muted-foreground/40',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <div>
        {label && <label htmlFor={id} className="text-sm font-medium mb-1.5 block">{label}</label>}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'min-h-24 w-full resize-none rounded-2xl border-2 border-border/60 bg-surface-container-low px-4 py-2.5 text-base font-medium outline-none transition-all placeholder:text-muted-foreground/40',
            'focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        />
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, id, options, ...props }, ref) => {
    return (
      <div>
        {label && <label htmlFor={id} className="text-sm font-medium mb-1.5 block">{label}</label>}
        <select
          ref={ref}
          id={id}
          className={cn(
            'h-11 w-full rounded-2xl border-2 border-border/60 bg-surface-container-low px-4 text-base font-medium outline-none transition-all',
            'focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    )
  }
)
Select.displayName = 'Select'
