'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Shield, Activity, Bell, Battery, Smartphone, BellRing, Clock, MonitorUp, ChevronDown, ChevronUp } from 'lucide-react'
import { useStore } from '@/lib/store'
import { deepLockPlugin } from '@/lib/deep-lock/plugin'
import { ACCESSIBILITY_CLAIMS } from './accessibility-claims'

type DisclosureLine = string | { type: 'heading'; text: string }

interface PermissionExpandedContent {
  title: string
  content: DisclosureLine[]
}

const PERMISSIONS: Array<{
  icon: React.ElementType
  name: string
  badge: string
  badgeStyle: 'required' | 'recommended' | 'optional'
  collapsed: string
  expanded?: PermissionExpandedContent
}> = [
  {
    icon: Eye,
    name: 'Accessibility Service',
    badge: 'REQUIRED FOR DEEP LOCK',
    badgeStyle: 'required',
    collapsed: 'Detects the foreground app package name during an active Focus session so Deep Lock can identify blocked apps.',
    expanded: {
      title: 'Accessibility Service',
      content: [
        { type: 'heading', text: 'What it accesses' },
        ACCESSIBILITY_CLAIMS.purpose,
        '',
        { type: 'heading', text: 'Other personal info' },
        ACCESSIBILITY_CLAIMS.personalInfo,
        '',
        { type: 'heading', text: 'Other user-generated content' },
        ACCESSIBILITY_CLAIMS.userGeneratedContent,
        '',
        { type: 'heading', text: 'What it does not access' },
        ACCESSIBILITY_CLAIMS.notCollected,
        '',
        { type: 'heading', text: 'How it is used' },
        ACCESSIBILITY_CLAIMS.coreFunctionality,
        '',
        { type: 'heading', text: 'Local storage' },
        'When a blocked-app attempt is recorded, Deep Lock stores the app\'s package name and display name, time of the attempt, Deep Lock mode, remaining focus time, and focus-session ID on this device.',
        '',
        { type: 'heading', text: 'Sharing & transmission' },
        ACCESSIBILITY_CLAIMS.storage,
        '',
        { type: 'heading', text: 'If you don\'t allow it' },
        'Deep Lock cannot use AccessibilityService to detect blocked foreground apps. Other Student OS features that do not depend on Deep Lock can continue to be used.'
      ]
    }
  },
  {
    icon: Activity,
    name: 'Usage Access',
    badge: 'REQUIRED FOR DEEP LOCK',
    badgeStyle: 'required',
    collapsed: 'Helps identify the currently active app and provides foreground-app detection for Deep Lock.',
    expanded: {
      title: 'Usage Access',
      content: [
        { type: 'heading', text: 'What it accesses' },
        'Usage Access allows Student OS to determine which application is currently in the foreground using Android\'s UsageStatsManager.',
        '',
        { type: 'heading', text: 'Why Deep Lock needs it' },
        'Deep Lock uses foreground-app information to identify apps that should be blocked during a focus session and to maintain reliable app detection.',
        '',
        { type: 'heading', text: 'How it differs from Accessibility' },
        'Usage Access and Accessibility Service are separate Android capabilities. Usage Access does not provide Student OS with the contents of the apps you use.',
        '',
        { type: 'heading', text: 'What it does not access' },
        'Usage Access does not give Student OS access to your messages, passwords, screen text, documents, or private content inside other applications.',
        '',
        { type: 'heading', text: 'Storage and processing' },
        'Usage information used for Deep Lock is processed on the device.',
        '',
        { type: 'heading', text: 'If you don\'t allow it' },
        'Deep Lock\'s foreground-app detection may not function correctly without Usage Access.'
      ]
    }
  },
  {
    icon: Bell,
    name: 'Notifications',
    badge: 'RECOMMENDED',
    badgeStyle: 'recommended',
    collapsed: 'Used for Focus, planner, alarm, and Deep Lock notifications.'
  },
  {
    icon: Battery,
    name: 'Battery Optimization',
    badge: 'RECOMMENDED',
    badgeStyle: 'recommended',
    collapsed: 'Helps Focus and Deep Lock remain reliable during background operation.'
  },
  {
    icon: BellRing,
    name: 'Do Not Disturb',
    badge: 'OPTIONAL',
    badgeStyle: 'optional',
    collapsed: 'Allows Focus mode to manage Do Not Disturb when you choose that feature.'
  },
  {
    icon: Clock,
    name: 'Exact Alarms',
    badge: 'OPTIONAL',
    badgeStyle: 'optional',
    collapsed: 'Allows Student OS to schedule time-sensitive alarms and reminders accurately, including scheduled focus-related events where applicable.'
  },
  {
    icon: MonitorUp,
    name: 'Pop-ups over other apps',
    badge: 'OPTIONAL',
    badgeStyle: 'optional',
    collapsed: 'Lets alarms and motivation reminders appear full-screen so you never miss them. You can turn this off anytime in system settings.'
  },
  {
    icon: Smartphone,
    name: 'Installed Apps / App Visibility',
    badge: 'OPTIONAL',
    badgeStyle: 'optional',
    collapsed: 'Helps identify available apps when creating Deep Lock allow/block lists.'
  }
]

/** The sole UI gateway to Android Accessibility Settings. */
export function AccessibilityDisclosure() {
  const visible = useStore((s) => s.showAccessibilityDisclosure)
  const setVisible = useStore((s) => s.setShowAccessibilityDisclosure)
  const [expandedPermission, setExpandedPermission] = useState<number | null>(null)

  if (!visible) return null

  const handleAllow = () => {
    // The affirmative tap is the only consent signal. Set consent BEFORE
    // opening Android Settings: the wrapper guard (ensureDisclosureAccepted)
    // and the native SharedPreferences guard both check this flag first.
    useStore.getState().setProminentDisclosureAccepted(true)
    setVisible(false)
    void deepLockPlugin.openAccessibilitySettings()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-modal-backdrop flex min-h-dynamic items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-disclosure-title"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="my-auto w-full max-w-xl overflow-hidden rounded-3xl border border-border/70 bg-card shadow-2xl"
      >
        <div className="border-b border-border/60 bg-secondary/10 px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Deep Lock permission</p>
              <p className="mt-0.5 text-sm text-muted-foreground">A clear choice before Android Settings</p>
            </div>
          </div>
        </div>
        <div className="space-y-5 px-6 py-7 sm:px-8">
          <Eye className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 id="accessibility-disclosure-title" className="max-w-md text-2xl font-semibold tracking-tight text-foreground">Allow Deep Lock to detect opened apps?</h2>
          <div className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>{ACCESSIBILITY_CLAIMS.purpose}</p>
            <p>{ACCESSIBILITY_CLAIMS.coreFunctionality}</p>

            <div className="rounded-xl border border-border/50 bg-secondary/30 p-4">
              <p className="text-xs font-semibold text-foreground">Other personal info</p>
              <p className="mt-1">{ACCESSIBILITY_CLAIMS.personalInfo}</p>
            </div>

            <div className="rounded-xl border border-border/50 bg-secondary/30 p-4">
              <p className="text-xs font-semibold text-foreground">Other user-generated content</p>
              <p className="mt-1">{ACCESSIBILITY_CLAIMS.userGeneratedContent}</p>
            </div>

            <p>{ACCESSIBILITY_CLAIMS.notCollected}</p>
            <p>{ACCESSIBILITY_CLAIMS.storage}</p>

            <p className="mt-2">
              <a
                href="https://studentos-privacy-hub.lovable.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                View full Privacy Policy ↗
              </a>
            </p>
          </div>

          <div className="border-t border-border/60 pt-5">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground mb-3">
              Permissions used by Student OS
            </p>
            <div className="space-y-2">
              {PERMISSIONS.map((perm, index) => {
                const Icon = perm.icon
                const isExpanded = expandedPermission === index
                const canExpand = !!perm.expanded

                const badgeColor = perm.badgeStyle === 'required' ? 'bg-primary/10 text-primary' :
                                    perm.badgeStyle === 'recommended' ? 'bg-amber-500/10 text-amber-500' :
                                    'bg-secondary text-muted-foreground'

                return (
                  <div key={perm.name} className="rounded-xl border border-border/50 bg-card p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="h-4 w-4 text-primary" />
                          <h3 className="text-sm font-semibold text-foreground">{perm.name}</h3>
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>
                          {perm.badge}
                        </span>
                      </div>
                      {canExpand && (
                        <button
                          type="button"
                          onClick={() => setExpandedPermission(isExpanded ? null : index)}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                          aria-expanded={isExpanded}
                          aria-label={isExpanded ? 'Collapse permission details' : 'Expand permission details'}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{perm.collapsed}</p>

                    <AnimatePresence>
                      {canExpand && isExpanded && perm.expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 pt-3 border-t border-border/30 space-y-2 text-xs text-muted-foreground">
                            {perm.expanded.content.map((line, i) =>
                              line === ''
                                ? <br key={i} />
                                : typeof line === 'object' && line.type === 'heading'
                                  ? <p key={i} className="text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground mt-1">{line.text}</p>
                                  : <p key={i} className="whitespace-pre-wrap">{typeof line === 'string' ? line : line.text}</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid gap-3 border-t border-border/60 pt-5 sm:grid-cols-2">
            <button type="button" onClick={handleAllow} className="min-h-12 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">Allow Deep Lock</button>
            <button type="button" onClick={() => setVisible(false)} className="min-h-12 rounded-xl border border-border bg-transparent px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">Not now</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}