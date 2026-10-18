import { format } from 'date-fns'
import { sanitizeString, sanitizeNumber } from '../helpers'
import { MAX_HABITS } from '../constants'
import { generateId } from '../../utils'
import { syncHabitAlarms, cancelAlarm, dismissAlarm } from '../../scheduling'
import type { HabitSettings } from '../../habits/types'
import { DEFAULT_HABIT_SETTINGS } from '../../habits/types'
import { getTodayStr, calculateStreak, calculateLongestStreak, calculateCompletionRate } from '../../habits/utils'
import type { Habit } from '../types'

export interface HabitSlice {
  habits: Habit[]
  addHabit: (habit: Omit<Habit, 'id' | 'completedDates' | 'streak' | 'bestStreak' | 'createdAt'>) => void
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>
  deleteHabit: (id: string) => Promise<void>
  toggleHabitDay: (id: string, date: string) => void
  completeHabit: (id: string, date?: string) => void
  undoCompleteHabit: (id: string, date?: string) => void
  skipHabit: (id: string, reason?: string, date?: string) => void
  archiveHabit: (id: string) => Promise<void>
  restoreHabit: (id: string) => void
  duplicateHabit: (id: string) => void
  resetHabit: (id: string, period: 'daily' | 'weekly' | 'monthly') => void
  recomputeHabitStreaks: () => void
  habitSettings: HabitSettings
  setHabitSettings: (settings: Partial<HabitSettings>) => void
}

export const createHabitSlice = (set: any, get: any, _api?: any): HabitSlice => ({
  habits: [
    { id: '1', name: 'Morning Study', icon: '📚', color: 'blue', category: 'study', frequency: 'daily', completedDates: [], streak: 0, bestStreak: 7, createdAt: new Date() },
    { id: '2', name: 'Exercise', icon: '🏃', color: 'green', category: 'fitness', frequency: 'daily', completedDates: [], streak: 0, bestStreak: 14, createdAt: new Date() },
    { id: '3', name: 'Review Notes', icon: '📝', color: 'purple', category: 'study', frequency: 'daily', completedDates: [], streak: 0, bestStreak: 21, createdAt: new Date() },
  ],
  addHabit: async (habit) => {
    set((state: any) => {
      if (state.habits.length >= MAX_HABITS) return state
      const now = new Date()
      const id = generateId()
      const newHabit: Habit = {
        ...habit,
        id,
        name: sanitizeString(habit.name, 'Habit', 100),
        completedDates: [],
        streak: 0,
        bestStreak: 0,
        createdAt: now,
        updatedAt: now,
        completionRate: 0,
        skippedCount: 0,
        completedCount: 0,
        skippedDates: [],
        history: [],
        repeatType: (habit as any).repeatType || (habit.frequency === 'weekly' ? 'weekly' : 'daily'),
        repeatDays: (habit as any).repeatDays || (habit.frequency === 'weekly' ? [1, 2, 3, 4, 5] : undefined),
        notificationEnabled: (habit as any).notificationEnabled ?? true,
        alarmEnabled: (habit as any).alarmEnabled ?? false,
        timeOfDay: (habit as any).timeOfDay || 'anytime',
        priority: (habit as any).priority || 'medium',
        archived: false,
        longestStreak: 0,
      }
      return { habits: [...state.habits, newHabit] }
    })
    await syncHabitAlarms(get().habits)
  },
  updateHabit: async (id, updates) => {
    const old = get().habits.find((h: Habit) => h.id === id)
    if (old && (old.alarmEnabled || old.reminder?.enabled)) {
      for (const timeStr of (old.reminder?.times || [])) {
        await cancelAlarm(`${old.id}-${timeStr}`)
      }
    }
    set((state: any) => ({ habits: state.habits.map((h: Habit) => h.id === id ? { ...h, ...updates, updatedAt: new Date() } : h) }))
    await syncHabitAlarms(get().habits)
  },
  deleteHabit: async (id) => {
    const habit = get().habits.find((h: Habit) => h.id === id)
    if (habit && (habit.alarmEnabled || habit.reminder?.enabled)) {
      for (const timeStr of (habit.reminder?.times || [])) {
        await cancelAlarm(`${habit.id}-${timeStr}`)
      }
    }
    set((state: any) => ({ habits: state.habits.filter((h: Habit) => h.id !== id) }))
    await syncHabitAlarms(get().habits)
  },
  completeHabit: async (id, date) => {
    set((state: any) => ({
      habits: state.habits.map((h: Habit) => {
        if (h.id !== id) return h
        const targetDate = date || getTodayStr()
        if (h.completedDates.includes(targetDate)) return h
        const newDates = [...h.completedDates, targetDate]
        const newHistory = [...(h.history || []), { date: targetDate, action: 'completed' as const, timestamp: new Date() }]
        const streak = calculateStreak(newDates)
        return {
          ...h,
          completedDates: newDates,
          completedCount: (h.completedCount || 0) + 1,
          currentStreak: streak,
          streak,
          longestStreak: Math.max(h.longestStreak ?? h.bestStreak ?? 0, streak),
          bestStreak: Math.max(h.bestStreak ?? 0, streak),
          completionRate: calculateCompletionRate(newDates),
          history: newHistory,
          updatedAt: new Date(),
        }
      }),
    }))
    await syncHabitAlarms(get().habits)
    await dismissAlarm()
  },
  undoCompleteHabit: (id, date) => set((state: any) => ({
    habits: state.habits.map((h: Habit) => {
      if (h.id !== id) return h
      const targetDate = date || getTodayStr()
      if (!h.completedDates.includes(targetDate)) return h
      const newDates = h.completedDates.filter((d: string) => d !== targetDate)
      const newHistory = [...(h.history || []), { date: targetDate, action: 'undone' as const, timestamp: new Date() }]
      const streak = calculateStreak(newDates)
      return {
        ...h,
        completedDates: newDates,
        completedCount: Math.max(0, (h.completedCount ?? 1) - 1),
        currentStreak: streak,
        streak,
        completionRate: calculateCompletionRate(newDates),
        history: newHistory,
        updatedAt: new Date(),
      }
    }),
  })),
  skipHabit: (id, reason, date) => set((state: any) => ({
    habits: state.habits.map((h: Habit) => {
      if (h.id !== id) return h
      const targetDate = date || getTodayStr()
      if (h.completedDates.includes(targetDate)) return h
      const newSkipped = [...(h.skippedDates || []), targetDate]
      const newHistory = [...(h.history || []), { date: targetDate, action: 'skipped' as const, reason: reason || 'Manual skip', timestamp: new Date() }]
      return {
        ...h,
        skippedDates: newSkipped,
        skippedCount: (h.skippedCount || 0) + 1,
        history: newHistory,
        updatedAt: new Date(),
      }
    }),
  })),
  archiveHabit: async (id) => {
    const habit = get().habits.find((h: Habit) => h.id === id)
    if (habit && (habit.alarmEnabled || habit.reminder?.enabled)) {
      for (const timeStr of (habit.reminder?.times || [])) {
        await cancelAlarm(`${habit.id}-${timeStr}`)
      }
    }
    set((state: any) => ({
      habits: state.habits.map((h: Habit) => h.id === id ? { ...h, archived: true, archivedAt: new Date(), updatedAt: new Date() } : h),
    }))
    await syncHabitAlarms(get().habits)
  },
  restoreHabit: (id) => set((state: any) => ({
    habits: state.habits.map((h: Habit) => h.id === id ? { ...h, archived: false, archivedAt: undefined, updatedAt: new Date() } : h),
  })),
  duplicateHabit: (id) => set((state: any) => {
    const original = state.habits.find((h: Habit) => h.id === id)
    if (!original || state.habits.length >= MAX_HABITS) return state
    const now = new Date()
    const copy: Habit = {
      ...original as any,
      id: generateId(),
      name: `${original.name} (Copy)`,
      completedDates: [],
      skippedDates: [],
      streak: 0, bestStreak: 0, currentStreak: 0, longestStreak: 0,
      completionRate: 0, skippedCount: 0, completedCount: 0,
      history: [],
      createdAt: now, updatedAt: now,
      archived: false, archivedAt: undefined,
    }
    return { habits: [...state.habits, copy] }
  }),
  resetHabit: (id, period) => set((state: any) => ({
    habits: state.habits.map((h: Habit) => {
      if (h.id !== id) return h
      const now = new Date()
      if (period === 'daily') {
        const today = getTodayStr()
        return { ...h, completedDates: h.completedDates.filter((d: string) => d !== today), skippedDates: (h.skippedDates || []).filter((d: string) => d !== today), updatedAt: now }
      }
      if (period === 'weekly') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const cutoff = format(weekAgo, 'yyyy-MM-dd')
        return { ...h, completedDates: h.completedDates.filter((d: string) => d < cutoff), skippedDates: (h.skippedDates || []).filter((d: string) => d < cutoff), updatedAt: now }
      }
      return {
        ...h, completedDates: [], skippedDates: [], completedCount: 0, skippedCount: 0,
        currentStreak: 0, longestStreak: h.longestStreak ?? h.bestStreak ?? 0, streak: 0,
        completionRate: 0, updatedAt: now,
      }
    }),
  })),
  recomputeHabitStreaks: () => set((state: any) => ({
    habits: state.habits.map((h: Habit) => {
      const streak = calculateStreak(h.completedDates)
      const best = Math.max(calculateLongestStreak(h.completedDates), streak, h.longestStreak ?? h.bestStreak ?? 0)
      return {
        ...h, streak, bestStreak: best, currentStreak: streak, longestStreak: best,
        completionRate: calculateCompletionRate(h.completedDates),
        completedCount: h.completedDates.length, updatedAt: new Date(),
      }
    }),
  })),
  toggleHabitDay: async (id, date) => {
    set((state: any) => ({
      habits: state.habits.map((h: Habit) => {
        if (h.id !== id) return h
        const normalized = h.completedDates.map((d: string) => typeof d === 'string' ? d.split('T')[0] : format(new Date(d), 'yyyy-MM-dd'))
        const dates = normalized.includes(date) ? normalized.filter((d: string) => d !== date) : [...normalized, date]
        const streak = calculateStreak(dates)
        const bestStreak = Math.max(calculateLongestStreak(dates), streak, h.longestStreak ?? h.bestStreak ?? 0)
        const newHistory = [...(h.history || [])]
        if (normalized.includes(date)) {
          newHistory.push({ date, action: 'undone' as const, timestamp: new Date() })
        } else {
          newHistory.push({ date, action: 'completed' as const, timestamp: new Date() })
        }
        return {
          ...h, completedDates: dates, streak, bestStreak, currentStreak: streak, longestStreak: bestStreak,
          completedCount: dates.length, completionRate: calculateCompletionRate(dates),
          history: newHistory, updatedAt: new Date(),
        }
      }),
    }))
    await syncHabitAlarms(get().habits)
    await dismissAlarm()
  },
  habitSettings: DEFAULT_HABIT_SETTINGS,
  setHabitSettings: (settings) => set((state: any) => ({ habitSettings: { ...state.habitSettings, ...settings } })),
})
