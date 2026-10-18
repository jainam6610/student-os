import type { FocusShieldMode, DistractionRecord } from '../types'
import type { MotivationCategory } from '../../motivation/messages'

export interface ShieldSlice {
  focusShieldMode: FocusShieldMode
  setFocusShieldMode: (mode: FocusShieldMode) => void
  distractions: DistractionRecord[]
  addDistraction: (record: DistractionRecord) => void
  whitelistedApps: string[]
  addWhitelistedApp: (packageName: string) => void
  removeWhitelistedApp: (packageName: string) => void
  deepLockActive: boolean
  setDeepLockActive: (active: boolean) => void
  accessibilityServiceEnabled: boolean | null
  setAccessibilityServiceEnabled: (enabled: boolean) => void
  showAccessibilityPrompt: boolean
  setShowAccessibilityPrompt: (show: boolean) => void
  showAccessibilityDisclosure: boolean
  setShowAccessibilityDisclosure: (show: boolean) => void
  showFocusShieldSetup: boolean
  setShowFocusShieldSetup: (show: boolean) => void
    autoDnd: boolean
  setAutoDnd: (enabled: boolean) => void
  motivationEnabled: boolean
  motivationTimes: string[]
  motivationDays: number[]
  motivationCategories: MotivationCategory[]
  recentMotivationIds: string[]
  examModeEnabled: boolean
  setMotivationEnabled: (v: boolean) => void
  setMotivationTimes: (times: string[]) => void
  setMotivationDays: (days: number[]) => void
  addRecentMotivationId: (id: string) => void
  setExamModeEnabled: (v: boolean) => void
}

export const createShieldSlice = (set: any, _get?: any, _api?: any): ShieldSlice => ({
  focusShieldMode: 'normal' as FocusShieldMode,
  setFocusShieldMode: (mode) => {
    if (['normal', 'deep-lock'].includes(mode)) set({ focusShieldMode: mode as FocusShieldMode })
  },
  distractions: [],
  addDistraction: (record) => set((state: any) => ({ distractions: [...state.distractions, record] })),
  whitelistedApps: [],
  addWhitelistedApp: (packageName) => set((state: any) => ({
    whitelistedApps: state.whitelistedApps.includes(packageName) ? state.whitelistedApps : [...state.whitelistedApps, packageName],
  })),
  removeWhitelistedApp: (packageName) => set((state: any) => ({
    whitelistedApps: state.whitelistedApps.filter((p: string) => p !== packageName),
  })),
  deepLockActive: false,
  setDeepLockActive: (active) => set({ deepLockActive: active }),
  accessibilityServiceEnabled: null,
  setAccessibilityServiceEnabled: (enabled) => set({ accessibilityServiceEnabled: enabled }),
  showAccessibilityPrompt: false,
  setShowAccessibilityPrompt: (show) => set({ showAccessibilityPrompt: show }),
  // Deliberately transient: this controls the one in-app disclosure immediately
  // before Android Accessibility Settings; it is never persisted as consent.
  showAccessibilityDisclosure: false,
  setShowAccessibilityDisclosure: (show) => set({ showAccessibilityDisclosure: show }),
  showFocusShieldSetup: false,
  setShowFocusShieldSetup: (show) => set({ showFocusShieldSetup: show }),
    autoDnd: false,
  setAutoDnd: (enabled) => set({ autoDnd: enabled }),
  motivationEnabled: true,
  motivationTimes: ['09:00', '14:00', '20:00'],
  motivationDays: [0, 1, 2, 3, 4, 5, 6],
  motivationCategories: ['start', 'grind', 'streak', 'comeback', 'exam', 'late_night'],
  recentMotivationIds: [],
  examModeEnabled: false,
  setMotivationEnabled: (v) => set({ motivationEnabled: v }),
  setMotivationTimes: (times) => set({ motivationTimes: times }),
  setMotivationDays: (days) => set({ motivationDays: days }),
  addRecentMotivationId: (id) => set((state: any) => ({
    recentMotivationIds: [id, ...state.recentMotivationIds].slice(0, 10)
  })),
  setExamModeEnabled: (v) => set({ examModeEnabled: v }),
})

