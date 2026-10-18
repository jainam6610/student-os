import { addDays, addMinutes, isSameDay } from 'date-fns'

import type { PlannerSettings, StudyEvent } from '@/lib/store'

import { getEventsForDate, getTimelineBounds, minutesBetween } from './utils'

export interface SlotSuggestion {
  startTime: Date
  endTime: Date
  reason: string
}

export function eventsOverlap(
  left: Pick<StudyEvent, 'startTime' | 'endTime' | 'id'>,
  right: Pick<StudyEvent, 'startTime' | 'endTime' | 'id'>
): boolean {
  if (left.id === right.id) return false
  return new Date(left.startTime).getTime() < new Date(right.endTime).getTime() &&
    new Date(right.startTime).getTime() < new Date(left.endTime).getTime()
}

export function findOverlaps(events: StudyEvent[]): Array<[StudyEvent, StudyEvent]> {
  const overlaps: Array<[StudyEvent, StudyEvent]> = []
  const sorted = [...events].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )

  for (let index = 0; index < sorted.length; index += 1) {
    for (let inner = index + 1; inner < sorted.length; inner += 1) {
      if (eventsOverlap(sorted[index], sorted[inner])) {
        overlaps.push([sorted[index], sorted[inner]])
      }
    }
  }

  return overlaps
}

export function findNearestAvailableSlots(args: {
  events: StudyEvent[]
  targetDate: Date
  durationMinutes: number
  settings: PlannerSettings
  excludeEventId?: string
  limit?: number
}): SlotSuggestion[] {
  const { events, targetDate, durationMinutes, settings, excludeEventId, limit = 3 } = args
  const suggestions: SlotSuggestion[] = []
  const daysToCheck = [targetDate, addDays(targetDate, 1)]

  for (const day of daysToCheck) {
    const dayEvents = getEventsForDate(
      events.filter((event) => event.id !== excludeEventId),
      day
    )
    const { start, end } = getTimelineBounds(day, settings)
    let cursor = new Date(start)

    while (cursor < end) {
      const candidateEnd = addMinutes(cursor, durationMinutes)
      const overlaps = dayEvents.some((event) =>
        eventsOverlap(
          { id: '__candidate__', startTime: cursor, endTime: candidateEnd },
          event
        )
      )

      if (!overlaps && cursor.getTime() >= Date.now()) {
        suggestions.push({
          startTime: new Date(cursor),
          endTime: candidateEnd,
          reason: isSameDay(day, targetDate) ? 'Nearest free slot' : 'Next-day free slot',
        })
      }

      cursor = addMinutes(cursor, settings.slotMinutes)
      if (suggestions.length >= limit) return suggestions
    }
  }

  return suggestions
}

export function clampEventRange(
  startTime: Date,
  endTime: Date,
  settings: PlannerSettings,
  anchorDate = startTime
): { startTime: Date; endTime: Date } {
  const { start, end } = getTimelineBounds(anchorDate, settings)
  const durationMinutes = Math.max(15, minutesBetween(startTime, endTime))
  const safeStart = new Date(Math.max(startTime.getTime(), start.getTime()))
  let safeEnd = addMinutes(safeStart, durationMinutes)

  if (safeEnd.getTime() > end.getTime()) {
    safeEnd = new Date(end)
  }

  return { startTime: safeStart, endTime: safeEnd }
}

export function buildCarryForwardSuggestion(event: StudyEvent, settings: PlannerSettings, events: StudyEvent[]): SlotSuggestion | null {
  const durationMinutes = Math.max(15, minutesBetween(new Date(event.startTime), new Date(event.endTime)))
  const next = findNearestAvailableSlots({
    events,
    targetDate: addDays(new Date(event.startTime), 1),
    durationMinutes,
    settings,
    excludeEventId: event.id,
    limit: 1,
  })

  return next[0] ?? null
}
