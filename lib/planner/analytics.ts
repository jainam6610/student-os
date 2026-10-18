import { eachDayOfInterval, format, isSameDay, startOfWeek, subDays } from 'date-fns'

import type { FocusSession, StudyEvent } from '@/lib/store'

import { getDateKey, getEventDurationMinutes } from './utils'

export interface PlannerDailyAnalytics {
  totalPlannedTime: number
  completedTime: number
  remainingTime: number
  focusTime: number
  completionPercent: number
  mostStudiedSubject: string | null
  averageSession: number
  longestSession: number
}

export interface PlannerWeeklyAnalytics {
  heatmap: Array<{ date: string; plannedMinutes: number; completedMinutes: number }>
  dailyHours: Array<{ label: string; minutes: number }>
  subjectDistribution: Array<{ subject: string; minutes: number }>
  consistency: number
  streak: number
  missedTasks: number
  recoverySuggestions: string[]
}

export function getPlannerDailyAnalytics(events: StudyEvent[], focusSessions: FocusSession[], date: Date): PlannerDailyAnalytics {
  const dayEvents = events.filter((event) => isSameDay(new Date(event.startTime), date))
  const focusForDay = focusSessions.filter(
    (session) => session.endTime && isSameDay(new Date(session.endTime), date)
  )

  const totalPlannedTime = dayEvents.reduce((sum, event) => sum + getEventDurationMinutes(event), 0)
  const completedTime = dayEvents.reduce(
    (sum, event) => sum + (event.completed ? getEventDurationMinutes(event) : 0),
    0
  )
  const focusTime = focusForDay.reduce((sum, session) => sum + session.duration, 0)

  const subjectTotals = new Map<string, number>()
  for (const event of dayEvents) {
    if (!event.subject) continue
    subjectTotals.set(event.subject, (subjectTotals.get(event.subject) ?? 0) + getEventDurationMinutes(event))
  }

  const sortedSubjects = [...subjectTotals.entries()].sort((left, right) => right[1] - left[1])
  const longestSession = focusForDay.reduce((max, session) => Math.max(max, session.duration), 0)
  const averageSession =
    focusForDay.length > 0
      ? Math.round(focusForDay.reduce((sum, session) => sum + session.duration, 0) / focusForDay.length)
      : 0

  return {
    totalPlannedTime,
    completedTime,
    remainingTime: Math.max(totalPlannedTime - completedTime, 0),
    focusTime,
    completionPercent: totalPlannedTime > 0 ? Math.round((completedTime / totalPlannedTime) * 100) : 0,
    mostStudiedSubject: sortedSubjects[0]?.[0] ?? null,
    averageSession,
    longestSession,
  }
}

export function getPlannerWeeklyAnalytics(events: StudyEvent[], focusSessions: FocusSession[], date: Date): PlannerWeeklyAnalytics {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: subDays(weekStart, -6) })
  const heatmap = weekDays.map((day) => {
    const dayEvents = events.filter((event) => isSameDay(new Date(event.startTime), day))
    const plannedMinutes = dayEvents.reduce((sum, event) => sum + getEventDurationMinutes(event), 0)
    const completedMinutes = dayEvents.reduce(
      (sum, event) => sum + (event.completed ? getEventDurationMinutes(event) : 0),
      0
    )

    return {
      date: getDateKey(day),
      plannedMinutes,
      completedMinutes,
    }
  })

  const dailyHours = heatmap.map((day) => ({
    label: format(new Date(day.date), 'EEE'),
    minutes: day.plannedMinutes,
  }))

  const subjectTotals = new Map<string, number>()
  for (const event of events) {
    const startTime = new Date(event.startTime)
    if (startTime < weekStart || startTime > subDays(weekStart, -6)) continue
    const subject = event.subject || 'General'
    subjectTotals.set(subject, (subjectTotals.get(subject) ?? 0) + getEventDurationMinutes(event))
  }

  const subjectDistribution = [...subjectTotals.entries()]
    .map(([subject, minutes]) => ({ subject, minutes }))
    .sort((left, right) => right.minutes - left.minutes)

  const completedDays = heatmap.filter((day) => day.completedMinutes > 0).length
  const consistency = Math.round((completedDays / Math.max(heatmap.length, 1)) * 100)

  let streak = 0
  for (let index = heatmap.length - 1; index >= 0; index -= 1) {
    if (heatmap[index].completedMinutes > 0) streak += 1
    else break
  }

  const missedTasks = events.filter((event) => {
    const startTime = new Date(event.startTime)
    return isSameDay(startTime, date) && !event.completed && startTime.getTime() < Date.now()
  }).length

  const recoverySuggestions: string[] = []
  if (missedTasks > 0) recoverySuggestions.push('Review missed tasks and carry the highest-priority ones forward.')
  if (consistency < 50) recoverySuggestions.push('Plan shorter, more focused sessions to rebuild consistency.')
  if (!recoverySuggestions.length) recoverySuggestions.push('Keep the momentum by protecting tomorrow morning for deep work.')

  const focusMap = new Map<string, number>()
  for (const session of focusSessions) {
    if (!session.endTime) continue
    const key = getDateKey(new Date(session.endTime))
    focusMap.set(key, (focusMap.get(key) ?? 0) + session.duration)
  }

  return {
    heatmap: heatmap.map((day) => ({
      ...day,
      completedMinutes: Math.max(day.completedMinutes, focusMap.get(day.date) ?? 0),
    })),
    dailyHours,
    subjectDistribution,
    consistency,
    streak,
    missedTasks,
    recoverySuggestions,
  }
}
