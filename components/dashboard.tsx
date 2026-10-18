'use client'

import { useMemo, memo, useCallback, useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { staggerContainer, staggerItem, spring } from './motion'
import { Badge } from './ui/badge'
import { QuoteDisplay } from './ui/quote-display'
import { format, isToday, startOfWeek, addDays } from 'date-fns'
import { generateInsights, generateDailyMessage, getMotivationMessage } from '@/lib/insights'
import {
  Flame, Clock, CheckCircle2, Sparkles, TrendingUp, Zap, Heart,
  ArrowRight, Target, FileSpreadsheet, ClipboardList, Shield,
  Activity, ListChecks, Brain, Smartphone,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { habitIconEmoji } from '@/lib/habits/types'
import { ProfileAvatar } from './profile-avatar'
import { DashboardExamCountdown } from './dashboard-exam-countdown'
import { deepLockPlugin } from '@/lib/deep-lock/plugin'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function Dashboard() {
  const userName = useStore((s) => s.userName)
  const progress = useStore((s) => s.progress)
  const tasks = useStore((s) => s.tasks)
  const habits = useStore((s) => s.habits)
  const focusSessions = useStore((s) => s.focusSessions)
  const setActiveView = useStore((s) => s.setActiveView)
  const dailyGoal = useStore((s) => s.dailyGoal)
  const studyStyle = useStore((s) => s.studyStyle)
  const motivationStyle = useStore((s) => s.motivationStyle)
  const mainChallenge = useStore((s) => s.mainChallenge)
  const showExamCountdownOnStartup = useStore((s) => s.showExamCountdownOnStartup)

  const [showGoalCelebration, setShowGoalCelebration] = useState(false)
  const [prevGoalMet, setPrevGoalMet] = useState(false)
  const [todayVersion, setTodayVersion] = useState(0)
  const goalCelebrationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (goalCelebrationTimeoutRef.current !== null) {
      clearTimeout(goalCelebrationTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    const now = new Date()
    const nextMidnight = new Date(now)
    nextMidnight.setHours(24, 0, 0, 0)
    const msUntilMidnight = nextMidnight.getTime() - now.getTime()
    const timer = setTimeout(() => setTodayVersion(v => v + 1), msUntilMidnight)
    return () => clearTimeout(timer)
  }, [todayVersion])

  const todaysTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'done' && task.dueDate && isToday(new Date(task.dueDate))),
    [tasks]
  )

  const completedToday = useMemo(
    () => tasks.filter((task) => task.completedAt && isToday(new Date(task.completedAt))).length,
    [tasks]
  )

  const todayFocusTime = useMemo(
    () => focusSessions
      .filter((s) => s.endTime && s.type !== 'break' && isToday(new Date(s.endTime)))
      .reduce((acc, s) => acc + s.duration, 0),
    [focusSessions]
  )

  const weeklyGoalProgress = useMemo(
    () => progress.weeklyGoal > 0 ? Math.min((progress.weeklyProgress / progress.weeklyGoal) * 100, 100) : 0,
    [progress.weeklyProgress, progress.weeklyGoal]
  )

  const heatmapData = useMemo(() => {
    const today = new Date()
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 })
    const days = Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i))
    const dayMinutes = days.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd')
      return focusSessions
        .filter((s) => s.endTime && s.type !== 'break' && format(new Date(s.startTime), 'yyyy-MM-dd') === dateStr)
        .reduce((acc, s) => acc + s.duration, 0)
    })
    const maxMinutes = Math.max(...dayMinutes, 1)
    return days.map((date, i) => ({
      date, day: format(date, 'EEE'),
      intensity: dayMinutes[i] / maxMinutes,
      minutes: dayMinutes[i],
    }))
  }, [focusSessions])

  const focusPercentChange = useMemo(() => {
    const today = new Date()
    const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 })
    const lastWeekStart = addDays(thisWeekStart, -7)
    const thisWeekMinutes = focusSessions
      .filter((s) => s.endTime && s.type !== 'break' && new Date(s.endTime) >= thisWeekStart)
      .reduce((acc, s) => acc + s.duration, 0)
    const lastWeekMinutes = focusSessions
      .filter((s) => s.endTime && s.type !== 'break' && new Date(s.endTime) >= lastWeekStart && new Date(s.endTime) < thisWeekStart)
      .reduce((acc, s) => acc + s.duration, 0)
    if (lastWeekMinutes === 0) return thisWeekMinutes > 0 ? '+100%' : null
    const change = Math.round(((thisWeekMinutes - lastWeekMinutes) / lastWeekMinutes) * 100)
    return change >= 0 ? `+${change}%` : `${change}%`
  }, [focusSessions])

  const completedHabitsToday = useMemo(
    () => habits.filter((h) => h.completedDates.includes(format(new Date(), 'yyyy-MM-dd')) && !h.archived).length,
    [habits]
  )
  const remainingHabitsToday = useMemo(
    () => habits.filter((h) => !h.completedDates.includes(format(new Date(), 'yyyy-MM-dd')) && !h.archived).length,
    [habits]
  )
  const totalActiveHabits = useMemo(
    () => habits.filter((h) => !h.archived).length,
    [habits]
  )

  const weekFocusTime = useMemo(() => {
    const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    return focusSessions
      .filter((s) => s.endTime && s.type !== 'break' && new Date(s.endTime) >= thisWeekStart)
      .reduce((acc, s) => acc + s.duration, 0)
  }, [focusSessions])

  const tasksCompletedThisWeek = useMemo(() => {
    const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    return tasks.filter((task) => {
      if (!task.completedAt) return false
      return new Date(task.completedAt) >= thisWeekStart
    }).length
  }, [tasks])

  const insights = useMemo(() => generateInsights(focusSessions, tasks, habits).slice(0, 3), [focusSessions, tasks, habits, todayVersion])

  const daysSinceLastSession = useMemo(() => {
    if (focusSessions.length === 0) return 999
    const sorted = focusSessions
      .filter(s => s.endTime)
      .sort((a, b) => new Date(b.endTime!).getTime() - new Date(a.endTime!).getTime())
    if (sorted.length === 0) return 999
    const last = new Date(sorted[0].endTime!)
    return Math.floor((Date.now() - last.getTime()) / 86400000)
  }, [focusSessions])

  const motivationMessage = useMemo(
    () => getMotivationMessage({
      motivationStyle,
      mainChallenge,
      timeOfDay: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening',
      todayFocusTime,
      dailyGoal,
      currentStreak: progress.currentStreak,
      completedToday,
      completedHabitsToday,
      daysSinceLastSession,
    }),
    [motivationStyle, mainChallenge, todayFocusTime, dailyGoal, progress.currentStreak, completedToday, completedHabitsToday, daysSinceLastSession]
  )

  useEffect(() => {
    const met = todayFocusTime >= dailyGoal && dailyGoal > 0
    if (met && !prevGoalMet) {
      setShowGoalCelebration(true)
      if (goalCelebrationTimeoutRef.current !== null) {
        clearTimeout(goalCelebrationTimeoutRef.current)
      }
      goalCelebrationTimeoutRef.current = setTimeout(() => {
        setShowGoalCelebration(false)
        goalCelebrationTimeoutRef.current = null
      }, 4000)
    }
    setPrevGoalMet(met)
  }, [todayFocusTime, dailyGoal, prevGoalMet])

  return (
    <motion.div variants={staggerContainer} initial={false} animate="animate" className="space-y-4 sm:space-y-6 max-w-full">
      <motion.div variants={staggerItem}>
        <div className="flex items-center gap-2 sm:gap-3">
          <ProfileAvatar size="md" />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight text-foreground truncate">
              {getGreeting()}, {userName}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{format(new Date(), 'EEEE, MMMM d')}</p>
            <p className="text-xs text-muted-foreground mt-1 sm:mt-1.5">{motivationMessage}</p>
            <p className="text-[10px] text-muted-foreground/40 mt-1">Your workspace. Your terms.</p>
          </div>
        </div>
        <div className="mt-2 sm:mt-3">
          <QuoteDisplay />
        </div>
      </motion.div>

      <AnimatePresence>
        {showGoalCelebration && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={spring.bouncy}
            className="p-3 rounded-2xl bg-success/10 border border-success/20 text-xs sm:text-sm text-center"
          >
            <span className="font-medium text-success">Daily goal achieved!</span>
            <span className="text-muted-foreground ml-1.5">{dailyGoal} min — you showed up.</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={staggerItem} className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label="Focus today"
          value={`${Math.floor(todayFocusTime / 60)}h ${todayFocusTime % 60}m`}
          trend={focusPercentChange}
          color="primary"
        />
        <StatCard
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="Completed"
          value={`${completedToday}`}
          color="success"
        />
        <StatCard
          icon={<Flame className="w-4 h-4" />}
          label="Streak"
          value={`${progress.currentStreak} days`}
          color="warning"
        />
        <StatCard
          icon={<Sparkles className="w-4 h-4" />}
          label="Goal"
          value={`${Math.round(weeklyGoalProgress)}%`}
          color="primary"
        />
      </motion.div>

      {showExamCountdownOnStartup && <DashboardExamCountdown />}

      {/* Academic Overview */}
      <DashboardAcademicSection />

      <motion.div variants={staggerItem} className="flex flex-col md:grid md:grid-cols-12 gap-3 sm:gap-4">
        <div className="md:col-span-7 glass-card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">Today vs goal</h3>
              <p className="text-base sm:text-xl font-semibold text-foreground mt-0.5">
                {Math.floor(todayFocusTime / 60)}h{' '}
                <span className="text-xs sm:text-sm font-normal text-muted-foreground">of {Math.floor(dailyGoal / 60)}h today</span>
              </p>
              <div className="mt-1.5 w-24 sm:w-32 h-1 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${dailyGoal > 0 ? Math.min((todayFocusTime / dailyGoal) * 100, 100) : 0}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
            <span className="text-[10px] sm:text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md shrink-0 tabular-nums">{Math.floor(todayFocusTime / 60)}h {todayFocusTime % 60}m</span>
          </div>
          <div className="h-24 sm:h-36 w-full">
            <div className="flex items-end h-[70px] sm:h-28 gap-1 sm:gap-1.5 mb-1">
              {heatmapData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 self-end">
                  <motion.div
                    className={cn(
                      'w-full rounded-t-md',
                      d.intensity > 0.7 ? 'bg-primary' : d.intensity > 0.3 ? 'bg-primary/60' : d.intensity > 0 ? 'bg-primary/30' : 'bg-secondary'
                    )}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(d.intensity * 100, 4)}%` }}
                    transition={{ delay: i * 0.02, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    style={{ minHeight: d.minutes > 0 ? '4px' : '2px' }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              {heatmapData.map((d, i) => (
                <span key={i} className={cn('text-[9px] sm:text-[10px]', d.intensity > 0 ? 'text-muted-foreground' : 'text-muted-foreground/40')}>
                  {d.day}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-5 glass-card p-4 sm:p-5 flex flex-col items-center justify-center text-center">
          <div className="flex md:flex-col items-center md:items-center gap-4 md:gap-0 w-full">
            <motion.div
              className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 md:mb-3"
              whileHover={{ scale: 1.05 }}
            >
              <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-border" />
                <motion.circle
                  cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="2.5"
                  strokeDasharray={176}
                  strokeDashoffset={176 - (Math.min(progress.currentStreak / 30, 1) * 176)}
                  className="text-primary" strokeLinecap="round"
                  animate={{ strokeDashoffset: 176 - (Math.min(progress.currentStreak / 30, 1) * 176) }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
              </svg>
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="currentColor" />
              </motion.div>
            </motion.div>
            <div className="flex-1 md:text-center">
              <motion.p
                key={progress.currentStreak}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={spring.snappy}
                className="text-xl sm:text-2xl font-bold text-foreground"
              >
                {progress.currentStreak}
              </motion.p>
              <p className="text-[11px] sm:text-xs text-muted-foreground">Day streak</p>
            </div>
          </div>
          <div className="mt-3 w-full card-flat px-3 py-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">XP</span>
              <span className="font-medium text-foreground">{progress.xp.toLocaleString()}</span>
            </div>
            <div className="w-full bg-border h-1 rounded-full mt-1.5 overflow-hidden">
              <motion.div
                className="bg-primary h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(progress.xp % 1000) / 10}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {1000 - (progress.xp % 1000)} XP to level {progress.level + 1}
            </p>
          </div>
        </div>

        <StudyStatsCard
          weekFocusTime={weekFocusTime}
          todayFocusTime={todayFocusTime}
          tasksCompletedThisWeek={tasksCompletedThisWeek}
          completedToday={completedToday}
          completedHabitsToday={completedHabitsToday}
          habitsCount={habits.length}
          currentStreak={progress.currentStreak}
        />

        <div className="md:col-span-7 glass-card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-medium text-foreground">Focus queue</h3>
            <div className="flex items-center gap-1">
              <button onClick={() => { useStore.getState().setInitialAnalyticsRange('all'); setActiveView('analytics') }} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[11px] text-muted-foreground hover:text-foreground hover:underline" aria-label="View full history">
                View full history
              </button>
              <button onClick={() => setActiveView('tasks')} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-primary hover:underline" aria-label="View all tasks">
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="space-y-0.5 sm:space-y-1">
            {todaysTasks.length > 0 ? (
              todaysTasks.slice(0, 4).map((task, i) => (
                <TaskRow key={task.id} task={task} index={i} />
              ))
            ) : (
              <div className="py-6 sm:py-8 text-center">
                <ListChecks className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-xs sm:text-sm text-foreground/70 font-medium">Nothing due today</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground/60 mt-1">Enjoy the calm while it lasts.</p>
                <button onClick={() => setActiveView('tasks')} className="mt-3 min-h-[44px] px-4 text-[11px] sm:text-xs text-primary hover:underline inline-flex items-center gap-1">
                  Add a task <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-12 glass-card p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-sm sm:text-base font-medium text-foreground">One session changes everything</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Start a deep work session.</p>
          </div>
          <motion.button
            onClick={() => setActiveView('focus')}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            className="px-4 sm:px-5 py-2 sm:py-2.5 bg-primary text-primary-foreground rounded-xl text-xs sm:text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20 touch-target"
          >
            <Zap className="w-4 h-4" />
            Start session
          </motion.button>
        </div>

        {/* Deep Lock Summary */}
        <motion.div variants={staggerItem} className="md:col-span-12 glass-card p-3 sm:p-4">
          <DeepLockSummary />
        </motion.div>

        {/* Today's Habits */}
        <motion.div variants={staggerItem} className="md:col-span-6 glass-card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-medium text-foreground">Today</h3>
            <button onClick={() => setActiveView('habits')} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-primary hover:underline" aria-label="View all habits">
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1.5">
            {totalActiveHabits > 0 ? (
              habits.filter((h) => !h.archived).slice(0, 5).map((habit) => {
                const done = habit.completedDates.includes(format(new Date(), 'yyyy-MM-dd'))
                return (
                  <div key={habit.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <span className={cn('w-5 h-5 rounded-lg flex items-center justify-center text-xs', done ? 'bg-success/20' : 'bg-secondary')}>
                      {habitIconEmoji(habit.icon)}
                    </span>
                    <span className={cn('flex-1 text-sm truncate', done ? 'text-foreground/50 line-through' : 'text-foreground')}>{habit.name}</span>
                    {done ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                    ) : (
                      <span className="text-[10px] text-muted-foreground/60 shrink-0">
                        {(habit.currentStreak ?? habit.streak ?? 0) > 0 ? `${habit.currentStreak ?? habit.streak ?? 0}d` : ''}
                      </span>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="py-6 text-center">
                <Target className="w-8 h-8 mx-auto mb-1.5 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground/60">No habits yet.</p>
                <button onClick={() => setActiveView('habits')} className="mt-2 min-h-[44px] px-4 text-[11px] text-primary hover:underline">Add your first</button>
              </div>
            )}
          </div>
          {totalActiveHabits > 0 && (
            <div className="mt-2.5 pt-2.5 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{completedHabitsToday}/{totalActiveHabits} completed</span>
              {remainingHabitsToday > 0 && (
                <span className="text-primary">{remainingHabitsToday} remaining</span>
              )}
            </div>
          )}
        </motion.div>

        {/* Recent Focus Sessions */}
        <motion.div variants={staggerItem} className="md:col-span-6 glass-card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-medium text-foreground">Sessions</h3>
            <button onClick={() => setActiveView('analytics')} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-primary hover:underline" aria-label="View analytics">
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1.5">
            {focusSessions.filter((s) => s.endTime).slice(-5).reverse().map((session) => (
              <div key={session.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className={cn(
                  'w-5 h-5 rounded-lg flex items-center justify-center',
                  session.status === 'completed' ? 'bg-success/10' : session.status === 'interrupted' ? 'bg-chart-5/10' : 'bg-secondary'
                )}>
                  <Brain className={cn(
                    'w-3 h-3',
                    session.status === 'completed' ? 'text-success' : session.status === 'interrupted' ? 'text-chart-5' : 'text-muted-foreground/40'
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{session.subject ?? 'Focus Session'}</p>
                  <p className="text-xs text-muted-foreground">{session.duration}m {session.status === 'completed' ? '· Completed' : session.status === 'interrupted' ? '· Interrupted' : ''}</p>
                </div>
                <span className="text-[10px] text-muted-foreground/50">
                  {session.endTime ? format(new Date(session.endTime), 'h:mm a') : ''}
                </span>
              </div>
            ))}
            {focusSessions.filter((s) => s.endTime).length === 0 && (
              <div className="py-6 text-center">
                <Clock className="w-8 h-8 mx-auto mb-1.5 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground/60">No sessions yet.</p>
                <button onClick={() => setActiveView('focus')} className="mt-2 min-h-[44px] px-4 text-[11px] text-primary hover:underline">Start one</button>
              </div>
            )}
          </div>
        </motion.div>

        {insights.length > 0 && (
          <motion.div variants={staggerItem} className="glass-card p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
              <h3 className="text-[10px] sm:text-xs font-medium text-foreground/70 uppercase tracking-wider">Trends</h3>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              {insights.map((insight, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, ...spring.snappy }}
                  className="flex items-start gap-2 sm:gap-2.5 text-xs sm:text-sm"
                >
                  <span className="text-sm sm:text-base shrink-0 mt-0.5">{insight.icon}</span>
                  <p className="text-foreground/80">{insight.message}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      <motion.div variants={staggerItem} className="lg:hidden text-center pt-1 sm:pt-2">
        <a
          href="https://instagram.com/thats.jainam"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
          aria-label="Built by Jainam Karnawat"
        >
          <Heart className="w-2.5 h-2.5" />
          <span>Built by Jainam</span>
        </a>
      </motion.div>
    </motion.div>
  )
}

function DashboardAcademicSection() {
  const exams = useStore((s) => s.exams)
  const assignments = useStore((s) => s.assignments)
  const setActiveView = useStore((s) => s.setActiveView)

  const upcomingExams = useMemo(() => exams.filter((e) => new Date(e.date) >= new Date()).length, [exams])
  const pendingAssignments = useMemo(() => assignments.filter((a) => a.status === 'todo' || a.status === 'in-progress').length, [assignments])

  if (exams.length === 0 && assignments.length === 0) {
    return (
      <motion.div variants={staggerItem} className="glass-card p-4">
        <button onClick={() => setActiveView('exams')} className="w-full flex items-center gap-3 text-left min-h-[48px]">
          <FileSpreadsheet className="w-5 h-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Set up your first exam</p>
            <p className="text-xs text-muted-foreground">Track deadlines and get countdown alerts</p>
          </div>
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div variants={staggerItem} className="glass-card p-4 sm:p-5">
      <h3 className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">Upcoming</h3>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setActiveView('exams')} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-center">
          <FileSpreadsheet className="w-4 h-4 text-warning" />
          <span className="text-lg font-semibold text-foreground">{upcomingExams}</span>
          <span className="text-[10px] text-muted-foreground">Upcoming exams</span>
        </button>
        <button onClick={() => setActiveView('assignments')} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-center">
          <ClipboardList className="w-4 h-4 text-info" />
          <span className="text-lg font-semibold text-foreground">{pendingAssignments}</span>
          <span className="text-[10px] text-muted-foreground">Pending</span>
        </button>
      </div>
    </motion.div>
  )
}

function DeepLockSummary() {
  const deepLockActive = useStore((s) => s.deepLockActive)
  const focusShieldMode = useStore((s) => s.focusShieldMode)
  const distractions = useStore((s) => s.distractions)
  const setActiveView = useStore((s) => s.setActiveView)
  const progress = useStore((s) => s.progress)
  const [status, setStatus] = useState<{ todayFocusMs: number; todayDistractions: number } | null>(null)
  const isEnabled = deepLockActive || focusShieldMode === 'deep-lock'

  useEffect(() => {
    if (!isEnabled) return
    deepLockPlugin.getDeepLockStatus().then(s => setStatus(s)).catch(() => { })
    const interval = setInterval(() => {
      deepLockPlugin.getDeepLockStatus().then(s => setStatus(s)).catch(() => { })
    }, 10000)
    return () => clearInterval(interval)
  }, [isEnabled])
  const todayDistractions = status?.todayDistractions ?? distractions.length
  const todayMinutes = Math.round((status?.todayFocusMs ?? 0) / 60000)

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center',
          isEnabled ? 'bg-success/15' : 'bg-secondary'
        )}>
          <Shield className={cn('w-4 h-4', isEnabled ? 'text-success' : 'text-muted-foreground')} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">Deep Lock</p>
            <span className={cn(
              'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
              isEnabled ? 'bg-success/15 text-success' : 'bg-secondary text-muted-foreground'
            )}>
              {isEnabled ? 'Active' : 'Off'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground/60 mt-0.5">
            {isEnabled && <span>{todayMinutes}m focused today</span>}
            <span>{todayDistractions} distraction{todayDistractions !== 1 ? 's' : ''}</span>
            <span>Streak: {progress.currentStreak}d</span>
          </div>
        </div>
      </div>
      <button
        onClick={() => setActiveView('deep-lock')}
        className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors min-h-[44px] flex items-center gap-1"
      >
        Open <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  )
}

function StatCard({ icon, label, value, trend, color }: {
  icon: React.ReactNode; label: string; value: string; trend?: string | null; color?: string
}) {
  const cardStyle = 'glass-card-subtle'

  return (
    <motion.div
      className={cn(cardStyle, 'p-4')}
      whileHover={{ y: -2 }}
      transition={spring.snappy}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className={cn(
          'text-muted-foreground',
          color === 'success' && 'text-success',
          color === 'warning' && 'text-chart-5',
          color === 'primary' && 'text-primary',
        )}>
          {icon}
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold text-foreground">{value}</span>
        {trend && (
          <span className="flex items-center text-xs text-success">
            <TrendingUp className="w-3 h-3 mr-0.5" />
            {trend}
          </span>
        )}
      </div>
    </motion.div>
  )
}

const StudyStatsCard = memo(function StudyStatsCard({
  weekFocusTime, todayFocusTime, tasksCompletedThisWeek, completedToday,
  completedHabitsToday, habitsCount, currentStreak
}: {
  weekFocusTime: number; todayFocusTime: number; tasksCompletedThisWeek: number; completedToday: number;
  completedHabitsToday: number; habitsCount: number; currentStreak: number
}) {
  const completedSessions = useStore((s) => s.focusSessions.filter((fs) => fs.endTime && !fs.interrupted).length)
  const partialSessions = useStore((s) => s.focusSessions.filter((fs) => fs.interrupted).length)
  const dailyGoal = useStore((s) => s.dailyGoal)
  const totalSessions = completedSessions + partialSessions
  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0

  return (
    <div className="md:col-span-5 glass-card p-5 border-l-2 border-l-primary/30">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground">This week</h3>
      </div>
      <div className="space-y-4">
        <StatBlock
          main={`${Math.floor(weekFocusTime / 60)}h ${weekFocusTime % 60}m focused`}
          sub={`${todayFocusTime}m of ${dailyGoal}m daily goal`}
        />
        <StatBlock
          main={`${tasksCompletedThisWeek} tasks completed`}
          sub={`${completedToday} done today`}
        />
        <StatBlock
          main={habitsCount > 0 ? `${completedHabitsToday}/${habitsCount} habits done today` : 'No habits tracked yet'}
          sub={`${currentStreak} day streak`}
        />
        {totalSessions > 0 && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Session completion</span>
              <span className="font-medium text-foreground">{completionRate}%</span>
            </div>
            <div className="w-full h-1 rounded-full bg-secondary mt-1 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-chart-2"
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            {partialSessions > 0 && (
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                {partialSessions} partial {partialSessions === 1 ? 'session' : 'sessions'} — every minute counts
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

function StatBlock({ main, sub }: { main: string; sub: string }) {
  return (
    <div className="text-sm text-foreground/80">
      <p>{main}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </div>
  )
}

const TaskRow = memo(function TaskRow({ task, index }: { task: { id: string; title: string; subject?: string | null; priority: 'high' | 'medium' | 'low' }; index: number }) {
  const completeTask = useStore((s) => s.completeTask)
  const handleComplete = useCallback(() => completeTask(task.id), [completeTask, task.id])

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, ...spring.snappy }}
      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors group"
    >
      <motion.button
        onClick={handleComplete}
        whileTap={{ scale: 0.9 }}
        className="shrink-0 flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full"
        aria-label={`Mark "${task.title}" as complete`}
      >
        <span className="w-4 h-4 rounded-full border border-muted-foreground/30 hover:border-primary hover:bg-primary/10 transition-colors" />
      </motion.button>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{task.title}</p>
        {task.subject && <p className="text-xs text-muted-foreground">{task.subject}</p>}
      </div>
      <Badge variant={task.priority === 'high' ? 'high' : task.priority === 'medium' ? 'medium' : 'low'}>
        {task.priority}
      </Badge>
    </motion.div>
  )
})
