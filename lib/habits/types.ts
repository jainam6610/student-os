export type RepeatType = 'daily' | 'weekly' | 'monthly' | 'custom' | 'weekdays' | 'weekends'
export type HabitPriority = 'low' | 'medium' | 'high'
export type HabitTimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime'
export type HabitAction = 'completed' | 'skipped' | 'undone' | 'missed'

export interface HabitReminder {
  enabled: boolean
  times: string[]
  repeat: boolean
  sound: string
  vibration: boolean
  snoozed: boolean
  weekdayOnly: boolean
  weekendOnly: boolean
}

export interface HabitHistoryEntry {
  date: string
  action: HabitAction
  reason?: string
  timestamp: Date
}

export interface Habit {
  id: string
  name: string
  description?: string
  category?: string
  icon: string
  color: string
  reminder?: HabitReminder
  alarmEnabled?: boolean
  notificationEnabled?: boolean
  repeatType?: RepeatType
  repeatDays?: number[]
  repeatInterval?: number
  timeOfDay?: HabitTimeOfDay
  estimatedDuration?: number
  priority?: HabitPriority
  notes?: string
  currentStreak?: number
  longestStreak?: number
  completionRate?: number
  skippedCount?: number
  completedCount?: number
  completedDates: string[]
  skippedDates?: string[]
  history?: HabitHistoryEntry[]
  createdAt: Date
  updatedAt?: Date
  archived?: boolean
  archivedAt?: Date
  // Legacy fields for backward compat
  streak?: number
  bestStreak?: number
  frequency?: 'daily' | 'weekly'
  targetDays?: number[]
}

export interface HabitCreateInput {
  name: string
  description?: string
  category?: string
  icon: string
  color: string
  reminder?: HabitReminder
  alarmEnabled?: boolean
  notificationEnabled?: boolean
  repeatType: RepeatType
  repeatDays?: number[]
  repeatInterval?: number
  timeOfDay?: HabitTimeOfDay
  estimatedDuration?: number
  priority?: HabitPriority
  notes?: string
}

export interface HabitDailySummary {
  date: string
  total: number
  completed: number
  skipped: number
  missed: number
  rate: number
}

export interface HabitWeeklySummary {
  startDate: string
  endDate: string
  daily: HabitDailySummary[]
  total: number
  averageRate: number
  bestDay: string
  worstDay: string
}

export interface HabitMonthlySummary {
  year: number
  month: number
  totalDays: number
  completedDays: number
  rate: number
  currentStreak: number
  longestStreak: number
  bestStreakStart?: string
  bestStreakEnd?: string
}

export interface HabitAnalytics {
  today: HabitDailySummary
  thisWeek: HabitWeeklySummary
  thisMonth: HabitMonthlySummary
  overall: {
    totalCompleted: number
    totalSkipped: number
    consistency: number
    completionRate: number
    averagePerWeek: number
    bestStreak: number
    currentStreak: number
    totalHabits: number
    activeHabits: number
  }
}

export interface HabitSettings {
  defaultReminderTime: string
  defaultRepeat: RepeatType
  defaultDuration: number
  defaultCategory: string
  defaultNotification: boolean
  defaultAlarm: boolean
  habitSort: 'name' | 'streak' | 'completion' | 'created' | 'manual'
  habitSortAscending: boolean
  animationsEnabled: boolean
}

export const DEFAULT_HABIT_SETTINGS: HabitSettings = {
  defaultReminderTime: '09:00',
  defaultRepeat: 'daily',
  defaultDuration: 15,
  defaultCategory: 'health',
  defaultNotification: true,
  defaultAlarm: false,
  habitSort: 'manual',
  habitSortAscending: true,
  animationsEnabled: true,
}

export const DEFAULT_REMINDER: HabitReminder = {
  enabled: false,
  times: [],
  repeat: false,
  sound: 'default',
  vibration: true,
  snoozed: false,
  weekdayOnly: false,
  weekendOnly: false,
}

export const HABIT_ICONS = [
  'self_improvement', 'water_drop', 'auto_stories', 'fitness_center',
  'nightlight', 'restaurant', 'emoji_nature', 'bolt', 'track_changes',
  'alarm', 'psychology', 'menu_book', 'palette', 'music_note',
  'spa', 'coffee', 'cleaning_services', 'call', 'directions_run',
  'bedtime', 'forest', 'beach_access', 'sunny', 'star',
]

// The icon keys above are Material Symbols ligature names. The app ships no icon
// font (CSP blocks the CDN), so render them as emoji instead — offline-safe.
export const HABIT_ICON_EMOJI: Record<string, string> = {
  self_improvement: '🧘', water_drop: '💧', auto_stories: '📖',
  fitness_center: '🏋️', nightlight: '🌙', restaurant: '🍽️',
  emoji_nature: '🌿', bolt: '⚡', track_changes: '🎯',
  alarm: '⏰', psychology: '🧠', menu_book: '📚',
  palette: '🎨', music_note: '🎵', spa: '🌸',
  coffee: '☕', cleaning_services: '🧹', call: '📞',
  directions_run: '🏃', bedtime: '🛏️', forest: '🌲',
  beach_access: '🏖️', sunny: '☀️', star: '⭐',
}

export function habitIconEmoji(name: string | undefined): string {
  return (name && HABIT_ICON_EMOJI[name]) || '⭐'
}

export const HABIT_CATEGORIES = [
  'health', 'study', 'fitness', 'mindfulness', 'personal', 'work', 'social',
] as const

export const CATEGORY_META: Record<string, { icon: string; emoji: string; label: string }> = {
  health: { icon: 'favorite', emoji: '❤️', label: 'Health' },
  study: { icon: 'school', emoji: '🎓', label: 'Study' },
  fitness: { icon: 'directions_run', emoji: '🏃', label: 'Fitness' },
  mindfulness: { icon: 'spa', emoji: '🌸', label: 'Mindfulness' },
  personal: { icon: 'person', emoji: '👤', label: 'Personal' },
  work: { icon: 'work', emoji: '💼', label: 'Work' },
  social: { icon: 'group', emoji: '👥', label: 'Social' },
}

export const HABIT_COLORS = [
  '#7dd3fc', '#f472b6', '#a78bfa', '#34d399', '#fb923c',
  '#f87171', '#60a5fa', '#fbbf24', '#2dd4bf', '#e879f9',
]

export const REPEAT_LABELS: Record<RepeatType, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  custom: 'Custom',
  weekdays: 'Weekdays',
  weekends: 'Weekends',
}
