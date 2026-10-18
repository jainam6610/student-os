import { format } from 'date-fns'
import { sanitizeNumber, calculateLevel } from '../helpers'
import { MAX_XP } from '../constants'
import type { Achievement, UserProgress, ProductivityScore } from '../types'

export interface ProgressSlice {
  progress: UserProgress
  addXP: (amount: number) => void
  updateProgress: (updates: Partial<UserProgress>) => void
  achievements: Achievement[]
  unlockAchievement: (id: string) => void
  checkAchievements: () => void
  productivityScore: ProductivityScore
  recalculateProductivityScore: () => void
}

const defaultAchievements: Achievement[] = [
  { id: 'first-focus', title: 'First Focus', description: 'Complete your first focus session', icon: '🎯', unlocked: false, category: 'focus' },
  { id: 'ten-hours', title: '10 Hours', description: 'Log 10 hours of focus time', icon: '⏰', unlocked: false, category: 'focus', progress: 0, maxProgress: 600 },
  { id: 'hundred-hours', title: '100 Hours', description: 'Log 100 hours of focus time', icon: '💪', unlocked: false, category: 'focus', progress: 0, maxProgress: 6000 },
  { id: 'streak-7', title: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', unlocked: false, category: 'streak', progress: 0, maxProgress: 7 },
  { id: 'streak-30', title: 'Monthly Master', description: 'Maintain a 30-day streak', icon: '⭐', unlocked: false, category: 'streak', progress: 0, maxProgress: 30 },
  { id: 'tasks-50', title: 'Task Tamer', description: 'Complete 50 tasks', icon: '✅', unlocked: false, category: 'tasks', progress: 0, maxProgress: 50 },
  { id: 'tasks-100', title: 'Task Terminator', description: 'Complete 100 tasks', icon: '🏆', unlocked: false, category: 'tasks', progress: 0, maxProgress: 100 },
  { id: 'habits-30', title: 'Habit Former', description: 'Complete habits for 30 days', icon: '📋', unlocked: false, category: 'habits', progress: 0, maxProgress: 30 },
  { id: 'early-bird', title: 'Early Bird', description: 'Complete 5 focus sessions before 8 AM', icon: '🌅', unlocked: false, category: 'milestone', progress: 0, maxProgress: 5 },
  { id: 'night-owl', title: 'Night Owl', description: 'Complete 5 focus sessions after 10 PM', icon: '🦉', unlocked: false, category: 'milestone', progress: 0, maxProgress: 5 },
]

export const createProgressSlice = (set: any, get: any, _api?: any): ProgressSlice => ({
  progress: {
    xp: 0, level: 1, totalFocusTime: 0, totalTasksCompleted: 0,
    currentStreak: 0, bestStreak: 0, weeklyGoal: 25 * 60, weeklyProgress: 0,
  },
  addXP: (amount) => set((state: any) => {
    const safeAmount = sanitizeNumber(amount, 0, -MAX_XP, MAX_XP)
    const newXP = Math.max(0, Math.min(state.progress.xp + safeAmount, MAX_XP))
    return {
      progress: {
        ...state.progress,
        xp: newXP,
        level: calculateLevel(newXP),
        bestStreak: Math.max(state.progress.bestStreak, state.progress.currentStreak),
      },
    }
  }),
  updateProgress: (updates) => set((state: any) => ({
    progress: {
      ...state.progress,
      ...updates,
      xp: sanitizeNumber(updates.xp ?? state.progress.xp, 0, 0, MAX_XP),
      totalFocusTime: sanitizeNumber(updates.totalFocusTime ?? state.progress.totalFocusTime, 0, 0),
      totalTasksCompleted: sanitizeNumber(updates.totalTasksCompleted ?? state.progress.totalTasksCompleted, 0, 0),
      currentStreak: sanitizeNumber(updates.currentStreak ?? state.progress.currentStreak, 0, 0, 3650),
      bestStreak: sanitizeNumber(updates.bestStreak ?? state.progress.bestStreak, 0, 0, 3650),
      weeklyGoal: sanitizeNumber(updates.weeklyGoal ?? state.progress.weeklyGoal, 60, 1, 10080),
      weeklyProgress: sanitizeNumber(updates.weeklyProgress ?? state.progress.weeklyProgress, 0, 0),
      level: calculateLevel(updates.xp ?? state.progress.xp),
    },
  })),

  achievements: defaultAchievements,
  unlockAchievement: (id) => set((state: any) => ({
    achievements: state.achievements.map((a: Achievement) =>
      a.id === id && !a.unlocked ? { ...a, unlocked: true, unlockedAt: new Date() } : a
    ),
  })),
  checkAchievements: () => set((state: any) => {
    const totalFocusMin = state.focusSessions.filter((s: any) => s.type !== 'break').reduce((acc: number, s: any) => acc + s.duration, 0)
    const completedTasks = state.tasks.filter((t: any) => t.status === 'done').length
    const currentStreak = state.progress.currentStreak
    const updated = state.achievements.map((a: Achievement) => {
      if (a.unlocked) return a
      switch (a.id) {
        case 'first-focus': return state.focusSessions.length > 0 ? { ...a, unlocked: true, unlockedAt: new Date() } : a
        case 'ten-hours': return totalFocusMin >= 600 ? { ...a, unlocked: true, unlockedAt: new Date() } : { ...a, progress: totalFocusMin }
        case 'hundred-hours': return totalFocusMin >= 6000 ? { ...a, unlocked: true, unlockedAt: new Date() } : { ...a, progress: totalFocusMin }
        case 'streak-7': return currentStreak >= 7 ? { ...a, unlocked: true, unlockedAt: new Date() } : { ...a, progress: currentStreak }
        case 'streak-30': return currentStreak >= 30 ? { ...a, unlocked: true, unlockedAt: new Date() } : { ...a, progress: currentStreak }
        case 'tasks-50': return completedTasks >= 50 ? { ...a, unlocked: true, unlockedAt: new Date() } : { ...a, progress: completedTasks }
        case 'tasks-100': return completedTasks >= 100 ? { ...a, unlocked: true, unlockedAt: new Date() } : { ...a, progress: completedTasks }
        case 'habits-30': {
          const uniqueHabitDays = new Set(state.habits.flatMap((h: any) => h.completedDates)).size
          return uniqueHabitDays >= 30 ? { ...a, unlocked: true, unlockedAt: new Date() } : { ...a, progress: uniqueHabitDays }
        }
        case 'early-bird': {
          const before8am = state.focusSessions.filter((s: any) => {
            if (!s.startTime || s.type === 'break') return false
            return new Date(s.startTime).getHours() < 8
          }).length
          return before8am >= 5 ? { ...a, unlocked: true, unlockedAt: new Date() } : { ...a, progress: before8am }
        }
        case 'night-owl': {
          const after10pm = state.focusSessions.filter((s: any) => {
            if (!s.startTime || s.type === 'break') return false
            return new Date(s.startTime).getHours() >= 22
          }).length
          return after10pm >= 5 ? { ...a, unlocked: true, unlockedAt: new Date() } : { ...a, progress: after10pm }
        }
        default: return a
      }
    })
    return { achievements: updated }
  }),

  productivityScore: {
    score: 0, focusConsistency: 0, taskCompletion: 0, habitCompletion: 0,
    studyHours: 0, goalCompletion: 0, latePenalty: 0, weeklyHistory: [],
  },
  recalculateProductivityScore: () => set((state: any) => {
    const totalSessions = state.focusSessions.filter((s: any) => s.type !== 'break').length
    const completedSessions = state.focusSessions.filter((s: any) => s.completed && s.type !== 'break').length
    const focusConsistency = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0
    const totalTasks = state.tasks.length
    const doneTasks = state.tasks.filter((t: any) => t.status === 'done').length
    const taskCompletion = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0
    const totalHabitDays = new Set(state.habits.flatMap((h: any) => h.completedDates)).size
    const habitCompletion = Math.min((totalHabitDays / 30) * 100, 100)
    const totalStudyMin = state.focusSessions.filter((s: any) => s.type !== 'break').reduce((acc: number, s: any) => acc + s.duration, 0)
    const studyHours = Math.min((totalStudyMin / 60) * 2, 100)
    const goalMet = state.dailyGoal > 0 ? (state.progress.weeklyProgress / state.progress.weeklyGoal) * 100 : 0
    const goalCompletion = Math.min(goalMet, 100)
    const lateTasks = state.tasks.filter((t: any) => t.dueDate && t.status !== 'done' && new Date(t.dueDate) < new Date()).length
    const latePenalty = Math.min(lateTasks * 5, 100)
    const rawScore = (focusConsistency * 0.25 + taskCompletion * 0.2 + habitCompletion * 0.15 + studyHours * 0.2 + goalCompletion * 0.2) * (1 - latePenalty / 100)
    const score = Math.round(Math.min(Math.max(rawScore, 0), 100))
    const weekStr = format(new Date(), 'yyyy-ww')
    const weeklyHistory = [...state.productivityScore.weeklyHistory.slice(-51), { week: weekStr, score }]
    return {
      productivityScore: {
        score, focusConsistency: Math.round(focusConsistency), taskCompletion: Math.round(taskCompletion),
        habitCompletion: Math.round(habitCompletion), studyHours: Math.round(studyHours),
        goalCompletion: Math.round(goalCompletion), latePenalty: Math.round(latePenalty), weeklyHistory,
      },
    }
  }),
})
