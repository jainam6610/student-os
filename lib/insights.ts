import { format, subDays, isSameDay } from 'date-fns'
import type { FocusSession, Task, Habit } from './store'

export interface Pattern {
  type: 'trend' | 'milestone' | 'suggestion' | 'note'
  message: string
  icon: string
  priority: number
}

function getBestFocusHour(sessions: FocusSession[]): number | null {
  const hourly: Record<number, number> = {}
  sessions.filter((s) => s.endTime).forEach((s) => {
    const hour = new Date(s.startTime).getHours()
    hourly[hour] = (hourly[hour] || 0) + s.duration
  })
  let best = -1, bestVal = -1
  for (const [h, v] of Object.entries(hourly)) {
    if (v > bestVal) { bestVal = v; best = parseInt(h) }
  }
  return best >= 0 ? best : null
}

function getTimeOfDayLabel(hour: number): string {
  if (hour < 6) return 'late night'
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  if (hour < 21) return 'evening'
  return 'night'
}

function getAvgUninterruptedSession(sessions: FocusSession[]): number {
  const completed = sessions.filter((s) => !s.interrupted && s.duration > 0)
  if (completed.length === 0) return 0
  return Math.round(completed.reduce((a, s) => a + s.duration, 0) / completed.length)
}

function getCompletionRate(sessions: FocusSession[]): number {
  const total = sessions.length
  if (total === 0) return 0
  const completed = sessions.filter((s) => !s.interrupted).length
  return Math.round((completed / total) * 100)
}

function getStreakDays(sessions: FocusSession[]): number {
  if (sessions.length === 0) return 0
  const days = new Set<string>()
  sessions.forEach((s) => {
    if (s.endTime) days.add(format(new Date(s.endTime), 'yyyy-MM-dd'))
  })
  const sorted = [...days].sort().reverse()
  let streak = 0
  const today = format(new Date(), 'yyyy-MM-dd')
  let expected = today
  for (const day of sorted) {
    if (day === expected) { streak++; const d = new Date(expected); d.setDate(d.getDate() - 1); expected = format(d, 'yyyy-MM-dd') }
    else break
  }
  return streak
}

function getFocusQualityTrend(sessions: FocusSession[]): 'improving' | 'declining' | 'stable' | null {
  const withScore = sessions.filter((s) => s.focusScore !== undefined && s.focusScore !== null)
  if (withScore.length < 4) return null
  const recent = withScore.slice(-4)
  const scores = recent.map((s) => s.focusScore!)
  const firstHalf = scores.slice(0, 2).reduce((a, b) => a + b, 0) / 2
  const secondHalf = scores.slice(2).reduce((a, b) => a + b, 0) / 2
  if (secondHalf > firstHalf + 5) return 'improving'
  if (firstHalf > secondHalf + 5) return 'declining'
  return 'stable'
}

export function generateInsights(sessions: FocusSession[], tasks: Task[], habits: Habit[]): Pattern[] {
  const insights: Pattern[] = []

  const bestHour = getBestFocusHour(sessions)
  if (bestHour !== null) {
    insights.push({
      type: 'trend',
      message: `You focus best in the ${getTimeOfDayLabel(bestHour)}.`,
      icon: bestHour < 12 ? '○' : bestHour < 17 ? '●' : '◑',
      priority: 90,
    })
  }

  const avgUninterrupted = getAvgUninterruptedSession(sessions)
  const recentSessions = sessions.filter((s) => s.endTime && isSameDay(new Date(s.endTime), subDays(new Date(), 1)))
  const recentAvg = recentSessions.length > 0
    ? Math.round(recentSessions.filter((s) => !s.interrupted).reduce((a, s) => a + s.duration, 0) / Math.max(recentSessions.length, 1))
    : 0
  if (avgUninterrupted > 0) {
    if (recentAvg > avgUninterrupted) {
      insights.push({
        type: 'trend',
        message: 'Your average uninterrupted session is growing.',
        icon: '↑',
        priority: 85,
      })
    } else {
      insights.push({
        type: 'note',
        message: `Your typical session is ${avgUninterrupted} min — a solid block of focus.`,
        icon: '◷',
        priority: 75,
      })
    }
  }

  const compRate = getCompletionRate(sessions)
  if (sessions.length >= 3) {
    if (compRate >= 80) {
      insights.push({
        type: 'milestone',
        message: `${compRate}% of your sessions are completed — strong follow-through.`,
        icon: '◆',
        priority: 95,
      })
    } else if (compRate >= 50) {
      insights.push({
        type: 'suggestion',
        message: `Shorter sessions may help you complete more — try 30 min blocks.`,
        icon: '→',
        priority: 70,
      })
    } else {
      insights.push({
        type: 'note',
        message: 'Every session builds momentum, even partial ones.',
        icon: '·',
        priority: 65,
      })
    }
  }

  const streak = getStreakDays(sessions)
  if (streak >= 5) {
    insights.push({
      type: 'milestone',
      message: `You've been consistent for ${streak} days. Keep the momentum.`,
      icon: '◈',
      priority: 100,
    })
  } else if (streak >= 3) {
    insights.push({
      type: 'note',
      message: `${streak}-day streak — a strong foundation.`,
      icon: '◇',
      priority: 80,
    })
  }

  const qualityTrend = getFocusQualityTrend(sessions)
  if (qualityTrend === 'improving') {
    insights.push({
      type: 'trend',
      message: 'Your focus quality is improving — your sessions are becoming more effective.',
      icon: '↑',
      priority: 92,
    })
  } else if (qualityTrend === 'declining') {
    insights.push({
      type: 'suggestion',
      message: 'Your focus quality has dipped. Try reducing session length or adding breaks.',
      icon: '↓',
      priority: 78,
    })
  }

  const incomplete = tasks.filter((t) => t.status !== 'done').length
  if (incomplete > 5) {
    insights.push({
      type: 'suggestion',
      message: `${incomplete} tasks await — pick the top 3 for today.`,
      icon: '☰',
      priority: 60,
    })
  }

  return insights.sort((a, b) => b.priority - a.priority)
}

export function generateDailyMessage(studyStyle: string, streak: number, todayFocus: number, dailyGoal: number): string {
  if (streak >= 7) {
    const styles: Record<string, string> = {
      'deep-work': 'Your deep work habit is thriving.',
      'consistent': 'Your consistency is unstoppable.',
      'sprint': 'Your sprint sessions are stacking up.',
      'night-owl': 'Your late-night focus is legendary.',
    }
    return styles[studyStyle] || 'Your focus streak is impressive.'
  }
  if (todayFocus >= dailyGoal) return 'Daily goal achieved — you showed up.'
  if (todayFocus > 0) return 'Progress is progress. Keep building.'
  return 'A calm workspace awaits you.'
}

// ─── Motivation Engine ────────────────────────────────────────

type MotivationStyle = 'calm' | 'direct' | 'encouraging'
type TimeOfDay = 'morning' | 'afternoon' | 'evening'

interface MotivationInput {
  motivationStyle: MotivationStyle
  mainChallenge: string
  timeOfDay: TimeOfDay
  todayFocusTime: number
  dailyGoal: number
  currentStreak: number
  completedToday: number
  completedHabitsToday: number
  daysSinceLastSession: number
}

// ponytail: static message catalog — no AI, no network, no runtime generation.
// ~35 messages across 5 states × 3 styles, selected deterministically.

const CHALLENGE_SUFFIXES: Record<string, Record<MotivationStyle, string>> = {
  procrastination: {
    calm: ' Start with just five minutes.',
    direct: ' Stop planning. Start doing.',
    encouraging: ' The hardest part is beginning — and you can do that.',
  },
  phone: {
    calm: ' The phone can wait for this block.',
    direct: ' Put the phone away. This session is yours.',
    encouraging: ' Every minute without distractions is a win.',
  },
  consistency: {
    calm: ' One session today is another vote for consistency.',
    direct: ' Show up today. That is the whole strategy.',
    encouraging: ' You are building something real, one day at a time.',
  },
  starting: {
    calm: ' You do not need to finish. Just begin.',
    direct: ' Open the material. Start the timer. That is enough.',
    encouraging: ' Starting is the hardest part — and you are doing it.',
  },
  time: {
    calm: ' Use the time you have. One block is enough.',
    direct: ' Thirty focused minutes beat two hours of wandering.',
    encouraging: ' Even a short session moves you forward.',
  },
  overwhelm: {
    calm: ' Pick one thing. Ignore everything else for this block.',
    direct: ' Shrink the task. One topic, one session.',
    encouraging: ' You do not have to do it all. Just this one thing.',
  },
}

function challengeSuffix(challenge: string, style: MotivationStyle): string {
  return CHALLENGE_SUFFIXES[challenge]?.[style] ?? ''
}

export function getMotivationMessage(input: MotivationInput): string {
  const { motivationStyle: s, timeOfDay: t, todayFocusTime, dailyGoal, currentStreak, completedToday, completedHabitsToday, daysSinceLastSession, mainChallenge } = input

  // Comeback — inactive 2+ days
  if (daysSinceLastSession > 1) {
    const msgs: Record<MotivationStyle, string> = {
      calm: 'Welcome back. No catch-up required. Start from today.',
      direct: 'You are back. Start today instead of recovering yesterday.',
      encouraging: 'Everyone misses days. What matters is coming back.',
    }
    return msgs[s] + challengeSuffix(mainChallenge, s)
  }

  // New user — no sessions ever
  if (daysSinceLastSession === 999) {
    const msgs: Record<MotivationStyle, string> = {
      calm: 'Welcome. Let us make today simple.',
      direct: 'Start with one focused block.',
      encouraging: 'You can build momentum one session at a time.',
    }
    return msgs[s]
  }

  // Goal completed
  if (todayFocusTime >= dailyGoal && dailyGoal > 0) {
    const msgs: Record<MotivationStyle, string> = {
      calm: 'Your goal is done. That is enough for today.',
      direct: 'Goal complete. Keep the consistency going.',
      encouraging: 'You did what you set out to do today.',
    }
    return msgs[s]
  }

  // Active day — focus > 0 but goal incomplete
  if (todayFocusTime > 0) {
    const hrs = Math.floor(todayFocusTime / 60)
    const mins = todayFocusTime % 60
    const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins} min`
    const msgs: Record<MotivationStyle, string> = {
      calm: `You have focused for ${timeStr}. One more block if you have the energy.`,
      direct: `You have done ${timeStr}. Finish another focused block.`,
      encouraging: `You are already at ${timeStr}. Keep the momentum.`,
    }
    return msgs[s] + challengeSuffix(mainChallenge, s)
  }

  // Low activity — no focus yet, daytime
  const eveningMsgs: Record<MotivationStyle, string> = {
    calm: 'The day is winding down. One short session still counts.',
    direct: 'Evening focus separates good students from great ones.',
    encouraging: 'A late session is still a session. Start one.',
  }
  if (t === 'evening') return eveningMsgs[s]

  const lowMsgs: Record<MotivationStyle, string> = {
    calm: 'Do not fix the whole day. Finish one useful thing.',
    direct: 'Stop waiting for the perfect time. Start one block.',
    encouraging: 'One small session can change the direction of the day.',
  }
  return lowMsgs[s] + challengeSuffix(mainChallenge, s)
}

// ─── Focus Completion Messages ─────────────────────────────────

interface CompletionInput {
  score: number
  duration: number
  motivationStyle: MotivationStyle
  mainChallenge: string
  sessionNumber: number
}

export function getCompletionMessage(input: CompletionInput): string {
  const { score, duration, motivationStyle: s, mainChallenge, sessionNumber } = input

  let base: string
  if (score >= 90) {
    const msgs: Record<MotivationStyle, string> = {
      calm: 'Excellent focus session.',
      direct: 'Strong session. That is how it is done.',
      encouraging: 'You showed up and delivered. Well done.',
    }
    base = msgs[s]
  } else if (score >= 70) {
    const msgs: Record<MotivationStyle, string> = {
      calm: 'Great work. That was a solid block.',
      direct: 'Good session. Keep stacking them.',
      encouraging: 'You are building real momentum.',
    }
    base = msgs[s]
  } else if (score >= 50) {
    const msgs: Record<MotivationStyle, string> = {
      calm: 'A solid effort. Every session counts.',
      direct: 'You showed up. That matters.',
      encouraging: 'Progress is progress. Keep going.',
    }
    base = msgs[s]
  } else {
    const msgs: Record<MotivationStyle, string> = {
      calm: 'Short but real. That session still counts.',
      direct: 'A short session is better than none.',
      encouraging: 'You started. That is the hardest part.',
    }
    base = msgs[s]
  }

  if (sessionNumber === 1) {
    base += ' Your first session is done.'
  }

  return base
}

// ─── Deep Lock Motivation ──────────────────────────────────────

export function getDeepLockMotivation(
  interruptionCount: number,
  remainingMinutes: number,
  motivationStyle: MotivationStyle
): string {
  if (remainingMinutes <= 5 && remainingMinutes > 0) {
    const msgs: Record<MotivationStyle, string> = {
      calm: 'Almost there. Finish this block.',
      direct: 'Five minutes left. Do not stop now.',
      encouraging: 'The finish line is close. Stay with it.',
    }
    return msgs[motivationStyle]
  }

  if (interruptionCount === 0) {
    const msgs: Record<MotivationStyle, string> = {
      calm: 'Your focus is protected. Stay with the task.',
      direct: 'Deep Lock is active. No distractions allowed.',
      encouraging: 'This session is yours. Make it count.',
    }
    return msgs[motivationStyle]
  }

  if (interruptionCount === 1) {
    const msgs: Record<MotivationStyle, string> = {
      calm: 'You noticed the distraction. Go back to your task.',
      direct: 'That was a distraction. Refocus now.',
      encouraging: 'You caught it. That shows awareness. Keep going.',
    }
    return msgs[motivationStyle]
  }

  // repeated attempts
  const msgs: Record<MotivationStyle, string> = {
    calm: 'Your focus session is still active. The distraction can wait.',
    direct: 'Stop switching. Your session is still running.',
    encouraging: 'Every time you resist, you get stronger. Stay with it.',
  }
  return msgs[motivationStyle]
}