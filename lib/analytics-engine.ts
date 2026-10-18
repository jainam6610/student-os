import { format, addDays, addMonths, startOfWeek, isSameDay, startOfMonth, endOfMonth, startOfDay, eachDayOfInterval, subDays, subMonths, subYears } from 'date-fns'
import type { FocusSession, Task, Habit } from './store'

export interface FocusAnalytics {
  totalFocusTime: number
  todayFocus: number
  weeklyFocus: number
  monthlyFocus: number
  completedSessions: number
  interruptedSessions: number
  cancelledSessions: number
  totalSessions: number
  averageSessionLength: number
  currentStreak: number
  longestStreak: number
  goalProgress: number
  completionRate: number
}

function getSessionDate(session: FocusSession): Date | null {
  const end = session.endTime ?? session.startTime
  if (end instanceof Date && !Number.isNaN(end.getTime())) return end
  try {
    const d = new Date(end as any)
    return Number.isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}

function calculateStreak(sessions: FocusSession[]): number {
  const days = new Set<string>()
  for (let i = 0; i < sessions.length; i++) {
    const d = getSessionDate(sessions[i])
    if (!d) continue
    const startDate = new Date(sessions[i].startTime)
    if (Number.isNaN(startDate.getTime())) continue
    const dateStr = format(d, 'yyyy-MM-dd')
    if (sessions[i].completed && !sessions[i].interrupted) {
      days.add(dateStr)
    }
  }
  if (days.size === 0) return 0
  const sorted = [...days].sort().reverse()
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  let streak = 0
  let expected = todayStr
  for (const dateStr of sorted) {
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

function calculateLongestStreak(sessions: FocusSession[]): number {
  const days = new Set<string>()
  for (let i = 0; i < sessions.length; i++) {
    const d = getSessionDate(sessions[i])
    if (!d) continue
    if (sessions[i].completed && !sessions[i].interrupted) {
      days.add(format(d, 'yyyy-MM-dd'))
    }
  }
  if (days.size <= 1) return days.size
  const sorted = [...days].sort()
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

export function computeFocusAnalytics(sessions: FocusSession[]): FocusAnalytics {
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const monthStart = startOfMonth(new Date())
  const monthEnd = endOfMonth(new Date())

  let totalFocusTime = 0
  let todayFocus = 0
  let weeklyFocus = 0
  let monthlyFocus = 0
  let completedSessions = 0
  let interruptedSessions = 0
  let cancelledSessions = 0
  let sessionCount = 0
  let durationSum = 0
  let validDurationCount = 0

  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i]
    if (!s || typeof s !== 'object') continue
    if (s.type === 'break') continue
    const dur = typeof s.duration === 'number' && !Number.isNaN(s.duration) && s.duration >= 0 ? s.duration : 0
    totalFocusTime += dur
    sessionCount++

    const d = getSessionDate(s)
    if (!d) continue
    const dateStr = format(d, 'yyyy-MM-dd')

    if (dateStr === todayStr) {
      todayFocus += dur
    }

    if (d >= weekStart) {
      weeklyFocus += dur
    }

    if (d >= monthStart && d <= monthEnd) {
      monthlyFocus += dur
    }

    if (s.status === 'completed' || (s.completed && !s.interrupted)) {
      completedSessions++
    } else if (s.status === 'interrupted' || s.interrupted) {
      interruptedSessions++
    } else if (s.status === 'cancelled') {
      cancelledSessions++
    }

    if (dur > 0) {
      durationSum += dur
      validDurationCount++
    }
  }

  const totalSessions = sessionCount
  const averageSessionLength = validDurationCount > 0 ? Math.round(durationSum / validDurationCount) : 0
  const currentStreak = calculateStreak(sessions)
  const longestStreak = Math.max(currentStreak, calculateLongestStreak(sessions))
  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0
  const goalProgress = 0

  return {
    totalFocusTime,
    todayFocus,
    weeklyFocus,
    monthlyFocus,
    completedSessions,
    interruptedSessions,
    cancelledSessions,
    totalSessions,
    averageSessionLength,
    currentStreak,
    longestStreak,
    goalProgress,
    completionRate,
  }
}

export function computeRecomputedProgress(
  sessions: FocusSession[],
  existingProgress: {
    xp: number
    level: number
    totalFocusTime: number
    totalTasksCompleted: number
    currentStreak: number
    bestStreak: number
    weeklyGoal: number
    weeklyProgress: number
  }
) {
  const analytics = computeFocusAnalytics(sessions)
  return {
    ...existingProgress,
    totalFocusTime: analytics.totalFocusTime,
    weeklyProgress: analytics.weeklyFocus,
    currentStreak: analytics.currentStreak,
    bestStreak: analytics.longestStreak,
  }
}

export type AnalyticsRange = '7d' | '30d' | '3m' | '6m' | '1y' | 'all'
export type Granularity = 'day' | 'week' | 'month'

export interface RangeBoundaries {
  start: Date
  end: Date
  granularity: Granularity
  isAll: boolean
}

export interface RangePeriodPoint {
  start: Date
  label: string
  date: string
}

export interface FocusRangeData {
  period: (RangePeriodPoint & { focusMinutes: number; sessions: number; breakMinutes: number })[]
  totalFocusMinutes: number
  totalBreakMinutes: number
  completedSessions: number
  avgSessionMinutes: number
}

export interface TaskRangeData {
  period: (RangePeriodPoint & { tasks: number })[]
  totalCompleted: number
  completionRate: number
}

export interface HabitRangeData {
  period: (RangePeriodPoint & { habits: number })[]
  activeHabits: number
  totalCompletions: number
  activeDays: number
  rate: number
}

export interface XpRangeData {
  period: (RangePeriodPoint & { xp: number })[]
  totalXp: number
}

export interface RangeStats {
  totalFocusMinutes: number
  totalBreakMinutes: number
  completedSessions: number
  tasksCompleted: number
  habitRate: number
  bestStreak: number
}

export interface Milestone {
  id: string
  icon: string
  label: string
  value: string
  date?: Date
}

const VALID_RANGES: AnalyticsRange[] = ['7d', '30d', '3m', '6m', '1y', 'all']

export function isAnalyticsRange(v: unknown): v is AnalyticsRange {
  return typeof v === 'string' && (VALID_RANGES as string[]).includes(v)
}

export function getRangeBoundaries(range: AnalyticsRange, now: Date = new Date()): RangeBoundaries {
  const end = now
  switch (range) {
    case '7d': return { start: startOfDay(subDays(now, 6)), end, granularity: 'day', isAll: false }
    case '30d': return { start: startOfDay(subDays(now, 29)), end, granularity: 'day', isAll: false }
    case '3m': return { start: startOfWeek(subMonths(now, 3), { weekStartsOn: 1 }), end, granularity: 'week', isAll: false }
    case '6m': return { start: startOfWeek(subMonths(now, 6), { weekStartsOn: 1 }), end, granularity: 'week', isAll: false }
    case '1y': return { start: startOfMonth(subYears(now, 1)), end, granularity: 'month', isAll: false }
    case 'all': return { start: new Date(0), end, granularity: 'month', isAll: true }
  }
}

function resolveStart(boundaries: RangeBoundaries, earliest?: Date): Date | null {
  if (boundaries.isAll) {
    if (!earliest) return null
    return startOfMonth(earliest)
  }
  return boundaries.start
}

function buildPeriod(start: Date, end: Date, granularity: Granularity): RangePeriodPoint[] {
  const points: RangePeriodPoint[] = []
  if (granularity === 'day') {
    for (const d of eachDayOfInterval({ start, end })) {
      points.push({ start: d, label: format(d, 'EEE'), date: format(d, 'yyyy-MM-dd') })
    }
  } else if (granularity === 'week') {
    let cur = startOfWeek(start, { weekStartsOn: 1 })
    while (cur.getTime() <= end.getTime()) {
      points.push({ start: cur, label: format(cur, 'MMM d'), date: format(cur, 'yyyy-MM-dd') })
      cur = addDays(cur, 7)
    }
  } else {
    let cur = startOfMonth(start)
    while (cur.getTime() <= end.getTime()) {
      points.push({ start: cur, label: format(cur, 'MMM'), date: format(cur, 'yyyy-MM') })
      cur = addMonths(cur, 1)
    }
  }
  return points
}

function getSessionDateOf(s: FocusSession): Date | null {
  const d = s.endTime ?? s.createdAt
  if (d instanceof Date && !Number.isNaN(d.getTime())) return d
  return null
}

function isCompletedSession(s: FocusSession): boolean {
  return s.completed === true || s.status === 'completed'
}

// ponytail: "counted" = session actually logged minutes; feeds time totals only.
// streaks/achievement milestones deliberately stay on isCompletedSession.
function isCountedSession(s: FocusSession): boolean {
  if (s.type === 'break') return false
  return sessionDuration(s) > 0
}

function sessionDuration(s: FocusSession): number {
  if (typeof s.duration === 'number' && !Number.isNaN(s.duration) && s.duration >= 0) return s.duration
  if (s.endTime instanceof Date && s.startTime instanceof Date) {
    return Math.round((s.endTime.getTime() - s.startTime.getTime()) / 60000)
  }
  return 0
}

function getPeriodIndex(points: RangePeriodPoint[], date: Date): number {
  for (let i = points.length - 1; i >= 0; i--) {
    if (date.getTime() >= points[i].start.getTime()) return i
  }
  return -1
}

export function getFocusDataForRange(
  range: AnalyticsRange,
  sessions: FocusSession[],
  now: Date = new Date()
): FocusRangeData {
  const boundaries = getRangeBoundaries(range, now)
  const counted = sessions.filter(isCountedSession)
  const dated = counted
    .map((s) => ({ s, d: getSessionDateOf(s) }))
    .filter((x): x is { s: FocusSession; d: Date } => x.d !== null && x.d.getTime() <= now.getTime())
  const inRange = dated.filter((x) => x.d.getTime() >= boundaries.start.getTime())
  const completedDated = inRange.filter((x) => isCompletedSession(x.s)).length

  let earliest: Date | undefined
  for (const { d } of dated) {
    if (!earliest || d.getTime() < earliest.getTime()) earliest = d
  }
  const start = resolveStart(boundaries, earliest)
  const period = start ? buildPeriod(start, boundaries.end, boundaries.granularity) : []

  const focus: number[] = period.map(() => 0)
  const counts: number[] = period.map(() => 0)
  for (const { s, d } of dated) {
    const i = getPeriodIndex(period, d)
    if (i < 0) continue
    focus[i] += sessionDuration(s)
    counts[i]++
  }

  // Break time = auto-break session durations + minutes paused during focus
  // sessions. Attributed to the session's own period so it stacks with focus.
  const brk: number[] = period.map(() => 0)
  for (const s of sessions) {
    const pauseMin = s.pauseMinutes ?? 0
    const isBreak = s.type === 'break'
    if (!isBreak && pauseMin <= 0) continue
    const d = getSessionDateOf(s)
    if (!d || d.getTime() > now.getTime()) continue
    const i = getPeriodIndex(period, d)
    if (i < 0) continue
    brk[i] += isBreak ? sessionDuration(s) : pauseMin
  }

  const totalFocusMinutes = focus.reduce((a, b) => a + b, 0)
  const totalBreakMinutes = brk.reduce((a, b) => a + b, 0)
  const periodData = period.map((p, i) => ({ ...p, focusMinutes: focus[i], sessions: counts[i], breakMinutes: brk[i] }))
  return {
    period: periodData,
    totalFocusMinutes,
    totalBreakMinutes,
    completedSessions: completedDated,
    avgSessionMinutes: inRange.length > 0 ? Math.round(totalFocusMinutes / inRange.length) : 0,
  }
}

export function getTaskDataForRange(
  range: AnalyticsRange,
  tasks: Task[],
  now: Date = new Date()
): TaskRangeData {
  const boundaries = getRangeBoundaries(range, now)
  const done = tasks.filter((t) => t.status === 'done' && (t.completedAt ?? t.createdAt) instanceof Date && (t.completedAt ?? t.createdAt).getTime() <= now.getTime())
  const created = tasks.filter((t) => t.createdAt instanceof Date && t.createdAt.getTime() <= now.getTime())

  let earliest: Date | undefined
  for (const t of done) {
    const d = t.completedAt ?? t.createdAt
    if (!earliest || d.getTime() < earliest.getTime()) earliest = d
  }
  const start = resolveStart(boundaries, earliest)
  const period = start ? buildPeriod(start, boundaries.end, boundaries.granularity) : []

  const counts: number[] = period.map(() => 0)
  const inRange = (d: Date) => d.getTime() >= boundaries.start.getTime() && d.getTime() <= now.getTime()
  let totalCompleted = 0
  for (const t of done) {
    const d = t.completedAt ?? t.createdAt
    if (!inRange(d)) continue
    totalCompleted++
    const i = getPeriodIndex(period, d)
    if (i < 0) continue
    counts[i]++
  }

  const createdInRange = created.filter((t) => inRange(t.createdAt)).length
  const completionRate = createdInRange > 0 ? Math.min(100, Math.round((totalCompleted / createdInRange) * 100)) : 0
  return {
    period: period.map((p, i) => ({ ...p, tasks: counts[i] })),
    totalCompleted,
    completionRate,
  }
}

export function getHabitConsistencyForRange(
  range: AnalyticsRange,
  habits: Habit[],
  now: Date = new Date()
): HabitRangeData {
  const boundaries = getRangeBoundaries(range, now)
  const active = habits.filter((h) => !h.archived)
  const parsed: Date[] = []
  for (const h of active) {
    for (const ds of h.completedDates) {
      const d = new Date(ds + 'T00:00:00')
      if (!Number.isNaN(d.getTime()) && d.getTime() <= now.getTime()) parsed.push(d)
    }
  }

  let earliest: Date | undefined
  for (const d of parsed) {
    if (!earliest || d.getTime() < earliest.getTime()) earliest = d
  }
  const start = resolveStart(boundaries, earliest)
  const period = start ? buildPeriod(start, boundaries.end, boundaries.granularity) : []

  const counts: number[] = period.map(() => 0)
  const activeDaySet = new Set<string>()
  for (const d of parsed) {
    const i = getPeriodIndex(period, d)
    if (i < 0) continue
    const dateStr = format(d, 'yyyy-MM-dd')
    if (boundaries.granularity === 'day') activeDaySet.add(dateStr)
    counts[i]++
  }

  const totalCompletions = counts.reduce((a, b) => a + b, 0)
  const activeDays = boundaries.granularity === 'day' ? activeDaySet.size : counts.filter((c) => c > 0).length
  const daySpan = Math.max(1, Math.ceil((now.getTime() - (start?.getTime() ?? now.getTime())) / (1000 * 60 * 60 * 24)))
  const rate = Math.min(100, Math.round((activeDays / daySpan) * 100))

  return {
    period: period.map((p, i) => ({ ...p, habits: counts[i] })),
    activeHabits: active.length,
    totalCompletions,
    activeDays,
    rate,
  }
}

export function getXPDataForRange(
  range: AnalyticsRange,
  sessions: FocusSession[],
  tasks: Task[],
  now: Date = new Date()
): XpRangeData {
  const boundaries = getRangeBoundaries(range, now)
  const events: { date: Date; xp: number }[] = []
  for (const s of sessions) {
    if (!isCountedSession(s)) continue
    const d = getSessionDateOf(s)
    if (!d || d.getTime() > now.getTime()) continue
    events.push({ date: d, xp: Math.floor(sessionDuration(s) * 2) })
  }
  for (const t of tasks) {
    if (t.status !== 'done') continue
    const d = t.completedAt ?? t.createdAt
    if (!(d instanceof Date) || Number.isNaN(d.getTime()) || d.getTime() > now.getTime()) continue
    events.push({ date: d, xp: t.priority === 'high' ? 50 : t.priority === 'medium' ? 30 : 15 })
  }
  events.sort((a, b) => a.date.getTime() - b.date.getTime())

  let earliest: Date | undefined
  for (const e of events) {
    if (!earliest || e.date.getTime() < earliest.getTime()) earliest = e.date
  }
  const start = resolveStart(boundaries, earliest)
  const period = start ? buildPeriod(start, boundaries.end, boundaries.granularity) : []

  const sums: number[] = period.map(() => 0)
  for (const e of events) {
    const i = getPeriodIndex(period, e.date)
    if (i < 0) continue
    sums[i] += e.xp
  }
  let cumulative = 0
  const periodData = period.map((p, i) => {
    cumulative += sums[i]
    return { ...p, xp: cumulative }
  })
  return { period: periodData, totalXp: cumulative }
}

export function getRangeSummaryStats(
  range: AnalyticsRange,
  tasks: Task[],
  habits: Habit[],
  sessions: FocusSession[],
  now: Date = new Date()
): RangeStats {
  const focus = getFocusDataForRange(range, sessions, now)
  const taskData = getTaskDataForRange(range, tasks, now)
  const habitData = getHabitConsistencyForRange(range, habits, now)

  const completedSessions = focus.completedSessions
  const boundaries = getRangeBoundaries(range, now)
  const days = new Set<string>()
  for (const s of sessions) {
    if (!isCompletedSession(s)) continue
    const d = s.endTime ?? s.startTime
    if (d instanceof Date && !Number.isNaN(d.getTime())) days.add(format(d, 'yyyy-MM-dd'))
  }
  const inRangeDays = [...days].filter((ds) => {
    const t = new Date(ds + 'T00:00:00').getTime()
    return t >= boundaries.start.getTime() && t <= now.getTime()
  })
  const sorted = [...new Set(inRangeDays)].sort()
  let best = 0
  let cur = 0
  let prev: number | null = null
  for (const ds of sorted) {
    const t = new Date(ds + 'T00:00:00').getTime()
    if (prev !== null && t - prev === 86400000) cur++
    else cur = 1
    best = Math.max(best, cur)
    prev = t
  }

  return {
    totalFocusMinutes: focus.totalFocusMinutes,
    totalBreakMinutes: focus.totalBreakMinutes,
    completedSessions,
    tasksCompleted: taskData.totalCompleted,
    habitRate: habitData.rate,
    bestStreak: best,
  }
}

export function getMilestones(tasks: Task[], habits: Habit[], sessions: FocusSession[]): Milestone[] {
  const milestones: Milestone[] = []

  const firstSession = sessions
    .filter(isCompletedSession)
    .map((s) => ({ s, d: s.endTime ?? s.createdAt }))
    .filter((x) => x.d instanceof Date)
    .sort((a, b) => (a.d as Date).getTime() - (b.d as Date).getTime())[0]
  if (firstSession) {
    milestones.push({ id: 'first-focus', icon: '🎯', label: 'First focus session', value: format(firstSession.d as Date, 'MMM d, yyyy'), date: firstSession.d as Date })
  }

  const totalFocus = sessions.filter(isCountedSession).reduce((a, s) => a + sessionDuration(s), 0)
  if (totalFocus >= 600) {
    milestones.push({ id: 'ten-hours', icon: '⏰', label: '10 hours of focus', value: `${Math.floor(totalFocus / 60)}h logged` })
  }
  if (totalFocus >= 6000) {
    milestones.push({ id: 'hundred-hours', icon: '💪', label: '100 hours of focus', value: `${Math.floor(totalFocus / 60)}h logged` })
  }

  const doneTasks = tasks
    .filter((t) => t.status === 'done' && t.completedAt instanceof Date)
    .sort((a, b) => (a.completedAt as Date).getTime() - (b.completedAt as Date).getTime())
  if (doneTasks.length > 0) {
    milestones.push({ id: 'first-task', icon: '✅', label: 'First task completed', value: format(doneTasks[0].completedAt as Date, 'MMM d, yyyy'), date: doneTasks[0].completedAt as Date })
  }
  if (doneTasks.length >= 50) {
    milestones.push({ id: 'fifty-tasks', icon: '📋', label: '50 tasks completed', value: `${doneTasks.length} tasks done` })
  }

  const habitDates = new Set<string>()
  for (const h of habits) {
    if (h.archived) continue
    for (const d of h.completedDates) habitDates.add(d)
  }
  if (habitDates.size > 0) {
    milestones.push({ id: 'first-habit-day', icon: '🌱', label: 'First habit day', value: `active on ${habitDates.size} day${habitDates.size === 1 ? '' : 's'}` })
  }

  return milestones
}

export function getPreviousRangeBoundaries(
  range: AnalyticsRange,
  now: Date = new Date()
): RangeBoundaries | null {
  if (range === 'all') return null
  const current = getRangeBoundaries(range, now)
  const span = current.end.getTime() - current.start.getTime()
  const prevStart = new Date(current.start.getTime() - span)
  const prevEnd = current.start
  return { start: prevStart, end: prevEnd, granularity: current.granularity, isAll: false }
}
