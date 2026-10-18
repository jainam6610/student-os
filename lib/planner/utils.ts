import { addDays, endOfDay, format, isSameDay, set, startOfDay } from 'date-fns'

import type { PlannerSettings, StudyEvent } from '@/lib/store'

export const DEFAULT_WAKE_TIME = '06:00'
export const DEFAULT_BED_TIME = '22:30'
export const DEFAULT_SLOT_MINUTES = 30

export function parseClockTime(value: string): { hours: number; minutes: number } {
  const [rawHours = '0', rawMinutes = '0'] = value.split(':')
  const hours = Number.parseInt(rawHours, 10)
  const minutes = Number.parseInt(rawMinutes, 10)

  return {
    hours: Number.isFinite(hours) ? Math.min(Math.max(hours, 0), 23) : 0,
    minutes: Number.isFinite(minutes) ? Math.min(Math.max(minutes, 0), 59) : 0,
  }
}

export function setTimeOnDate(date: Date, clock: string): Date {
  const { hours, minutes } = parseClockTime(clock)
  return set(date, { hours, minutes, seconds: 0, milliseconds: 0 })
}

export function getSleepDurationMinutes(bedTime: string, wakeTime: string): number {
  const baseDay = startOfDay(new Date())
  const bed = setTimeOnDate(baseDay, bedTime)
  let wake = setTimeOnDate(baseDay, wakeTime)

  if (wake.getTime() <= bed.getTime()) {
    wake = addDays(wake, 1)
  }

  return Math.max(0, Math.round((wake.getTime() - bed.getTime()) / 60000))
}

export function normalizePlannerSettings(
  settings?: Partial<PlannerSettings> | null
): PlannerSettings {
  const wakeTime = settings?.wakeTime ?? DEFAULT_WAKE_TIME
  const bedTime = settings?.bedTime ?? DEFAULT_BED_TIME
  const sleepDurationMinutes =
    typeof settings?.sleepDurationMinutes === 'number' && settings.sleepDurationMinutes > 0
      ? settings.sleepDurationMinutes
      : getSleepDurationMinutes(bedTime, wakeTime)

  return {
    wakeTime,
    bedTime,
    sleepDurationMinutes,
    slotMinutes:
      typeof settings?.slotMinutes === 'number' && settings.slotMinutes >= 15 && settings.slotMinutes <= 60
        ? settings.slotMinutes
        : DEFAULT_SLOT_MINUTES,
    defaultView:
      settings?.defaultView === 'day' ||
      settings?.defaultView === 'week' ||
      settings?.defaultView === 'month' ||
      settings?.defaultView === 'agenda' ||
      settings?.defaultView === 'syllabus'
        ? settings.defaultView
        : 'day',
    carryForwardMode: 'suggest',
    defaultReminderMinutes:
      typeof settings?.defaultReminderMinutes === 'number' && settings.defaultReminderMinutes >= 0
        ? settings.defaultReminderMinutes
        : 10,
    showWeeklyStrip: settings?.showWeeklyStrip ?? true,
    timelineDensity:
      settings?.timelineDensity === 'compact' || settings?.timelineDensity === 'comfortable'
        ? settings.timelineDensity
        : 'comfortable',
  }
}

export function minutesBetween(start: Date, end: Date): number {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000))
}

export function isPastSlot(date: Date): boolean {
  return date.getTime() < Date.now()
}

export function getEventDurationMinutes(event: Pick<StudyEvent, 'startTime' | 'endTime' | 'estimatedDuration'>): number {
  if (typeof event.estimatedDuration === 'number' && event.estimatedDuration > 0) {
    return event.estimatedDuration
  }
  return minutesBetween(new Date(event.startTime), new Date(event.endTime))
}

export function getDayLabel(date: Date): string {
  return format(date, 'EEE')
}

export function getDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function getTimelineBounds(date: Date, settings: PlannerSettings): { start: Date; end: Date } {
  const start = setTimeOnDate(startOfDay(date), settings.wakeTime)
  let end = setTimeOnDate(startOfDay(date), settings.bedTime)

  if (end.getTime() <= start.getTime()) {
    end = setTimeOnDate(addDays(date, 1), settings.bedTime)
  }

  return { start, end }
}

export function sortEvents(events: StudyEvent[]): StudyEvent[] {
  return [...events].sort(
    (left, right) =>
      new Date(left.startTime).getTime() - new Date(right.startTime).getTime() ||
      new Date(left.endTime).getTime() - new Date(right.endTime).getTime()
  )
}

export function getEventsForDate(events: StudyEvent[], date: Date): StudyEvent[] {
  return sortEvents(events.filter((event) => isSameDay(new Date(event.startTime), date)))
}
