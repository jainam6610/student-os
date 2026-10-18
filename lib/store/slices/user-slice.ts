import { sanitizeString, sanitizeBoolean, sanitizeNumber } from '../helpers'
import { normalizePlannerSettings } from '../../planner/utils'

export interface UserSlice {
  userName: string
  setUserName: (name: string) => void
  onboardingComplete: boolean
  setOnboardingComplete: (complete: boolean) => void
  resetOnboarding: () => void
  prominentDisclosureAccepted: boolean
  setProminentDisclosureAccepted: (accepted: boolean) => void
  avatar: string
  setAvatar: (avatar: string) => void
  theme: 'light' | 'dark' | 'amoled'
  setTheme: (theme: 'light' | 'dark' | 'amoled') => void
  studyStyle: 'deep-work' | 'consistent' | 'sprint' | 'night-owl'
  setStudyStyle: (style: 'deep-work' | 'consistent' | 'sprint' | 'night-owl') => void
  academicGoal: string
  setAcademicGoal: (goal: string) => void
  preferredFocusDuration: number
  setPreferredFocusDuration: (mins: number) => void
  timerSettings: import('../types').TimerSettings
  setTimerSettings: (settings: Partial<import('../types').TimerSettings>) => void
  onboardingProfile: import('../types').OnboardingProfile
  updateOnboardingProfile: (updates: Partial<import('../types').OnboardingProfile>) => void
  reducedMotion: boolean
  setReducedMotion: (reduced: boolean) => void
  dailyGoal: number
  setDailyGoal: (goal: number) => void
  accentColor: string
  setAccentColor: (color: string) => void
  fontSize: 'small' | 'medium' | 'large'
  setFontSize: (size: 'small' | 'medium' | 'large') => void
  compactMode: boolean
  setCompactMode: (compact: boolean) => void
  autoStartFocus: boolean
  setAutoStartFocus: (auto: boolean) => void
  showExamCountdownOnStartup: boolean
  setShowExamCountdownOnStartup: (v: boolean) => void
  mainChallenge: string
  setMainChallenge: (challenge: string) => void
  motivationStyle: 'calm' | 'direct' | 'encouraging'
  setMotivationStyle: (style: 'calm' | 'direct' | 'encouraging') => void
  examDate: Date | null
  setExamDate: (date: Date | null) => void
}

export const createUserSlice = (set: any, _get?: any, _api?: any): UserSlice => ({
  userName: 'Student',
  setUserName: (name) => set({ userName: sanitizeString(name, 'Student', 50) }),
  onboardingComplete: false,
  setOnboardingComplete: (complete) => set({ onboardingComplete: sanitizeBoolean(complete, false) }),
  prominentDisclosureAccepted: false,
  setProminentDisclosureAccepted: (accepted) => set({ prominentDisclosureAccepted: sanitizeBoolean(accepted, false) }),
  resetOnboarding: () => set({ onboardingComplete: false, userName: 'Student', avatar: 'initials' }),
  avatar: 'focused-learner',
  setAvatar: (avatar) => set({ avatar: sanitizeString(avatar, 'focused-learner', 30) }),

  theme: 'dark',
  setTheme: (theme) => {
    if (theme === 'light' || theme === 'dark' || theme === 'amoled') set({ theme })
  },

  studyStyle: 'deep-work',
  setStudyStyle: (style) => {
    if (['deep-work', 'consistent', 'sprint', 'night-owl'].includes(style)) set({ studyStyle: style })
  },
  academicGoal: '',
  setAcademicGoal: (goal) => set({ academicGoal: sanitizeString(goal, '', 100) }),
  preferredFocusDuration: 60,
  setPreferredFocusDuration: (mins) => set({ preferredFocusDuration: sanitizeNumber(mins, 60, 10, 240) }),
  timerSettings: {
    notificationEnabled: true, vibrationEnabled: true, backgroundSounds: false,
    autoBreak: false, breakDuration: 5, longBreakFrequency: 4,
    keepScreenAwake: true, animationsEnabled: true,
    alarmSound: 'studentos_alarm', strictFocus: false,
  },
  setTimerSettings: (updates) => set((state: any) => ({
    timerSettings: { ...state.timerSettings, ...updates },
  })),
  onboardingProfile: {
    name: 'Student', goal: 'Study consistently',
    sleepTime: '22:30', wakeTime: '06:30', sleepDurationMinutes: 480,
    dailyStudyMinutes: 180, focusDurationMinutes: 120,
    selectedHabits: ['Study Session', 'Drink Water', 'Evening Review'],
    enabledRoutines: ['Morning Routine', 'Study Routine'],
    preferredSessions: ['morning'],
    notifications: { enabled: false, habitReminders: false, studyReminders: false, alarmMode: false },
    skipped: false,
    classOrOccupation: '', studyGoal: '', habitGoals: [],
  },
  updateOnboardingProfile: (updates) => set((state: any) => ({
    onboardingProfile: {
      ...state.onboardingProfile,
      ...updates,
      notifications: { ...state.onboardingProfile.notifications, ...(updates.notifications ?? {}) },
      selectedHabits: Array.isArray(updates.selectedHabits)
        ? updates.selectedHabits.map((h: string) => sanitizeString(h, '', 80)).filter(Boolean).slice(0, 3)
        : state.onboardingProfile.selectedHabits,
      enabledRoutines: Array.isArray(updates.enabledRoutines)
        ? updates.enabledRoutines.map((r: string) => sanitizeString(r, '', 80)).filter(Boolean).slice(0, 3)
        : state.onboardingProfile.enabledRoutines,
      preferredSessions: Array.isArray(updates.preferredSessions)
        ? updates.preferredSessions.filter((s: string) => ['morning', 'afternoon', 'evening', 'night'].includes(s)).slice(0, 4)
        : state.onboardingProfile.preferredSessions,
      habitGoals: Array.isArray(updates.habitGoals)
        ? updates.habitGoals.filter(Boolean).slice(0, 5)
        : state.onboardingProfile.habitGoals,
      completedAt: updates.completedAt instanceof Date ? updates.completedAt : state.onboardingProfile.completedAt,
    },
  })),
  reducedMotion: false,
  setReducedMotion: (reduced) => set({ reducedMotion: sanitizeBoolean(reduced, false) }),

  dailyGoal: 120,
  setDailyGoal: (goal) => set({ dailyGoal: sanitizeNumber(goal, 120, 1, 1440) }),
  accentColor: 'purple',
  setAccentColor: (color) => set({ accentColor: sanitizeString(color, 'purple', 30) }),
  fontSize: 'medium' as 'small' | 'medium' | 'large',
  setFontSize: (size) => { if (['small', 'medium', 'large'].includes(size)) set({ fontSize: size }) },
  compactMode: false,
  setCompactMode: (compact) => set({ compactMode: sanitizeBoolean(compact, false) }),
  autoStartFocus: false,
  setAutoStartFocus: (auto) => set({ autoStartFocus: sanitizeBoolean(auto, false) }),
  showExamCountdownOnStartup: true,
  setShowExamCountdownOnStartup: (v) => set({ showExamCountdownOnStartup: sanitizeBoolean(v, true) }),
  mainChallenge: '',
  setMainChallenge: (challenge) => set({ mainChallenge: sanitizeString(challenge, '', 30) }),
  motivationStyle: 'calm' as 'calm' | 'direct' | 'encouraging',
  setMotivationStyle: (style) => {
    if (['calm', 'direct', 'encouraging'].includes(style)) set({ motivationStyle: style })
  },
  examDate: null,
  setExamDate: (date) => set({ examDate: date instanceof Date ? date : null }),
})
