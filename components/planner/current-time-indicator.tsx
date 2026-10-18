'use client'

interface CurrentTimeIndicatorProps {
  top: number
  label: string
}

export function CurrentTimeIndicator({ top, label }: CurrentTimeIndicatorProps) {
  return (
    <div
      className="absolute left-0 right-0 z-20 flex items-center gap-2 pointer-events-none"
      style={{ top }}
      aria-hidden="true"
    >
      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-sm">
        {label}
      </span>
      <div className="h-px flex-1 bg-primary/40" />
    </div>
  )
}
