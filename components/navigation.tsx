'use client'

import { memo, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import {
  LayoutDashboard,
  Timer,
  Calendar,
  Target,
  BarChart3,
  Settings,
  Shield,
  Sparkles,
  Menu,
  ChevronLeft,
  Zap,
  X,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { spring } from './motion'
import { ProfileAvatar } from './profile-avatar'

const navItems = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'focus', label: 'Focus', icon: Timer },
  { id: 'planner', label: 'Planner', icon: Calendar },
  { id: 'habits', label: 'Routines', icon: Target },
  { id: 'deep-lock', label: 'Deep Lock', icon: Shield },
  { id: 'analytics', label: 'Trends', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const

const PARENT_VIEW: Record<string, string> = {
  dashboard: 'dashboard',
  focus: 'focus',
  planner: 'planner',
  tasks: 'planner',
  habits: 'habits',
  exams: 'planner',
  assignments: 'planner',
  'deep-lock': 'deep-lock',
  settings: 'settings',
  analytics: 'analytics',
}

const VIEW_TITLE: Record<string, string> = {
  dashboard: 'Home',
  focus: 'Focus',
  planner: 'Planner',
  tasks: 'Tasks',
  habits: 'Routines',
  exams: 'Exams',
  assignments: 'Assignments',
  'deep-lock': 'Deep Lock',
  settings: 'Settings',
  analytics: 'Trends',
}

type SidebarContentProps = {
  isMobile: boolean
  onNavClick?: () => void
  forceExpanded?: boolean
  hideHeader?: boolean
}

function SidebarContent({ isMobile, onNavClick, forceExpanded, hideHeader }: SidebarContentProps) {
  const storeSidebarOpen = useStore((s) => s.sidebarOpen)
  const setSidebarOpen = useStore((s) => s.setSidebarOpen)
  const setActiveView = useStore((s) => s.setActiveView)
  const activeView = useStore((s) => s.activeView)
  const progress = useStore((s) => s.progress)
  const userName = useStore((s) => s.userName)
  const dailyGoal = useStore((s) => s.dailyGoal)
  const todayMinutes = useStore((s) => {
    const todayStr = new Date().toDateString()
    let total = 0
    for (let i = 0; i < s.focusSessions.length; i++) {
      const fs = s.focusSessions[i]
      if (fs.endTime && new Date(fs.endTime).toDateString() === todayStr) {
        total += fs.duration
      }
    }
    return total
  })

  const sidebarOpen = forceExpanded ?? storeSidebarOpen

  const handleNav = (id: string) => {
    setActiveView(id as typeof activeView)
    if (isMobile) setSidebarOpen(false)
    onNavClick?.()
    setTimeout(() => document.getElementById('main-content')?.focus({ preventScroll: true }), 0)
  }

  const handleSidebarToggle = () => {
    if (isMobile) {
      onNavClick?.()
      return
    }
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="absolute inset-0 bg-sidebar lg:bg-sidebar/95" />
      <div className="relative z-10 flex flex-col h-full">
        {!hideHeader && (
          <div className={cn('flex items-center h-12 shrink-0', sidebarOpen ? 'px-4' : 'px-3')}>
            <div className={cn('flex items-center gap-2.5 overflow-hidden', !sidebarOpen && 'justify-center w-full')}>
              <motion.div
                className="w-7 h-7 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </motion.div>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={spring.snappy}
                  className="text-sm font-semibold text-sidebar-foreground whitespace-nowrap"
                >
                  Student OS
                </motion.span>
              )}
            </div>
          </div>
        )}

        <nav className="flex-1 py-2 overflow-y-auto no-scrollbar" aria-label="Main menu">
          <ul className={cn('space-y-0.5', sidebarOpen ? 'px-2' : 'px-1.5')} role="list">
            {navItems.map((item, i) => (
              <NavButton
                key={item.id}
                item={item}
                index={i}
                isActive={activeView === item.id || PARENT_VIEW[activeView] === item.id}
                sidebarOpen={sidebarOpen}
                onClick={() => handleNav(item.id)}
              />
            ))}
          </ul>
        </nav>

        <div className={cn('border-t border-sidebar-border py-1', sidebarOpen ? 'px-2' : 'px-1.5')}>
          <button
            onClick={() => {
              const event = new CustomEvent('open-global-search')
              window.dispatchEvent(event)
            }}
            className={cn(
              'w-full flex items-center gap-2.5 rounded-lg text-sm transition-colors text-sidebar-foreground/50 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/30 min-h-[44px]',
              sidebarOpen ? 'px-2.5 py-2' : 'justify-center p-2'
            )}
            title={!sidebarOpen ? 'Search (Ctrl+K)' : undefined}
          >
            <Search className="w-4 h-4 shrink-0" />
            {sidebarOpen && (
              <span className="flex-1 text-left truncate">Search</span>
            )}
            {sidebarOpen && (
              <kbd className="text-[10px] text-sidebar-foreground/30 bg-sidebar-accent/30 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
            )}
          </button>
        </div>

        <div className="border-t border-sidebar-border">
          <div className={cn('py-3', !sidebarOpen && 'flex justify-center')}>
            {sidebarOpen ? (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
                <ProfileAvatar size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-sidebar-foreground truncate leading-tight">{userName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <motion.div className="relative w-3.5 h-3.5 shrink-0" whileHover={{ scale: 1.05 }}>
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 14 14">
                        <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-sidebar-border" />
                        <motion.circle
                          cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5"
                          strokeDasharray={34.56}
                          strokeDashoffset={34.56 - ((progress.xp % 1000) / 1000) * 34.56}
                          className="text-primary" strokeLinecap="round"
                          animate={{ strokeDashoffset: 34.56 - ((progress.xp % 1000) / 1000) * 34.56 }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </svg>
                    </motion.div>
                    <p className="text-[11px] text-sidebar-foreground/40">{progress.xp.toLocaleString()} XP</p>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-sidebar-foreground/30">
                    <div className="w-full h-1 rounded-full bg-sidebar-border overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-primary/60"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((todayMinutes / dailyGoal) * 100, 100)}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="whitespace-nowrap">
                      {todayMinutes}m / {dailyGoal}m
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <ProfileAvatar size="sm" />
            )}
          </div>

          <div className={cn('pb-2 flex items-center gap-1', sidebarOpen ? 'px-2' : 'flex-col px-1.5')}>
            {sidebarOpen && (
              <div className="flex-1">
              </div>
            )}
            <button
              onClick={handleSidebarToggle}
              className={cn(
                'flex items-center justify-center rounded-lg text-sidebar-foreground/30 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors',
                sidebarOpen ? 'gap-1.5 px-2 py-1.5 text-xs' : 'p-1.5 w-full'
              )}
              aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <motion.span
                animate={{ rotate: sidebarOpen ? 0 : 180 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
              </motion.span>
              {sidebarOpen && <span>Collapse</span>}
            </button>
            {!sidebarOpen && (
              <div className="pt-1">
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const NavButton = memo(function NavButton({ item, index, isActive, sidebarOpen, onClick }: {
  item: typeof navItems[number]
  index: number
  isActive: boolean
  sidebarOpen: boolean
  onClick: () => void
}) {
  const Icon = item.icon
  return (
    <motion.li
      role="listitem"
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.02 }}
    >
      <button
        onClick={onClick}
        aria-current={isActive ? 'page' : undefined}
        aria-label={item.label}
        title={!sidebarOpen ? item.label : undefined}
        className={cn(
          'w-full flex items-center gap-2.5 rounded-lg text-sm transition-colors relative group',
          sidebarOpen ? 'px-2.5 py-2' : 'justify-center p-2',
        )}
      >
        {isActive && (
          <motion.span
            className="absolute inset-0 rounded-lg bg-sidebar-accent"
            initial={{ opacity: 0, scale: 0.93 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2.5 w-full">
          <motion.span
            className={cn(
              'shrink-0 transition-colors',
              isActive ? 'text-sidebar-foreground' : 'text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70'
            )}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
          </motion.span>
          {sidebarOpen && (
            <motion.span
              className={cn(
                'truncate relative z-10',
                isActive
                  ? 'text-sidebar-foreground font-medium'
                  : 'text-sidebar-foreground/50 hover:text-sidebar-foreground/80'
              )}
            >
              {item.label}
            </motion.span>
          )}
        </span>
      </button>
    </motion.li>
  )
})

/* ─── DESKTOP SIDEBAR ────────────── */
export const Sidebar = memo(function Sidebar() {
  const sidebarOpen = useStore((s) => s.sidebarOpen)

  return (
    <aside
      className={cn(
        'hidden lg:flex lg:flex-col lg:relative lg:border-r lg:border-sidebar-border shrink-0',
        'transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
        sidebarOpen ? 'lg:w-60' : 'lg:w-14'
      )}
      aria-label="Main navigation"
    >
      <SidebarContent isMobile={false} />
    </aside>
  )
})

type MobileSidebarProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const MobileSidebar = memo(function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) {
      document.body.classList.add('scroll-locked')
      closeButtonRef.current?.focus()
    } else {
      document.body.classList.remove('scroll-locked')
    }
    return () => { document.body.classList.remove('scroll-locked') }
  }, [open])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onOpenChange(false)
      return
    }
    if (e.key === 'Tab' && panelRef.current) {
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }, [onOpenChange])

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-sidebar-backdrop lg:hidden bg-black/50 backdrop-blur-[4px]"
        style={{
          pointerEvents: 'auto',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
        onClick={() => onOpenChange(false)}
        onKeyDown={(e) => e.key === 'Escape' && onOpenChange(false)}
        aria-hidden="true"
      />

      <aside
        ref={panelRef}
        onKeyDown={handleKeyDown}
        className={cn(
          'fixed top-0 left-0 bottom-0 z-sidebar-panel lg:hidden shadow-2xl',
          'w-[280px] max-w-[80vw] bg-sidebar border-r border-sidebar-border',
          'flex flex-col'
        )}
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-between h-12 shrink-0 px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-sidebar-foreground">
              Student OS
            </span>
          </div>
          <button
            ref={closeButtonRef}
            onClick={() => onOpenChange(false)}
            className="p-2.5 rounded-lg hover:bg-sidebar-accent/50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4 text-sidebar-foreground/50" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <SidebarContent isMobile={true} forceExpanded={true} hideHeader={true} onNavClick={() => onOpenChange(false)} />
        </div>
      </aside>
    </>
  )
})

export const MobileNav = memo(function MobileNav() {
  const activeView = useStore((s) => s.activeView)
  const setActiveView = useStore((s) => s.setActiveView)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-mobile-nav lg:hidden mobile-bottom-nav" aria-label="Mobile navigation">
      <div className="bg-card/95 backdrop-blur-sm border-t border-border shadow-2xl nav-safe-bottom">
        <div className="flex" role="list">
          {navItems.map((item) => {
            const isActive = activeView === item.id || PARENT_VIEW[activeView] === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as typeof activeView)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 py-2 px-1 flex-1 min-w-0 transition-colors relative',
                  'min-h-[48px] min-w-[48px]',
                  isActive ? 'text-foreground' : 'text-muted-foreground/60'
                )}
              >
                <motion.div
                  className="relative"
                  whileTap={{ scale: 0.85 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                >
                  {isActive && (
                    <motion.div
                      className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    />
                  )}
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </motion.div>
                <span className={cn('text-[10px] leading-none font-medium whitespace-nowrap', isActive && 'text-primary')}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
})

type MobileHeaderProps = {
  onOpenSidebar: () => void
}

export const MobileHeader = memo(function MobileHeader({ onOpenSidebar }: MobileHeaderProps) {
  const progress = useStore((s) => s.progress)
  const activeView = useStore((s) => s.activeView)

  const pageTitle = VIEW_TITLE[activeView] || 'Home'

  return (
    <header className="sticky top-0 z-mobile-header lg:hidden safe-top bg-card/95 backdrop-blur-sm border-b border-border" role="banner">
      <div className="flex items-center justify-between px-4 h-12">
        <div className="flex items-center gap-2">
          <motion.button
            onClick={onOpenSidebar}
            className="p-2.5 -ml-1.5 rounded-lg hover:bg-secondary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Open sidebar"
            whileTap={{ scale: 0.9 }}
          >
            <Menu className="w-4 h-4" aria-hidden="true" />
          </motion.button>
          <h1 className="text-sm font-medium">{pageTitle}</h1>
        </div>
        <motion.div
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-secondary text-xs text-muted-foreground"
          whileHover={{ scale: 1.02 }}
        >
          <Zap className="w-3 h-3 text-primary" aria-hidden="true" />
          <span>{progress.xp.toLocaleString()}</span>
        </motion.div>
      </div>
    </header>
  )
})
