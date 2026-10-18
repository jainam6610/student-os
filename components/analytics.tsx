'use client'

import { useMemo, memo, useState, useEffect, useDeferredValue } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { staggerContainer, staggerItem } from './motion'
import { Card } from './ui/glass-card'
import { useDeferredRender } from '@/hooks/use-deferred-effect'
import { getPlannerDailyAnalytics, getPlannerWeeklyAnalytics } from '@/lib/planner/analytics'
import { format } from 'date-fns'
import {
  getRangeBoundaries,
  getPreviousRangeBoundaries,
  getFocusDataForRange,
  getTaskDataForRange,
  getHabitConsistencyForRange,
  getXPDataForRange,
  getRangeSummaryStats,
  getMilestones,
  isAnalyticsRange,
  type AnalyticsRange,
} from '@/lib/analytics-engine'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts'
import {
  Clock, Target, TrendingUp, TrendingDown, Flame, CheckCircle2,
  Sun, Award, BarChart3, Activity, Star, Zap, ShieldAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTopperBenchmark, getTopperTips } from '@/lib/topper-benchmark'

const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']
const SUBJECT_KEYWORDS: Record<string, string> = {
  physics: 'Physics', mathematics: 'Mathematics', math: 'Mathematics',
  chemistry: 'Chemistry', biology: 'Biology', english: 'English',
  history: 'History', computer: 'Computer Science',
}

function inferSubject(title: string, subject?: string | null): string {
  if (subject) return subject
  const lower = title.toLowerCase()
  for (const [key, value] of Object.entries(SUBJECT_KEYWORDS)) { if (lower.includes(key)) return value }
  return 'Other'
}

export function Analytics() {
  const tasks = useStore((s) => s.tasks)
  const habits = useStore((s) => s.habits)
  const focusSessions = useStore((s) => s.focusSessions)
  const events = useStore((s) => s.events)
  const distractions = useStore((s) => s.distractions)
  const initialAnalyticsRange = useStore((s) => s.initialAnalyticsRange)
  const setInitialAnalyticsRange = useStore((s) => s.setInitialAnalyticsRange)
  // Use requestIdleCallback via useDeferredRender for chart data
  const chartsReady = useDeferredRender(100)

  const [range, setRange] = useState<AnalyticsRange>(() => isAnalyticsRange(initialAnalyticsRange) ? initialAnalyticsRange : '30d')
  const [comparePrev, setComparePrev] = useState(false)
  const deferredRange = useDeferredValue(range)

  useEffect(() => {
    setInitialAnalyticsRange(null)
  }, [initialAnalyticsRange, setInitialAnalyticsRange])

  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const nextMidnight = new Date()
    nextMidnight.setHours(24, 0, 0, 0)
    const msUntilMidnight = nextMidnight.getTime() - Date.now()
    const timer = setTimeout(() => setNow(new Date()), msUntilMidnight)
    return () => clearTimeout(timer)
  }, [])

  const todayStr = useMemo(() => format(now, 'yyyy-MM-dd'), [now])

  const focusRange = useMemo(() => getFocusDataForRange(deferredRange, focusSessions, now), [deferredRange, focusSessions, now])
  const taskRange = useMemo(() => getTaskDataForRange(deferredRange, tasks, now), [deferredRange, tasks, now])
  const habitRange = useMemo(() => getHabitConsistencyForRange(deferredRange, habits, now), [deferredRange, habits, now])
  const xpRange = useMemo(() => getXPDataForRange(deferredRange, focusSessions, tasks, now), [deferredRange, focusSessions, tasks, now])
  const stats = useMemo(() => getRangeSummaryStats(deferredRange, tasks, habits, focusSessions, now), [deferredRange, tasks, habits, focusSessions, now])

  const prevBoundaries = useMemo(() => getPreviousRangeBoundaries(deferredRange, now), [deferredRange, now])
  const prevStats = useMemo(() => {
    if (!comparePrev || !prevBoundaries) return null
    return getRangeSummaryStats(deferredRange, tasks, habits, focusSessions, prevBoundaries.end)
  }, [comparePrev, prevBoundaries, deferredRange, tasks, habits, focusSessions])

  const focusTrend = useMemo(() => {
    if (!prevStats) return 0
    const prev = prevStats.totalFocusMinutes
    return prev > 0 ? Math.round(((stats.totalFocusMinutes - prev) / prev) * 100) : stats.totalFocusMinutes > 0 ? 100 : 0
  }, [stats, prevStats])
  const taskTrend = useMemo(() => {
    if (!prevStats) return 0
    const prev = prevStats.tasksCompleted
    return prev > 0 ? Math.round(((stats.tasksCompleted - prev) / prev) * 100) : stats.tasksCompleted > 0 ? 100 : 0
  }, [stats, prevStats])
  const habitTrend = useMemo(() => {
    if (!prevStats) return 0
    const prev = prevStats.habitRate
    return prev > 0 ? Math.round(((stats.habitRate - prev) / prev) * 100) : stats.habitRate > 0 ? 100 : 0
  }, [stats, prevStats])

  const prevChartData = useMemo(() => {
    if (!comparePrev || !prevBoundaries) return null
    return getFocusDataForRange(deferredRange, focusSessions, prevBoundaries.end).period.map((p) => p.focusMinutes)
  }, [comparePrev, prevBoundaries, deferredRange, focusSessions])

  const chartData = useMemo(() => {
    // Align by date key, not index: for the "all" range each series resolves its
    // own earliest date, so period arrays can start/end differently.
    const tasksByDate = new Map(taskRange.period.map((p) => [p.date, p.tasks]))
    const habitsByDate = new Map(habitRange.period.map((p) => [p.date, p.habits]))
    return focusRange.period.map((p, i) => ({
      label: p.label,
      date: p.date,
      focus: p.focusMinutes,
      brk: p.breakMinutes,
      tasks: tasksByDate.get(p.date) ?? 0,
      habits: habitsByDate.get(p.date) ?? 0,
      prevFocus: prevChartData?.[i] ?? 0,
    }))
  }, [focusRange, taskRange, habitRange, prevChartData])

  const boundaries = useMemo(() => getRangeBoundaries(deferredRange, now), [deferredRange, now])
  const fbRatio = useMemo(() => {
    const f = focusRange.totalFocusMinutes
    const b = focusRange.totalBreakMinutes
    const total = f + b
    if (total <= 0) return { focusPct: 0, breakPct: 0 }
    return { focusPct: Math.round((f / total) * 100), breakPct: Math.round((b / total) * 100) }
  }, [focusRange])
  const sessionsInRange = useMemo(() => {
    const start = boundaries.start.getTime()
    return focusSessions.filter((s) => {
      if (s.type === 'break') return false
      const d = s.endTime ?? s.createdAt
      return d instanceof Date && d.getTime() >= start && d.getTime() <= now.getTime()
    })
  }, [focusSessions, boundaries, now])

  const subjectData = useMemo(() => {
    const subjectHours: Record<string, number> = {}
    for (let i = 0; i < sessionsInRange.length; i++) {
      const s = sessionsInRange[i]
      const subject = inferSubject('', s.subject)
      subjectHours[subject] = (subjectHours[subject] || 0) + s.duration
    }
    const entries = Object.entries(subjectHours)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, hours], i) => ({
        name,
        hours: Math.round((hours / 60) * 10) / 10,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }))
    return entries.length > 0 ? entries : [{ name: 'No data yet', hours: 1, color: 'var(--muted-foreground)' }]
  }, [sessionsInRange])

  const productivityData = useMemo(() => {
    const hourly: Record<number, { sum: number; count: number }> = {}
    for (let i = 0; i < sessionsInRange.length; i++) {
      const s = sessionsInRange[i]
      const hour = new Date(s.startTime).getHours()
      if (!hourly[hour]) hourly[hour] = { sum: 0, count: 0 }
      hourly[hour].sum += s.duration
      hourly[hour].count++
    }
    const result = new Array(24)
    for (let i = 0; i < 24; i++) {
      const h = hourly[i]
      result[i] = {
        hour: `${i}:00`,
        productivity: h ? Math.round(h.sum / h.count) : 0,
      }
    }
    return result
  }, [sessionsInRange])

  const priorityData = useMemo(() => {
    const start = boundaries.start.getTime()
    const counts = { high: 0, medium: 0, low: 0 }
    tasks.forEach((t) => {
      const d = t.createdAt
      if (d instanceof Date && d.getTime() >= start && d.getTime() <= now.getTime() && counts[t.priority] !== undefined) counts[t.priority]++
    })
    return [
      { name: 'High', value: counts.high, color: 'var(--chart-5)' },
      { name: 'Medium', value: counts.medium, color: 'var(--chart-1)' },
      { name: 'Low', value: counts.low, color: 'var(--chart-2)' },
    ].filter((d) => d.value > 0)
  }, [tasks, boundaries, now])

  const habitHeatmap = useMemo(() => {
    return habitRange.period.map((p) => ({
      date: p.date,
      day: new Date(p.start).getDay(),
      count: p.habits,
    }))
  }, [habitRange])

  const maxHabitCount = useMemo(() => Math.max(...habitHeatmap.map((d) => d.count), 1), [habitHeatmap])

  const xpGrowth = useMemo(() => xpRange.period.map((p) => ({ label: p.label, xp: p.xp })), [xpRange])

  const peakProductivityHour = useMemo(() => {
    const hourlyTotals: Record<number, number> = {}
    for (let i = 0; i < sessionsInRange.length; i++) {
      const s = sessionsInRange[i]
      const hour = new Date(s.startTime).getHours()
      hourlyTotals[hour] = (hourlyTotals[hour] ?? 0) + s.duration
    }
    let bestHour = -1, bestTotal = 0
    for (const [hour, total] of Object.entries(hourlyTotals)) {
      if (total > bestTotal) { bestTotal = total; bestHour = Number(hour) }
    }
    return bestHour >= 0
      ? { hour: bestHour, label: bestHour === 0 ? '12 AM' : bestHour < 12 ? `${bestHour} AM` : bestHour === 12 ? '12 PM' : `${bestHour - 12} PM`, total: Math.round(bestTotal / 60 * 10) / 10 }
      : null
  }, [sessionsInRange])

  const milestones = useMemo(() => getMilestones(tasks, habits, focusSessions), [tasks, habits, focusSessions])

  const plannerDaily = useMemo(() => getPlannerDailyAnalytics(events, focusSessions, now), [events, focusSessions, now])
  const plannerWeekly = useMemo(() => getPlannerWeeklyAnalytics(events, focusSessions, now), [events, focusSessions, now])

  const hasData = focusSessions.length > 0 || tasks.length > 0 || habits.length > 0

  if (!chartsReady) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">Crunching numbers...</p>
        </div>
      </div>
    )
  }

  if (!hasData) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 max-w-full">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">Your week at a glance</p>
        </div>
          <div className="py-16 text-center">
          <BarChart3 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-foreground/70 font-medium">Nothing to analyze yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1 max-w-[240px] mx-auto">Complete a focus session and the charts will fill in.</p>
          <button
            onClick={() => useStore.getState().setActiveView('focus')}
            className="mt-3 px-4 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
          >
            Start your first session
          </button>
        </div>
      </motion.div>
    )
  }
  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4 sm:space-y-5 max-w-full">
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight text-foreground">Analytics</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {range === 'all' ? 'Your full history' : `${range.toUpperCase()} view`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setComparePrev((v) => !v)}
            className={cn(
              'min-h-[44px] px-3 rounded-xl text-xs font-medium border transition-colors',
              comparePrev ? 'bg-primary/10 text-primary border-primary/20' : 'text-muted-foreground border-border hover:bg-muted/50'
            )}
            aria-pressed={comparePrev}
          >
            Compare prev.
          </button>
        </div>
      </motion.div>

      <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-1.5">
        {(['7d', '30d', '3m', '6m', '1y', 'all'] as AnalyticsRange[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              'min-h-[44px] px-3 rounded-xl text-xs font-medium transition-colors',
              range === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground bg-muted/40 hover:bg-muted/70'
            )}
            aria-pressed={range === r}
          >
            {r === 'all' ? 'All' : r.toUpperCase()}
          </button>
        ))}
      </motion.div>

      <motion.div variants={staggerItem} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AnalyticsStat icon={<Clock className="w-4 h-4" />} label="Focus time" value={`${Math.floor(stats.totalFocusMinutes / 60)}h ${stats.totalFocusMinutes % 60}m`} trend={comparePrev ? focusTrend : undefined} />
        <AnalyticsStat icon={<CheckCircle2 className="w-4 h-4" />} label="Tasks completed" value={stats.tasksCompleted.toString()} trend={comparePrev ? taskTrend : undefined} />
        <AnalyticsStat icon={<Star className="w-4 h-4" />} label="Habit completion" value={`${stats.habitRate}%`} trend={comparePrev ? habitTrend : undefined} />
        <AnalyticsStat icon={<Flame className="w-4 h-4" />} label="Best streak" value={`${stats.bestStreak} days`} />
      </motion.div>

      <motion.div variants={staggerItem}>
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-medium text-foreground">Planner snapshot</h3>
            <span className="text-[10px] sm:text-xs text-muted-foreground">{todayStr}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <AnalyticsStat icon={<Clock className="w-4 h-4" />} label="Planned" value={`${Math.floor(plannerDaily.totalPlannedTime / 60)}h ${plannerDaily.totalPlannedTime % 60}m`} />
            <AnalyticsStat icon={<CheckCircle2 className="w-4 h-4" />} label="Completed" value={`${Math.floor(plannerDaily.completedTime / 60)}h ${plannerDaily.completedTime % 60}m`} />
            <AnalyticsStat icon={<Target className="w-4 h-4" />} label="Completion" value={`${plannerDaily.completionPercent}%`} />
            <AnalyticsStat icon={<Zap className="w-4 h-4" />} label="Missed tasks" value={plannerWeekly.missedTasks.toString()} />
          </div>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-3 sm:gap-4">
        <motion.div variants={staggerItem}>
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-xs sm:text-sm font-medium text-foreground">Focus vs Break</h3>
              <span className="text-[10px] sm:text-xs text-muted-foreground">{range === 'all' ? 'All time' : range.toUpperCase()}</span>
            </div>
            {focusRange.totalFocusMinutes > 0 || focusRange.totalBreakMinutes > 0 ? (
            <div className="h-40 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" strokeWidth={0.5} />
                  <XAxis dataKey="label" className="text-[10px] sm:text-xs fill-muted-foreground" tick={{ fill: 'currentColor' }} />
                  <YAxis className="text-[10px] sm:text-xs fill-muted-foreground" tick={{ fill: 'currentColor' }} tickFormatter={(v: number) => `${Math.floor(v / 60)}h`} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: '0.75rem', boxShadow: 'var(--shadow-lg)' }}
                    formatter={(value: number, name: string) => [`${Math.floor(value / 60)}h ${value % 60}m`, name === 'focus' ? 'Focus' : name === 'brk' ? 'Break' : 'Previous']} />
                  <Bar dataKey="focus" stackId="f" fill="var(--primary)" animationDuration={600} animationEasing="ease-out" />
                  <Bar dataKey="brk" stackId="f" fill="var(--chart-4)" radius={[4, 4, 0, 0]} animationDuration={600} animationEasing="ease-out" />
                  {comparePrev && prevChartData && (
                    <Bar dataKey="prevFocus" fill="var(--muted-foreground)" fillOpacity={0.25} radius={[4, 4, 0, 0]} animationDuration={600} animationEasing="ease-out" />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
            ) : (
              <div className="h-40 sm:h-56 flex items-center justify-center text-xs sm:text-sm text-muted-foreground">No focus sessions in this range</div>
            )}
            {(focusRange.totalFocusMinutes > 0 || focusRange.totalBreakMinutes > 0) && (
              <div className="mt-3 flex items-center gap-4 text-[10px] sm:text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[var(--primary)]" /> Deep {fbRatio.focusPct}%</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[var(--chart-4)]" /> Rest {fbRatio.breakPct}%</span>
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-xs sm:text-sm font-medium text-foreground">By subject</h3>
          <span className="text-[10px] sm:text-xs text-muted-foreground">{range === 'all' ? 'All time' : range.toUpperCase()}</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="h-36 w-36 sm:h-44 sm:w-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={subjectData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="hours"
                      animationBegin={200} animationDuration={800} animationEasing="ease-out">
                      {subjectData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: '0.75rem' }}
                      formatter={(value: number) => [`${value}h`, 'Time']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full space-y-1.5">
                {subjectData.map((subject) => (
                  <div key={subject.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: subject.color }} />
                      <span className="text-sm text-foreground">{subject.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{subject.hours}h</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-xs sm:text-sm font-medium text-foreground">Trends</h3>
              <span className="text-[10px] sm:text-xs text-muted-foreground">Tasks & habits</span>
            </div>
            {chartData.some((d) => d.tasks > 0 || d.habits > 0) ? (
            <div className="h-40 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" strokeWidth={0.5} />
                  <XAxis dataKey="label" className="text-[10px] sm:text-xs fill-muted-foreground" tick={{ fill: 'currentColor' }} />
                  <YAxis className="text-[10px] sm:text-xs fill-muted-foreground" tick={{ fill: 'currentColor' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: '0.75rem' }} />
                  <Line type="monotone" dataKey="tasks" stroke="var(--chart-2)" strokeWidth={1.5} dot={{ fill: 'var(--chart-2)', r: 3 }} name="Tasks"
                    animationDuration={600} animationEasing="ease-out" />
                  <Line type="monotone" dataKey="habits" stroke="var(--chart-4)" strokeWidth={1.5} dot={{ fill: 'var(--chart-4)', r: 3 }} name="Habits"
                    animationDuration={600} animationEasing="ease-out" animationBegin={150} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            ) : (
              <div className="h-40 sm:h-56 flex items-center justify-center text-xs sm:text-sm text-muted-foreground">No tasks or habits in this range</div>
            )}
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-xs sm:text-sm font-medium text-foreground">Focus minutes by hour</h3>
              <span className="text-[10px] sm:text-xs text-muted-foreground">Avg session</span>
            </div>
            <div className="h-40 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={productivityData}>
                  <defs>
                    <linearGradient id="prodGradAnalytics" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" strokeWidth={0.5} />
                  <XAxis dataKey="hour" className="text-[10px] sm:text-xs fill-muted-foreground" tick={{ fill: 'currentColor' }} interval={3} />
                  <YAxis className="text-[10px] sm:text-xs fill-muted-foreground" tick={{ fill: 'currentColor' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: '0.75rem' }}
                    formatter={(value: number) => [`${Math.round(value)} min`, 'Avg session']} />
                  <Area type="monotone" dataKey="productivity" stroke="var(--primary)" strokeWidth={1.5} fill="url(#prodGradAnalytics)"
                    animationDuration={700} animationEasing="ease-out" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-3 sm:gap-4">
        <motion.div variants={staggerItem}>
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-xs sm:text-sm font-medium text-foreground">Task priorities</h3>
              <span className="text-[10px] sm:text-xs text-muted-foreground">Distribution</span>
            </div>
            {priorityData.length > 0 ? (
              <div className="h-36 sm:h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={priorityData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={3} dataKey="value"
                      animationBegin={200} animationDuration={800} animationEasing="ease-out">
                      {priorityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: '0.75rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-36 sm:h-44 flex items-center justify-center text-xs sm:text-sm text-muted-foreground">No task data yet</div>
            )}
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-xs sm:text-sm font-medium text-foreground">XP earned</h3>
              <span className="text-[10px] sm:text-xs text-muted-foreground">Cumulative</span>
            </div>
            {xpGrowth.length > 1 ? (
              <div className="h-36 sm:h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={xpGrowth}>
                    <defs>
                      <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" strokeWidth={0.5} />
                    <XAxis dataKey="label" className="text-[10px] sm:text-xs fill-muted-foreground" tick={{ fill: 'currentColor' }} interval="preserveStartEnd" />
                    <YAxis className="text-[10px] sm:text-xs fill-muted-foreground" tick={{ fill: 'currentColor' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: '0.75rem' }}
                      formatter={(value: number) => [`${value} XP`, 'Total']} />
                    <Area type="monotone" dataKey="xp" stroke="var(--chart-3)" strokeWidth={1.5} fill="url(#xpGrad)"
                      animationDuration={700} animationEasing="ease-out" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-36 sm:h-44 flex items-center justify-center text-xs sm:text-sm text-muted-foreground">Complete focus sessions to see growth</div>
            )}
          </Card>
        </motion.div>
      </div>

      {habitHeatmap.length > 0 && (
        <motion.div variants={staggerItem}>
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-xs sm:text-sm font-medium text-foreground">Habit consistency</h3>
              <span className="text-[10px] sm:text-xs text-muted-foreground">{range === 'all' ? 'All time' : range.toUpperCase()}</span>
            </div>
            <div className="flex flex-wrap gap-px sm:gap-0.5">
              {habitHeatmap.map((day) => {
                const intensity = Math.min(day.count / maxHabitCount, 1)
                return (
                  <div
                    key={day.date}
                    className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-[1px]"
                    style={{
                      backgroundColor: day.count > 0
                        ? `color-mix(in srgb, var(--chart-2) ${intensity * 100}%, var(--secondary))`
                        : 'var(--secondary)',
                    }}
                    title={`${day.date}: ${day.count} habits completed`}
                  />
                )
              })}
            </div>
          </Card>
        </motion.div>
      )}

      <motion.div variants={staggerItem}>
        <Card className="p-4 sm:p-5">
            <h3 className="text-xs sm:text-sm font-medium text-foreground mb-3 sm:mb-4 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              Patterns
            </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {peakProductivityHour && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                  <Sun className="w-3.5 h-3.5 text-chart-3" />
                  Peak productivity
                </div>
                <p className="text-xs text-muted-foreground">
                  You focus best around <strong className="text-foreground">{peakProductivityHour.label}</strong>
                  {' '}({peakProductivityHour.total}h total). Schedule deep work here.
                </p>
              </div>
            )}
            {stats.habitRate > 0 && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                  <Activity className="w-3.5 h-3.5 text-chart-2" />
                  Habit score
                </div>
                <p className="text-xs text-muted-foreground">
                  Habit consistency is at <strong className="text-foreground">{Math.min(stats.habitRate, 100)}%</strong>
                  {' '}with {habitRange.activeHabits} active habits. {stats.habitRate >= 70 ? 'Great momentum!' : stats.habitRate >= 40 ? 'Building consistency!' : 'Start small to build streaks.'}
                </p>
              </div>
            )}
            {stats.tasksCompleted > 0 && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                  <Award className="w-3.5 h-3.5 text-chart-5" />
                  Impact score
                </div>
                <p className="text-xs text-muted-foreground">
                  Completed <strong className="text-foreground">{stats.tasksCompleted}</strong> tasks in this range. Prioritizing what matters.
                </p>
              </div>
            )}
            {taskRange.completionRate > 0 && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                  <BarChart3 className="w-3.5 h-3.5 text-chart-4" />
                  Task completion rate
                </div>
                <p className="text-xs text-muted-foreground">
                  Task completion at <strong className="text-foreground">{taskRange.completionRate}%</strong>
                  {taskRange.completionRate >= 80 ? ' Excellent! Keep it up.' : taskRange.completionRate >= 50 ? ' On the right track.' : ' Try breaking tasks into smaller steps.'}
                </p>
              </div>
            )}
            {stats.completedSessions > 0 && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                  <Clock className="w-3.5 h-3.5 text-chart-5" />
                  Session consistency
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">{stats.completedSessions}</strong> completed sessions in this range
                  {' — '}{stats.completedSessions >= 10 ? 'strong follow-through!' : stats.completedSessions >= 4 ? 'building consistency.' : 'every minute still counts.'}
                </p>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {milestones.length > 0 && (
        <motion.div variants={staggerItem}>
          <Card className="p-4 sm:p-5">
            <h3 className="text-xs sm:text-sm font-medium text-foreground mb-3 sm:mb-4 flex items-center gap-2">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              Milestones
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
              {milestones.map((m) => (
                <div key={m.id} className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="text-xl mb-1">{m.icon}</div>
                  <p className="text-[10px] font-medium text-foreground leading-tight">{m.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{m.value}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {(range === '1y' || range === 'all') && (
        <motion.div variants={staggerItem}>
          <Card className="p-4 sm:p-5">
            <h3 className="text-xs sm:text-sm font-medium text-foreground mb-3 sm:mb-4 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-chart-3" />
              Your journey
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div className="p-3 rounded-xl bg-muted/40">
                <p className="text-lg sm:text-xl font-bold text-foreground">{Math.floor(focusRange.totalFocusMinutes / 60)}h</p>
                <p className="text-[10px] text-muted-foreground">Focus time</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40">
                <p className="text-lg sm:text-xl font-bold text-foreground">{focusRange.completedSessions}</p>
                <p className="text-[10px] text-muted-foreground">Sessions</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40">
                <p className="text-lg sm:text-xl font-bold text-foreground">{xpRange.totalXp.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">XP earned</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40">
                <p className="text-lg sm:text-xl font-bold text-foreground">{habitRange.activeDays}</p>
                <p className="text-[10px] text-muted-foreground">Habit days</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Distraction Analytics */}
      {distractions.length > 0 && (
        <motion.div variants={staggerItem}>
          <Card className="p-4 sm:p-5">
            <h3 className="text-xs sm:text-sm font-medium text-foreground mb-3 sm:mb-4 flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive" />
              Distractions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                <p className="text-lg sm:text-xl font-bold text-foreground">{distractions.length}</p>
                <p className="text-[10px] text-muted-foreground">Total distractions</p>
              </div>
              <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                <p className="text-lg sm:text-xl font-bold text-foreground">
                  {new Set(distractions.map((d) => d.sessionId)).size}
                </p>
                <p className="text-[10px] text-muted-foreground">Sessions affected</p>
              </div>
              <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                <p className="text-lg sm:text-xl font-bold text-foreground">
                  {new Set(distractions.map((d) => d.appName || d.packageName)).size}
                </p>
                <p className="text-[10px] text-muted-foreground">Blocked apps</p>
              </div>
              <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                <p className="text-lg sm:text-xl font-bold text-foreground">
                  {distractions.filter((d) => d.timestamp > Date.now() - 7 * 86400000).length}
                </p>
                <p className="text-[10px] text-muted-foreground">This week</p>
              </div>
            </div>
            {distractions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex flex-wrap gap-1.5">
                  {[...new Set(distractions.map((d) => d.appName || d.packageName))].slice(0, 6).map((app) => (
                    <span key={app} className="px-2 py-0.5 rounded-md bg-destructive/10 text-destructive text-[10px] font-medium">
                      {app}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {comparePrev && prevStats && focusTrend !== 0 && (
        <motion.div variants={staggerItem}>
          <div className={cn(
            'p-3 sm:p-4 rounded-xl border',
            focusTrend > 0 ? 'bg-success/5 border-success/20' : 'bg-warning/5 border-warning/20'
          )}>
            <div className="flex items-center gap-2">
              {focusTrend > 0 ? (
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-warning" />
              )}
              <h4 className="text-xs sm:text-sm font-medium text-foreground">
                {focusTrend > 0 ? 'Focus time trending up' : 'Focus time trending down'}
              </h4>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 ml-5 sm:ml-6">
              {focusTrend > 0
                ? `Focus time is ${focusTrend}% higher than the previous period.`
                : `Focus time is ${Math.abs(focusTrend)}% lower than the previous period.`
              }
            </p>
          </div>
        </motion.div>
      )}

      {/* Academic Analytics */}
      <AcademicAnalyticsSection focusSessions={focusSessions} tasks={tasks} habits={habits} />

    </motion.div>
  )
}

function AcademicAnalyticsSection({ focusSessions, tasks, habits }: {
  focusSessions: import('@/lib/store').FocusSession[]
  tasks: import('@/lib/store').Task[]
  habits: import('@/lib/store').Habit[]
}) {
  const syllabus = useStore((s) => s.syllabus)
  const getSyllabusCompletion = useStore((s) => s.getSyllabusCompletion)
  const academicGoal = useStore((s) => s.academicGoal)
  const dailyGoal = useStore((s) => s.dailyGoal)
  const subjectHours = useMemo(() => {
    const hours: Record<string, number> = {}
    for (const s of focusSessions) {
      if (!s.endTime || !s.subject) continue
      hours[s.subject] = (hours[s.subject] || 0) + s.duration
    }
    const entries = Object.entries(hours).sort(([, a], [, b]) => b - a)
    return {
      entries: entries.map(([name, mins], i) => ({ name, hours: Math.round((mins / 60) * 10) / 10, color: CHART_COLORS[i % CHART_COLORS.length] })),
      mostStudied: entries[0]?.[0] ?? null,
      leastStudied: entries[entries.length - 1]?.[0] ?? null,
    }
  }, [focusSessions])

  const totalHours = useMemo(() => {
    const mins = focusSessions.reduce((acc, s) => acc + (s.endTime ? s.duration : 0), 0)
    return Math.round((mins / 60) * 10) / 10
  }, [focusSessions])

  const sessionsCount = useMemo(() => {
    let completed = 0, interrupted = 0
    for (const s of focusSessions) {
      if (!s.endTime) continue
      if (s.interrupted) interrupted++
      else completed++
    }
    return { completed, interrupted }
  }, [focusSessions])

  const avgDailyFocus = useMemo(() => {
    if (focusSessions.length === 0) return 0
    const first = focusSessions.reduce((earliest, s) => s.startTime < earliest ? s.startTime : earliest, focusSessions[0].startTime)
    const days = Math.max(1, Math.ceil((Date.now() - first.getTime()) / (1000 * 60 * 60 * 24)))
    return Math.round(totalHours / days * 10) / 10
  }, [focusSessions, totalHours])

  const monthlyTrend = useMemo(() => {
    const now = new Date()
    const months: { label: string; hours: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = format(d, 'MMM')
      let hours = 0
      for (const s of focusSessions) {
        if (!s.endTime) continue
        const sd = new Date(s.endTime)
        if (sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear()) {
          hours += s.duration / 60
        }
      }
      months.push({ label: monthKey, hours: Math.round(hours * 10) / 10 })
    }
    return months
  }, [focusSessions])

  const completionRate = useMemo(() => {
    const total = tasks.length
    const done = tasks.filter((t) => t.status === 'done').length
    return total > 0 ? Math.round((done / total) * 100) : 0
  }, [tasks])

  const consistencyScore = useMemo(() => {
    const habitDays = new Set<string>()
    for (const h of habits) {
      for (const d of h.completedDates) habitDays.add(d)
    }
    const last30 = new Array(30).fill(0).map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      return format(d, 'yyyy-MM-dd')
    })
    const daysWithActivity = last30.filter((d) => habitDays.has(d)).length
    return Math.round((daysWithActivity / 30) * 100)
  }, [habits])

  if (focusSessions.length === 0) return null

  return (
    <motion.div variants={staggerItem}>
      <h2 className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Academic</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3">
        <Card className="p-3">
          <p className="text-[10px] text-muted-foreground">Total study hours</p>
          <p className="text-lg font-semibold text-foreground mt-0.5">{totalHours}h</p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] text-muted-foreground">Avg daily focus</p>
          <p className="text-lg font-semibold text-foreground mt-0.5">{avgDailyFocus}h</p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] text-muted-foreground">Completion rate</p>
          <p className="text-lg font-semibold text-foreground mt-0.5">{completionRate}%</p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] text-muted-foreground">Consistency</p>
          <p className="text-lg font-semibold text-foreground mt-0.5">{consistencyScore}%</p>
        </Card>
      </div>

      {/* Syllabus Completion */}
      {syllabus && syllabus.subjects.length > 0 && (() => {
        const sc = getSyllabusCompletion()
        return (
          <Card className="p-4 mb-3">
            <h3 className="text-xs font-medium text-foreground mb-3">Syllabus Progress</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{sc.completedSubjects}/{sc.totalSubjects} subjects &middot; {sc.completedTopics}/{sc.totalTopics} topics</span>
              {sc.totalTopics > 0 && (
                <span className="text-sm font-semibold text-primary">{Math.round((sc.completedTopics / sc.totalTopics) * 100)}%</span>
              )}
            </div>
            {sc.totalTopics > 0 && (
              <div className="h-2 rounded-full bg-secondary overflow-hidden mb-3">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(sc.completedTopics / sc.totalTopics) * 100}%` }} />
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              {Object.entries(sc.bySubject).map(([subj, data]) => (
                <span key={subj} className="text-[10px] px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                  {subj}: {data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0}%
                </span>
              ))}
            </div>
          </Card>
        )
      })()}

      {/* Topper Benchmark */}
      {academicGoal && (() => {
        const bench = getTopperBenchmark(academicGoal)
        const userDailyMins = avgDailyFocus * 60
        const tips = getTopperTips(userDailyMins, academicGoal)
        const gap = bench.dailyMinutes - userDailyMins
        const ratio = bench.dailyMinutes > 0 ? Math.min(1, userDailyMins / bench.dailyMinutes) : 0
        return (
          <Card className="p-4 mb-3">
            <h3 className="text-xs font-medium text-foreground mb-3">Topper Benchmark</h3>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground mb-0.5">Avg topper</p>
                <p className="text-sm font-semibold text-foreground">{Math.round(bench.dailyMinutes / 60)}h {bench.dailyMinutes % 60}m/day</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground mb-0.5">You (avg)</p>
                <p className={cn('text-sm font-semibold', gap <= 0 ? 'text-success' : gap <= 60 ? 'text-chart-4' : 'text-destructive')}>
                  {avgDailyFocus}h/day
                </p>
              </div>
            </div>
            {gap > 0 && (
              <p className="text-[10px] text-muted-foreground mb-2">
                {Math.round(gap / 60 * 10) / 10}h/day gap to bridge. Small daily increases compound.
              </p>
            )}
            <div className="space-y-1.5">
              {tips.map((tip, i) => (
                <p key={i} className="text-[11px] text-muted-foreground/80 flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">&#8226;</span>
                  {tip}
                </p>
              ))}
            </div>
          </Card>
        )
      })()}

      <div className="grid lg:grid-cols-2 gap-3">
        {subjectHours.entries.length > 0 && (
          <Card className="p-4">
            <h3 className="text-xs font-medium text-foreground mb-3">Study hours by subject</h3>
            <div className="space-y-2">
              {subjectHours.entries.slice(0, 6).map((subj) => (
                <div key={subj.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: subj.color }} />
                    <span className="text-sm text-foreground">{subj.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{subj.hours}h</span>
                </div>
              ))}
            </div>
          </Card>
        )}

      </div>

      {monthlyTrend.length > 0 && (
        <Card className="p-4 mt-3">
          <h3 className="text-xs font-medium text-foreground mb-3">Monthly trend</h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" strokeWidth={0.5} />
                <XAxis dataKey="label" className="text-[10px] fill-muted-foreground" tick={{ fill: 'currentColor' }} />
                <YAxis className="text-[10px] fill-muted-foreground" tick={{ fill: 'currentColor' }} tickFormatter={(v: number) => `${v}h`} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: '0.75rem' }}
                  formatter={(value: number) => [`${value}h`, 'Hours']} />
                <Bar dataKey="hours" fill="var(--chart-1)" radius={[4, 4, 0, 0]} animationDuration={600} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Patterns row */}
      <div className="grid sm:grid-cols-2 gap-3 mt-3">
        {subjectHours.mostStudied && (
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-chart-3" />
              Most studied
            </div>
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">{subjectHours.mostStudied}</strong> — {subjectHours.entries[0]?.hours}h total
            </p>
          </div>
        )}
        {subjectHours.leastStudied && subjectHours.leastStudied !== subjectHours.mostStudied && (
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
              <Target className="w-3.5 h-3.5 text-chart-2" />
              Needs attention
            </div>
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">{subjectHours.leastStudied}</strong> — only {subjectHours.entries.find((e) => e.name === subjectHours.leastStudied)?.hours}h studied
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

const AnalyticsStat = memo(function AnalyticsStat({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string; trend?: number }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold text-foreground">{value}</span>
        {trend !== undefined && trend !== 0 && (
          <span className={cn('flex items-center text-xs', trend >= 0 ? 'text-success' : 'text-destructive')}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </Card>
  )
})
