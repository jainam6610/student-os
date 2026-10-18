import { sanitizeBoolean } from '../helpers'

export interface NavigationSlice {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  activeView: 'dashboard' | 'focus' | 'planner' | 'tasks' | 'habits' | 'analytics' | 'settings' | 'exams' | 'assignments' | 'deep-lock'
  setActiveView: (view: string) => void
  initialAnalyticsRange: string | null
  setInitialAnalyticsRange: (range: string | null) => void
}

const VALID_VIEWS = ['dashboard', 'focus', 'planner', 'tasks', 'habits', 'analytics', 'settings', 'exams', 'assignments', 'deep-lock'] as const

export const createNavigationSlice = (set: any, _get?: any, _api?: any): NavigationSlice => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: sanitizeBoolean(open, true) }),
  toggleSidebar: () => set((state: any) => ({ sidebarOpen: !state.sidebarOpen })),
  activeView: 'dashboard',
  setActiveView: (view) => set((state: any) => {
    if (VALID_VIEWS.includes(view as typeof VALID_VIEWS[number])) {
      return { activeView: view }
    }
    return state
  }),
  initialAnalyticsRange: null,
  setInitialAnalyticsRange: (range) => set({ initialAnalyticsRange: range }),
})
