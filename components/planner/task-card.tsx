'use client'

import { memo } from 'react'
import { format } from 'date-fns'
import { CheckCircle2, Circle, Clock3, GripVertical, Lock, Play, Sparkles } from 'lucide-react'

import type { StudyEvent } from '@/lib/store'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  event: StudyEvent
  locked?: boolean
  active?: boolean
  compact?: boolean
  onOpen: () => void
  onStartFocus?: () => void
  onMoveEarlier?: () => void
  onMoveLater?: () => void
  onResizeShorter?: () => void
  onResizeLonger?: () => void
  onToggleComplete?: () => void
  draggable?: boolean
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void
}

const TYPE_LABELS: Record<string, { label: string; class: string }> = {
  study: { label: 'Study', class: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  exam: { label: 'Exam', class: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  revision: { label: 'Revision', class: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  break: { label: 'Break', class: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  assignment: { label: 'Assignment', class: 'bg-teal-500/10 text-teal-600 dark:text-teal-400' },
  personal: { label: 'Personal', class: 'bg-gray-500/10 text-gray-600 dark:text-gray-400' },
}

const PRIORITY_BORDER: Record<string, string> = {
  high: 'border-l-destructive',
  medium: 'border-l-chart-5',
  low: 'border-l-transparent',
}

export const TaskCard = memo(function TaskCard({
  event,
  locked = false,
  active = false,
  compact = false,
  onOpen,
  onStartFocus,
  onMoveEarlier,
  onMoveLater,
  onResizeShorter,
  onResizeLonger,
  onToggleComplete,
  draggable,
  onDragStart,
}: TaskCardProps) {

  if (compact) {
    const typeInfo = TYPE_LABELS[event.type] ?? TYPE_LABELS.study
    const priorityBorder = event.priority ? (PRIORITY_BORDER[event.priority] ?? 'border-l-transparent') : 'border-l-transparent'

    return (
      <div
        draggable={draggable}
        onDragStart={onDragStart}
        onClick={onOpen}
        className={cn(
          'group relative rounded-xl border-l-[3px] bg-card px-3 py-1.5 text-sm shadow-xs transition-all cursor-pointer h-full min-h-[44px]',
          locked ? 'opacity-30' : 'hover:shadow-sm',
          active ? 'bg-primary/5 border-l-primary' : priorityBorder,
          event.completed ? 'opacity-50' : ''
        )}
        role="button"
        tabIndex={0}
        aria-label={`${event.title}, ${format(new Date(event.startTime), 'h:mm a')}`}
      >
        <div className="flex items-start gap-2 h-full">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleComplete?.() }}
            className="mt-0.5 h-5 w-5 shrink-0 flex items-center justify-center rounded-full"
            aria-label={event.completed ? `Mark ${event.title} incomplete` : `Mark ${event.title} complete`}
            aria-pressed={event.completed}
          >
            {event.completed ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <Circle className={cn('h-4 w-4 border-2', active ? 'border-primary' : 'border-border')} />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>{format(new Date(event.startTime), 'h:mm a')}</span>
              {locked && <Lock className="h-3 w-3" />}
            </div>
            <h4 className={cn('truncate text-sm font-medium', active ? 'text-primary' : 'text-foreground')}>
              {event.title}
            </h4>
          </div>

          {onStartFocus && !locked && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onStartFocus() }}
              className="shrink-0 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Play className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() }
      }}
      className="block w-full text-left"
    >
      <div
        className={cn(
          'rounded-xl border border-border bg-card p-3.5 transition-all cursor-pointer hover:border-primary/20',
          locked ? 'opacity-55' : '',
          event.completed ? 'opacity-40' : ''
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              {format(new Date(event.startTime), 'EEE h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}
            </div>
            <div className="mt-0.5 text-sm font-medium text-foreground">{event.title}</div>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onStartFocus?.() }}
            className="shrink-0 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
          >
            Focus
          </button>
        </div>
      </div>
    </div>
  )
})
