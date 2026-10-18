'use client'

import { format } from 'date-fns'
import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'

import { staggerItem } from '@/components/motion'
import { Card } from '@/components/ui/glass-card'
import { layoutTimelineEvents, type TimelineSlot } from '@/lib/planner/timeline'
import type { PlannerSettings, StudyEvent } from '@/lib/store'
import { cn } from '@/lib/utils'
import { CurrentTimeIndicator } from './current-time-indicator'
import { TaskCard } from './task-card'

interface TimelineProps {
  date: Date
  events: StudyEvent[]
  settings: PlannerSettings
  slots: TimelineSlot[]
  currentTimeTop: number | null
  onCreateAt: (date: Date) => void
  onOpenTask: (event: StudyEvent) => void
  onDropTask: (eventId: string, slotTime: Date) => void
  onMoveEarlier: (event: StudyEvent) => void
  onMoveLater: (event: StudyEvent) => void
  onResizeShorter: (event: StudyEvent) => void
  onResizeLonger: (event: StudyEvent) => void
  onStartFocus: (event: StudyEvent) => void
  onToggleComplete: (event: StudyEvent) => void
}

const PIXELS_PER_SLOT = 48
const TIME_COL_WIDTH = 80
const DOT_SIZE = 10
const LINE_LEFT = TIME_COL_WIDTH

const TYPE_DOT_COLORS: Record<string, string> = {
  study: 'bg-primary',
  exam: 'bg-error',
  revision: 'bg-secondary',
  break: 'bg-tertiary',
}

export function Timeline({
  date,
  events,
  settings,
  slots,
  currentTimeTop,
  onCreateAt,
  onOpenTask,
  onDropTask,
  onMoveEarlier,
  onMoveLater,
  onResizeShorter,
  onResizeLonger,
  onStartFocus,
  onToggleComplete,
}: TimelineProps) {
  const layouts = useMemo(() => layoutTimelineEvents(events, date, settings), [events, date, settings])

  return (
    <motion.div variants={staggerItem}>
      <Card className="rounded-[2rem] p-0 overflow-hidden border border-border/40">
        <div className="border-b border-border/40 px-5 py-4">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70 font-semibold mb-0.5">Today</div>
          <div className="text-lg font-bold text-foreground">{format(date, 'EEEE, MMMM d')}</div>
        </div>

        <div className="relative overflow-auto overscroll-contain no-scrollbar scroll-smooth" style={{ maxHeight: 'calc(100dvh - 280px)' }}>
          <div className="relative min-w-0" style={{ height: slots.length * PIXELS_PER_SLOT, marginLeft: 0 }}>
            {/* Vertical central line */}
            <div
              className="absolute left-0 top-0 bottom-0 w-0.5 z-10 pointer-events-none"
              style={{
                left: LINE_LEFT,
                background: 'linear-gradient(180deg, transparent 0%, rgba(69,70,82,0.5) 50%, transparent 100%)',
              }}
            />

            {/* Timeline dots for events */}
            {layouts.map((layout) => {
              const locked = new Date(layout.event.startTime).getTime() < Date.now()
              const active = !locked && new Date(layout.event.startTime).getTime() <= Date.now() && new Date(layout.event.endTime).getTime() >= Date.now()
              const dotColor = layout.event.completed ? 'bg-emerald-400' : (TYPE_DOT_COLORS[layout.event.type] ?? 'bg-primary')
              const dotTop = layout.top + 8

              return (
                <div
                  key={`dot-${layout.event.id}`}
                  className={cn(
                    'absolute z-10 pointer-events-none rounded-full',
                    active ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5',
                    dotColor
                  )}
                  style={{
                    left: LINE_LEFT - (active ? 7 : 5),
                    top: dotTop,
                    boxShadow: active ? '0 0 0 6px rgba(186,195,255,0.1)' : '0 0 0 4px var(--background)',
                  }}
                />
              )
            })}

            {/* Current time indicator */}
            {currentTimeTop !== null && <CurrentTimeIndicator top={currentTimeTop} label="Now" />}

            {/* Slot grid */}
            {slots.map((slot, index) => (
              <div
                key={slot.id}
                className="grid border-b border-border/40"
                style={{ gridTemplateColumns: `${TIME_COL_WIDTH}px 1fr`, height: PIXELS_PER_SLOT }}
                onDragOver={(event) => {
                  if (!slot.locked) event.preventDefault()
                }}
                onDrop={(event) => {
                  const eventId = event.dataTransfer.getData('text/planner-event-id')
                  if (eventId && !slot.locked) {
                    onDropTask(eventId, slot.time)
                  }
                }}
              >
                <button
                  type="button"
                  onClick={() => !slot.locked && onCreateAt(slot.time)}
                  className="border-r border-border/40 px-3 text-left text-[11px] text-muted-foreground/70 font-medium bg-transparent uppercase tracking-wider"
                  disabled={slot.locked}
                >
                  {slot.label}
                </button>
                <button
                  type="button"
                  disabled={slot.locked}
                  onClick={() => onCreateAt(slot.time)}
                  className={cn(
                    'transition-colors',
                    slot.locked ? 'bg-secondary/20' : index % 2 === 0 ? 'bg-transparent' : 'bg-secondary/10'
                  )}
                  aria-label={slot.locked ? `Past slot ${slot.label}` : `Create task at ${slot.label}`}
                />
              </div>
            ))}

            {/* Event cards overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{ left: TIME_COL_WIDTH, right: 0 }}>
              {layouts.map((layout) => {
                const width = `calc(${100 / Math.max(layout.columns, 1)}% - 6px)`
                const left = `calc(${(layout.column * 100) / Math.max(layout.columns, 1)}% + 3px)`
                const locked = new Date(layout.event.startTime).getTime() < Date.now()
                const active = !locked && new Date(layout.event.startTime).getTime() <= Date.now() && new Date(layout.event.endTime).getTime() >= Date.now()

                return (
                  <div
                    key={layout.event.id}
                    className="absolute pointer-events-auto overflow-hidden"
                    style={{ top: layout.top, left, width, height: layout.height }}
                  >
                    <TaskCard
                      event={layout.event}
                      locked={locked}
                      active={active}
                      compact
                      draggable={!locked}
                      onDragStart={(event) => {
                        event.dataTransfer.setData('text/planner-event-id', layout.event.id)
                      }}
                      onOpen={() => onOpenTask(layout.event)}
                      onStartFocus={() => onStartFocus(layout.event)}
                      onMoveEarlier={() => onMoveEarlier(layout.event)}
                      onMoveLater={() => onMoveLater(layout.event)}
                      onResizeShorter={() => onResizeShorter(layout.event)}
                      onResizeLonger={() => onResizeLonger(layout.event)}
                      onToggleComplete={() => onToggleComplete(layout.event)}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
