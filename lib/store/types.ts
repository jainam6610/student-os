export interface Exam {
  id: string; title: string; subject: string; date: Date; time: string
  location?: string; maxMarks: number; obtainedMarks?: number
  preparationStatus: 'not-started' | 'in-progress' | 'revised' | 'ready'
  difficulty: 'easy' | 'medium' | 'hard'; notes?: string; reminder?: boolean; isPinned?: boolean; createdAt: Date
}

export interface Assignment {
  id: string; title: string; subject: string; priority: 'low' | 'medium' | 'high'
  deadline: Date; estimatedHours: number
  status: 'todo' | 'in-progress' | 'submitted' | 'graded'
  attachments: { name: string; path: string }[]
  obtainedMarks?: number; maxMarks?: number; completionDate?: Date
  description?: string; createdAt: Date
}

export interface Achievement {
  id: string; title: string; description: string; icon: string
  unlocked: boolean; unlockedAt?: Date
  category: 'focus' | 'tasks' | 'habits' | 'streak' | 'study' | 'milestone'
  progress?: number; maxProgress?: number
}

export interface ProductivityScore {
  score: number; focusConsistency: number; taskCompletion: number; habitCompletion: number
  studyHours: number; goalCompletion: number; latePenalty: number
  weeklyHistory: { week: string; score: number }[]
}

export interface Task {
  id: string; title: string; description?: string; subject?: string
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in-progress' | 'done'
  dueDate?: Date; subtasks?: { id: string; title: string; done: boolean }[]
  tags?: string[]; projectId?: string; createdAt: Date; completedAt?: Date
}

export interface Habit {
  id: string; name: string; description?: string; category?: string; icon: string; color: string
  frequency: 'daily' | 'weekly'; targetDays?: number[]; completedDates: string[]
  streak: number; bestStreak: number; createdAt: Date
  repeatType?: 'daily' | 'weekly' | 'monthly' | 'custom' | 'weekdays' | 'weekends'
  repeatDays?: number[]; repeatInterval?: number
  reminder?: { enabled: boolean; times: string[]; repeat: boolean; sound: string; vibration: boolean; snoozed: boolean; weekdayOnly: boolean; weekendOnly: boolean }
  alarmEnabled?: boolean; notificationEnabled?: boolean
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime'
  estimatedDuration?: number; priority?: 'low' | 'medium' | 'high'
  notes?: string; currentStreak?: number; longestStreak?: number
  completionRate?: number; skippedCount?: number; completedCount?: number
  skippedDates?: string[]
  history?: { date: string; action: 'completed' | 'skipped' | 'undone' | 'missed'; reason?: string; timestamp: Date }[]
  updatedAt?: Date; archived?: boolean; archivedAt?: Date
}

export interface FocusSession {
  id: string; startTime: Date; endTime?: Date; duration: number; targetDuration: number
  subject?: string; type: 'pomodoro' | 'deep-work' | 'custom' | 'break'
  completed: boolean; interrupted: boolean; status: 'completed' | 'interrupted' | 'cancelled'
  goal?: string; createdAt: Date; plannerEventId?: string
  energy?: number; distractions?: number; category?: string
  focusScore?: number; reflection?: string; pauseCount?: number
  pauseMinutes?: number
}

export interface PlannerReminder {
  enabled: boolean; minutesBefore: number
  scheduledFor?: Date; snoozedUntil?: Date; lastTriggeredAt?: Date
}

export interface PlannerTaskHistoryEntry {
  id: string; at: Date
  action: 'created' | 'updated' | 'rescheduled' | 'resized' | 'completed' | 'focus-linked' | 'snoozed' | 'carried-forward'
  note?: string
}

export interface StudyEvent {
  id: string; title: string; description?: string; subject?: string
  startTime: Date; endTime: Date
  type: 'study' | 'exam' | 'revision' | 'break'
  color?: string; icon?: string; priority?: 'low' | 'medium' | 'high'
  estimatedDuration?: number; reminder?: PlannerReminder
  repeatRule?: 'none' | 'daily' | 'weekdays' | 'weekly'
  notes?: string; difficulty?: number; energyLevel?: number
  completed?: boolean; completedAt?: Date
  focusMinutes?: number; focusSessionIds?: string[]
  history?: PlannerTaskHistoryEntry[]; carryForwardSuggestedFor?: Date
}

export interface PlannerSettings {
  wakeTime: string; bedTime: string; sleepDurationMinutes: number; slotMinutes: number
  defaultView: 'day' | 'week' | 'month' | 'agenda' | 'syllabus'
  carryForwardMode: 'suggest'; defaultReminderMinutes: number
  showWeeklyStrip: boolean; timelineDensity: 'compact' | 'comfortable'
}

export interface UserProgress {
  xp: number; level: number; totalFocusTime: number; totalTasksCompleted: number
  currentStreak: number; bestStreak: number; weeklyGoal: number; weeklyProgress: number
}

export interface TimerSettings {
  notificationEnabled: boolean; vibrationEnabled: boolean; backgroundSounds: boolean
  autoBreak: boolean; breakDuration: number; longBreakFrequency: number
  keepScreenAwake: boolean; animationsEnabled: boolean
  alarmSound: string;
  strictFocus?: boolean;
}

export interface OnboardingProfile {
  name: string; goal: string; sleepTime: string; wakeTime: string; sleepDurationMinutes: number
  dailyStudyMinutes: number; focusDurationMinutes: number
  selectedHabits: string[]; enabledRoutines: string[]; preferredSessions: string[]
  notifications: { enabled: boolean; habitReminders: boolean; studyReminders: boolean; alarmMode: boolean }
  skipped: boolean; completedAt?: Date
  classOrOccupation: string; studyGoal: string; habitGoals: string[]
}

export type FocusShieldMode = 'normal' | 'deep-lock'

export interface DistractionRecord {
  id: string; sessionId: string; packageName: string; appName: string
  timestamp: number; resolved: boolean; duration: number
}

export interface SyllabusTopic {
  id: string
  name: string
  completed: boolean
}

export interface SyllabusChapter {
  id: string
  name: string
  topics: SyllabusTopic[]
}

export interface SyllabusSubject {
  id: string
  name: string
  chapters: SyllabusChapter[]
}

export interface Syllabus {
  id: string
  name: string
  examType: string
  subjects: SyllabusSubject[]
  createdAt: Date
}
