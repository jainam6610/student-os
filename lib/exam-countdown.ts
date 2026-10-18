import type { Exam } from '@/lib/store'

export interface CountdownResult {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalDays: number
  totalHours: number
  isPast: boolean
  isToday: boolean
  isTomorrow: boolean
  urgency: 'calm' | 'soon' | 'close' | 'imminent'
}

export function getPrimaryExam(exams: Exam[]): Exam | null {
  if (!exams || exams.length === 0) return null

  const now = new Date()
  const upcoming = exams.filter(e => e.date > now)
  if (upcoming.length === 0) return null

  const pinned = upcoming.find(e => e.isPinned)
  if (pinned) return pinned

  return upcoming.sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  )[0]
}

export function getCountdown(examDate: Date): CountdownResult {
  const now = new Date()
  const target = examDate
  const diffMs = target.getTime() - now.getTime()

  if (diffMs <= 0) {
    return {
      days: 0, hours: 0, minutes: 0, seconds: 0,
      totalDays: 0, totalHours: 0,
      isPast: true, isToday: false, isTomorrow: false,
      urgency: 'imminent'
    }
  }

  const totalSeconds = Math.floor(diffMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const isToday = days === 0
  const isTomorrow = days === 1
  const urgency = days > 30 ? 'calm'
    : days > 7 ? 'soon'
      : days > 1 ? 'close'
        : 'imminent'

  return {
    days, hours, minutes, seconds,
    totalDays: days,
    totalHours: Math.floor(diffMs / 3600000),
    isPast: false, isToday, isTomorrow, urgency
  }
}

/** Shared urgency → design‑system class map. Import once, use everywhere. */
export const URGENCY_COLORS: Record<CountdownResult['urgency'], { text: string; bg: string; border: string }> = {
  calm: { text: 'text-primary', bg: 'bg-primary/10', border: 'border-l-primary/30' },
  soon: { text: 'text-warning', bg: 'bg-warning/10', border: 'border-l-warning/30' },
  close: { text: 'text-chart-5', bg: 'bg-chart-5/10', border: 'border-l-chart-5/30' },
  imminent: { text: 'text-destructive', bg: 'bg-destructive/10', border: 'border-l-destructive/40' },
}