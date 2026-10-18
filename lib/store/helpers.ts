import { format } from 'date-fns'
import { generateId } from '../utils'
import {
  ISO_DATE_REGEX, MAX_XP, MAX_FOCUS_MINUTES, MAX_TASKS,
  MAX_SESSIONS, MAX_EVENTS,
} from './constants'
import type {
  PlannerReminder, PlannerTaskHistoryEntry,
  PlannerSettings, StudyEvent, FocusSession, UserProgress,
} from './types'
import { normalizePlannerSettings } from '../planner/utils'
import { calculateLongestStreak } from '../habits/utils'

export function reviveDates(key: string, value: unknown): unknown {
  if (typeof value === 'string' && ISO_DATE_REGEX.test(value)) {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => reviveDates(String(index), item))
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>
    const result: Record<string, unknown> = {}
    for (const k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        result[k] = reviveDates(k, obj[k])
      }
    }
    return result
  }
  return value
}

export const safeReviver = (key: string, value: unknown): unknown => {
  if (typeof value === 'string' && ISO_DATE_REGEX.test(value)) {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  return value
}

export function sanitizeNumber(val: unknown, fallback: number, min = -Infinity, max = Infinity): number {
  if (typeof val === 'number' && !Number.isNaN(val) && Number.isFinite(val)) {
    return Math.min(Math.max(val, min), max)
  }
  if (typeof val === 'string') {
    const parsed = parseFloat(val)
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      return Math.min(Math.max(parsed, min), max)
    }
  }
  return fallback
}

export function sanitizeString(val: unknown, fallback: string, maxLength = 1000): string {
  if (typeof val === 'string') return val.trim().slice(0, maxLength)
  return fallback
}

export function sanitizeBoolean(val: unknown, fallback: boolean): boolean {
  return typeof val === 'boolean' ? val : fallback
}

export function sanitizeDate(val: unknown): Date | undefined {
  if (val instanceof Date && !Number.isNaN(val.getTime())) return val
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val)
    if (!Number.isNaN(d.getTime())) return d
  }
  return undefined
}

export const calculateLevel = (xp: number) => {
  const safe = sanitizeNumber(xp, 0, 0, MAX_XP)
  return Math.floor(safe / 1000) + 1
}

export const calculateBestStreak = (completedDates: string[]): number => {
  return calculateLongestStreak(completedDates)
}

export function formatMinutes(minutes: number): string {
  const m = Math.round(minutes)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const remainder = m % 60
  return remainder > 0 ? `${h}h ${remainder}m` : `${h}h`
}

export function sanitizePlannerReminder(value: unknown, defaultMinutes: number): PlannerReminder | undefined {
  if (!value || typeof value !== 'object') return undefined
  const reminder = value as Record<string, unknown>
  return {
    enabled: sanitizeBoolean(reminder.enabled, false),
    minutesBefore: sanitizeNumber(reminder.minutesBefore, defaultMinutes, 0, 1440),
    scheduledFor: sanitizeDate(reminder.scheduledFor),
    snoozedUntil: sanitizeDate(reminder.snoozedUntil),
    lastTriggeredAt: sanitizeDate(reminder.lastTriggeredAt),
  }
}

export function sanitizePlannerHistory(value: unknown): PlannerTaskHistoryEntry[] {
  if (!Array.isArray(value)) return []
  const result: PlannerTaskHistoryEntry[] = []
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue
    const record = entry as Record<string, unknown>
    result.push({
      id: sanitizeString(record.id, generateId(), 80),
      at: sanitizeDate(record.at) ?? new Date(),
      action: sanitizeString(record.action, 'updated', 30) as PlannerTaskHistoryEntry['action'],
      note: record.note ? sanitizeString(record.note, '', 500) : undefined,
    })
  }
  return result
}

export function normalizeStudyEvent(event: Omit<StudyEvent, 'id'> | StudyEvent, plannerSettings?: PlannerSettings): StudyEvent {
  const settings = plannerSettings ?? normalizePlannerSettings()
  const startTime = sanitizeDate(event.startTime) ?? new Date()
  const fallbackEnd = new Date(startTime.getTime() + 60 * 60 * 1000)
  const endTimeCandidate = sanitizeDate(event.endTime) ?? fallbackEnd
  const endTime = endTimeCandidate.getTime() > startTime.getTime() ? endTimeCandidate : fallbackEnd
  const estimatedDuration = sanitizeNumber(
    event.estimatedDuration ?? Math.round((endTime.getTime() - startTime.getTime()) / 60000),
    60, 15, 1440
  )

  return {
    ...event,
    id: 'id' in event ? sanitizeString(event.id, generateId(), 80) : generateId(),
    title: sanitizeString(event.title, 'Event', 200),
    description: event.description ? sanitizeString(event.description, '', 2000) : undefined,
    subject: event.subject ? sanitizeString(event.subject, '', 120) : undefined,
    startTime,
    endTime,
    type: (['study', 'exam', 'revision', 'break'].includes(event.type) ? event.type : 'study') as StudyEvent['type'],
    color: event.color ? sanitizeString(event.color, '', 60) : undefined,
    icon: event.icon ? sanitizeString(event.icon, '', 40) : undefined,
    priority: event.priority === 'low' || event.priority === 'medium' || event.priority === 'high' ? event.priority : 'medium',
    estimatedDuration,
    reminder: sanitizePlannerReminder(event.reminder, settings.defaultReminderMinutes) ?? {
      enabled: false,
      minutesBefore: settings.defaultReminderMinutes,
    },
    repeatRule:
      event.repeatRule === 'daily' ||
      event.repeatRule === 'weekdays' ||
      event.repeatRule === 'weekly'
        ? event.repeatRule
        : 'none',
    notes: event.notes ? sanitizeString(event.notes, '', 4000) : undefined,
    difficulty: sanitizeNumber(event.difficulty, 3, 1, 5),
    energyLevel: sanitizeNumber(event.energyLevel, 3, 1, 5),
    completed: sanitizeBoolean(event.completed, false),
    completedAt: sanitizeDate(event.completedAt),
    focusMinutes: sanitizeNumber(event.focusMinutes, 0, 0, MAX_FOCUS_MINUTES),
    focusSessionIds: Array.isArray(event.focusSessionIds)
      ? event.focusSessionIds.map((id) => sanitizeString(id, '', 80)).filter(Boolean)
      : [],
    history: sanitizePlannerHistory(event.history),
    carryForwardSuggestedFor: sanitizeDate(event.carryForwardSuggestedFor),
  }
}

export function migrateV1toV2(state: Record<string, unknown>): Record<string, unknown> {
  const s = { ...state }
  if (Array.isArray(s.tasks)) {
    s.tasks = (s.tasks as Record<string, unknown>[]).map((t) => {
      if (t.subtasks && Array.isArray(t.subtasks)) return t
      return { ...t, subtasks: [] }
    })
  }
  if (typeof s.weeklyGoal === 'number') {
    s.progress = {
      ...(s.progress as Record<string, unknown> || {}),
      weeklyGoal: s.weeklyGoal,
    }
    delete s.weeklyGoal
  }
  return reviveDates('', s) as Record<string, unknown>
}

export function checkStorageQuota(): boolean {
  try {
    const testKey = '__storage_test__'
    localStorage.setItem(testKey, '1')
    localStorage.removeItem(testKey)
    let totalSize = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const val = localStorage.getItem(key)
        if (val) totalSize += key.length + val.length
      }
    }
    const estimatedQuota = 5 * 1024 * 1024
    return totalSize < estimatedQuota * 0.85
  } catch {
    return false
  }
}
