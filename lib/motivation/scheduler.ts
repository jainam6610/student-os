import { scheduleAlarm, cancelAlarm } from '@/lib/scheduling'
import { MOTIVATION_MESSAGES, pickMessage, categoryForTime } from './messages'

// Sync motivation alarms with user's selected times
// Call this whenever motivationTimes or motivationDays changes
export async function syncMotivationAlarms(
  times: string[],       // ["07:30", "14:00"]
  days: number[],        // [1,2,3,4,5] weekdays
  enabled: boolean,
  recentIds: string[]
): Promise<void> {
  await cancelMotivationAlarms()

  if (!enabled || times.length === 0) {
    return
  }

  if (!days.length) {
    await cancelMotivationAlarms()
    return
  }

  for (const time of times) {
    const [hours, minutes] = time.split(':').map(Number)
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[MotivationScheduler] invalid time skipped: "${time}"`)
      }
      continue
    }

    const category = categoryForTime(hours)
    const message = pickMessage(category, recentIds)

    const alarmId = `motivation-${time.replace(':', '')}`
    const nextFire = nextOccurrence(hours, minutes, days)

    await scheduleAlarm({
      entityId: alarmId,
      title: `${message.emoji} ${message.title}`,
      body: message.body,
      scheduleAt: nextFire,
      type: 'motivation',
      // Thoughts are silent — the native side posts a calm notification,
      // never the ringing full-screen alarm path.
      sound: 'none',
      vibration: false,
    })
  }

  try {
    localStorage.setItem('student-os-motivation-alarms', JSON.stringify(times))
  } catch (e) {}
}

export async function cancelMotivationAlarms(): Promise<void> {
  const lastTimesStr = localStorage.getItem('student-os-motivation-alarms')
  if (lastTimesStr) {
    try {
      const lastTimes = JSON.parse(lastTimesStr) as string[]
      for (const time of lastTimes) {
        const alarmId = `motivation-${time.replace(':', '')}`
        await cancelAlarm(alarmId)
      }
    } catch (e) {}
  }
}

function nextOccurrence(
  hours: number,
  minutes: number,
  days: number[]
): Date {
  const now = new Date()
  const candidate = new Date()
  candidate.setHours(hours, minutes, 0, 0)

  for (let i = 0; i < 8; i++) {
    const d = new Date(candidate)
    d.setDate(candidate.getDate() + i)
    if (d > now && days.includes(d.getDay())) {
      return d
    }
  }
  candidate.setDate(candidate.getDate() + 1)
  return candidate
}
