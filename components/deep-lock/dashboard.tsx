'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { deepLockPlugin, type DeepLockStatus } from '@/lib/deep-lock/plugin'
import { Card } from '@/components/ui/glass-card'
import { WhitelistEditor } from './WhitelistEditor'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { Sparkles, Plus, X } from 'lucide-react'
import { syncMotivationAlarms } from '@/lib/motivation/scheduler'
import { showMotivation } from '@/lib/motivation/useMotivationPopup'
import { getDeepLockMotivation } from '@/lib/insights'
import {
  Shield, ShieldOff, ShieldCheck, Eye, Bell, Battery,
  Activity, Timer, AlertTriangle, Target, Smartphone,
  Play, Pause, Square, ChevronDown, ChevronUp,
  ExternalLink, Clock, Zap, Cpu,   BookOpen, CheckCircle2,
  Lightbulb, ArrowRight, ListChecks, MonitorUp,
} from 'lucide-react'

const POLL_INTERVAL = 3000
const TEAL = 'oklch(72% 0.11 185)'

type ProtectionLevel = 'excellent' | 'good' | 'needs-attention'

function computeProtectionScore(status: DeepLockStatus | null): { score: number; level: ProtectionLevel } {
  if (!status) return { score: 0, level: 'needs-attention' }
  let score = 0
  if (status.accessibilityEnabled) score += 25
  if (status.dndGranted) score += 10
  if (status.batteryOptimizationIgnored) score += 15
  if (status.serviceRunning) score += 10
  if (status.notificationPermissionGranted) score += 10
  if (status.sessionActive) score += 10
  score += status.todayDistractions > 0 ? 5 : 0
  score += status.totalFocusMs > 0 ? 5 : 0
  if (status.accessibilityEnabled && status.batteryOptimizationIgnored) score += 10
  return {
    score: Math.min(score, 100),
    level: score >= 85 ? 'excellent' : score >= 60 ? 'good' : 'needs-attention',
  }
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function TealRing({ value, max, size = 88, strokeWidth = 6 }: { value: number; max: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = max > 0 ? Math.min(value / max, 1) : 0
  const offset = circumference * (1 - progress)
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-border/40" />
      <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} strokeLinecap="round"
        style={{ stroke: TEAL }} strokeDasharray={circumference}
        initial={false} animate={{ strokeDashoffset: offset }} transition={{ duration: 0.6, ease: 'easeOut' }} />
    </svg>
  )
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full font-mono uppercase tracking-wider" style={{ backgroundColor: `${color}1a`, color }}>
      {label}
    </span>
  )
}

function PermissionCard({ label, description, icon: Icon, granted, onFix }: {
  label: string; description: string; icon: React.ElementType; granted: boolean | null; onFix?: () => void
}) {
  return (
    <div className={cn(
      'flex items-start gap-3 p-4 rounded-xl border transition-all',
      granted === true ? 'border-green-500/15' :
      granted === false ? 'border-amber-500/15' :
      'border-border/50'
    )}>
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
        granted === true ? 'bg-green-500/10' : granted === false ? 'bg-amber-500/10' : 'bg-secondary'
      )}>
        <Icon className={cn('w-5 h-5', granted === true ? 'text-green-400' : granted === false ? 'text-amber-400' : 'text-muted-foreground')} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className={cn(
            'text-[10px] font-medium px-1.5 py-0.5 rounded-full font-mono uppercase tracking-wider',
            granted === true ? 'bg-green-500/10 text-green-400' :
            granted === false ? 'bg-amber-500/10 text-amber-400' :
            'bg-secondary text-muted-foreground'
          )}>
            {granted === true ? 'On' : granted === false ? 'Off' : 'Unknown'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground/70 leading-relaxed">{description}</p>
      </div>
      {granted === false && onFix && (
        <button onClick={onFix}
          className="px-3 py-1.5 rounded-lg font-mono text-xs font-medium hover:opacity-80 transition-opacity shrink-0 min-h-[36px] min-w-[36px] flex items-center gap-1"
          style={{ backgroundColor: `${TEAL}1a`, color: TEAL }}>
          Fix <ExternalLink className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

function DiagnosticsRow({ label, healthy }: { label: string; healthy: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/20">
      <span className="text-sm text-foreground font-mono text-xs">{label}</span>
      <span className={cn(
        'text-xs font-medium px-2 py-0.5 rounded-full font-mono uppercase tracking-wider',
        healthy ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'
      )}>
        {healthy ? 'Healthy' : 'Needs Attention'}
      </span>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={cn("w-10 h-6 rounded-full p-1 transition-colors relative", checked ? "bg-accent" : "bg-muted")}>
      <motion.div layout className={cn("w-4 h-4 rounded-full bg-white shadow-sm", checked ? "ml-auto" : "")} />
    </button>
  )
}

export function DeepLockDashboard() {
  const [status, setStatus] = useState<DeepLockStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAllowedApps, setShowAllowedApps] = useState(false)
  const [showSetupGuide, setShowSetupGuide] = useState(false)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [fsiGranted, setFsiGranted] = useState<boolean | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const deepLockActive = useStore((s) => s.deepLockActive)
  const setDeepLockActive = useStore((s) => s.setDeepLockActive)
  const setFocusShieldMode = useStore((s) => s.setFocusShieldMode)
  const setShowAccessibilityDisclosure = useStore((s) => s.setShowAccessibilityDisclosure)
  const progress = useStore((s) => s.progress)
  const dailyGoal = useStore((s) => s.dailyGoal)
  const whitelistedApps = useStore((s) => s.whitelistedApps)
  const preferredFocusDuration = useStore((s) => s.preferredFocusDuration)
    const { showToast } = useToast()
  
  const motivationEnabled = useStore(s => s.motivationEnabled)
  const setMotivationEnabled = useStore(s => s.setMotivationEnabled)
  const motivationTimes = useStore(s => s.motivationTimes)
  const setMotivationTimes = useStore(s => s.setMotivationTimes)
  const motivationDays = useStore(s => s.motivationDays)
  const setMotivationDays = useStore(s => s.setMotivationDays)
  const examModeEnabled = useStore(s => s.examModeEnabled)
  const setExamModeEnabled = useStore(s => s.setExamModeEnabled)
  const recentMotivationIds = useStore(s => s.recentMotivationIds)
  const motivationStyle = useStore(s => s.motivationStyle)

  const addTime = () => {
    if (motivationTimes.length >= 3) return
    const defaults = ['09:00', '14:00', '20:00']
    const next = defaults.find(t => !motivationTimes.includes(t)) ?? '09:00'
    setMotivationTimes([...motivationTimes, next])
  }

  const removeTime = (index: number) => {
    setMotivationTimes(motivationTimes.filter((_, i) => i !== index))
  }

  const updateTime = (index: number, value: string) => {
    const updated = [...motivationTimes]
    updated[index] = value
    setMotivationTimes(updated)
  }

  const toggleDay = (day: number) => {
    const updated = motivationDays.includes(day)
      ? motivationDays.filter(d => d !== day)
      : [...motivationDays, day].sort()
    if (updated.length === 0) return
    setMotivationDays(updated)
  }

  useEffect(() => {
    void syncMotivationAlarms(motivationTimes, motivationDays, motivationEnabled, recentMotivationIds)
  }, [motivationTimes, motivationDays, motivationEnabled, recentMotivationIds])

  const fetchStatus = useCallback(async () => {
    try {
      const s = await deepLockPlugin.getDeepLockStatus()
      setStatus(s)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    pollRef.current = setInterval(fetchStatus, POLL_INTERVAL)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [fetchStatus])

  // Full-screen intent status (A14+ can revoke it; alarms degrade silently)
  useEffect(() => {
    void deepLockPlugin.checkFullScreenIntent()
      .then(r => setFsiGranted(r.granted))
      .catch(() => setFsiGranted(null))
  }, [])

  const { score: protectionScore, level: protectionLevel } = computeProtectionScore(status)

  const handleToggle = useCallback(async () => {
    if (deepLockActive) {
      await deepLockPlugin.stopDeepLock()
      setDeepLockActive(false)
      setFocusShieldMode('normal')
    } else {
      const missing: string[] = []
      if (!status?.accessibilityEnabled) missing.push('Accessibility Service')
      if (!status?.usageAccessGranted) missing.push('Usage Access')
      if (missing.length > 0) {
        showToast({ type: 'error', title: 'Permissions needed for Deep Lock', description: `Enable: ${missing.join(', ')}` })
        setShowAccessibilityDisclosure(true)
        return
      }
      await deepLockPlugin.startDeepLock(whitelistedApps, 'deep-lock', preferredFocusDuration)
      setDeepLockActive(true)
      setFocusShieldMode('deep-lock')
    }
    fetchStatus()
  }, [deepLockActive, setDeepLockActive, setFocusShieldMode, setShowAccessibilityDisclosure, fetchStatus, whitelistedApps, status, showToast])

  const handlePause = useCallback(async () => { await deepLockPlugin.pauseDeepLock(); fetchStatus() }, [fetchStatus])
  const handleResume = useCallback(async () => { await deepLockPlugin.resumeDeepLock(); fetchStatus() }, [fetchStatus])
  const handleStop = useCallback(async () => {
    await deepLockPlugin.stopDeepLock()
    setDeepLockActive(false)
    setFocusShieldMode('normal')
    fetchStatus()
  }, [setDeepLockActive, setFocusShieldMode, fetchStatus])

  const sessionCtx = status?.sessionContext
  const todayFocusMinutes = Math.round((status?.todayFocusMs ?? 0) / 60000)
  const sessionActive = status?.sessionState === 'active' || status?.sessionState === 'paused'
  const isRunning = status?.sessionState === 'active'

  const protectionColor = protectionLevel === 'excellent' ? 'text-green-400' : protectionLevel === 'good' ? 'text-amber-400' : 'text-red-400'
  const protectionBg = protectionLevel === 'excellent' ? 'bg-green-500/10' : protectionLevel === 'good' ? 'bg-amber-500/10' : 'bg-red-500/10'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-8 max-w-2xl mx-auto"
    >
      {/* Section 1 — Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="relative overflow-hidden p-6">
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(50% 60% at 50% 0%, ${TEAL}08, transparent 70%)`,
            }}
          />
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none"
            style={{ backgroundColor: `${TEAL}08` }}
          />

          <div className="relative z-10 flex items-start gap-5">
            <motion.div
              animate={deepLockActive ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: deepLockActive ? Infinity : 0, duration: 3 }}
              className={cn(
                'w-20 h-20 rounded-2xl flex items-center justify-center shrink-0',
                deepLockActive ? 'bg-green-500/10' : protectionLevel === 'excellent' ? 'bg-primary/10' : 'bg-amber-500/10'
              )}
            >
              {deepLockActive ? (
                <ShieldCheck className="w-10 h-10 text-green-400" />
              ) : protectionLevel === 'excellent' ? (
                <Shield className="w-10 h-10" style={{ color: TEAL }} />
              ) : (
                <ShieldOff className="w-10 h-10 text-amber-400" />
              )}
            </motion.div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: TEAL }}>Student OS</p>
                  <h1 className="text-2xl font-bold text-foreground tracking-tight">Deep Lock</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {deepLockActive ? 'Protecting your focus' : 'Block distractions during focus'}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="relative">
                    <TealRing value={protectionScore} max={100} size={56} strokeWidth={4} />
                    <span className={cn('absolute inset-0 flex items-center justify-center text-xs font-bold font-mono', protectionColor)}>
                      {protectionScore}
                    </span>
                  </div>
                  <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-mono">Score</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full font-mono uppercase tracking-wider', protectionBg, protectionColor)}>
                  {protectionLevel === 'excellent' ? 'Excellent' : protectionLevel === 'good' ? 'Good' : 'Needs Attention'}
                </span>
                {deepLockActive && (
                  <Badge label="Session Active" color="#22c55e" />
                )}
              </div>

              <button onClick={handleToggle}
                className={cn(
                  'mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all min-h-[48px] tracking-wide',
                  deepLockActive
                    ? 'bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25'
                    : 'text-white'
                )}
                style={deepLockActive ? {} : { backgroundColor: TEAL, boxShadow: `0 8px 32px ${TEAL}33` }}
              >
                {deepLockActive ? (
                  <><ShieldOff className="w-4 h-4" /> Stop Protection</>
                ) : (
                  <><Shield className="w-4 h-4" /> Enable Protection</>
                )}
              </button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Section 2 — Permissions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Permissions</h2>
          {!loading && status && (
            <span className="text-xs font-mono text-muted-foreground/60">
              {[status.accessibilityEnabled, status.usageAccessGranted, status.notificationPermissionGranted, status.batteryOptimizationIgnored, status.dndGranted].filter(Boolean).length}/5
            </span>
          )}
        </div>
        <div className="space-y-2">
          {loading ? (
            <>
              {[1,2,3,4].map(i => <div key={i} className="h-[72px] rounded-xl bg-card/50 border border-border/30 animate-pulse" />)}
            </>
          ) : (
            <>
              <PermissionCard
                label="Accessibility Service"
                description="Detects blocked apps and shows a warning screen"
                icon={Eye}
                granted={status?.accessibilityEnabled ?? null}
                onFix={() => setShowAccessibilityDisclosure(true)}
              />
              <PermissionCard
                label="Usage Access"
                description="Identifies the current foreground app"
                icon={Activity}
                granted={status?.usageAccessGranted ?? null}
                onFix={() => deepLockPlugin.openUsageAccessSettings()}
              />
              <PermissionCard
                label="Notifications"
                description="Alerts on blocked distraction attempts"
                icon={Bell}
                granted={status?.notificationPermissionGranted ?? null}
                onFix={() => deepLockPlugin.openNotificationSettings()}
              />
              <PermissionCard
                label="Battery Optimization"
                description="Prevents system from stopping the service"
                icon={Battery}
                granted={status?.batteryOptimizationIgnored ?? null}
                onFix={() => deepLockPlugin.requestIgnoreBatteryOptimization()}
              />
              {fsiGranted === false && (
                <PermissionCard
                  label="Pop-ups over other apps"
                  description="Lets alarms and reminders appear full-screen so you never miss them"
                  icon={MonitorUp}
                  granted={false}
                  onFix={() => deepLockPlugin.openNotificationSettings()}
                />
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Section 3 — Setup Guide */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <Card className="p-4">
          <button onClick={() => setShowSetupGuide(!showSetupGuide)}
            className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${TEAL}0d` }}>
                <BookOpen className="w-4 h-4" style={{ color: TEAL }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Setup Guide</p>
                <p className="text-xs font-mono text-muted-foreground">How to enable &amp; recommendations</p>
              </div>
            </div>
            {showSetupGuide ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          <AnimatePresence>
            {showSetupGuide && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-border/50 mt-4 space-y-5">

                  {/* Why Deep Lock */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <p className="text-sm font-semibold text-foreground">Why use Deep Lock?</p>
                    </div>
                    <ul className="space-y-2 pl-1">
                      {[
                        'Blocks distracting apps during focus sessions — no more impulse scrolling',
                        'Builds stronger study habits by enforcing your focus time',
                        'Tracks blocked attempts so you see your progress over time',
                        'Works offline — everything happens on your device',
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: TEAL }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Step-by-step */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <ListChecks className="w-4 h-4" style={{ color: TEAL }} />
                      <p className="text-sm font-semibold text-foreground">How to enable</p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Accessibility Service', desc: 'Required — lets Deep Lock detect and block distracting apps', icon: Eye },
                        { label: 'Usage Access', desc: 'Required — identifies which app is currently open', icon: Activity },
                        { label: 'Notifications', desc: 'Recommended — get notified when an app is blocked', icon: Bell },
                        { label: 'Battery Optimization', desc: 'Recommended — prevents Android from killing the service', icon: Battery },
                      ].map((step, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 border border-border/30">
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0"
                            style={{ backgroundColor: `${TEAL}1a`, color: TEAL }}>
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <step.icon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground">{step.label}</span>
                            </div>
                            <p className="text-xs text-muted-foreground/70 mt-0.5">{step.desc}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 shrink-0 text-muted-foreground/40" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tip */}
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                    <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <strong className="text-foreground">Tip:</strong> Start a focus session from the <strong className="text-foreground">Focus</strong> tab &mdash; if Deep Lock isn&apos;t set up, you&apos;ll see a prompt to enable it. You can also configure which apps are allowed from the <strong className="text-foreground">Allowed Apps</strong> section below.
                    </p>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* Section 4 — Active Session */}
      <AnimatePresence>
        {sessionActive && sessionCtx && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-5 overflow-hidden relative">
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(60% 50% at 30% 50%, ${TEAL}06, transparent 70%)` }}
              />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Timer className="w-3.5 h-3.5" style={{ color: TEAL }} />
                    Active Session
                  </h2>
                  <Badge label={isRunning ? 'Running' : 'Paused'} color={isRunning ? '#22c55e' : '#f59e0b'} />
                </div>

                <div className="flex items-center gap-6 mb-5">
                  <div className="relative">
                    <TealRing value={sessionCtx.elapsedMinutes} max={sessionCtx.totalMinutes} size={88} strokeWidth={6} />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold font-mono text-foreground">
                      {Math.round((sessionCtx.elapsedMinutes / Math.max(sessionCtx.totalMinutes, 1)) * 100)}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground font-mono">
                        {sessionCtx.remainingMinutes > 0 ? `${sessionCtx.remainingMinutes}m left` : 'Finishing...'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground font-mono">
                        {sessionCtx.interruptionCount} block{sessionCtx.interruptionCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground font-mono">
                        {sessionCtx.streak}d streak
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground/80 mt-1">
                      {getDeepLockMotivation(sessionCtx.interruptionCount, sessionCtx.remainingMinutes, motivationStyle)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {isRunning ? (
                    <button onClick={handlePause}
                      className="flex-1 py-3 rounded-xl bg-amber-500/15 text-amber-400 font-medium text-sm flex items-center justify-center gap-2 hover:bg-amber-500/25 transition-colors min-h-[44px] font-mono tracking-wide">
                      <Pause className="w-4 h-4" /> Pause
                    </button>
                  ) : (
                    <button onClick={handleResume}
                      className="flex-1 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:opacity-80 transition-opacity min-h-[44px] font-mono tracking-wide"
                      style={{ backgroundColor: `${TEAL}1a`, color: TEAL }}>
                      <Play className="w-4 h-4" /> Resume
                    </button>
                  )}
                  <button onClick={handleStop}
                    className="flex-1 py-3 rounded-xl bg-red-500/15 text-red-400 font-medium text-sm flex items-center justify-center gap-2 hover:bg-red-500/25 transition-colors min-h-[44px] font-mono tracking-wide">
                    <Square className="w-4 h-4" /> Stop
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section 4 — Stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="grid grid-cols-2 gap-3"
      >
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${TEAL}0d` }}>
              <Timer className="w-4 h-4" style={{ color: TEAL }} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-mono">Today</p>
              <p className="text-lg font-semibold text-foreground">{formatMinutes(todayFocusMinutes)}</p>
              <p className="text-[10px] text-muted-foreground/60 font-mono">
                {dailyGoal > 0 ? `${Math.round((todayFocusMinutes / dailyGoal) * 100)}% goal` : 'No goal'}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/5 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-mono">Blocked</p>
              <p className="text-lg font-semibold text-foreground">{status?.todayDistractions ?? 0}</p>
              <p className="text-[10px] text-muted-foreground/60 font-mono">
                {status && status.todayDistractions > 0 ? 'attempts' : 'all clear'}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-500/5 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-mono">Streak</p>
              <p className="text-lg font-semibold text-foreground">{progress.currentStreak}</p>
              <p className="text-[10px] text-muted-foreground/60 font-mono">Best: {progress.bestStreak}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${TEAL}0d` }}>
              <Shield className="w-4 h-4" style={{ color: TEAL }} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-mono">Total</p>
              <p className="text-lg font-semibold text-foreground">{formatMinutes(Math.round((status?.totalFocusMs ?? 0) / 60000))}</p>
              <p className="text-[10px] text-muted-foreground/60 font-mono">all time</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Section 5 — Allowed Apps + Diagnostics */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="space-y-3"
      >
        <Card className="p-4">
          <button onClick={() => setShowAllowedApps(!showAllowedApps)}
            className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${TEAL}0d` }}>
                <Smartphone className="w-4 h-4" style={{ color: TEAL }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Allowed Apps</p>
                <p className="text-xs font-mono text-muted-foreground">{whitelistedApps.length} whitelisted</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); deepLockPlugin.openAppManagement() }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium min-h-[36px] min-w-[36px] flex items-center gap-1 hover:opacity-80 transition-opacity"
                style={{ backgroundColor: `${TEAL}1a`, color: TEAL }}>
                Manage <ExternalLink className="w-3 h-3" />
              </button>
              {showAllowedApps ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </button>
          <AnimatePresence>
            {showAllowedApps && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-border/50 mt-4">
                  <WhitelistEditor />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        <Card className="p-4">
          <button onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">System</p>
                <p className="text-xs font-mono text-muted-foreground">Component health</p>
              </div>
            </div>
            {showDiagnostics ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          <AnimatePresence>
            {showDiagnostics && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-border/50 mt-4 space-y-1">
                  {loading ? (
                    <div className="text-sm text-muted-foreground text-center py-4 font-mono">Checking...</div>
                  ) : (
                    <>
                      <DiagnosticsRow label="Accessibility Service" healthy={status?.accessibilityEnabled === true} />
                      <DiagnosticsRow label="Usage Access" healthy={status?.usageAccessGranted === true} />
                      <DiagnosticsRow label="Foreground Service" healthy={status?.serviceRunning === true} />
                      <DiagnosticsRow label="Battery Optimization" healthy={status?.batteryOptimizationIgnored === true} />
                      <DiagnosticsRow label="Notifications" healthy={status?.notificationPermissionGranted === true} />
                      <DiagnosticsRow label="Do Not Disturb" healthy={status?.dndGranted === true} />
                      <DiagnosticsRow label="Session Persistence" healthy={status?.sessionContext !== null || !status?.sessionActive} />
                      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/20 mt-2">
                        <span className="text-sm text-foreground font-mono text-xs">Protection Plugin</span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full font-mono uppercase tracking-wider bg-green-500/10 text-green-400">Connected</span>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* Section 6 — Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3 px-1">Quick Actions</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setShowAccessibilityDisclosure(true)}
            className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border/50 hover:opacity-80 transition-opacity text-left min-h-[44px]">
            <Eye className="w-4 h-4 shrink-0" style={{ color: TEAL }} />
            <span className="text-sm font-medium text-foreground">Accessibility</span>
          </button>
          <button onClick={() => deepLockPlugin.openUsageAccessSettings()}
            className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border/50 hover:opacity-80 transition-opacity text-left min-h-[44px]">
            <Activity className="w-4 h-4 shrink-0" style={{ color: TEAL }} />
            <span className="text-sm font-medium text-foreground">Usage Access</span>
          </button>
          <button onClick={() => deepLockPlugin.openDndSettings()}
            className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border/50 hover:opacity-80 transition-opacity text-left min-h-[44px]">
            <Bell className="w-4 h-4 shrink-0" style={{ color: TEAL }} />
            <span className="text-sm font-medium text-foreground">Do Not Disturb</span>
          </button>
          <button onClick={() => deepLockPlugin.openBatteryOptimizationSettings()}
            className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border/50 hover:opacity-80 transition-opacity text-left min-h-[44px]">
            <Battery className="w-4 h-4 shrink-0" style={{ color: TEAL }} />
            <span className="text-sm font-medium text-foreground">Battery</span>
          </button>
        </div>
      </motion.div>

      {/* Section 7 — Motivation */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-accent/10">
                <Sparkles size={16} className="text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Motivation Engine</h3>
                <p className="text-xs text-muted-foreground">
                  Smart nudges to keep you studying
                </p>
              </div>
            </div>
            <Toggle
              checked={motivationEnabled}
              onChange={setMotivationEnabled}
            />
          </div>

          {motivationEnabled && (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Daily reminder times (max 3)
                </p>
                <div className="space-y-2">
                  {motivationTimes.map((time, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Clock size={14} className="text-muted-foreground" />
                      <input
                        type="time"
                        value={time}
                        onChange={e => updateTime(i, e.target.value)}
                        className="flex-1 bg-transparent text-sm border-none outline-none"
                      />
                      <button
                        onClick={() => removeTime(i)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  {motivationTimes.length < 3 && (
                    <button
                      onClick={addTime}
                      className="flex items-center gap-2 text-xs text-accent hover:opacity-80 transition-opacity">
                      <Plus size={14} />
                      Add reminder time
                    </button>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Remind me on
                </p>
                <div className="flex gap-1.5">
                  {['S','M','T','W','T','F','S'].map((day, i) => (
                    <button
                      key={i}
                      onClick={() => toggleDay(i)}
                      className={cn(
                        "w-8 h-8 rounded-full text-xs font-medium transition-all duration-150",
                        motivationDays.includes(i)
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-border">
                <div>
                  <p className="text-xs font-medium">Exam mode</p>
                  <p className="text-xs text-muted-foreground">
                    Extra motivation during exam season
                  </p>
                </div>
                <Toggle
                  checked={examModeEnabled}
                  onChange={setExamModeEnabled}
                />
              </div>

              <button
                onClick={() => showMotivation('grind', true)}
                className="w-full py-2 rounded-xl border border-border text-xs text-muted-foreground hover:border-accent hover:text-accent transition-all duration-150 flex items-center justify-center gap-2">
                <Sparkles size={13} />
                Preview a motivation message
              </button>
            </div>
          )}
        </Card>
      </motion.div>

    </motion.div>
  )
}


