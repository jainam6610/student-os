import { registerPlugin, PluginListenerHandle } from '@capacitor/core'

export interface AlarmScheduleOptions {
  entityId: string
  type: string
  title: string
  body: string
  scheduleAtMs: number
  isRecurring: boolean
  timeStr: string
  sound: string
  vibration: boolean
  extraJson: string
}

export interface AlarmEventData {
  entityId: string
  title: string
  body: string
  habitId: string
}

export interface ActiveAlarmResult {
  active: boolean
  entityId?: string
  title?: string
  body?: string
  habitId?: string
}

export interface PendingThoughtResult {
  found: boolean
  title?: string
  body?: string
  entityId?: string
  firedAtMs?: number
}

export interface AlarmPlugin {
  scheduleAlarm(options: AlarmScheduleOptions): Promise<{ success: boolean }>
  cancelAlarm(options: { entityId: string }): Promise<{ success: boolean }>
  cancelAllAlarms(): Promise<{ success: boolean }>
  checkExactAlarmPermission(): Promise<{ granted: boolean }>
  requestExactAlarmPermission(): Promise<{ success: boolean }>
  previewAlarm(options: { sound: string }): Promise<{ success: boolean }>
  stopPreview(): Promise<{ success: boolean }>
  dismissAlarm(): Promise<{ success: boolean }>
  snoozeAlarm(options: { minutes: number }): Promise<{ success: boolean }>
  getActiveAlarm(): Promise<ActiveAlarmResult>
  getPendingThought(): Promise<PendingThoughtResult>
  clearPendingThought(): Promise<{ success: boolean }>
  markThoughtHandled(options: { entityId: string }): Promise<{ success: boolean }>
  addListener(eventName: 'alarmFired', listener: (data: AlarmEventData) => void): Promise<PluginListenerHandle>
}

const Alarm = registerPlugin<AlarmPlugin>('Alarm')

export default Alarm
