import { Capacitor } from '@capacitor/core'
import type { Habit, StudyEvent } from './store'
import { useStore } from './store'
import Alarm from '@/lib/plugins/alarm-plugin'

const browserTimers = new Map<string, ReturnType<typeof setTimeout>>()

const MIGRATION_KEY = 'student-os-alarm-migration-v1'

const lastHabitIds = new Map<string, string[]>()
let lastPlannerIds = new Set<string>()

let syncQueue: Promise<void> = Promise.resolve()

function serialized(fn: () => Promise<void>): Promise<void> {
  syncQueue = syncQueue.catch(() => {}).then(fn)
  return syncQueue
}

export type AlarmType = 'habit' | 'planner' | 'motivation'

export interface AlarmPayload {
  type: AlarmType
  entityId: string
  title: string
  body: string
  scheduleAt: Date
  sound?: string
  vibration?: boolean
  extra?: Record<string, unknown>
}

function isNative(): boolean {
  const result = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
  return result
}

/**
 * Fires an in-app explainer just before the OS exact-alarm screen appears,
 * so users understand why it opened. AlarmManager listens for this event.
 */
function requestExactAlarmWithNotice(): void {
  try { window.dispatchEvent(new CustomEvent('exact-alarm-permission-requested')) } catch { /* noop */ }
  void Alarm.requestExactAlarmPermission().catch(() => {})
}

async function runOneTimeMigration(): Promise<void> {
  if (!isNative()) return
  if (typeof window === 'undefined') return
  try {
    if (localStorage.getItem(MIGRATION_KEY)) return
    await cancelAllAlarms()
    localStorage.setItem(MIGRATION_KEY, 'done')
    lastHabitIds.clear()
    lastPlannerIds.clear()
  } catch { /* non-critical */ }
}

export async function ensureAlarmPermissions(): Promise<boolean> {
  try {
    if (isNative()) {
      return true
    }
    if (!('Notification' in window)) { return false }
    if (Notification.permission === 'granted') { return true }
    const result = await Notification.requestPermission()
    return result === 'granted'
  } catch (e) {
    console.warn('ensureAlarmPermissions failed', e)
    return false
  }
}

export async function ensureExactAlarmPermissions(): Promise<boolean> {
  if (!isNative()) { return true }
  try {
    const { granted } = await Alarm.checkExactAlarmPermission()
    return granted
  } catch (e) {
    console.warn('ensureExactAlarmPermissions failed', e)
    return false
  }
}

export async function requestExactAlarmPermission(): Promise<void> {
  if (!isNative()) { return }
  try {
    await Alarm.requestExactAlarmPermission()
  } catch (e) {
    console.warn('requestExactAlarmPermission failed', e)
  }
}

async function cancelTimer(entityId: string): Promise<void> {
  if (isNative()) {
    try { await Alarm.cancelAlarm({ entityId }) } catch (e) { console.warn('cancelTimer AlarmPlugin failed', e) }
  }
  const existing = browserTimers.get(entityId)
  if (existing) {
    clearTimeout(existing)
    browserTimers.delete(entityId)
  }
}

function scheduleBrowserNotification(payload: AlarmPayload): void {
  const now = Date.now()
  const delay = payload.scheduleAt.getTime() - now
  if (delay <= 0) { return }

  const timerId = setTimeout(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') { return }
    try {
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: '/icon-512.svg',
        badge: '/icon-192x192.png',
        tag: `${payload.type}-${payload.entityId}`,
        silent: !payload.sound || payload.sound === 'none',
        data: payload.extra || {},
      })
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
      setTimeout(() => notification.close(), 15000)
    } catch (e) { console.warn('scheduleBrowserNotification failed', e) }
  }, delay)

  browserTimers.set(payload.entityId, timerId)
}

async function scheduleNativeNotification(payload: AlarmPayload): Promise<void> {
  const extra = payload.extra || {}
  const timeStr = (extra.time as string) || ''
  const extraJson = JSON.stringify(extra)
  const isRecurring = payload.type === 'habit'
  // ponytail: debug log removed
  try {
    const globalAlarmSound = useStore.getState().timerSettings?.alarmSound || 'studentos_alarm'
    await Alarm.scheduleAlarm({
      entityId: payload.entityId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      scheduleAtMs: payload.scheduleAt.getTime(),
      isRecurring,
      timeStr,
      sound: payload.sound && payload.sound !== 'default' ? payload.sound : globalAlarmSound,
      vibration: payload.vibration ?? true,
      extraJson,
    })
  } catch (e) {
    console.error(`[Alarm] ${payload.type} alarm REJECTED: ${payload.entityId} reason="${(e as any)?.message || e}"`)
  }
}

export async function scheduleAlarm(payload: AlarmPayload): Promise<void> {
  const now = Date.now()
  if (payload.scheduleAt.getTime() <= now) {
    return
  }
  const delaySec = Math.round((payload.scheduleAt.getTime() - now) / 1000)
  await cancelTimer(payload.entityId)
  if (isNative()) {
    await scheduleNativeNotification(payload)
  } else {
    scheduleBrowserNotification(payload)
  }
}

export async function cancelAlarm(entityId: string): Promise<void> {
  await cancelTimer(entityId)
}

export async function cancelAllAlarms(): Promise<void> {
  for (const [key] of browserTimers) {
    clearTimeout(browserTimers.get(key)!)
    browserTimers.delete(key)
  }
  if (isNative()) {
    try { await Alarm.cancelAllAlarms() } catch (e) { console.warn('cancelAllAlarms AlarmPlugin failed', e) }
  }
}

export async function dismissAlarm(): Promise<void> {
  if (isNative()) {
    try { await Alarm.dismissAlarm() } catch (e) { console.warn('dismissAlarm failed', e) }
  }
}

export async function syncHabitAlarms(habits: Habit[]): Promise<void> {
  return serialized(() => syncHabitAlarmsImpl(habits))
}

async function syncHabitAlarmsImpl(habits: Habit[]): Promise<void> {
  await runOneTimeMigration()

  const now = new Date()
  const today = now.toISOString().split('T')[0]

  if (isNative()) {
    const { granted } = await Alarm.checkExactAlarmPermission()
    if (!granted) {
      console.warn('[Alarm] Exact alarm permission not granted — requesting from user')
      try {
        await requestExactAlarmWithNotice()
      } catch (e) {
        console.warn('[Alarm] requestExactAlarmPermission failed', e)
      }
      // Re-check after the request dialog. If still not granted, bail — the OS
      // will open the system settings screen; alarms will sync on next app launch.
      const { granted: grantedAfter } = await Alarm.checkExactAlarmPermission()
      if (!grantedAfter) {
        console.warn('[Alarm] Exact alarm permission still not granted — skipping habit alarm sync')
        return
      }
    }
  }

  const activeIds = new Map<string, string[]>()

  for (const habit of habits) {
    if (habit.archived) { activeIds.set(habit.id, []); continue }
    if (!habit.alarmEnabled && !habit.reminder?.enabled) { activeIds.set(habit.id, []); continue }

    const times = habit.reminder?.times || []
    if (times.length === 0) { activeIds.set(habit.id, []); continue }

    const completedToday = habit.completedDates.includes(today) && !(habit.reminder?.repeat)
    if (completedToday) { activeIds.set(habit.id, []); continue }

    const entityIds: string[] = []
    for (const timeStr of times) {
      const [h, m] = timeStr.split(':').map(Number)
      if (isNaN(h) || isNaN(m)) continue
      entityIds.push(`${habit.id}-${timeStr}`)
    }
    activeIds.set(habit.id, entityIds)
  }

  for (const [habitId, newIds] of activeIds) {
    const oldIds = lastHabitIds.get(habitId) || []

    const toCancel = oldIds.filter(id => !newIds.includes(id))
    const toSchedule = newIds.filter(id => !oldIds.includes(id))

    for (const id of toCancel) {
      await cancelAlarm(id)
    }

    const habit = habits.find(h => h.id === habitId)
    if (!habit) continue

    for (const alarmId of toSchedule) {
      const timeStr = alarmId.slice(habitId.length + 1)
      const [h, m] = timeStr.split(':').map(Number)
      if (isNaN(h) || isNaN(m)) continue

      const scheduleAt = new Date(now)
      scheduleAt.setHours(h, m, 0, 0)
      if (scheduleAt <= now) {
        scheduleAt.setDate(scheduleAt.getDate() + 1)
      }

      await scheduleAlarm({
        type: 'habit',
        entityId: alarmId,
        title: `Habit Reminder: ${habit.name}`,
        body: habit.description || `Time to complete "${habit.name}"`,
        scheduleAt,
        sound: habit.reminder?.sound || 'default',
        vibration: habit.reminder?.vibration ?? true,
        extra: { habitId: habit.id, time: timeStr },
      })
    }

    lastHabitIds.set(habitId, newIds)
  }

  for (const [habitId] of lastHabitIds) {
    if (!activeIds.has(habitId)) {
      const oldIds = lastHabitIds.get(habitId) || []
      for (const id of oldIds) {
        await cancelAlarm(id)
      }
      lastHabitIds.delete(habitId)
    }
  }
}

export async function syncPlannerAlarms(events: StudyEvent[]): Promise<void> {
  return serialized(() => syncPlannerAlarmsImpl(events))
}

async function syncPlannerAlarmsImpl(events: StudyEvent[]): Promise<void> {
  if (isNative()) {
    const { granted } = await Alarm.checkExactAlarmPermission()
    if (!granted) {
      console.warn('[Alarm] Exact alarm permission not granted — requesting from user (planner)')
      try {
        await requestExactAlarmWithNotice()
      } catch (e) {
        console.warn('[Alarm] requestExactAlarmPermission failed (planner)', e)
      }
      const { granted: grantedAfter } = await Alarm.checkExactAlarmPermission()
      if (!grantedAfter) {
        console.warn('[Alarm] Exact alarm permission still not granted — skipping planner alarm sync')
        return
      }
    }
  }

  const newPlannerIds = new Set<string>()

  for (const event of events) {
    if (!event.reminder?.enabled || event.completed) continue

    const start = new Date(event.startTime)
    const remindAt = new Date(start.getTime() - event.reminder.minutesBefore * 60000)
    if (remindAt <= new Date()) continue

    newPlannerIds.add(event.id)
  }

  for (const id of lastPlannerIds) {
    if (!newPlannerIds.has(id)) {
      await cancelAlarm(id)
    }
  }

  for (const id of newPlannerIds) {
    if (lastPlannerIds.has(id)) continue
    const event = events.find(e => e.id === id)
    if (!event) continue

    const start = new Date(event.startTime)
    const remindAt = new Date(start.getTime() - event.reminder!.minutesBefore * 60000)

    await scheduleAlarm({
      type: 'planner',
      entityId: event.id,
      title: `Time to ${event.title}`,
      body: event.subject
        ? `${event.subject} — ${start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
        : `Scheduled for ${start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`,
      scheduleAt: remindAt,
      extra: { eventId: event.id },
    })
  }

  lastPlannerIds = newPlannerIds
}


