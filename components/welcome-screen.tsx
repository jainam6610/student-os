'use client'

import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  GraduationCap, Sparkles, BookOpen, BarChart3, Timer,
  User, ArrowRight, Moon, Sunrise, Target, Zap, Shield,
  Eye, Activity, Bell, BatteryMedium, Clock, MonitorUp,
} from 'lucide-react'

import { spring, easing } from './motion'
import { OnboardingLayout } from './onboarding-layout'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { getPresetSyllabus } from '@/data/syllabus-presets'
import {
  useOnboardingNavigation,
  TOTAL_ONBOARDING_STEPS,
} from '@/hooks/use-onboarding'

const MAX_NAME_LENGTH = 50

const stepTitles: Record<string, string | undefined> = {
  welcome: undefined,
  profile: 'About You',
  goals: 'Your Targets',
  'exam-setup': 'Exam & Syllabus',
  motivation: 'Your Style',
  permissions: undefined,
  finish: undefined,
}

export function WelcomeScreen() {
  const setUserName = useStore((s) => s.setUserName)
  const setAcademicGoal = useStore((s) => s.setAcademicGoal)
  const setOnboardingComplete = useStore((s) => s.setOnboardingComplete)
  const setDailyGoal = useStore((s) => s.setDailyGoal)
  const setPreferredFocusDuration = useStore((s) => s.setPreferredFocusDuration)
  const setStudyStyle = useStore((s) => s.setStudyStyle)
  const setPlannerSettings = useStore((s) => s.setPlannerSettings)
  const setMainChallenge = useStore((s) => s.setMainChallenge)
  const setMotivationStyle = useStore((s) => s.setMotivationStyle)
  const setExamDate = useStore((s) => s.setExamDate)
  const setSyllabus = useStore((s) => s.setSyllabus)

  const nav = useOnboardingNavigation()

  const [name, setName] = useState('')
  const [dailyTarget, setDailyTarget] = useState(120)
  const [wakeTime, setWakeTime] = useState('06:30')
  const [sleepTime, setSleepTime] = useState('22:30')
  const [studyGoal, setStudyGoal] = useState('')
  const [focusStyle, setFocusStyle] = useState<'deep-work' | 'consistent' | 'sprint' | 'night-owl' | null>(null)
  const [challenge, setChallenge] = useState('')
  const [motivStyle, setMotivStyle] = useState<'calm' | 'direct' | 'encouraging'>('calm')
  const [examDateStr, setExamDateStr] = useState('')
  const [loadPresetSyllabus, setLoadPresetSyllabus] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  const stepIndex = nav.stepIndex

  const complete = useCallback(() => {
    const finalName = name.trim() || 'Student'
    setUserName(finalName)
    if (studyGoal) setAcademicGoal(studyGoal)
    if (focusStyle) setStudyStyle(focusStyle)
    setDailyGoal(dailyTarget)
    setPreferredFocusDuration(Math.min(120, dailyTarget))
    setPlannerSettings({ wakeTime, bedTime: sleepTime })
    if (challenge) setMainChallenge(challenge)
    setMotivationStyle(motivStyle)
    if (examDateStr) {
      setExamDate(new Date(examDateStr))
    }
    if (loadPresetSyllabus && studyGoal) {
      const presetMap: Record<string, string> = {
        jee: 'jee', neet: 'neet', boards: 'class-10',
        'class-12': 'class-12', upsc: 'upsc', college: 'other',
      }
      const presetType = presetMap[studyGoal]
      if (presetType) setSyllabus(getPresetSyllabus(presetType))
    }
    setOnboardingComplete(true)
  }, [name, dailyTarget, wakeTime, sleepTime, studyGoal, focusStyle, challenge, motivStyle, examDateStr, loadPresetSyllabus, setUserName, setStudyStyle, setAcademicGoal, setDailyGoal, setPreferredFocusDuration, setPlannerSettings, setMainChallenge, setMotivationStyle, setExamDate, setSyllabus, setOnboardingComplete])

  const isFullScreen = nav.step === 'welcome' || nav.step === 'permissions'

  return (
    <OnboardingLayout
      fullScreen={isFullScreen}
      title={isFullScreen ? undefined : stepTitles[nav.step]}
      currentStep={stepIndex}
      totalSteps={TOTAL_ONBOARDING_STEPS}
      onBack={isFullScreen ? null : nav.step === 'finish' ? null : nav.goBack}
      onSkip={isFullScreen ? null : nav.step === 'finish' ? null : complete}
      onContinue={nav.step === 'finish' ? complete : nav.goNext}
      canContinue={nav.step === 'welcome' || nav.step === 'finish' ? true : nav.step === 'profile' ? name.trim().length > 0 : true}
      continueLabel={nav.step === 'finish' ? 'Start using Student OS' : 'Continue'}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={nav.step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className={cn(isFullScreen ? 'w-full max-w-sm my-auto' : '')}
        >
          {/* ═══ STEP 1 — HERO ═══ */}
          {nav.step === 'welcome' && (
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-56 h-56 mb-8"
              >
                <div className="absolute inset-0 bg-primary/15 rounded-full blur-3xl opacity-30" />
                <div className="relative z-10 w-full h-full rounded-[32px] bg-surface-container-low backdrop-blur-xl border border-glass-border flex items-center justify-center shadow-2xl overflow-hidden">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center">
                      <GraduationCap className="h-8 w-8 text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-primary tracking-widest uppercase">Student OS</span>
                  </div>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="text-[28px] font-bold tracking-tight leading-tight"
              >
                Your workspace. <span className="text-primary">Your terms.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="mt-2 text-sm text-muted-foreground max-w-xs leading-relaxed"
              >
                Everything a student needs to stay organized, focused, and consistent — in one app.
              </motion.p>

              {/* Bento grid of 5 capabilities */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-6 gap-2 w-full mt-8"
              >
                <div className="col-span-3 rounded-2xl bg-surface-container-low backdrop-blur-sm border border-glass-border p-3 flex flex-col items-center gap-1.5">
                  <Timer className="h-5 w-5 text-primary" />
                  <span className="text-[10px] font-medium text-muted-foreground leading-tight text-center">Deep work timer</span>
                </div>
                <div className="col-span-3 rounded-2xl bg-surface-container-low backdrop-blur-sm border border-glass-border p-3 flex flex-col items-center gap-1.5">
                  <Shield className="h-5 w-5 text-primary/70" />
                  <span className="text-[10px] font-medium text-muted-foreground leading-tight text-center">Focus Shield</span>
                </div>
                <div className="col-span-2 rounded-2xl bg-surface-container-low backdrop-blur-sm border border-glass-border p-3 flex flex-col items-center gap-1.5">
                  <BarChart3 className="h-5 w-5 text-primary/60" />
                  <span className="text-[10px] font-medium text-muted-foreground leading-tight text-center">Analytics</span>
                </div>
                <div className="col-span-2 rounded-2xl bg-surface-container-low backdrop-blur-sm border border-glass-border p-3 flex flex-col items-center gap-1.5">
                  <Target className="h-5 w-5 text-primary/80" />
                  <span className="text-[10px] font-medium text-muted-foreground leading-tight text-center">Habits & streaks</span>
                </div>
                <div className="col-span-2 rounded-2xl bg-surface-container-low backdrop-blur-sm border border-glass-border p-3 flex flex-col items-center gap-1.5">
                  <BookOpen className="h-5 w-5 text-primary/50" />
                  <span className="text-[10px] font-medium text-muted-foreground leading-tight text-center">Planner</span>
                </div>
              </motion.div>

              <motion.button
                onClick={nav.goNext}
                whileTap={{ scale: 0.96 }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 h-14 w-full max-w-[260px] rounded-2xl bg-primary text-primary-foreground font-semibold text-base shadow-lg shadow-primary/25 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Set up your workspace"
              >
                Set up your workspace
                <ArrowRight className="h-5 w-5" />
              </motion.button>

              <motion.button
                type="button"
                onClick={complete}
                whileTap={{ scale: 0.96 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.3 }}
                className="mt-4 min-h-[44px] px-6 text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors rounded-xl"
                aria-label="Skip for now"
              >
                Skip for now
              </motion.button>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.3 }}
                className="mt-3 text-center text-xs text-muted-foreground/50"
              >
                <a
                  href="https://studentos-privacy-hub.lovable.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary/70 underline underline-offset-2 hover:text-primary transition-colors"
                >
                  Privacy Policy
                </a>
              </motion.p>
            </div>
          )}

          {/* ═══ STEP 2 — PROFILE ═══ */}
          {nav.step === 'profile' && (
            <div className="pb-4 space-y-5">
              <div className="relative group">
                <div className={cn(
                  'relative flex items-center gap-3 rounded-2xl border-2 bg-surface-container-low transition-all duration-200 px-4',
                  name.trim().length > 0 ? 'border-primary' : 'border-border/60'
                )}>
                  <User className={cn(
                    'h-5 w-5 shrink-0 transition-colors duration-200',
                    name.trim().length > 0 ? 'text-primary' : 'text-muted-foreground'
                  )} />
                  <div className="relative flex-1">
                    <input
                      ref={inputRef}
                      value={name}
                      maxLength={MAX_NAME_LENGTH}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      autoComplete="name"
                      className="peer w-full bg-transparent pt-5 pb-2 text-base font-medium outline-none text-foreground placeholder-transparent"
                    />
                    <label className={cn(
                      'absolute left-0 top-1/2 -translate-y-1/2 text-sm transition-all duration-200 pointer-events-none',
                      'peer-focus:text-xs peer-focus:top-2.5 peer-focus:-translate-y-0 peer-focus:text-primary',
                      name.trim().length > 0 && 'text-xs top-2.5 -translate-y-0 text-primary'
                    )}>
                      Your name
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-surface-container-low border border-border/60 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sunrise className="w-4 h-4 text-amber-400" />
                    <p className="text-xs font-medium text-muted-foreground">Wake up</p>
                  </div>
                  <input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="w-full bg-transparent text-lg font-bold text-foreground outline-none [color-scheme:dark]"
                  />
                </div>
                <div className="rounded-2xl bg-surface-container-low border border-border/60 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <p className="text-xs font-medium text-muted-foreground">Sleep</p>
                  </div>
                  <input
                    type="time"
                    value={sleepTime}
                    onChange={(e) => setSleepTime(e.target.value)}
                    className="w-full bg-transparent text-lg font-bold text-foreground outline-none [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-surface-container-low border border-border/60 p-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">What are you studying for?</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'boards', label: 'Board Exams' },
                    { value: 'jee', label: 'JEE' },
                    { value: 'neet', label: 'NEET' },
                    { value: 'class-12', label: 'Class 12 Boards' },
                    { value: 'college', label: 'College' },
                    { value: 'self-learning', label: 'Self Learning' },
                    { value: 'upsc', label: 'UPSC / Govt' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setStudyGoal(option.value === studyGoal ? '' : option.value)}
                      className={cn(
                        'py-2.5 px-3 rounded-xl text-xs font-medium transition-all border',
                        studyGoal === option.value
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-surface-container-high border-border/40 text-muted-foreground hover:border-border'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ STEP 3 — GOALS ═══ */}
          {nav.step === 'goals' && (
            <div className="pb-4 space-y-5">
              <div className="rounded-2xl bg-surface-container-low border border-border/60 p-4">
                <p className="text-xs font-medium text-muted-foreground mb-3">Daily study target</p>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setDailyTarget(Math.max(30, dailyTarget - 30))}
                    className="min-h-[44px] min-w-[44px] rounded-xl bg-surface-container-high border border-border/40 flex items-center justify-center text-foreground hover:border-primary/40 transition-all"
                    aria-label="Decrease target"
                  >
                    −
                  </button>
                  <div className="text-center">
                    <span className="text-2xl font-bold text-foreground">{dailyTarget}</span>
                    <span className="text-xs text-muted-foreground ml-1">min</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDailyTarget(Math.min(600, dailyTarget + 30))}
                    className="min-h-[44px] min-w-[44px] rounded-xl bg-surface-container-high border border-border/40 flex items-center justify-center text-foreground hover:border-primary/40 transition-all"
                    aria-label="Increase target"
                  >
                    +
                  </button>
                </div>
                <div className="mt-3 flex gap-1">
                  {[60, 120, 180, 240, 300].map((t) => (
                    <button
                      key={t}
                      onClick={() => setDailyTarget(t)}
                      className={cn(
                        'flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all border',
                        dailyTarget === t
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-surface-container-high border-border/30 text-muted-foreground'
                      )}
                    >
                      {t >= 60 ? `${t / 60}h` : `${t}m`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-surface-container-low border border-border/60 p-4">
                <p className="text-xs font-medium text-muted-foreground mb-3">Choose a focus area</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'deep-work', icon: Zap, label: 'Deep Work', color: 'text-primary' },
                    { value: 'consistent', icon: Target, label: 'Consistent', color: 'text-chart-2' },
                    { value: 'sprint', icon: Timer, label: 'Sprint', color: 'text-chart-3' },
                    { value: 'night-owl', icon: Moon, label: 'Night Owl', color: 'text-indigo-400' },
                  ].map((style) => {
                    const Icon = style.icon
                    const isActive = focusStyle === style.value
                    return (
                      <button
                        key={style.value}
                        onClick={() => setFocusStyle(isActive ? null : style.value as any)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all',
                          isActive
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-surface-container-high border-border/40 text-muted-foreground'
                        )}
                      >
                        <Icon className={cn('w-4 h-4', style.color)} />
                        <span className="text-[10px] font-medium">{isActive ? 'Selected' : style.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ═══ STEP 3.5 — EXAM DATE & SYLLABUS ═══ */}
          {nav.step === 'exam-setup' && (
            <div className="pb-4 space-y-5">
              <div className="rounded-2xl bg-surface-container-low border border-border/60 p-4">
                <p className="text-xs font-medium text-muted-foreground mb-3">When is your exam?</p>
                <input
                  type="date"
                  value={examDateStr}
                  onChange={(e) => setExamDateStr(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-surface-container-high border border-border/40 rounded-xl px-3 py-3 text-sm text-foreground outline-none [color-scheme:dark]"
                />
                <p className="text-[10px] text-muted-foreground/60 mt-2">Optional — you can set this later in Settings.</p>
              </div>

              {['jee', 'neet', 'boards', 'class-12', 'upsc', 'college'].includes(studyGoal) && (
                <div className="rounded-2xl bg-surface-container-low border border-border/60 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Load {studyGoal === 'jee' ? 'JEE' : studyGoal === 'neet' ? 'NEET' : studyGoal === 'class-12' ? 'Class 12' : studyGoal === 'upsc' ? 'UPSC' : studyGoal === 'boards' ? 'Class 10' : 'syllabus'} syllabus?
                    </p>
                    <button
                      onClick={() => setLoadPresetSyllabus(!loadPresetSyllabus)}
                      className={cn(
                        'relative w-10 h-6 rounded-full transition-colors',
                        loadPresetSyllabus ? 'bg-primary' : 'bg-secondary'
                      )}
                    >
                      <span className={cn(
                        'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                        loadPresetSyllabus ? 'translate-x-4.5' : 'translate-x-0.5'
                      )} />
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60">
                    {loadPresetSyllabus
                      ? studyGoal === 'jee' || studyGoal === 'neet'
                        ? '3 subjects, 18 topics pre-loaded. Edit in Planner tab.'
                        : studyGoal === 'boards'
                          ? '4 subjects, 25 topics pre-loaded. Edit in Planner tab.'
                          : studyGoal === 'class-12'
                            ? '4 subjects, 21 topics pre-loaded. Edit in Planner tab.'
                            : studyGoal === 'upsc'
                              ? '5 subjects, 17 topics pre-loaded. Edit in Planner tab.'
                              : 'Syllabus will be loaded. Edit in Planner tab.'
                      : 'You can build your own syllabus in the Planner tab.'}
                  </p>
                </div>
              )}

              {studyGoal && !['jee', 'neet', 'boards', 'class-12', 'upsc', 'college'].includes(studyGoal) && (
                <div className="rounded-2xl bg-surface-container-low border border-border/60 p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Custom syllabus</p>
                  <p className="text-[10px] text-muted-foreground/60">
                    You can add your own subjects and topics in the Planner tab after setup.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ═══ STEP 3.5 — MOTIVATION PREFERENCES ═══ */}
          {nav.step === 'motivation' && (
            <div className="pb-4 space-y-5">
              <div className="rounded-2xl bg-surface-container-low border border-border/60 p-4">
                <p className="text-xs font-medium text-muted-foreground mb-3">What usually gets in your way?</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'procrastination', label: 'Procrastination' },
                    { value: 'phone', label: 'Phone distractions' },
                    { value: 'consistency', label: 'Staying consistent' },
                    { value: 'starting', label: 'Starting tasks' },
                    { value: 'time', label: 'Managing time' },
                    { value: 'overwhelm', label: 'Getting overwhelmed' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setChallenge(challenge === option.value ? '' : option.value)}
                      className={cn(
                        'py-2.5 px-3 rounded-xl text-xs font-medium transition-all border',
                        challenge === option.value
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-surface-container-high border-border/40 text-muted-foreground hover:border-border'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-surface-container-low border border-border/60 p-4">
                <p className="text-xs font-medium text-muted-foreground mb-3">How should we keep you motivated?</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['calm', 'direct', 'encouraging'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setMotivStyle(s)}
                      className={cn(
                        'py-2.5 px-3 rounded-xl text-xs font-medium transition-all border capitalize',
                        motivStyle === s
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-surface-container-high border-border/40 text-muted-foreground hover:border-border'
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ STEP 3.5 — PERMISSIONS & PRIVACY (information only) ═══ */}
          {nav.step === 'permissions' && (
            <div className="w-full max-w-sm my-auto">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mb-6">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">Permissions &amp; Privacy</h2>
                <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-6">
                  Student OS runs entirely on this device. Nothing is uploaded, and no account is needed.
                  Here&apos;s what it may ask to use — you&apos;ll only be asked when you turn a feature on.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-2"
              >
                {[
                  { icon: Eye, name: 'Accessibility Service', type: 'For Deep Lock only', desc: 'Detects which app is open during Focus sessions. Never reads your screen, messages, or passwords.' },
                  { icon: Activity, name: 'Usage Access', type: 'For Deep Lock only', desc: 'Identifies the current foreground app to block distractions.' },
                  { icon: Bell, name: 'Notifications', type: 'Recommended', desc: 'Focus completion, reminders, alarms, and Deep Lock alerts.' },
                  { icon: BatteryMedium, name: 'Battery Optimization Exemption', type: 'Optional', desc: 'Keeps Focus sessions and alarms reliable in the background.' },
                  { icon: Clock, name: 'Exact Alarms', type: 'Optional', desc: 'Fires study and habit reminders at precise times.' },
                  { icon: MonitorUp, name: 'Pop-ups over other apps', type: 'Optional', desc: 'Shows reminders and alarms full-screen so you never miss them.' },
                ].map((p, i) => {
                  const Icon = p.icon
                  return (
                    <div key={i} className="flex items-start gap-3 rounded-2xl bg-surface-container-low border border-glass-border p-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">{p.name}</p>
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground uppercase tracking-wider shrink-0">{p.type}</span>
                        </div>
                        <p className="text-xs text-muted-foreground/70 leading-relaxed mt-0.5">{p.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="mt-6"
              >
                <button
                  onClick={nav.goNext}
                  className="h-14 w-full rounded-2xl bg-primary text-primary-foreground font-semibold text-base shadow-lg shadow-primary/25 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={complete}
                  className="mt-3 min-h-[44px] w-full text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors rounded-xl"
                  aria-label="Skip onboarding"
                >
                  Skip for now
                </button>
                <p className="mt-3 text-center text-xs text-muted-foreground/50">
                  <a
                    href="https://studentos-privacy-hub.lovable.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary/70 underline underline-offset-2 hover:text-primary transition-colors"
                  >
                    Privacy Policy
                  </a>
                </p>
              </motion.div>
            </div>
          )}

          {/* ═══ STEP 4 — FINISH ═══ */}
          {nav.step === 'finish' && (
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={spring.bouncy}
                className="relative w-32 h-32 mb-6"
              >
                <div className="absolute inset-0 bg-success/20 rounded-full blur-3xl" />
                <div className="relative w-full h-full rounded-[32px] bg-surface-container-low backdrop-blur-xl border border-glass-border flex items-center justify-center shadow-2xl overflow-hidden">
                  <Sparkles className="h-12 w-12 text-success" />
                </div>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, ...easing.standard }}
                className="text-2xl font-bold tracking-tight"
              >
                You&apos;re all set, {name.trim() || 'Student'}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, ...easing.standard }}
                className="mt-2 text-sm text-muted-foreground max-w-xs leading-relaxed"
              >
                Your workspace is ready. Here&apos;s what to do first:
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, ...spring.gentle }}
                className="mt-6 w-full space-y-2"
              >
                <div className="flex items-center gap-3 rounded-2xl bg-surface-container-low border border-glass-border p-4">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Timer className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xs text-left text-muted-foreground">Start a focus session — everything else can wait.</p>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-surface-container-low border border-glass-border p-4">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Target className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xs text-left text-muted-foreground">Create one task. Then another. Momentum builds.</p>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </OnboardingLayout>
  )
}
