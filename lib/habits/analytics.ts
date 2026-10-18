import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { type Habit, type HabitAnalytics, type HabitDailySummary, type HabitWeeklySummary, type HabitMonthlySummary } from './types'
import { getTodayStr, calculateStreak, calculateLongestStreak, calculateCompletionRate, isHabitDueOnDate, resolveArchived, resolveCompletedDates, resolveSkippedDates, resolveStreak, resolveBestStreak } from './utils'

export function computeTodaySummary(habits: Habit[]): HabitDailySummary {
  const today = getTodayStr()
  const active = habits.filter((h) => !resolveArchived(h) && isHabitDueOnDate(h, today))
  const total = active.length
  let completed = 0
  let skipped = 0

  for (const h of active) {
    if (resolveCompletedDates(h).includes(today)) completed++
    if (resolveSkippedDates(h).includes(today)) skipped++
  }

  return {
    date: today,
    total,
    completed,
    skipped,
    missed: total - completed - skipped,
    rate: total > 0 ? Math.round((completed / total) * 100) : 0,
  }
}

export function computeWeekSummary(habits: Habit[]): HabitWeeklySummary {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: now })

  const daily = days.map((d) => {
    const dateStr = format(d, 'yyyy-MM-dd')
    const active = habits.filter((h) => !resolveArchived(h) && isHabitDueOnDate(h, dateStr))
    const total = active.length
    let completed = 0
    let skipped = 0
    for (const h of active) {
      if (resolveCompletedDates(h).includes(dateStr)) completed++
      if (resolveSkippedDates(h).includes(dateStr)) skipped++
    }
    return {
      date: dateStr,
      total,
      completed,
      skipped,
      missed: total - completed - skipped,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  })

  const rates = daily.filter((d) => d.total > 0).map((d) => d.rate)
  const averageRate = rates.length > 0 ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0

  const bestDay = daily.reduce((best, d) => d.rate > (best?.rate ?? -1) ? d : best, daily[0])
  const worstDay = daily.reduce((worst, d) => d.rate < (worst?.rate ?? 101) && d.total > 0 ? d : worst, daily.find((d) => d.total > 0))

  return {
    startDate: format(weekStart, 'yyyy-MM-dd'),
    endDate: format(weekEnd, 'yyyy-MM-dd'),
    daily,
    total: daily.reduce((s, d) => s + d.completed, 0),
    averageRate,
    bestDay: bestDay?.date ?? '',
    worstDay: worstDay?.date ?? '',
  }
}

export function computeMonthSummary(habits: Habit[]): HabitMonthlySummary {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const days = eachDayOfInterval({ start: monthStart, end: now })

  let completedDays = 0
  const allCompleted = new Set<string>()

  for (const h of habits) {
    if (resolveArchived(h)) continue
    for (const d of resolveCompletedDates(h)) {
      if (d >= format(monthStart, 'yyyy-MM-dd') && d <= format(monthEnd, 'yyyy-MM-dd')) {
        allCompleted.add(d)
      }
    }
  }

  for (const d of days) {
    const ds = format(d, 'yyyy-MM-dd')
    if (allCompleted.has(ds)) completedDays++
  }

  const totalDays = days.length
  const allDates = habits.flatMap((h) => resolveCompletedDates(h).filter((d) => {
    return d >= format(monthStart, 'yyyy-MM-dd') && d <= format(monthEnd, 'yyyy-MM-dd')
  }))
  const uniqueDates = [...new Set(allDates)].sort()

  return {
    year: now.getFullYear(),
    month: now.getMonth(),
    totalDays,
    completedDays,
    rate: totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0,
    currentStreak: calculateStreak(uniqueDates),
    longestStreak: calculateLongestStreak(uniqueDates),
  }
}

export function computeHabitAnalytics(habits: Habit[]): HabitAnalytics {
  const active = habits.filter((h) => !resolveArchived(h))
  const today = computeTodaySummary(habits)
  const thisWeek = computeWeekSummary(habits)
  const thisMonth = computeMonthSummary(habits)

  let totalCompleted = 0
  let totalSkipped = 0
  let bestStreak = 0
  let currentStreak = 0

  for (const h of active) {
    totalCompleted += resolveCompletedDates(h).length
    totalSkipped += resolveSkippedDates(h).length
    const bs = resolveBestStreak(h)
    const cs = resolveStreak(h)
    if (bs > bestStreak) bestStreak = bs
    if (cs > currentStreak) currentStreak = cs
  }

  const consistency = thisWeek.averageRate
  const completionRate = active.length > 0
    ? Math.round((totalCompleted / Math.max(active.length * 30, 1)) * 100)
    : 0

  return {
    today,
    thisWeek,
    thisMonth,
    overall: {
      totalCompleted,
      totalSkipped,
      consistency,
      completionRate: Math.min(completionRate, 100),
      averagePerWeek: thisWeek.daily.length > 0
        ? Math.round(thisWeek.total / thisWeek.daily.length)
        : 0,
      bestStreak,
      currentStreak,
      totalHabits: habits.length,
      activeHabits: active.length,
    },
  }
}

export function buildHeatmapData(habits: Habit[], days: number = 365): { date: string; count: number; intensity: number }[] {
  const now = new Date()
  const counts: Record<string, number> = {}
  for (const h of habits) {
    if (resolveArchived(h)) continue
    for (const d of resolveCompletedDates(h)) {
      counts[d] = (counts[d] || 0) + 1
    }
  }

  const maxCount = Math.max(1, ...Object.values(counts))
  const result: { date: string; count: number; intensity: number }[] = []

  for (let i = days - 1; i >= 0; i--) {
    const date = format(subDays(now, i), 'yyyy-MM-dd')
    const count = counts[date] || 0
    result.push({
      date,
      count,
      intensity: count / maxCount,
    })
  }

  return result
}

export function generateHabitPatterns(habits: Habit[]): { icon: string; message: string; type: string }[] {
  const insights: { icon: string; message: string; type: string }[] = []
  const analytics = computeHabitAnalytics(habits)
  const active = habits.filter((h) => !resolveArchived(h))

  if (active.length === 0) {
    insights.push({
      icon: '🌱',
      message: 'Start tracking habits to see personalized insights.',
      type: 'info',
    })
    return insights
  }

  if (analytics.overall.currentStreak >= 7) {
    insights.push({
      icon: '🔥',
      message: `You're on a ${analytics.overall.currentStreak}-day streak! Keep the momentum going.`,
      type: 'streak',
    })
  }

  if (analytics.thisWeek.averageRate >= 80) {
    insights.push({
      icon: '⭐',
      message: 'Excellent consistency this week! You\'re building strong habits.',
      type: 'success',
    })
  } else if (analytics.thisWeek.averageRate >= 50) {
    insights.push({
      icon: '💪',
      message: 'Good progress this week. Try to complete at least one more habit daily.',
      type: 'encouragement',
    })
  }

  const streakyHabits = active.filter((h) => resolveStreak(h) >= 7)
  if (streakyHabits.length > 0) {
    const best = streakyHabits.sort((a, b) => resolveStreak(b) - resolveStreak(a))[0]
    insights.push({
      icon: '🏆',
      message: `"${best.name}" is your strongest habit — ${resolveStreak(best)}-day streak!`,
      type: 'achievement',
    })
  }

  const atRisk = active.filter((h) => {
    const cs = resolveStreak(h)
    if (cs <= 0) return false
    const today = format(new Date(), 'yyyy-MM-dd')
    const dates = resolveCompletedDates(h)
    if (dates.includes(today)) return false
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')
    return dates.includes(yesterday)
  })

  if (atRisk.length > 0) {
    insights.push({
      icon: '⚠️',
      message: `Complete "${atRisk[0].name}" today to save your streak!`,
      type: 'warning',
    })
  }

  return insights
}
