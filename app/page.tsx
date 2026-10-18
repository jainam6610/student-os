'use client'

import { useEffect, lazy, Suspense, useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { Sidebar, MobileNav, MobileHeader, MobileSidebar } from '@/components/navigation'
import { RootErrorBoundary, ViewErrorBoundary } from '@/components/error-boundary'
import { ChunkErrorBoundary } from '@/components/chunk-error-boundary'
import { Loader } from '@/components/loader'
import { Footer } from '@/components/footer'
import { ToastProvider } from '@/components/ui/toast'
import { InstallPrompt } from '@/components/install-prompt'
import { WelcomeScreen } from '@/components/welcome-screen'
import { StorageMonitor } from '@/components/storage-monitor'
import { HomeErrorBoundary } from '@/components/home-error-boundary'
import { FocusShieldSetup } from '@/components/deep-lock/FocusShieldSetup'
import { AccessibilityDisclosure } from '@/components/compliance/AccessibilityDisclosure'
import { AlarmManager } from '@/components/AlarmManager'
import { MotivationManager } from '@/components/motivation/MotivationManager'
import { focusService } from '@/Focus/service/FocusService'
import { vibrate } from '@/lib/notifications'

const Dashboard = lazy(() => import('@/components/dashboard').then(m => ({ default: m.Dashboard })))
const FocusView = lazy(() => import('@/Focus/components/FocusView').then(m => ({ default: m.FocusView })))
const TaskManagement = lazy(() => import('@/components/tasks').then(m => ({ default: m.TaskManagement })))
const HabitTracking = lazy(() => import('@/components/habits').then(m => ({ default: m.HabitTracking })))
const StudyPlanner = lazy(() => import('@/components/planner').then(m => ({ default: m.StudyPlanner })))
const Analytics = lazy(() => import('@/components/analytics').then(m => ({ default: m.Analytics })))
const Settings = lazy(() => import('@/components/settings').then(m => ({ default: m.Settings })))
const AssignmentsPage = lazy(() => import('@/components/assignments').then(m => ({ default: m.AssignmentsPage })))
const Exams = lazy(() => import('@/components/exams'))
const DeepLockDashboard = lazy(() => import('@/components/deep-lock/dashboard').then(m => ({ default: m.DeepLockDashboard })))
const DiagnosticScreen = lazy(() => import('@/components/diagnostic-screen').then(m => ({ default: m.DiagnosticScreen })))

// Lazy-load intro components to reduce critical bundle size
const CinematicIntro = lazy(() => import('@/components/cinematic-intro').then(m => ({ default: m.CinematicIntro })))
const LaunchIntro = lazy(() => import('@/components/launch-intro').then(m => ({ default: m.LaunchIntro })))

type View = 'dashboard' | 'focus' | 'planner' | 'tasks' | 'habits' | 'analytics' | 'settings' | 'exams' | 'assignments' | 'deep-lock' | 'diagnostic'

const VALID_VIEWS: readonly View[] = ['dashboard', 'focus', 'planner', 'tasks', 'habits', 'analytics', 'settings', 'exams', 'assignments', 'deep-lock', 'diagnostic'] as const

const VIEW_TO_SECTION: Record<View, string> = {
  dashboard: 'Dashboard',
  focus: 'Focus Mode',
  planner: 'Planner',
  tasks: 'Tasks',
  habits: 'Habits',
  analytics: 'Analytics',
  settings: 'Settings',
  exams: 'Exams',
  assignments: 'Assignments',
  'deep-lock': 'Deep Lock',
  diagnostic: 'Diagnostic',
}

const VIEW_ORDER: View[] = ['dashboard', 'focus', 'planner', 'tasks', 'habits', 'analytics', 'settings', 'exams', 'assignments', 'deep-lock', 'diagnostic']

function isValidView(view: unknown): view is View {
  return VALID_VIEWS.includes(view as View)
}

function getViewFromUrl(): View | null {
  const params = new URLSearchParams(window.location.search)
  const view = params.get('view')
  if (view && isValidView(view)) return view
  return null
}

export function getStoredTheme(): 'light' | 'dark' | 'amoled' | null {
  try {
    const keys = ['student-os-storage-v3', 'student-os-storage-v2']
    for (const key of keys) {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      let parsed: Record<string, unknown>
      try { parsed = JSON.parse(raw) } catch { continue }
      const state = parsed.state || parsed
      if (state && typeof state === 'object') {
        const s = state as Record<string, unknown>
        if (s.theme === 'light' || s.theme === 'dark' || s.theme === 'amoled') return s.theme as 'light' | 'dark' | 'amoled'
      }
    }
  } catch { /* noop */ }
  return null
}

// ponytail: Zustand v5 fires onFinishHydration synchronously before the
// useEffect subscription, so useSyncExternalStore never flips to true.
// Simple mounted flag replaces the broken hydration hook.

function checkOnboardingComplete(): boolean {
  try {
    const keys = ['student-os-storage-v3', 'student-os-storage-v2']
    for (const key of keys) {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw)
      const state = parsed.state || parsed
      if (state && state.onboardingComplete === true) return true
    }
  } catch {}
  return false
}

export default function StudentOS() {
  const activeView = useStore((s) => s.activeView)
  const theme = useStore((s) => s.theme)
  const setActiveView = useStore((s) => s.setActiveView)
  const onboardingComplete = useStore((s) => s.onboardingComplete)
  const reducedMotion = useStore((s) => s.reducedMotion)
  const accentColor = useStore((s) => s.accentColor)
  const fontSize = useStore((s) => s.fontSize)

  const [mounted, setMounted] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [showIntro, setShowIntro] = useState<boolean | null>(null)
  const [showLaunchIntro, setShowLaunchIntro] = useState(false)

  const isInitialMount = useRef(true)
  const lastView = useRef<View>(activeView)
  const isNavigatingFromPopstate = useRef(false)
  const wasOnboardingRef = useRef(true)
  const [direction, setDirection] = useState(0)
  const sidebarOpen = useStore((s) => s.sidebarOpen)
  const setSidebarOpen = useStore((s) => s.setSidebarOpen)
  const handleOpenSidebar = useCallback(() => setSidebarOpen(true), [setSidebarOpen])

  // Initialize focus service and wire completion to Zustand store
  useEffect(() => {
    focusService.init()
    focusService.onComplete = (session) => {
      const store = useStore.getState()
      if (session.completed && session.kind !== 'break' && store.timerSettings?.vibrationEnabled) {
        vibrate([0, 120, 80, 120])
      }
      store.addFocusSession({
        startTime: new Date(session.startTime),
        endTime: new Date(session.endTime),
        duration: Math.round(session.elapsed / 60),
        targetDuration: Math.round(session.plannedDuration / 60),
        type: session.kind === 'break' ? 'break' : 'deep-work',
        completed: session.completed,
        interrupted: session.interrupted,
        status: session.completed ? 'completed' : 'interrupted',
        createdAt: new Date(),
        focusScore: Math.min(100, Math.round((session.elapsed / session.plannedDuration) * 100)),
        pauseCount: session.pauseCount,
        pauseMinutes: Math.round(session.pausedDuration / 60),
        distractions: 0,
      })
    }
    return () => { focusService.onComplete = null }
  }, [])

  // Defer intro detection to avoid blocking first paint
  useEffect(() => {
    setMounted(true)
    const wasOnboarded = checkOnboardingComplete()
    setShowIntro(wasOnboarded)
  }, [])

  // Global handler for native navigation requests (e.g., WarningActivity → Focus)
  useEffect(() => {
    ;(window as any).__navigateTo = (view: string) => {
      if (isValidView(view)) {
        setActiveView(view)
        if (view === 'focus') {
          window.dispatchEvent(new CustomEvent('app-foreground'))
        }
      }
    }
    return () => {
      delete (window as any).__navigateTo
    }
  }, [setActiveView])

  // Warn before closing tab with active focus session
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      const s = focusService.session
      if (s && (s.status === 'running' || s.status === 'paused')) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  // Auto-navigate to Focus when returning to app with an active session
  useEffect(() => {
    const handleAppForeground = () => {
      const s = focusService.session
      if (s && (s.status === 'running' || s.status === 'paused')) {
        setActiveView('focus')
      }
    }
    window.addEventListener('app-foreground', handleAppForeground)
    return () => window.removeEventListener('app-foreground', handleAppForeground)
  }, [setActiveView])

  useEffect(() => {
    if (mounted) {
      const wasOnboarding = wasOnboardingRef.current
      const nowComplete = onboardingComplete
      setShowOnboarding(!nowComplete)
      wasOnboardingRef.current = !nowComplete
      if (wasOnboarding && nowComplete) {
        setShowIntro(true)
      }
    }
  }, [mounted, onboardingComplete])

  // Combine theme + reducedMotion + accentColor + fontSize into single effect
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark', 'amoled')
    if (theme !== 'light') root.classList.add('dark')
    if (theme === 'amoled') root.classList.add('amoled')
    root.classList.toggle('motion-reduced', reducedMotion)
    root.dataset.accentColor = accentColor
    root.dataset.fontSize = fontSize
  }, [theme, reducedMotion, accentColor, fontSize])

  useEffect(() => {
    function handlePopstate() {
      const view = getViewFromUrl()
      if (view) {
        isNavigatingFromPopstate.current = true
        setActiveView(view)
        lastView.current = view
      }
    }
    window.addEventListener('popstate', handlePopstate)
    return () => window.removeEventListener('popstate', handlePopstate)
  }, [setActiveView])

  useEffect(() => {
    if (isInitialMount.current) {
      const view = getViewFromUrl()
      if (view) {
        setActiveView(view)
        lastView.current = view
      }
      isInitialMount.current = false
      return
    }

    if (isNavigatingFromPopstate.current) {
      isNavigatingFromPopstate.current = false
      return
    }

    if (activeView !== lastView.current) {
      const oldIdx = VIEW_ORDER.indexOf(lastView.current)
      const newIdx = VIEW_ORDER.indexOf(activeView)
      setDirection(newIdx > oldIdx ? 1 : -1)
      lastView.current = activeView
      const params = new URLSearchParams(window.location.search)
      params.set('view', activeView)
      const newUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`
      window.history.pushState(null, '', newUrl)
    }
  }, [activeView, setActiveView])

  const pageTransitionVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 60 : -60,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -40 : 40,
      opacity: 0,
    }),
  }

  // Ensure motion containers don't block scrolling
  const motionContainerProps = {
    style: { touchAction: 'auto', pointerEvents: 'auto' } as React.CSSProperties
  }

  const handleViewRender = useCallback((view: View) => {
    switch (view) {
      case 'dashboard': return <Dashboard />
      case 'focus': return <FocusView />
      case 'tasks': return <TaskManagement />
      case 'habits': return <HabitTracking />
      case 'planner': return <StudyPlanner />
      case 'analytics': return <Analytics />
      case 'settings': return <Settings />
      case 'assignments': return <AssignmentsPage />
      case 'exams': return <Exams />
      case 'deep-lock': return <DeepLockDashboard />
      case 'diagnostic': return <DiagnosticScreen />
      default: return <Dashboard />
    }
  }, [])

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false)
    if (onboardingComplete) {
      setShowLaunchIntro(true)
    }
  }, [onboardingComplete])

  const handleLaunchIntroComplete = useCallback(() => {
    setShowLaunchIntro(false)
  }, [])

  // Show nothing on first paint — avoid flash, then decide what to show
  const shouldRender = mounted && showIntro !== null
  if (!shouldRender) return null

  if (showIntro) {
    return (
      <Suspense fallback={null}>
        <CinematicIntro onComplete={handleIntroComplete} />
      </Suspense>
    )
  }

  if (showLaunchIntro) {
    return (
      <Suspense fallback={null}>
        <LaunchIntro onComplete={handleLaunchIntroComplete} />
      </Suspense>
    )
  }

  if (showOnboarding) {
    return (
      <motion.div
        key="onboarding"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <WelcomeScreen />
      </motion.div>
    )
  }

  return (
    <HomeErrorBoundary>
      <motion.div
        key="app"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <RootErrorBoundary>
          <ChunkErrorBoundary>
          <ToastProvider>
            <InstallPrompt />
            <MobileSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
            <FocusShieldSetup />
            <AccessibilityDisclosure />
            <StorageMonitor />
            <AlarmManager />
            <MotivationManager />
            <div className="flex h-dynamic flex-col">
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-skip-link focus:px-3 focus:py-1.5 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium"
              >
                Skip to main content
              </a>

              <Sidebar />

              <main id="main-content" className="flex-1 flex flex-col min-w-0 overflow-hidden" tabIndex={-1}>
                <MobileHeader onOpenSidebar={handleOpenSidebar} />

                <div className="scroll-container">
                  <div className="px-4 lg:px-6 py-4 lg:py-6 content-bottom-nav">
                    <AnimatePresence mode="wait" custom={direction}>
                      <motion.div
                        key={activeView}
                        custom={direction}
                        variants={pageTransitionVariants}
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="max-w-5xl mx-auto overflow-visible"
                        style={{ touchAction: 'auto', pointerEvents: 'auto', overflow: 'visible' }}
                      >
                        <ViewErrorBoundary sectionName={VIEW_TO_SECTION[activeView]}>
                          <Suspense fallback={<Loader />}>
                            {handleViewRender(activeView)}
                          </Suspense>
                        </ViewErrorBoundary>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
                <Footer />
              </main>

              <MobileNav />
            </div>
          </ToastProvider>
          </ChunkErrorBoundary>
        </RootErrorBoundary>
      </motion.div>
    </HomeErrorBoundary>
  )
}
