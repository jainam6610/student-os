import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'
import { computeRecomputedProgress } from '../analytics-engine'
import { getTodayStr, calculateStreak, calculateLongestStreak, calculateCompletionRate } from '../habits/utils'
import { syncHabitAlarms, syncPlannerAlarms } from '../scheduling'
import { getStorageStats, cleanupOldData } from '../storage-quota'
import { normalizePlannerSettings } from '../planner/utils'

 
import { STORAGE_KEY, CURRENT_SCHEMA_VERSION, MAX_FOCUS_MINUTES } from './constants'
import { storage, autoRepair, validateSessions, safeDeserialize } from './storage'
import { sanitizeNumber, sanitizeBoolean, sanitizeString, sanitizeDate, migrateV1toV2, checkStorageQuota, normalizeStudyEvent } from './helpers'
import { createUserSlice } from './slices/user-slice'
import { createProgressSlice } from './slices/progress-slice'
import { createTaskSlice } from './slices/task-slice'
import { createHabitSlice } from './slices/habit-slice'
import { createFocusSlice } from './slices/focus-slice'
import { createEventSlice } from './slices/event-slice'
import { createShieldSlice } from './slices/shield-slice'
import { createContentSlice } from './slices/content-slice'
import { createAcademicSlice } from './slices/academic-slice'
import { createNavigationSlice } from './slices/navigation-slice'
import { createSyllabusSlice } from './slices/syllabus-slice'
import type { UserSlice } from './slices/user-slice'
import type { ProgressSlice } from './slices/progress-slice'
import type { TaskSlice } from './slices/task-slice'
import type { HabitSlice } from './slices/habit-slice'
import type { FocusSlice } from './slices/focus-slice'
import type { EventSlice } from './slices/event-slice'
import type { ShieldSlice } from './slices/shield-slice'
import type { ContentSlice } from './slices/content-slice'
import type { AcademicSlice } from './slices/academic-slice'
import type { NavigationSlice } from './slices/navigation-slice'
import type { SyllabusSlice } from './slices/syllabus-slice'

export type StudentOSState = UserSlice & ProgressSlice & TaskSlice & HabitSlice & FocusSlice & EventSlice & ShieldSlice & ContentSlice & AcademicSlice & NavigationSlice & SyllabusSlice

// Layer 2: Pre-hydration validation — belt-and-suspenders check
// that runs before Zustand even tries to hydrate.
function preValidateStorage(key: string): void {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return

    try {
      const parsed = JSON.parse(raw)
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Not an object')
      }
      if (!('state' in parsed) && !('version' in parsed)) {
        throw new Error('Missing state/version')
      }
    } catch {
      // Back up corrupted data before clearing (truncate to 10KB)
      try {
        localStorage.setItem(`${key}-corrupted-backup`,
          localStorage.getItem(key)?.slice(0, 10000) ?? '')
      } catch { /* best-effort */ }
      localStorage.removeItem(key)
    }
  } catch { /* localStorage unavailable */ }
}

// Run BEFORE store creation
if (typeof window !== 'undefined') {
  preValidateStorage(STORAGE_KEY)
}

export const useStore = create<StudentOSState>()(
  persist(
    (...a) => ({
      ...createUserSlice(...a),
      ...createProgressSlice(...a),
      ...createTaskSlice(...a),
      ...createHabitSlice(...a),
      ...createFocusSlice(...a),
      ...createEventSlice(...a),
      ...createShieldSlice(...a),
      ...createContentSlice(...a),
      ...createAcademicSlice(...a),
      ...createNavigationSlice(...a),
      ...createSyllabusSlice(...a),
    }),
    {
      name: STORAGE_KEY,
      version: CURRENT_SCHEMA_VERSION,
      storage,
      partialize: (state) => ({
        userName: state.userName,
        onboardingComplete: state.onboardingComplete,
        prominentDisclosureAccepted: state.prominentDisclosureAccepted,
        avatar: state.avatar,
        theme: state.theme,
        progress: state.progress,
        dailyGoal: state.dailyGoal,
        studyStyle: state.studyStyle,
        academicGoal: state.academicGoal,
        preferredFocusDuration: state.preferredFocusDuration,
        timerSettings: state.timerSettings,
        onboardingProfile: state.onboardingProfile,
        reducedMotion: state.reducedMotion,
        plannerSettings: state.plannerSettings,
        plannerSetupComplete: state.plannerSetupComplete,
        tasks: state.tasks,
        habits: state.habits,
        focusSessions: state.focusSessions,
        events: state.events,
        focusShieldMode: state.focusShieldMode,
        accessibilityServiceEnabled: state.accessibilityServiceEnabled,
        accentColor: state.accentColor,
        fontSize: state.fontSize,
        autoStartFocus: state.autoStartFocus,
        exams: state.exams,
        assignments: state.assignments,
        dashboardLayout: state.dashboardLayout,
        compactMode: state.compactMode,
        habitSettings: state.habitSettings,
        achievements: state.achievements,
        distractions: state.distractions,
        whitelistedApps: state.whitelistedApps,
        autoDnd: state.autoDnd,
        motivationEnabled: state.motivationEnabled,
        motivationTimes: state.motivationTimes,
        motivationDays: state.motivationDays,
        recentMotivationIds: state.recentMotivationIds,
        examModeEnabled: state.examModeEnabled,
        ambientSoundEnabled: state.ambientSoundEnabled,
        ambientVolume: state.ambientVolume,
        showExamCountdownOnStartup: state.showExamCountdownOnStartup,
        productivityScore: state.productivityScore,
        motivationCategories: state.motivationCategories,
        musicSettings: state.musicSettings,
        mainChallenge: state.mainChallenge,
        motivationStyle: state.motivationStyle,
        syllabus: state.syllabus,
        examDate: state.examDate,
      }),
      migrate: (persistedState: unknown, version: number) => {
        // ponytail: else-if chain in strict numerical order 0→17.
        // CRITICAL: only ONE block runs per migration (short-circuit on first match).
        // Previous sequential-if structure ran ALL matching blocks — v17/v16 could re-run v0/v1.
        let state = persistedState as any

        if (version <= 0) {
          try {
            const oldRaw = localStorage.getItem('student-os-storage-v2')
            if (oldRaw) {
              const oldParsed = JSON.parse(oldRaw)
              if (oldParsed.state) state = oldParsed.state
            }
          } catch { /* noop */ }
          state = migrateV1toV2(state)
        } else if (version <= 1) {
          if (Array.isArray(state.tasks)) {
            state.tasks = (state.tasks as Record<string, unknown>[]).map((t) => ({
              ...t, subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
            }))
          }
          if (typeof state.progress !== 'object' || !state.progress) {
            state.progress = {
              xp: 0, level: 1, totalFocusTime: 0, totalTasksCompleted: 0,
              currentStreak: 0, bestStreak: 0, weeklyGoal: 1500, weeklyProgress: 0,
            }
          }
        } else if (version <= 2) {
          if (Array.isArray(state.focusSessions)) {
            state.focusSessions = (state.focusSessions as Record<string, unknown>[]).map((fs) => ({
              ...fs, targetDuration: sanitizeNumber(fs.targetDuration, 0, 0, MAX_FOCUS_MINUTES),
              interrupted: sanitizeBoolean(fs.interrupted, false),
            }))
          }
          if (typeof state.dailyGoal !== 'number') state.dailyGoal = 120
        } else if (version <= 3) {
          if (Array.isArray(state.focusSessions)) {
            state.focusSessions = (state.focusSessions as Record<string, unknown>[]).map((fs) => ({
              ...fs, energy: fs.energy ?? undefined, distractions: fs.distractions ?? undefined,
              category: fs.category ?? undefined,
              focusScore: fs.focusScore !== undefined ? sanitizeNumber(fs.focusScore, 0, 0, 100) : undefined,
              reflection: fs.reflection ?? undefined,
              pauseCount: fs.pauseCount !== undefined ? sanitizeNumber(fs.pauseCount, 0, 0, 1000) : undefined,
            }))
          }
          if (typeof state.studyStyle !== 'string' || !['deep-work', 'consistent', 'sprint', 'night-owl'].includes(state.studyStyle as string)) state.studyStyle = 'deep-work'
          if (typeof state.academicGoal !== 'string') state.academicGoal = ''
          if (typeof state.preferredFocusDuration !== 'number' || state.preferredFocusDuration < 10 || state.preferredFocusDuration > 240) state.preferredFocusDuration = 60
          if (typeof state.reducedMotion !== 'boolean') state.reducedMotion = false
        } else if (version <= 4) {
          // no-op: v4 had no data migration
        } else if (version <= 5) {
          state.plannerSettings = normalizePlannerSettings(state.plannerSettings as any)
          if (Array.isArray(state.events)) {
            const settings = state.plannerSettings as any
            state.events = (state.events as any[]).map((event) => normalizeStudyEvent(event, settings))
          }
          if (Array.isArray(state.focusSessions)) {
            state.focusSessions = (state.focusSessions as any[]).map((session) => ({
              ...session, plannerEventId: session.plannerEventId ? sanitizeString(session.plannerEventId, '', 80) : undefined,
            }))
          }
        } else if (version <= 6) {
          if (!state.timerSettings || typeof state.timerSettings !== 'object') {
            state.timerSettings = {
              notificationEnabled: true, vibrationEnabled: true, backgroundSounds: false,
              autoBreak: false, breakDuration: 5, longBreakFrequency: 4,
              keepScreenAwake: true, animationsEnabled: true, alarmSound: 'studentos_alarm',
            }
          }
        } else if (version <= 7) {
          // no-op: v7 had no data migration
        } else if (version <= 8) {
          if (Array.isArray(state.focusSessions)) {
            state.focusSessions = (state.focusSessions as Record<string, unknown>[]).map((fs) => {
              const completed = sanitizeBoolean(fs.completed, false)
              const interrupted = sanitizeBoolean(fs.interrupted, false)
              let status = sanitizeString(fs.status as string, '', 20)
              if (status !== 'completed' && status !== 'interrupted' && status !== 'cancelled') {
                if (completed && !interrupted) status = 'completed'
                else if (interrupted) status = 'interrupted'
                else status = 'cancelled'
              }
              return { ...fs, status, goal: fs.goal ?? undefined, createdAt: sanitizeDate(fs.createdAt) ?? sanitizeDate(fs.startTime) ?? new Date() }
            })
          }
        } else if (version <= 9) {
          if (!['normal', 'deep-lock'].includes(state.focusShieldMode as string)) state.focusShieldMode = 'normal'
          if (typeof state.accentColor !== 'string') state.accentColor = 'purple'
          if (!['small', 'medium', 'large'].includes(state.fontSize as string)) state.fontSize = 'medium'
          if (typeof state.autoStartFocus !== 'boolean') state.autoStartFocus = false
        } else if (version <= 10) {
          if (!Array.isArray(state.exams)) state.exams = []
          if (!Array.isArray(state.assignments)) state.assignments = []
        } else if (version <= 11) {
          if (!Array.isArray(state.dashboardLayout)) state.dashboardLayout = ['stats', 'focus', 'tasks', 'habits', 'academic', 'insights', 'recent']
          if (typeof state.compactMode !== 'boolean') state.compactMode = false
          const defaultAchievements = [
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
          if (!Array.isArray(state.achievements) || (state.achievements as Record<string, unknown>[]).length === 0) state.achievements = defaultAchievements
          if (!state.productivityScore || typeof state.productivityScore !== 'object') {
            state.productivityScore = { score: 0, focusConsistency: 0, taskCompletion: 0, habitCompletion: 0, studyHours: 0, goalCompletion: 0, latePenalty: 0, weeklyHistory: [] }
          }
          if (Array.isArray(state.tasks)) {
            state.tasks = (state.tasks as Record<string, unknown>[]).map((t) => ({
              ...t, projectId: t.projectId ? sanitizeString(t.projectId as string, '', 80) : undefined,
            }))
          }
        } else if (version <= 12) {
          if (Array.isArray(state.habits)) {
            state.habits = (state.habits as Record<string, unknown>[]).map((h) => {
              const raw = h.completedDates
              let cleaned: string[]
              if (Array.isArray(raw)) {
                cleaned = raw.map((d: unknown) => {
                  if (d instanceof Date) return format(d, 'yyyy-MM-dd')
                  if (typeof d === 'string') return d.split('T')[0]
                  return String(d)
                }).filter((d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d))
              } else { cleaned = [] }
              return { ...h, completedDates: cleaned }
            })
          }
          if (Array.isArray(state.focusSessions)) {
            state.focusSessions = (state.focusSessions as Record<string, unknown>[]).map((fs) => ({
              ...fs, startTime: fs.startTime instanceof Date ? fs.startTime : sanitizeDate(fs.startTime) ?? new Date(0),
              endTime: fs.endTime instanceof Date ? fs.endTime : (fs.endTime ? sanitizeDate(fs.endTime) : undefined),
            }))
          }
        } else if (version <= 13) {
          if (Array.isArray(state.habits)) {
            state.habits = (state.habits as Record<string, unknown>[]).map((h) => {
              const now = new Date()
              const completedDates = Array.isArray(h.completedDates)
                ? (h.completedDates as unknown[]).map((d: unknown) => {
                    if (d instanceof Date) return format(d, 'yyyy-MM-dd')
                    if (typeof d === 'string') return d.split('T')[0]
                    return String(d)
                  }).filter((d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d))
                : []
              const streak = sanitizeNumber(h.streak, 0, 0, 10000)
              const bestStreak = sanitizeNumber(h.bestStreak, 0, 0, 10000)
              return {
                ...h, completedDates, repeatType: h.repeatType || (h.frequency === 'weekly' ? 'weekly' : 'daily'),
                repeatInterval: h.repeatInterval || undefined, timeOfDay: h.timeOfDay || 'anytime',
                priority: h.priority || 'medium', notificationEnabled: h.notificationEnabled ?? true,
                alarmEnabled: h.alarmEnabled ?? false, currentStreak: h.currentStreak ?? streak,
                longestStreak: h.longestStreak ?? bestStreak,
                completionRate: h.completionRate ?? calculateCompletionRate(completedDates),
                skippedCount: h.skippedCount ?? 0, completedCount: h.completedCount ?? completedDates.length,
                skippedDates: Array.isArray(h.skippedDates) ? h.skippedDates : [],
                history: Array.isArray(h.history) ? h.history : completedDates.map((d: string) => ({ date: d, action: 'completed' as const, timestamp: new Date(d + 'T00:00:00') })),
                updatedAt: h.updatedAt instanceof Date ? h.updatedAt : now, archived: h.archived ?? false,
                archivedAt: h.archivedAt instanceof Date ? h.archivedAt : undefined, reminder: h.reminder || undefined,
              }
            })
          }
        } else if (version <= 14) {
          if (!state.onboardingProfile || typeof state.onboardingProfile !== 'object') {
            state.onboardingProfile = {
              name: sanitizeString(state.userName, 'Student', 50),
              goal: sanitizeString(state.academicGoal, 'Study consistently', 100),
              sleepTime: '22:30', wakeTime: '06:30', sleepDurationMinutes: 480,
              dailyStudyMinutes: sanitizeNumber(state.dailyGoal, 180, 1, 1440),
              focusDurationMinutes: sanitizeNumber(state.preferredFocusDuration, 120, 10, 240),
              selectedHabits: ['Study Session', 'Drink Water', 'Evening Review'],
              enabledRoutines: ['Morning Routine', 'Study Routine'],
              notifications: { enabled: false, habitReminders: false, studyReminders: false, alarmMode: false },
              skipped: false, completedAt: undefined,
            }
          }
        } else if (version <= 15) {
          if (Array.isArray(state.events) && state.events.length > 0) {
            state.plannerSetupComplete = true
          }
        } else if (version <= 16) {
          if (!state.onboardingProfile || typeof state.onboardingProfile !== 'object') {
            state.onboardingProfile = {
              name: sanitizeString(state.userName, 'Student', 50),
              goal: sanitizeString(state.academicGoal, 'Study consistently', 100),
              sleepTime: '22:30', wakeTime: '06:30', sleepDurationMinutes: 480,
              dailyStudyMinutes: sanitizeNumber(state.dailyGoal, 180, 1, 1440),
              focusDurationMinutes: sanitizeNumber(state.preferredFocusDuration, 120, 10, 240),
              selectedHabits: ['Study Session', 'Drink Water', 'Evening Review'],
              enabledRoutines: ['Morning Routine', 'Study Routine'],
              preferredSessions: ['morning'],
              notifications: { enabled: false, habitReminders: false, studyReminders: false, alarmMode: false },
              skipped: false, completedAt: undefined,
              classOrOccupation: '', studyGoal: '', habitGoals: [],
            }
          } else {
            const p = state.onboardingProfile as Record<string, unknown>
            if (!Array.isArray(p.preferredSessions)) p.preferredSessions = ['morning']
            if (typeof p.classOrOccupation !== 'string') p.classOrOccupation = ''
            if (typeof p.studyGoal !== 'string') p.studyGoal = ''
            if (!Array.isArray(p.habitGoals)) p.habitGoals = []
          }
        } else if (version <= 17) {
          if (typeof state.motivationEnabled !== 'boolean') state.motivationEnabled = false
          if (!Array.isArray(state.motivationTimes)) state.motivationTimes = ['09:00', '14:00', '20:00']
          if (!Array.isArray(state.motivationDays)) state.motivationDays = [0, 1, 2, 3, 4, 5, 6]
          if (typeof state.examModeEnabled !== 'boolean') state.examModeEnabled = false
          if (!Array.isArray(state.recentMotivationIds)) state.recentMotivationIds = []
          if (typeof state.ambientSoundEnabled !== 'boolean') state.ambientSoundEnabled = false
          if (typeof state.ambientSoundVolume !== 'number') state.ambientSoundVolume = 0.5
          if (typeof state.prominentDisclosureAccepted !== 'boolean') state.prominentDisclosureAccepted = false
          if (typeof state.showExamCountdownOnStartup !== 'boolean') state.showExamCountdownOnStartup = false
          if (Array.isArray(state.exams)) {
            state.exams = (state.exams as any[]).map((e) => ({
              ...e, isPinned: typeof e.isPinned === 'boolean' ? e.isPinned : false,
            }))
          }
        } else if (version <= 18) {
          if (state.musicSettings && typeof state.musicSettings === 'object') {
            state.musicSettings = { ...state.musicSettings, autoPlay: true }
          }
        } else if (version <= 19) {
          if (typeof state.syllabus === 'undefined') state.syllabus = null
          if (typeof state.examDate === 'undefined') state.examDate = null
        } else if (version <= 20) {
          // Migrate syllabus: subject.topics → subject.chapters[].topics
          const s = state.syllabus as any
          if (s && Array.isArray(s.subjects)) {
            s.subjects = s.subjects.map((sub: any) => {
              if (Array.isArray(sub.chapters)) return sub
              const topics = Array.isArray(sub.topics) ? sub.topics : []
              const { topics: _, ...rest } = sub
              return { ...rest, chapters: [{ id: `ch-${sub.id}-general`, name: 'General', topics }] }
            })
          }
        }

        return state
      },
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.warn('Student OS: Storage rehydration failed:', error)

            // Layer 3B: Hydration failed — clear storage and reload ONCE.
            // Use sessionStorage flag to prevent infinite reload loop.
            const reloadKey = 'student-os-hydration-reload'
            try {
              const alreadyReloaded = sessionStorage.getItem(reloadKey)

              if (!alreadyReloaded) {
                sessionStorage.setItem(reloadKey, '1')
                try { localStorage.removeItem(STORAGE_KEY) } catch { /* best-effort */ }
                window.location.reload()
                return
              } else {
                // Already reloaded once — give up on reload, use default state
                sessionStorage.removeItem(reloadKey)
                // Continue below — Zustand will use slice defaults
              }
            } catch {
              // sessionStorage unavailable — skip reload guard, just continue
            }
          }

          if (typeof window !== 'undefined') {
            window.addEventListener('storage-data-cleaned', () => useStore.persist.rehydrate())
          }
          setTimeout(() => {
            if (state && state.focusSessions) {
              try {
                const store = useStore.getState()
                const recomputed = computeRecomputedProgress(state.focusSessions, store.progress)
                useStore.setState({ progress: recomputed })
              } catch (e) { console.warn('Progress recomputation failed:', e) }
            }
            if (state && Array.isArray(state.habits)) {
              try {
                const updatedHabits = state.habits.map((h: any) => {
                  const dates = Array.isArray(h.completedDates) ? h.completedDates : []
                  const streak = calculateStreak(dates)
                  const best = Math.max(calculateLongestStreak(dates), h.longestStreak ?? h.bestStreak ?? 0, streak)
                  return { ...h, streak, bestStreak: best, currentStreak: h.currentStreak ?? streak, longestStreak: h.longestStreak ?? best, completionRate: h.completionRate ?? calculateCompletionRate(dates), completedCount: h.completedCount ?? dates.length }
                })
                useStore.setState({ habits: updatedHabits })
              } catch (e) { console.warn('Habit streak recomputation failed:', e) }
            }
            if (state && state.achievements) {
              try { useStore.getState().checkAchievements() } catch (e) { console.warn('Achievement check failed on rehydration:', e) }
            }
            if (state && Array.isArray(state.habits)) { syncHabitAlarms(state.habits) }
            if (state && Array.isArray(state.events)) { syncPlannerAlarms(state.events) }
            const stats = getStorageStats()
            if (stats.isCritical) {
              window.dispatchEvent(new CustomEvent('storage-quota-warning', { detail: { stats } }))
              try { cleanupOldData() } catch {}
            }
          }, 0)
        }
      },
    }
  )
)

// Layer 3: Hydration timeout safety net — if something slips through
// Layers 1 and 2, force hydration completion after 3 seconds so the app
// loads with default state instead of hanging forever.
if (typeof window !== 'undefined') {
  setTimeout(() => {
    if (!useStore.persist.hasHydrated()) {
      console.warn('[Store] Hydration timeout after 3s — forcing completion')
      try {
        useStore.persist.rehydrate()
      } catch { /* best-effort */ }
      // If still not hydrated after rehydrate, force finish
      setTimeout(() => {
        if (!useStore.persist.hasHydrated()) {
          try {
            // Manually signal hydration complete so useHydrated() unblocks
            useStore.persist.onFinishHydration(() => {})()
          } catch { /* best-effort */ }
        }
      }, 500)
    }
  }, 3000)
}

export { STORAGE_KEY } from './constants'
export type {
  Exam, Assignment, Achievement, ProductivityScore,
  Task, Habit, FocusSession,
  PlannerReminder, PlannerTaskHistoryEntry, StudyEvent, PlannerSettings,
  UserProgress, TimerSettings, OnboardingProfile,
  FocusShieldMode, DistractionRecord,
} from './types'
export { exportBackup, importBackup, validateSessions, repairFocusSessions } from './storage'
