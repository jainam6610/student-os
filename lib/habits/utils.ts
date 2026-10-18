import { format, subDays, parse, differenceInDays, eachDayOfInterval, getDay } from 'date-fns'
import { type Habit, type RepeatType, type HabitHistoryEntry, type HabitDailySummary } from './types'
import { generateId } from '@/lib/utils'

export function resolveStreak(habit: Habit): number {
  return habit.currentStreak ?? habit.streak ?? 0
}

export function resolveBestStreak(habit: Habit): number {
  return habit.longestStreak ?? habit.bestStreak ?? 0
}

export function resolveRepeatType(habit: Habit): RepeatType {
  return habit.repeatType ?? (habit.frequency === 'weekly' ? 'weekly' : 'daily')
}

export function resolveArchived(habit: Habit): boolean {
  return habit.archived ?? false
}

export function resolveCompletedDates(habit: Habit): string[] {
  return Array.isArray(habit.completedDates) ? habit.completedDates : []
}

export function resolveSkippedDates(habit: Habit): string[] {
  return Array.isArray(habit.skippedDates) ? habit.skippedDates : []
}

export function resolveReminder(habit: Habit) {
  return habit.reminder ?? { enabled: false, times: [], repeat: false, sound: 'default', vibration: true, snoozed: false, weekdayOnly: false, weekendOnly: false }
}

export function getTodayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function isToday(dateStr: string): boolean {
  return dateStr === getTodayStr()
}

export function calculateStreak(completedDates: string[]): number {
  if (!Array.isArray(completedDates) || completedDates.length === 0) return 0
  const sorted = [...completedDates].sort().reverse()
  let streak = 0
  const today = getTodayStr()
  let expected = today
  for (const dateStr of sorted) {
    if (typeof dateStr !== 'string') continue
    if (dateStr === expected) {
      streak++
      const d = new Date(expected)
      d.setDate(d.getDate() - 1)
      expected = format(d, 'yyyy-MM-dd')
    } else if (dateStr < expected) {
      break
    }
  }
  return streak
}

export function calculateLongestStreak(completedDates: string[]): number {
  if (!Array.isArray(completedDates) || completedDates.length === 0) return 0
  const sorted = [...completedDates].sort()
  let best = 1
  let current = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1])
    const curr = new Date(sorted[i])
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    if (diffDays === 1) {
      current++
      best = Math.max(best, current)
    } else {
      current = 1
    }
  }
  return best
}

export function calculateCompletionRate(completedDates: string[], days: number = 30): number {
  if (days <= 0) return 0
  const interval = eachDayOfInterval({ start: subDays(new Date(), days - 1), end: new Date() })
  let completed = 0
  for (const d of interval) {
    if (completedDates.includes(format(d, 'yyyy-MM-dd'))) completed++
  }
  return Math.round((completed / Math.min(days, interval.length)) * 100)
}

export function shouldHabitBeDoneToday(habit: Habit): boolean {
  if (resolveArchived(habit)) return false
  const today = new Date()
  const todayStr = getTodayStr()
  const dayOfWeek = getDay(today)
  const repeatType = resolveRepeatType(habit)

  switch (repeatType) {
    case 'daily':
      return true
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5
    case 'weekends':
      return dayOfWeek === 0 || dayOfWeek === 6
    case 'weekly': {
      if (!habit.repeatDays || habit.repeatDays.length === 0) {
        return dayOfWeek === 1
      }
      return habit.repeatDays.includes(dayOfWeek)
    }
    case 'monthly': {
      if (habit.repeatDays && habit.repeatDays.length > 0) {
        return habit.repeatDays.includes(today.getDate())
      }
      return true
    }
    case 'custom': {
      if (!habit.repeatInterval || habit.repeatInterval <= 1) return true
      if (!habit.createdAt) return true
      const diff = differenceInDays(today, new Date(habit.createdAt))
      return diff % habit.repeatInterval === 0
    }
    default:
      return true
  }
}

export function isStreakAtRisk(habit: Habit): boolean {
  const streak = resolveStreak(habit)
  if (streak <= 0) return false
  const today = getTodayStr()
  if (resolveCompletedDates(habit).includes(today)) return false
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')
  if (resolveCompletedDates(habit).includes(yesterday)) return true
  return false
}

export function getDueHabits(habits: Habit[]): Habit[] {
  return habits.filter((h) => !resolveArchived(h) && !resolveCompletedDates(h).includes(getTodayStr()) && shouldHabitBeDoneToday(h))
}

export function getCompletedToday(habits: Habit[]): Habit[] {
  const today = getTodayStr()
  return habits.filter((h) => !resolveArchived(h) && resolveCompletedDates(h).includes(today))
}

export function getRemainingToday(habits: Habit[]): Habit[] {
  const today = getTodayStr()
  return habits.filter((h) => !resolveArchived(h) && !resolveCompletedDates(h).includes(today) && shouldHabitBeDoneToday(h))
}

export function createDefaultHabit(input: {
  name: string
  icon?: string
  color?: string
  category?: string
  repeatType?: RepeatType
}): Habit {
  const now = new Date()
  return {
    id: generateId(),
    name: input.name,
    description: undefined,
    category: input.category || 'health',
    icon: input.icon || 'self_improvement',
    color: input.color || '#7dd3fc',
    reminder: {
      enabled: false,
      times: [],
      repeat: false,
      sound: 'default',
      vibration: true,
      snoozed: false,
      weekdayOnly: false,
      weekendOnly: false,
    },
    alarmEnabled: false,
    notificationEnabled: true,
    repeatType: input.repeatType || 'daily',
    repeatDays: input.repeatType === 'weekdays' ? [1, 2, 3, 4, 5] : undefined,
    repeatInterval: undefined,
    timeOfDay: 'anytime',
    estimatedDuration: undefined,
    priority: 'medium',
    notes: undefined,
    currentStreak: 0,
    longestStreak: 0,
    completionRate: 0,
    skippedCount: 0,
    completedCount: 0,
    completedDates: [],
    skippedDates: [],
    history: [],
    createdAt: now,
    updatedAt: now,
    archived: false,
    archivedAt: undefined,
  }
}

export function computeDailySummaries(habits: Habit[], days: number = 30): HabitDailySummary[] {
  const today = new Date()
  const summaries: HabitDailySummary[] = []

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const activeHabits = habits.filter((h) => !resolveArchived(h))
    const total = activeHabits.length
    let completed = 0
    let skipped = 0

    for (const h of activeHabits) {
      if (resolveCompletedDates(h).includes(dateStr)) completed++
      if (resolveSkippedDates(h).includes(dateStr)) skipped++
    }

    summaries.push({
      date: dateStr,
      total,
      completed,
      skipped,
      missed: total - completed - skipped,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    })
  }

  return summaries
}

export function checkAndResetStreaks(habits: Habit[]): { id: string; updates: Partial<Habit> }[] {
  const today = getTodayStr()
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')
  const results: { id: string; updates: Partial<Habit> }[] = []

  for (const habit of habits) {
    if (resolveArchived(habit)) continue
    if (resolveCompletedDates(habit).includes(today)) continue

    const shouldDo = shouldHabitBeDoneToday(habit)
    if (!shouldDo) continue

    if (!resolveCompletedDates(habit).includes(yesterday) && resolveStreak(habit) > 0) {
      results.push({
        id: habit.id,
        updates: {
          currentStreak: 0,
          completionRate: calculateCompletionRate(resolveCompletedDates(habit)),
        },
      })
    }
  }

  return results
}

export function migrateLegacyHabit(legacy: {
  id: string
  name: string
  icon: string
  color: string
  category?: string
  frequency: 'daily' | 'weekly'
  targetDays?: number[]
  completedDates: string[]
  streak: number
  bestStreak: number
  createdAt: Date
}): Habit {
  const now = new Date()
  const completionRate = calculateCompletionRate(legacy.completedDates)

  return {
    id: legacy.id,
    name: legacy.name,
    description: undefined,
    category: legacy.category || 'health',
    icon: legacy.icon,
    color: legacy.color,
    reminder: {
      enabled: false,
      times: [],
      repeat: false,
      sound: 'default',
      vibration: true,
      snoozed: false,
      weekdayOnly: false,
      weekendOnly: false,
    },
    alarmEnabled: false,
    notificationEnabled: true,
    repeatType: legacy.frequency === 'weekly' && legacy.targetDays
      ? 'weekdays'
      : legacy.frequency,
    repeatDays: legacy.targetDays,
    repeatInterval: undefined,
    timeOfDay: 'anytime',
    estimatedDuration: undefined,
    priority: 'medium',
    notes: undefined,
    currentStreak: legacy.streak,
    longestStreak: legacy.bestStreak,
    completionRate,
    skippedCount: 0,
    completedCount: legacy.completedDates.length,
    completedDates: legacy.completedDates,
    skippedDates: [],
    history: legacy.completedDates.map((d) => ({
      date: d,
      action: 'completed' as const,
      timestamp: new Date(d + 'T00:00:00'),
    })),
    createdAt: legacy.createdAt instanceof Date ? legacy.createdAt : now,
    updatedAt: now,
    archived: false,
    archivedAt: undefined,
  }
}

export function isHabitDueOnDate(habit: Habit, dateStr: string): boolean {
  if (resolveArchived(habit)) return false
  const date = parse(dateStr, 'yyyy-MM-dd', new Date())
  const dayOfWeek = getDay(date)
  const repeatType = resolveRepeatType(habit)

  switch (repeatType) {
    case 'daily':
      return true
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5
    case 'weekends':
      return dayOfWeek === 0 || dayOfWeek === 6
    case 'weekly':
      if (!habit.repeatDays || habit.repeatDays.length === 0) return dayOfWeek === 1
      return habit.repeatDays.includes(dayOfWeek)
    case 'monthly':
      if (habit.repeatDays && habit.repeatDays.length > 0) {
        return habit.repeatDays.includes(date.getDate())
      }
      return true
    case 'custom':
      if (!habit.repeatInterval || habit.repeatInterval <= 1) return true
      if (!habit.createdAt) return true
      const diff = differenceInDays(date, new Date(habit.createdAt))
      return diff % habit.repeatInterval === 0
    default:
      return true
  }
}
