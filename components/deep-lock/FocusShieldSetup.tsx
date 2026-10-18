'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { deepLockPlugin } from '@/lib/deep-lock/plugin'
import { spring } from '../motion'
import { cn } from '@/lib/utils'
import { Check, XCircle, Eye, Activity, Bell, Battery, Shield, ArrowRight, Sparkles, Smartphone } from 'lucide-react'

type PermissionStatus = 'granted' | 'missing' | 'recommended' | 'optional'

interface PermissionItem {
  key: string
  label: string
  description: string
  icon: React.ElementType
  importance: 'required' | 'recommended' | 'optional'
  check: () => Promise<boolean>
  openSettings: () => Promise<void>
}

export function FocusShieldSetup() {
  const showFocusShieldSetup = useStore((s) => s.showFocusShieldSetup)
  const setShowFocusShieldSetup = useStore((s) => s.setShowFocusShieldSetup)
  const setFocusShieldMode = useStore((s) => s.setFocusShieldMode)
  const setAccessibilityServiceEnabled = useStore((s) => s.setAccessibilityServiceEnabled)
  const setShowAccessibilityDisclosure = useStore((s) => s.setShowAccessibilityDisclosure)

  const [step, setStep] = useState<'intro' | 'permissions' | 'allowed-apps' | 'complete'>('intro')
  const [permissions, setPermissions] = useState<Record<string, PermissionStatus>>({})
  const [polling, setPolling] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const items: PermissionItem[] = [
    {
      key: 'accessibility',
      label: 'Accessibility Service',
      description: 'Detects and blocks distracting apps during focus sessions',
      icon: Eye,
      importance: 'required',
      check: async () => {
        const result = await deepLockPlugin.isAccessibilityServiceEnabled()
        return result.enabled
      },
      openSettings: async () => {
        setShowAccessibilityDisclosure(true)
      },
    },
    {
      key: 'usageAccess',
      label: 'Usage Access',
      description: 'Identifies the current foreground app to block',
      icon: Activity,
      importance: 'required',
      check: async () => {
        const result = await deepLockPlugin.isUsageAccessGranted()
        return result.granted
      },
      openSettings: () => deepLockPlugin.openUsageAccessSettings(),
    },
    {
      key: 'notifications',
      label: 'Notifications',
      description: 'Alerts on blocked distraction attempts',
      icon: Bell,
      importance: 'recommended',
      check: async () => {
        const result = await deepLockPlugin.isNotificationPermissionGranted()
        return result.granted
      },
      openSettings: () => deepLockPlugin.openNotificationSettings(),
    },
    {
      key: 'battery',
      label: 'Ignore Battery Optimization',
      description: 'Prevents the system from stopping the focus service',
      icon: Battery,
      importance: 'recommended',
      check: async () => {
        const result = await deepLockPlugin.isBatteryOptimizationIgnored()
        return result.ignored
      },
      openSettings: () => deepLockPlugin.requestIgnoreBatteryOptimization(),
    },
    {
      key: 'dnd',
      label: 'Do Not Disturb',
      description: 'Silences notifications during focus sessions (optional)',
      icon: Bell,
      importance: 'optional',
      check: async () => {
        const result = await deepLockPlugin.isDndAccessGranted()
        return result.granted
      },
      openSettings: () => deepLockPlugin.openDndSettings(),
    },
  ]

  const checkAllPermissions = useCallback(async () => {
    const results: Record<string, PermissionStatus> = {}
    for (const item of items) {
      const granted = await item.check()
      results[item.key] = granted ? 'granted' : item.importance === 'required' ? 'missing' : item.importance === 'recommended' ? 'recommended' : 'optional'
    }
    setPermissions(results)
    return results
  }, [])

  useEffect(() => {
    if (showFocusShieldSetup) {
      checkAllPermissions()
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [showFocusShieldSetup, checkAllPermissions])

  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    setPolling(true)
    pollRef.current = setInterval(async () => {
      const results = await checkAllPermissions()
      const allRequiredGranted = items
        .filter((i) => i.importance === 'required')
        .every((i) => results[i.key] === 'granted')
      if (allRequiredGranted) {
        setAccessibilityServiceEnabled(true)
        if (pollRef.current) clearInterval(pollRef.current)
        setPolling(false)
        setStep('complete')
      }
    }, 1500)
  }, [checkAllPermissions, items, setAccessibilityServiceEnabled])

  const handleOpenSettings = useCallback(async (item: PermissionItem) => {
    // ponytail: only the Accessibility item routes through the disclosure
    // (its openSettings opens it). All other permissions have their own
    // Android settings screens and must NOT be gated on disclosure consent.
    await item.openSettings()
    startPolling()
  }, [startPolling])

  const handleStartSetup = useCallback(() => {
    setStep('permissions')
    void checkAllPermissions()
  }, [checkAllPermissions])

  const handleComplete = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    setPolling(false)
    setFocusShieldMode('deep-lock')
    setShowFocusShieldSetup(false)
  }, [setFocusShieldMode, setShowFocusShieldSetup])

  const handleSkip = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    setPolling(false)
    setShowFocusShieldSetup(false)
  }, [setShowFocusShieldSetup])

  if (!showFocusShieldSetup) return null

  const requiredGranted = items
    .filter((i) => i.importance === 'required')
    .every((i) => permissions[i.key] === 'granted')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-background overflow-y-auto flex"
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md p-6 m-auto"
      >
        {step === 'intro' && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Focus Shield Setup</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              Deep Lock blocks distracting apps during your focus sessions. 
              It needs a few permissions to work properly.
            </p>
            <div className="space-y-3 text-left mb-8">
              {items.map((item) => (
                <div key={item.key} className="flex items-start gap-3 bg-card rounded-xl p-3 border border-border/50">
                  <item.icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleStartSetup}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center gap-2"
              >
                Start Setup
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleSkip}
                className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip — I&apos;ll set it up later
              </button>
            </div>
          </div>
        )}

        {step === 'permissions' && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-foreground mb-1">Required Permissions</h2>
              <p className="text-sm text-muted-foreground">
                {polling ? 'Checking...' : 'Tap each item to enable it in system settings'}
              </p>
            </div>

            <div className="space-y-2 mb-8">
              {items.map((item) => {
                const status = permissions[item.key] || 'missing'
                const Icon = item.icon
                const isGranted = status === 'granted'

                return (
                  <div
                    key={item.key}
                    className={cn(
                      'flex items-center gap-3 p-3.5 rounded-xl border transition-all',
                      isGranted
                        ? 'bg-green-500/5 border-green-500/20'
                        : status === 'recommended'
                        ? 'bg-amber-500/5 border-amber-500/20'
                        : status === 'optional'
                        ? 'bg-card border-border/50'
                        : 'bg-card border-border'
                    )}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      isGranted ? 'bg-green-500/10' : 'bg-secondary'
                    )}>
                      {isGranted
                        ? <Check className="w-5 h-5 text-green-400" />
                        : <Icon className="w-5 h-5 text-muted-foreground" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <span className={cn(
                          'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                          isGranted ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'
                        )}>
                          {isGranted ? 'Granted' : status === 'missing' ? 'Required' : status === 'recommended' ? 'Recommended' : 'Optional'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    {!isGranted && !polling && (
                      <button
                        onClick={() => handleOpenSettings(item)}
                        className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors shrink-0"
                      >
                        Enable
                      </button>
                    )}
                    {!isGranted && polling && (
                      <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>

            {polling && (
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground">
                  Waiting for permissions to be enabled...
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  After enabling a permission in Settings, return here automatically
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {requiredGranted ? (
                <button
                  onClick={() => setStep('allowed-apps')}
                  className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleSkip}
                  className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip for now
                </button>
              )}
            </div>
          </div>
        )}

        {step === 'allowed-apps' && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-foreground mb-1">Allowed Apps</h2>
              <p className="text-sm text-muted-foreground">
                Choose which apps can be used during focus sessions
              </p>
            </div>

            <div className="bg-card rounded-xl p-4 border border-border/50 mb-6">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Apps you mark as <strong className="text-foreground">Allowed</strong> will remain accessible
                during Deep Lock sessions. Everything else will be blocked.
              </p>
            </div>

            <div className="space-y-3 mb-8">
              <button
                onClick={() => deepLockPlugin.openAppManagement()}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Configure Apps</p>
                    <p className="text-xs text-muted-foreground">Select which apps to allow or block</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-primary shrink-0" />
              </button>
              <p className="text-[10px] text-muted-foreground/50 text-center">
                This can also be changed later from the Deep Lock dashboard
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleComplete}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Start Using Deep Lock
              </button>
              <button
                onClick={() => setStep('permissions')}
                className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6"
            >
              <Check className="w-12 h-12 text-green-400" />
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground mb-2">All Set!</h2>
            <p className="text-sm text-muted-foreground mb-8">
              Focus Shield is ready to protect your sessions.
            </p>
            <button
              onClick={handleComplete}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base"
            >
              Start Focusing
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
