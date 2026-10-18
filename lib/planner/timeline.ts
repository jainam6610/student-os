import { addMinutes, format, isSameDay } from 'date-fns'

import type { PlannerSettings, StudyEvent } from '@/lib/store'

import { getTimelineBounds, isPastSlot, sortEvents } from './utils'

export interface TimelineSlot {
  id: string
  time: Date
  label: string
  locked: boolean
  isCurrentHour: boolean
}

export interface TimelineEventLayout {
  event: StudyEvent
  top: number
  height: number
  column: number
  columns: number
}

const PIXELS_PER_HOUR = 96

export function buildTimelineSlots(date: Date, settings: PlannerSettings): TimelineSlot[] {
  const { start, end } = getTimelineBounds(date, settings)
  const slots: TimelineSlot[] = []
  const step = settings.slotMinutes

  for (let cursor = start; cursor <= end; cursor = addMinutes(cursor, step)) {
    slots.push({
      id: cursor.toISOString(),
      time: cursor,
      label: format(cursor, 'h:mm a'),
      locked: isPastSlot(cursor),
      isCurrentHour: cursor.getHours() === new Date().getHours() && isSameDay(cursor, new Date()),
    })
  }

  return slots
}

export function getTimelineHeight(date: Date, settings: PlannerSettings): number {
  const slots = buildTimelineSlots(date, settings)
  return Math.max(slots.length * (PIXELS_PER_HOUR / (60 / settings.slotMinutes)), PIXELS_PER_HOUR * 8)
}

export function layoutTimelineEvents(events: StudyEvent[], date: Date, settings: PlannerSettings): TimelineEventLayout[] {
  const dayEvents = sortEvents(events).filter((event) => isSameDay(new Date(event.startTime), date))
  const { start } = getTimelineBounds(date, settings)
  const pxPerMinute = PIXELS_PER_HOUR / 60

  const layouts: TimelineEventLayout[] = []
  const activeColumns: { end: number; column: number }[] = []

  for (const event of dayEvents) {
    const eventStart = new Date(event.startTime).getTime()
    const eventEnd = new Date(event.endTime).getTime()
    const top = Math.max(0, ((eventStart - start.getTime()) / 60000) * pxPerMinute)
    const height = Math.max(44, ((eventEnd - eventStart) / 60000) * pxPerMinute)

    for (let i = activeColumns.length - 1; i >= 0; i -= 1) {
      if (activeColumns[i].end <= eventStart) {
        activeColumns.splice(i, 1)
      }
    }

    let column = 0
    while (activeColumns.some((entry) => entry.column === column)) {
      column += 1
    }

    activeColumns.push({ end: eventEnd, column })
    const columns = Math.max(activeColumns.length, column + 1)

    layouts.push({
      event,
      top,
      height,
      column,
      columns,
    })
  }

  return layouts.map((layout) => ({
    ...layout,
    columns: Math.max(
      layout.columns,
      layouts.filter((other) => {
        const leftStart = new Date(layout.event.startTime).getTime()
        const leftEnd = new Date(layout.event.endTime).getTime()
        const rightStart = new Date(other.event.startTime).getTime()
        const rightEnd = new Date(other.event.endTime).getTime()
        return leftStart < rightEnd && rightStart < leftEnd
      }).length
    ),
  }))
}
