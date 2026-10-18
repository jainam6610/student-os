'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { staggerContainer, staggerItem, spring } from './motion'
import { Card } from './ui/glass-card'
import { Button } from './ui/button'
import { format } from 'date-fns'
import {
  Moon, Sun, Monitor, Sparkles, Download, Upload, Trash2, Clock, Target,
  Instagram, User, ChevronRight, RotateCcw, Brain, BookOpen, Star, Eye, Zap, BellRing, X, Music, Coffee,
  Disc3, Volume2, Repeat, Type, Palette, Layout, Shield, Settings2, ChevronDown, Bell,
  Calendar, AlarmClock, Activity, Palette as PaletteIcon, FileText, Info, Terminal,
  Plus, Check, Music2, ListChecks, AlertTriangle, GraduationCap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProfileAvatar } from './profile-avatar'
import { DeepLockShieldSelector } from './deep-lock/DeepLockShieldSelector'
import { WhitelistEditor } from './deep-lock/WhitelistEditor'
import { AVATAR_CATEGORIES } from './ui/avatars'
import {
   getNotificationPermission,
   requestNotificationPermission,
   showTestNotification,
 } from '@/lib/notifications'
 import type { NotificationPermissionState } from '@/lib/notifications'
 import Alarm from '@/lib/plugins/alarm-plugin'
 import { scheduleAlarm } from '@/lib/scheduling'
 import { useToast } from './ui/toast'
 import { PrivacyPolicy } from './compliance/PrivacyPolicy'
 import { TermsOfService } from './compliance/TermsOfService'
  import { PermissionsInfo } from './compliance/PermissionsInfo'
 import { Licenses } from './compliance/Licenses'
 import { AboutInfo } from './compliance/AboutInfo'
 import { importAudioFiles, deleteTrack, renameTrack, getTracksMeta, MAX_TRACKS, type AmbientTrack } from '@/lib/ambient-db'
 import { useAmbientAudio } from '@/lib/useAmbientAudio'

const GOAL_PRESETS = [
  'IIT Bombay',
  '99% Boards',
  'NEET AIR <100',
  'JEE Advanced',
  'Become a Scientist',
  'Topper',
  'AI Engineer',
  'CA',
  'UPSC',
  'Olympiad Medal',
]

function SettingsSection({ title, icon: Icon, defaultOpen, children }: {
  title: string; icon: React.ElementType; defaultOpen?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  return (
    <motion.div variants={staggerItem} className="select-none">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wider hover:text-foreground transition-colors"
      >
        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
        <span className="flex-1 text-left">{title}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-3 space-y-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function Settings() {
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const userName = useStore((s) => s.userName)
  const setUserName = useStore((s) => s.setUserName)
  const progress = useStore((s) => s.progress)
  const resetOnboarding = useStore((s) => s.resetOnboarding)
  const dailyGoal = useStore((s) => s.dailyGoal)
  const setDailyGoal = useStore((s) => s.setDailyGoal)
  const studyStyle = useStore((s) => s.studyStyle)
  const setStudyStyle = useStore((s) => s.setStudyStyle)
  const academicGoal = useStore((s) => s.academicGoal)
  const setAcademicGoal = useStore((s) => s.setAcademicGoal)
  const preferredFocusDuration = useStore((s) => s.preferredFocusDuration)
  const setPreferredFocusDuration = useStore((s) => s.setPreferredFocusDuration)
  const timerSettings = useStore((s) => s.timerSettings)
  const setTimerSettings = useStore((s) => s.setTimerSettings)
  const musicSettings = useStore((s) => s.musicSettings)
  const setMusicSettings = useStore((s) => s.setMusicSettings)
  const reducedMotion = useStore((s) => s.reducedMotion)
  const setReducedMotion = useStore((s) => s.setReducedMotion)
  const avatar = useStore((s) => s.avatar)
  const setAvatar = useStore((s) => s.setAvatar)
  const focusShieldMode = useStore((s) => s.focusShieldMode)
  const setFocusShieldMode = useStore((s) => s.setFocusShieldMode)
  const distractions = useStore((s) => s.distractions)
  const whitelistedApps = useStore((s) => s.whitelistedApps)
  const deepLockActive = useStore((s) => s.deepLockActive)
  const [showWhitelistEditor, setShowWhitelistEditor] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const { showToast } = useToast()
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [goalInput, setGoalInput] = useState(academicGoal)
  const [goalMode, setGoalMode] = useState<'preset' | 'custom'>(
    academicGoal && !GOAL_PRESETS.includes(academicGoal) ? 'custom' : 'preset'
  )
  const [customGoalInput, setCustomGoalInput] = useState(
    academicGoal && !GOAL_PRESETS.includes(academicGoal) ? academicGoal : ''
  )
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [showDailyGoalModal, setShowDailyGoalModal] = useState(false)
  const [dailyGoalInput, setDailyGoalInput] = useState(dailyGoal.toString())
  const accentColor = useStore((s) => s.accentColor)
  const setAccentColor = useStore((s) => s.setAccentColor)
  const fontSize = useStore((s) => s.fontSize)
  const setFontSize = useStore((s) => s.setFontSize)
  const autoStartFocus = useStore((s) => s.autoStartFocus)
  const setAutoStartFocus = useStore((s) => s.setAutoStartFocus)
  const showExamCountdownOnStartup = useStore((s) => s.showExamCountdownOnStartup)
  const setShowExamCountdownOnStartup = useStore((s) => s.setShowExamCountdownOnStartup)
  const plannerSettings = useStore((s) => s.plannerSettings)
  const setPlannerSettings = useStore((s) => s.setPlannerSettings)
  const compactMode = useStore((s) => s.compactMode)
  const setCompactMode = useStore((s) => s.setCompactMode)
  const dashboardLayout = useStore((s) => s.dashboardLayout)
  const setDashboardLayout = useStore((s) => s.setDashboardLayout)
  const setActiveView = useStore((s) => s.setActiveView)
  const examDate = useStore((s) => s.examDate)
  const setExamDate = useStore((s) => s.setExamDate)
  const syllabus = useStore((s) => s.syllabus)
  const setSyllabus = useStore((s) => s.setSyllabus)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [showDurationModal, setShowDurationModal] = useState(false)
  const [durationInput, setDurationInput] = useState(preferredFocusDuration.toString())
  const [showVolumeModal, setShowVolumeModal] = useState(false)
  const [volumeInput, setVolumeInput] = useState(Math.round(musicSettings.maxVolumeLimit * 100).toString())
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)
  const [showTermsOfService, setShowTermsOfService] = useState(false)
  const setShowAccessibilityDisclosure = useStore((s) => s.setShowAccessibilityDisclosure)
  const [showPermissionsInfo, setShowPermissionsInfo] = useState(false)
  const [showLicenses, setShowLicenses] = useState(false)
  const [showAboutInfo, setShowAboutInfo] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionState>('default')

  useEffect(() => {
    setNotificationPermission(getNotificationPermission())
  }, [])

  const anyModalOpen = showClearConfirm || showGoalModal || showResetConfirm || showAvatarPicker || showDailyGoalModal || showPrivacyPolicy || showTermsOfService || showPermissionsInfo || showLicenses || showAboutInfo
  useEffect(() => {
    if (anyModalOpen) {
      document.body.classList.add('scroll-locked')
    } else {
      document.body.classList.remove('scroll-locked')
    }
    return () => {
      document.body.classList.remove('scroll-locked')
    }
  }, [anyModalOpen])

  const handleExport = async () => {
    try {
      const raw = localStorage.getItem('student-os-storage-v3')
      if (!raw) {
        showToast({ type: 'error', title: 'Nothing to export', description: 'No data found in storage.' })
        return
      }

      const fileName = `student-os-backup-${new Date().toISOString().split('T')[0]}.json`
      const blob = new Blob([raw], { type: 'application/json' })

      // Web Share API — works natively in Capacitor Android WebView (opens system share sheet)
      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
        const file = new File([blob], fileName, { type: 'application/json' })
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: 'Student OS Backup', text: 'Student OS data backup' })
            showToast({ type: 'success', title: 'Export ready', description: 'Choose where to save your backup.' })
            return
          } catch (shareErr: unknown) {
            // User cancelled the share sheet — not a real error
            if (shareErr instanceof Error && shareErr.name === 'AbortError') return
            // Fall through to data-URI fallback
            console.warn('Web Share failed, falling back to data URI:', shareErr)
          }
        }
      }

      // Fallback: data-URI download (works in desktop browsers)
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(raw)}`
      const a = document.createElement('a')
      a.href = dataUri
      a.download = fileName
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      showToast({ type: 'success', title: 'Export successful', description: 'Your backup file has been downloaded.' })
    } catch (err) {
      console.error('Export failed:', err)
      showToast({ type: 'error', title: 'Export failed', description: 'Could not create the backup file.' })
    }
  }

  const fileInputRef = useRef<HTMLInputElement>(null)
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = reader.result as string
        const parsed = JSON.parse(text)
        if (!parsed || typeof parsed !== 'object' || typeof parsed.version !== 'number' || !parsed.state) {
          setImportError('Invalid backup file: missing version or state')
          return
        }
        localStorage.setItem('student-os-storage-v3', text)
        window.location.reload()
      } catch {
        setImportError('Could not read file. Ensure it\'s a valid JSON backup.')
      }
    }
    reader.onerror = () => setImportError('Failed to read file')
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleClearData = () => {
    localStorage.removeItem('student-os-storage-v3')
      ;['student-os-storage', 'student-os-storage-v2'].forEach((k) => {
        try { localStorage.removeItem(k) } catch { }
      })
    window.location.reload()
  }

  const handleResetOnboarding = () => {
    resetOnboarding()
    setShowResetConfirm(false)
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-2 max-w-full">
      <motion.div variants={staggerItem}>
        <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Customize your experience</p>
      </motion.div>

      {/* ─── PROFILE ─────────────────────────────────────── */}
      <SettingsSection title="Profile" icon={User} defaultOpen>
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5">
            <motion.button
              onClick={() => setShowAvatarPicker(true)}
              whileHover={{ scale: 1.05 }}
              className="shrink-0 touch-target-sm"
            >
              <ProfileAvatar size="lg" />
            </motion.button>
            <div className="flex-1 min-w-0">
              <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)}
                className="text-sm sm:text-base font-semibold bg-transparent border-0 focus:outline-none focus:ring-0 w-full text-foreground"
                placeholder="Your name" aria-label="Your name" maxLength={50} />
              <div className="flex items-center gap-2 sm:gap-3 mt-0.5 text-[10px] sm:text-xs text-muted-foreground">
                <span>Level {progress.level}</span>
                <span>{progress.xp.toLocaleString()} XP</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 border-t border-border">
            <div className="p-2.5 sm:p-3.5 text-center border-r border-border">
              <p className="text-base sm:text-lg font-semibold text-foreground">{Math.floor(progress.totalFocusTime / 60)}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Hours focused</p>
            </div>
            <div className="p-2.5 sm:p-3.5 text-center border-r border-border">
              <p className="text-base sm:text-lg font-semibold text-foreground">{progress.totalTasksCompleted}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Tasks done</p>
            </div>
            <div className="p-2.5 sm:p-3.5 text-center">
              <p className="text-base sm:text-lg font-semibold text-foreground">{progress.bestStreak}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Best streak</p>
            </div>
          </div>
        </Card>
      </SettingsSection>

      {/* ─── GENERAL ─────────────────────────────────────── */}
      <SettingsSection title="General" icon={Settings2} defaultOpen>
        <Card className="p-0 overflow-hidden">
          <SettingRow icon={<Target className="w-4 h-4" />} title="Academic goal" description={academicGoal || 'Not set'} onClick={() => setShowGoalModal(true)} />
          <SettingRow icon={<Clock className="w-4 h-4" />} title="Daily focus goal" description={`${dailyGoal} min/day`} onClick={() => setShowDailyGoalModal(true)} />
          <SettingRow icon={<Brain className="w-4 h-4" />} title="Study style" description={studyStyle.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')} />
          <SettingRow icon={<Layout className="w-4 h-4" />} title="Compact mode" description={compactMode ? 'On' : 'Off'} onClick={() => setCompactMode(!compactMode)} isLast />
        </Card>
        {/* Study style picker */}
        <Card className="p-1 sm:p-1.5 mt-2">
          <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
            {([['deep-work', 'Deep Work', Brain], ['consistent', 'Consistent', Target], ['sprint', 'Sprint', Zap], ['night-owl', 'Night Owl', Moon]] as const).map(([value, label, Icon]) => (
              <button key={value} onClick={() => setStudyStyle(value)}
                className={cn('flex flex-col items-center gap-1 p-2 sm:p-2.5 rounded-xl transition-colors text-[10px] sm:text-xs', studyStyle === value ? 'bg-secondary text-foreground' : 'hover:bg-secondary/50 text-muted-foreground')}
                aria-label={`Study style: ${label}`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /><span>{label}</span>
              </button>
            ))}
          </div>
        </Card>
      </SettingsSection>

      {/* ─── FOCUS ──────────────────────────────────────── */}
      <SettingsSection title="Focus" icon={Clock} defaultOpen>
        <Card className="p-0 overflow-hidden">
          <SettingRow icon={<Clock className="w-4 h-4" />} title="Default duration" description={`${preferredFocusDuration} min`} onClick={() => { setDurationInput(preferredFocusDuration.toString()); setShowDurationModal(true) }} />
          <SettingRow icon={<BellRing className="w-4 h-4" />} title="Completion sound" description={timerSettings.notificationEnabled ? 'On' : 'Off'} onClick={() => setTimerSettings({ notificationEnabled: !timerSettings.notificationEnabled })} />
          <SettingRow icon={<Zap className="w-4 h-4" />} title="Vibration" description={timerSettings.vibrationEnabled ? 'On' : 'Off'} onClick={() => setTimerSettings({ vibrationEnabled: !timerSettings.vibrationEnabled })} />
          <SettingRow icon={<Music className="w-4 h-4" />} title="Background sounds" description={timerSettings.backgroundSounds ? 'On' : 'Off'} onClick={() => setTimerSettings({ backgroundSounds: !timerSettings.backgroundSounds })} />
          <SettingRow icon={<Coffee className="w-4 h-4" />} title="Auto break" description={timerSettings.autoBreak ? `${timerSettings.breakDuration} min` : 'Off'} onClick={() => setTimerSettings({ autoBreak: !timerSettings.autoBreak })} />
          {timerSettings.autoBreak && (
            <>
              <SettingRow icon={<Clock className="w-4 h-4" />} title="Break duration" description={`${timerSettings.breakDuration} min`} onClick={() => {
                const options = [5, 10, 15, 20]
                const next = options[(options.indexOf(timerSettings.breakDuration) + 1) % options.length]
                setTimerSettings({ breakDuration: next })
              }} />
              <SettingRow icon={<RotateCcw className="w-4 h-4" />} title="Long break after" description={`Every ${timerSettings.longBreakFrequency} sessions`} onClick={() => {
                const options = [2, 3, 4, 6]
                const next = options[(options.indexOf(timerSettings.longBreakFrequency) + 1) % options.length]
                setTimerSettings({ longBreakFrequency: next })
              }} />
            </>
          )}
          <SettingRow icon={<Sun className="w-4 h-4" />} title="Keep screen awake" description={timerSettings.keepScreenAwake ? 'On' : 'Off'} onClick={() => setTimerSettings({ keepScreenAwake: !timerSettings.keepScreenAwake })} />
          <SettingRow icon={<Eye className="w-4 h-4" />} title="Timer animations" description={timerSettings.animationsEnabled ? 'On' : 'Off'} onClick={() => setTimerSettings({ animationsEnabled: !timerSettings.animationsEnabled })} />
          <SettingRow icon={<Activity className="w-4 h-4" />} title="Auto-start focus" description={autoStartFocus ? 'On' : 'Off'} onClick={() => setAutoStartFocus(!autoStartFocus)} />
          <SettingRow icon={<Bell className="w-4 h-4" />} title="Show exam countdown on startup" description={showExamCountdownOnStartup ? 'On' : 'Off'} onClick={() => setShowExamCountdownOnStartup(!showExamCountdownOnStartup)} isLast />
        </Card>
      </SettingsSection>

      {/* ─── FOCUS SHIELD ────────────────────────────────── */}
      <SettingsSection title="Focus Shield" icon={Shield} defaultOpen>
        <Card className="p-4 space-y-3">
          <DeepLockShieldSelector embedded />
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Allowed apps</p>
                <p className="text-xs text-muted-foreground">{whitelistedApps.length} apps whitelisted</p>
              </div>
            </div>
            <button
              onClick={() => setShowWhitelistEditor(true)}
              className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
            >
              Manage
            </button>
          </div>
          {distractions.length > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-foreground">Distractions</p>
                  <p className="text-xs text-muted-foreground">{distractions.length} recorded</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {distractions.filter((d) => d.timestamp > Date.now() - 7 * 86400000).length} this week
              </span>
            </div>
          )}
          {deepLockActive && (
            <div className="flex items-center gap-2 text-xs text-primary/80 bg-primary/5 rounded-lg px-3 py-2">
              <Shield className="w-4 h-4" />
              Deep Lock is active
            </div>
          )}
        </Card>
      </SettingsSection>

      {/* ─── PLANNER ─────────────────────────────────────── */}
      <SettingsSection title="Planner" icon={Calendar}>
        <Card className="p-0 overflow-hidden">
          <SettingRow icon={<Moon className="w-4 h-4" />} title="Bedtime" description={plannerSettings.bedTime} onClick={() => {}}>
            <input type="time" value={plannerSettings.bedTime} onChange={(e) => setPlannerSettings({ bedTime: e.target.value })}
              className="bg-secondary/50 rounded-lg px-2 py-1 text-xs text-foreground border border-border" />
          </SettingRow>
          <SettingRow icon={<Sun className="w-4 h-4" />} title="Wake time" description={plannerSettings.wakeTime} onClick={() => {}}>
            <input type="time" value={plannerSettings.wakeTime} onChange={(e) => setPlannerSettings({ wakeTime: e.target.value })}
              className="bg-secondary/50 rounded-lg px-2 py-1 text-xs text-foreground border border-border" />
          </SettingRow>
          <SettingRow icon={<Layout className="w-4 h-4" />} title="Default view" description={plannerSettings.defaultView === 'syllabus' ? 'syllabus' : plannerSettings.defaultView} onClick={() => {
            const views: Array<'day' | 'week' | 'month' | 'agenda'> = ['day', 'week', 'month', 'agenda']
            const idx = views.indexOf(plannerSettings.defaultView as 'day' | 'week' | 'month' | 'agenda')
            setPlannerSettings({ defaultView: views[(idx + 1) % views.length] })
          }} />
          <SettingRow icon={<BellRing className="w-4 h-4" />} title="Default reminder" description={`${plannerSettings.defaultReminderMinutes} min before`} onClick={() => {
            const options = [5, 10, 15, 30, 60]
            const idx = options.indexOf(plannerSettings.defaultReminderMinutes)
            setPlannerSettings({ defaultReminderMinutes: options[(idx + 1) % options.length] })
          }} isLast />
        </Card>
      </SettingsSection>

      {/* ─── EXAM & SYLLABUS ───────────────────────────── */}
      <SettingsSection title="Exam & Syllabus" icon={GraduationCap}>
        <Card className="p-0 overflow-hidden">
          <SettingRow icon={<Calendar className="w-4 h-4" />} title="Exam date" description={examDate ? format(examDate, 'MMM d, yyyy') : 'Not set'} onClick={() => {}}>
            <input type="date" value={examDate ? format(examDate, 'yyyy-MM-dd') : ''} onChange={(e) => setExamDate(e.target.value ? new Date(e.target.value) : null)}
              min={new Date().toISOString().split('T')[0]}
              className="bg-secondary/50 rounded-lg px-2 py-1 text-xs text-foreground border border-border [color-scheme:dark]" />
          </SettingRow>
          <SettingRow icon={<BookOpen className="w-4 h-4" />} title="Syllabus" description={syllabus ? `${syllabus.subjects.length} subjects loaded` : 'No syllabus'} onClick={() => setActiveView('planner')} />
          <SettingRow icon={<RotateCcw className="w-4 h-4" />} title="Reset syllabus" description="Clear all progress" onClick={() => { if (window.confirm('Reset syllabus? All chapter/topic progress will be lost.')) setSyllabus(null) }} isLast />
        </Card>
      </SettingsSection>

      {/* ─── NOTIFICATIONS ──────────────────────────────── */}
      <SettingsSection title="Notifications" icon={Bell}>
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Browser notifications</p>
                <p className="text-xs text-muted-foreground">
                  {notificationPermission === 'granted' ? 'Enabled' : notificationPermission === 'denied' ? 'Blocked' : 'Not requested'}
                </p>
              </div>
            </div>
            {notificationPermission === 'granted' ? (
              <button onClick={() => showTestNotification()}
                className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                Test
              </button>
            ) : notificationPermission === 'denied' ? (
              <span className="text-xs text-destructive">Blocked in browser</span>
            ) : (
              <button onClick={async () => { const r = await requestNotificationPermission(); setNotificationPermission(r) }}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
                Enable
              </button>
            )}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Focus completion</p>
                <p className="text-xs text-muted-foreground">{timerSettings.notificationEnabled ? 'On' : 'Off'}</p>
              </div>
            </div>
            <button onClick={() => setTimerSettings({ notificationEnabled: !timerSettings.notificationEnabled })}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', timerSettings.notificationEnabled ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground')}>
              {timerSettings.notificationEnabled ? 'On' : 'Off'}
            </button>
          </div>
        </Card>
      </SettingsSection>

      {/* ─── LEGAL / COMPLIANCE ─────────────────────────── */}
      <SettingsSection title="Legal" icon={FileText}>
        <Card className="p-0 overflow-hidden">
          <SettingRow icon={<Shield className="w-4 h-4" />} title="Privacy Policy" description="How your data is handled" onClick={() => setShowPrivacyPolicy(true)} />
          <SettingRow icon={<FileText className="w-4 h-4" />} title="Terms of Service" description="App usage terms" onClick={() => setShowTermsOfService(true)} />
          <SettingRow icon={<Eye className="w-4 h-4" />} title="Accessibility Disclosure" description="Deep Lock accessibility usage" onClick={() => setShowAccessibilityDisclosure(true)} />
          <SettingRow icon={<Info className="w-4 h-4" />} title="Permissions" description="Required app permissions" onClick={() => setShowPermissionsInfo(true)} />
          <SettingRow icon={<BookOpen className="w-4 h-4" />} title="Licenses" description="Open source licenses" onClick={() => setShowLicenses(true)} />
          <SettingRow icon={<Terminal className="w-4 h-4" />} title="Debug Session" description="Live focus timer diagnostic" onClick={() => setActiveView('diagnostic')} />
          <SettingRow icon={<Info className="w-4 h-4" />} title="About" description="App version and credits" onClick={() => setShowAboutInfo(true)} isLast />
        </Card>
      </SettingsSection>

      {/* ─── ALARMS ────────────────────────────────────── */}
      <SettingsSection title="Alarms" icon={AlarmClock}>
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Default Alarm Sound</p>
                <p className="text-xs text-muted-foreground">
                  {timerSettings.alarmSound === 'studentos_alarm' ? 'Student OS Default' : 'Device Ringtone'}
                </p>
              </div>
            </div>
            <select
              value={timerSettings.alarmSound || 'studentos_alarm'}
              onChange={async (e) => {
                const s = e.target.value
                setTimerSettings({ alarmSound: s })
                try { await Alarm.previewAlarm({ sound: s }) } catch(err) { console.warn(err) }
              }}
              className="bg-secondary text-foreground text-xs rounded-lg px-2 py-1 outline-none border border-border"
            >
              <option value="studentos_alarm">Student OS Default</option>
              <option value="default">Device Ringtone</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-2 mt-2">
            <button
              onClick={async () => {
                try { await Alarm.previewAlarm({ sound: timerSettings.alarmSound || 'studentos_alarm' }) } catch(err) { console.error(err) }
              }}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              <Volume2 className="w-3 h-3" /> Volume Preview
            </button>
            <button
              onClick={async () => {
                const scheduleAt = new Date(Date.now() + 10000)
                await scheduleAlarm({
                  type: 'planner',
                  entityId: 'test-alarm-' + Date.now(),
                  title: 'Test Alarm',
                  body: 'This is a test alarm — verifying the full setExact → AlarmReceiver → ForegroundService pipeline.',
                  scheduleAt,
                })
                showToast({ type: 'info', title: 'Test alarm scheduled', description: 'Fires in 10 seconds' })
              }}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              <Zap className="w-3 h-3" /> Test Alarm
            </button>
          </div>
        </Card>
      </SettingsSection>

      {/* ─── APPEARANCE ──────────────────────────────────── */}
      <SettingsSection title="Appearance" icon={PaletteIcon}>
        <Card className="p-1 sm:p-1.5">
          <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
            <ThemeButton icon={<Sun className="w-4 h-4" />} label="Light" active={theme === 'light'} onClick={() => setTheme('light')} />
            <ThemeButton icon={<Moon className="w-4 h-4" />} label="Dark" active={theme === 'dark'} onClick={() => setTheme('dark')} />
            <ThemeButton icon={<Monitor className="w-4 h-4" />} label="AMOLED" active={theme === 'amoled'} onClick={() => setTheme('amoled')} />
          </div>
        </Card>

        <Card className="p-3 mt-2">
          <p className="text-xs text-muted-foreground font-medium mb-2">Accent color</p>
          <div className="flex gap-2">
            {['purple', 'blue', 'green', 'orange', 'pink', 'teal'].map((c) => (
              <button key={c} onClick={() => setAccentColor(c)}
                className={cn('min-h-[44px] min-w-[44px] rounded-xl transition-all border-2 flex items-center justify-center', accentColor === c ? 'border-foreground scale-110' : 'border-transparent')}
                style={{ backgroundColor: c === 'purple' ? '#7c4dff' : c === 'blue' ? '#448aff' : c === 'green' ? '#4caf50' : c === 'orange' ? '#ff9800' : c === 'pink' ? '#e91e63' : c === 'teal' ? '#009688' : '#7c4dff' }}
                aria-label={`${c} accent`}
              />
            ))}
          </div>
        </Card>

        <Card className="p-1 sm:p-1.5 mt-2">
          <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
            {(['small', 'medium', 'large'] as const).map((size) => (
              <button key={size} onClick={() => setFontSize(size)}
                className={cn('flex flex-col items-center gap-1 p-2.5 sm:p-3 rounded-xl transition-colors text-xs sm:text-sm', fontSize === size ? 'bg-secondary text-foreground' : 'hover:bg-secondary/50 text-muted-foreground')}>
                <Type className="w-4 h-4" />
                <span>{size.charAt(0).toUpperCase() + size.slice(1)}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="mt-2">
          <SettingRow icon={<Eye className="w-4 h-4" />} title="Reduced motion" description={reducedMotion ? 'On' : 'Off'} onClick={() => setReducedMotion(!reducedMotion)} isLast />
        </Card>
      </SettingsSection>

      {/* ─── MUSIC ───────────────────────────────────────── */}
      {/* ─── AMBIENT SOUND ─────────────────────────────────── */}
      <AmbientSoundSection />

      {/* ─── DATA ────────────────────────────────────────── */}
      <SettingsSection title="Data" icon={Download}>
        <Card className="p-0 overflow-hidden">
          <SettingRow icon={<Download className="w-4 h-4" />} title="Export data" description="Download JSON backup" onClick={handleExport} />
          <SettingRow icon={<Upload className="w-4 h-4" />} title="Import data" description="Restore from a backup file" onClick={() => setShowImportModal(true)} />
          <SettingRow icon={<RotateCcw className="w-4 h-4" />} title="Replay tutorial" description="Re-experience the guided onboarding" onClick={() => setShowResetConfirm(true)} />
          <SettingRow icon={<Trash2 className="w-4 h-4" />} title="Clear all data" description="Permanently delete local data" onClick={() => setShowClearConfirm(true)} isLast />
        </Card>
      </SettingsSection>

      {/* ─── CREATOR / ABOUT ─────────────────────────────── */}
      <motion.div variants={staggerItem}>
        <Card className="p-5 overflow-hidden">
          <div className="flex items-start gap-4">
            <motion.div
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0"
              whileHover={{ scale: 1.05, rotate: -3 }}
            >
              <span className="text-2xl font-bold text-primary">JK</span>
            </motion.div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-semibold text-foreground">Jainam Karnawat</h4>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Designer & Developer</p>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Building tools that help students work with intention and clarity.
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <a
                  href="https://instagram.com/thats.jainam.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-xs text-muted-foreground hover:text-foreground"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  <span>@thats.jainam.dev</span>
                </a>
                <a
                  href="https://instagram.com/thats.jainam"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-xs text-muted-foreground hover:text-foreground"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  <span>@thats.jainam</span>
                </a>
              </div>
              <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">Suggestions or complaints?</span> Just tag{' '}
                  <a href="https://instagram.com/thats.jainam.dev" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">@thats.jainam.dev</a>{' '}
                  — any bug or problem will be fixed within a month (it may take time).
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                  <span className="font-medium text-foreground">Leaving a review?</span> Please tag both accounts — it helps a lot.
                  Every good review motivates me, and the bad ones help me improve. ♥
                </p>
              </div>
            </div>
          </div>
        </Card>
        <Card className="text-center py-6 mt-2 bg-gradient-to-b from-card to-transparent border-border/50">
          <motion.div
            className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-2"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="w-5 h-5 text-primary" />
          </motion.div>
          <h4 className="text-sm font-semibold text-foreground">Student OS</h4>
          <p className="text-xs text-muted-foreground">Version {process.env.NEXT_PUBLIC_APP_VERSION ?? '1.1.0'}</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1.5">Made with ♥ by Jainam</p>
        </Card>
      </motion.div>

      {/* ─── MODALS ──────────────────────────────────────── */}

      {showGoalModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-modal-backdrop flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowGoalModal(false)}
          role="dialog" aria-modal="true" aria-label="Set academic goal"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card rounded-2xl border shadow-2xl p-6"
          >
            <div className="text-center mb-5">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Academic goal</h3>
              <p className="text-sm text-muted-foreground mt-0.5">What are you working toward?</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mb-3">
              {GOAL_PRESETS.map((preset) => (
                <button key={preset} onClick={() => { setGoalInput(preset); setGoalMode('preset'); setCustomGoalInput('') }}
                  className={cn('px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 border',
                    goalMode === 'preset' && goalInput === preset ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-secondary/40 border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground')}>
                  {preset}
                </button>
              ))}
            </div>
            <button onClick={() => setGoalMode('custom')}
              className={cn('w-full px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 border mb-3',
                goalMode === 'custom' ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-secondary/40 border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground')}>
              Custom goal
            </button>
            <AnimatePresence>
              {goalMode === 'custom' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <input type="text" value={customGoalInput} onChange={(e) => setCustomGoalInput(e.target.value)}
                    placeholder="e.g. IIT Bombay" maxLength={100} autoComplete="off"
                    className="w-full mb-3 px-4 py-2.5 rounded-xl bg-secondary border-0 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    aria-label="Custom academic goal" />
                </motion.div>
              )}
            </AnimatePresence>
            <p className="text-xs text-muted-foreground/50 text-center mb-4">Your goal will be shown on every startup.</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowGoalModal(false)} className="flex-1">Cancel</Button>
              <Button variant="primary" onClick={() => { const f = goalMode === 'custom' ? customGoalInput.trim() : goalInput; if (f) setAcademicGoal(f.slice(0, 100)); setShowGoalModal(false) }} className="flex-1">Save</Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showResetConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-modal-backdrop flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowResetConfirm(false)}
          role="alertdialog" aria-modal="true" aria-label="Confirm reset onboarding"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-card rounded-2xl border shadow-2xl p-6 text-center"
          >
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <RotateCcw className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-base font-semibold mb-1 text-foreground">Replay tutorial?</h3>
            <p className="text-sm text-muted-foreground mb-5">You&apos;ll re-experience the guided onboarding. Your data is preserved.</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowResetConfirm(false)} className="flex-1">Cancel</Button>
              <Button variant="primary" onClick={handleResetOnboarding} className="flex-1">Replay</Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showAvatarPicker && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-modal-backdrop flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowAvatarPicker(false)}
          role="dialog" aria-modal="true" aria-label="Choose avatar"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card rounded-2xl border shadow-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">Choose avatar</h3>
                <p className="text-sm text-muted-foreground">Pick your study persona</p>
              </div>
              <motion.button onClick={() => setShowAvatarPicker(false)} whileTap={{ scale: 0.9 }} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" aria-label="Close">
                <X className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
              {AVATAR_CATEGORIES.map((cat) => {
                const isActive = avatar === cat.id
                const SvgComponent = cat.component
                return (
                  <motion.button key={cat.id} onClick={() => { setAvatar(cat.id); setShowAvatarPicker(false) }} whileTap={{ scale: 0.97 }}
                    className={cn('flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 border',
                      isActive ? 'border-primary/40 bg-primary/5' : 'border-transparent hover:bg-secondary/60')}>
                    <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br shrink-0 flex items-center justify-center', cat.gradient)} style={{ color: 'rgba(255,255,255,0.85)' }}>
                      <SvgComponent size={40} />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <p className={cn('text-sm font-medium truncate', isActive ? 'text-foreground' : 'text-foreground/80')}>{cat.name}</p>
                      <p className="text-[10px] text-muted-foreground/60">Student persona</p>
                    </div>
                    {isActive && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }} className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      )}

      {showDailyGoalModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-modal-backdrop flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowDailyGoalModal(false)}
          role="dialog" aria-modal="true" aria-label="Set daily goal"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-card rounded-2xl border shadow-2xl p-6"
          >
            <h3 className="text-base font-semibold mb-1 text-foreground">Daily focus goal</h3>
            <p className="text-sm text-muted-foreground mb-5">How many minutes per day?</p>
            <div className="flex items-center gap-3">
              <input type="number" min={15} max={600} step={5} value={dailyGoalInput}
                onChange={(e) => setDailyGoalInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-secondary border-0 text-center text-lg font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                aria-label="Daily goal in minutes" />
              <span className="text-sm text-muted-foreground">min</span>
            </div>
            <div className="flex gap-3 mt-5">
              <Button variant="secondary" onClick={() => setShowDailyGoalModal(false)} className="flex-1">Cancel</Button>
              <Button variant="primary" onClick={() => { const v = parseInt(dailyGoalInput); if (v >= 15 && v <= 600) { setDailyGoal(v); setShowDailyGoalModal(false) } }} className="flex-1">Save</Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showDurationModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}
          className="fixed inset-0 z-modal-backdrop flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowDurationModal(false)} role="dialog" aria-modal="true" aria-label="Set default duration">
          <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-card rounded-2xl border shadow-2xl p-6">
            <h3 className="text-base font-semibold mb-1 text-foreground">Default session length</h3>
            <p className="text-sm text-muted-foreground mb-5">Minutes per session (10–240)</p>
            <input type="number" min={10} max={240} step={5} value={durationInput}
              onChange={(e) => setDurationInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-secondary border-0 text-center text-lg font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              aria-label="Session duration in minutes" />
            <div className="flex gap-3 mt-5">
              <Button variant="secondary" onClick={() => setShowDurationModal(false)} className="flex-1">Cancel</Button>
              <Button variant="primary" onClick={() => { const v = parseInt(durationInput); if (v >= 10 && v <= 240) { setPreferredFocusDuration(v); setShowDurationModal(false) } }} className="flex-1">Save</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
      {showVolumeModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}
          className="fixed inset-0 z-modal-backdrop flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowVolumeModal(false)} role="dialog" aria-modal="true" aria-label="Set max volume">
          <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-card rounded-2xl border shadow-2xl p-6">
            <h3 className="text-base font-semibold mb-1 text-foreground">Max volume limit</h3>
            <p className="text-sm text-muted-foreground mb-5">Percentage (0–100)</p>
            <input type="number" min={0} max={100} value={volumeInput}
              onChange={(e) => setVolumeInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-secondary border-0 text-center text-lg font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              aria-label="Max volume percentage" />
            <div className="flex gap-3 mt-5">
              <Button variant="secondary" onClick={() => setShowVolumeModal(false)} className="flex-1">Cancel</Button>
              <Button variant="primary" onClick={() => { const v = parseInt(volumeInput); if (v >= 0 && v <= 100) { setMusicSettings({ maxVolumeLimit: v / 100 }); setShowVolumeModal(false) } }} className="flex-1">Save</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
      {showClearConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-modal-backdrop flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowClearConfirm(false)}
          role="alertdialog" aria-modal="true" aria-label="Confirm clear data"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-card rounded-2xl border shadow-2xl p-6 text-center"
          >
            <div className="w-10 h-10 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <h3 className="text-base font-semibold mb-1 text-foreground">Clear all data?</h3>
            <p className="text-sm text-muted-foreground mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowClearConfirm(false)} className="flex-1">Cancel</Button>
              <Button variant="destructive" onClick={handleClearData} className="flex-1">Delete everything</Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Hidden file input for import */}
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" aria-hidden="true" />

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-modal-backdrop flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => { setShowImportModal(false); setImportError(null) }}
            role="dialog" aria-modal="true" aria-label="Import data"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card rounded-2xl border shadow-2xl p-6 text-center"
            >
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold mb-1 text-foreground">Import backup</h3>
              <p className="text-sm text-muted-foreground mb-5">Select a previously exported JSON backup file. Current data will be replaced.</p>
              {importError && <p className="text-xs text-destructive mb-3 bg-destructive/10 rounded-lg px-3 py-2">{importError}</p>}
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => { setShowImportModal(false); setImportError(null) }} className="flex-1">Cancel</Button>
                <Button variant="primary" onClick={() => { fileInputRef.current?.click() }} className="flex-1">Select file</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Whitelist Editor Modal */}
      <AnimatePresence>
        {showWhitelistEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-modal-backdrop flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowWhitelistEditor(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel rounded-xl p-5 max-w-lg w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-on-surface">Whitelist Apps</h3>
                <button onClick={() => setShowWhitelistEditor(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-variant/30 transition-colors">
                  <X className="w-5 h-5 text-on-surface-variant" />
                </button>
              </div>
              <p className="text-xs text-on-surface-variant/70 mb-4">Select which apps remain accessible during Deep Lock sessions. System essentials (Phone, Clock, Settings) are always allowed.</p>
              <WhitelistEditor />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compliance modals */}
      {showPrivacyPolicy && <PrivacyPolicy onClose={() => setShowPrivacyPolicy(false)} />}
      {showTermsOfService && <TermsOfService onClose={() => setShowTermsOfService(false)} />}
      {showPermissionsInfo && <PermissionsInfo onClose={() => setShowPermissionsInfo(false)} />}
      {showLicenses && <Licenses onClose={() => setShowLicenses(false)} />}
      {showAboutInfo && <AboutInfo onClose={() => setShowAboutInfo(false)} />}
    </motion.div>
  )
}

function ThemeButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={cn('flex flex-col items-center gap-1 sm:gap-1.5 p-2.5 sm:p-3 rounded-xl transition-colors text-xs sm:text-sm touch-target-sm', active ? 'bg-secondary text-foreground' : 'hover:bg-secondary/50 text-muted-foreground')}
    >
      {icon}<span>{label}</span>
    </motion.button>
  )
}

function SettingRow({ icon, title, description, isLast, onClick, children }: {
  icon: React.ReactNode; title: string; description?: string; isLast?: boolean; onClick?: () => void; children?: React.ReactNode
}) {
  return (
    <div
      onClick={onClick}
      className={cn('flex items-center gap-3 p-3 sm:p-4 text-left min-h-[48px]', onClick ? 'cursor-pointer hover:bg-secondary/50 transition-colors' : '', !isLast && 'border-b border-border')}
      role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
    >
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-medium text-foreground">{title}</p>
        {description && <p className="text-[10px] sm:text-xs text-muted-foreground">{description}</p>}
      </div>
      {children || (onClick && <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />)}
    </div>
  )
}

function AmbientSoundSection() {
  const ambientSoundEnabled = useStore((s) => s.ambientSoundEnabled)
  const setAmbientSoundEnabled = useStore((s) => s.setAmbientSoundEnabled)
  const ambientVolume = useStore((s) => s.ambientVolume)
  const setAmbientVolume = useStore((s) => s.setAmbientVolume)

  const { isPlaying, currentTrackName, stop, reloadTracks } = useAmbientAudio()

  const [tracks, setTracks] = useState<Omit<AmbientTrack, 'blob'>[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const audioInputRef = useRef<HTMLInputElement>(null)

  const refreshTrackList = useCallback(async () => {
    try {
      const list = await getTracksMeta()
      setTracks(list)
    } catch {
      setTracks([])
    }
  }, [])

  useEffect(() => {
    void refreshTrackList()
  }, [refreshTrackList])

  const handleToggle = (enabled: boolean) => {
    setAmbientSoundEnabled(enabled)
    if (!enabled) {
      stop()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setErrorMessage(null)
    const res = await importAudioFiles(files)

    if (res.errors.length > 0) {
      setErrorMessage(res.errors.join(' '))
    }

    if (res.added > 0) {
      await refreshTrackList()
      await reloadTracks()
    }

    e.target.value = ''
  }

  const handleDeleteTrack = async (id: number, name: string) => {
    if (currentTrackName === name && isPlaying) {
      stop()
    }
    await deleteTrack(id)
    await refreshTrackList()
    await reloadTracks()
  }

  const handleStartRename = (id: number, currentName: string) => {
    setEditingId(id)
    setEditingName(currentName)
  }

  const handleSaveRename = async (id: number) => {
    if (editingName.trim()) {
      await renameTrack(id, editingName)
      await refreshTrackList()
      await reloadTracks()
    }
    setEditingId(null)
  }

  const isAtLimit = tracks.length >= MAX_TRACKS

  return (
    <SettingsSection title="Ambient sound" icon={Disc3} defaultOpen>
      <Card className="p-0 overflow-hidden space-y-0">
        {/* Toggle */}
        <div className="flex items-center justify-between p-3 sm:p-4 min-h-[48px] border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
              <Disc3 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-foreground">Ambient sound</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Play your imported music during focus sessions</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle(!ambientSoundEnabled)}
            aria-label={ambientSoundEnabled ? 'Disable ambient sound' : 'Enable ambient sound'}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[36px]', ambientSoundEnabled ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground')}
          >
            {ambientSoundEnabled ? 'On' : 'Off'}
          </button>
        </div>

        {/* Volume Slider (only when enabled) */}
        {ambientSoundEnabled && (
          <div className="p-3 sm:p-4 border-b border-border space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs sm:text-sm font-medium text-foreground">Volume</span>
              </div>
              <span className="text-xs font-mono text-muted-foreground">{Math.round(ambientVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(ambientVolume * 100)}
              onChange={(e) => setAmbientVolume(Number(e.target.value) / 100)}
              aria-label="Ambient volume"
              aria-valuenow={Math.round(ambientVolume * 100)}
              className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        )}
      </Card>

      {/* Tracks Section (only when enabled) */}
      {ambientSoundEnabled && (
        <Card className="p-4 mt-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-xs sm:text-sm font-medium text-foreground">Your tracks</p>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-secondary text-muted-foreground font-mono">
                {tracks.length}/{MAX_TRACKS}
              </span>
            </div>

            <button
              onClick={() => audioInputRef.current?.click()}
              disabled={isAtLimit}
              aria-label="Import audio tracks"
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[36px]',
                isAtLimit ? 'bg-secondary text-muted-foreground/40 cursor-not-allowed' : 'bg-primary/10 text-primary hover:bg-primary/20'
              )}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>
          </div>

          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
            aria-hidden="true"
          />

          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs">
              {errorMessage}
            </div>
          )}

          {isAtLimit && (
            <p className="text-xs text-muted-foreground/70 italic">
              You can store up to {MAX_TRACKS} ambient tracks. Remove a track to add more.
            </p>
          )}

          {/* Empty state */}
          {tracks.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-border rounded-xl space-y-2">
              <Music2 className="w-8 h-8 mx-auto text-muted-foreground/40" />
              <p className="text-xs font-medium text-foreground">No ambient tracks yet.</p>
              <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                Import an audio file from your device to use it during Focus sessions.
              </p>
              <button
                onClick={() => audioInputRef.current?.click()}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors min-h-[36px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Import audio file</span>
              </button>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition-colors gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Music2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    {editingId === track.id ? (
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void handleSaveRename(track.id!)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          autoFocus
                          className="bg-secondary rounded px-2 py-0.5 text-xs text-foreground outline-none border border-primary/40 flex-1 min-w-0"
                          aria-label="Edit track name"
                        />
                        <button
                          onClick={() => void handleSaveRename(track.id!)}
                          className="p-1 text-primary hover:bg-primary/10 rounded min-h-[32px] min-w-[32px] flex items-center justify-center"
                          aria-label="Save name"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="min-w-0 flex-1 flex items-center gap-2">
                        <span
                          onClick={() => handleStartRename(track.id!, track.name)}
                          className="text-xs font-medium text-foreground truncate cursor-pointer hover:underline"
                          title={`${track.name} (Click to edit)`}
                        >
                          {track.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                          {(track.size / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => void handleDeleteTrack(track.id!, track.name)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0"
                    aria-label={`Delete ${track.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </SettingsSection>
  )
}
