import { format } from 'date-fns'
import { sanitizeString, sanitizeNumber, normalizeStudyEvent, sanitizeDate, sanitizeBoolean } from '../helpers'
import { MAX_EVENTS } from '../constants'
import { generateId } from '../../utils'
import { syncPlannerAlarms, cancelAlarm } from '../../scheduling'
import { normalizePlannerSettings } from '../../planner/utils'
import type { PlannerSettings, StudyEvent } from '../types'

 
export interface EventSlice {
  plannerSettings: PlannerSettings
  setPlannerSettings: (updates: Partial<PlannerSettings>) => void
  plannerSetupComplete: boolean
  setPlannerSetupComplete: (complete: boolean) => void
  events: StudyEvent[]
  addEvent: (event: Omit<StudyEvent, 'id'>) => void
  updateEvent: (id: string, updates: Partial<StudyEvent>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
  rescheduleEvent: (id: string, startTime: Date, endTime: Date) => Promise<void>
  markEventComplete: (id: string, completed?: boolean) => void
  attachFocusSessionToEvent: (eventId: string, focusSessionId: string, minutes: number, completed: boolean) => void
  setCarryForwardSuggestion: (id: string, suggestedFor: Date | null) => void
}

export const createEventSlice = (set: any, get: any, _api?: any): EventSlice => ({
  plannerSettings: normalizePlannerSettings(),
  setPlannerSettings: (updates) => set((state: any) => ({
    plannerSettings: normalizePlannerSettings({ ...state.plannerSettings, ...updates }),
  })),
  plannerSetupComplete: false,
  setPlannerSetupComplete: (complete) => set({ plannerSetupComplete: complete }),
  events: [],
  addEvent: async (event) => {
    try {
      const currentEvents = get().events
      if (currentEvents.length >= MAX_EVENTS) return
      const normalized = normalizeStudyEvent({ ...event, id: generateId() }, get().plannerSettings)
      const newEvents = [...currentEvents, normalized]
      set({ events: newEvents })
      await syncPlannerAlarms(get().events)
    } catch (e) { console.error('[EventSlice] addEvent error:', e) }
  },
  updateEvent: async (id, updates) => {
    const old = get().events.find((e: StudyEvent) => e.id === id)
    if (old && old.reminder?.enabled && !old.completed) {
      await cancelAlarm(id)
    }
    set((state: any) => ({
      events: state.events.map((event: StudyEvent) =>
        event.id === id ? normalizeStudyEvent({ ...event, ...updates, history: [...(event.history ?? []), { id: generateId(), at: new Date(), action: 'updated' as const, note: 'Planner task updated' }] }, state.plannerSettings) : event
      ),
    }))
    await syncPlannerAlarms(get().events)
  },
  deleteEvent: async (id) => {
    await cancelAlarm(id)
    set((state: any) => ({ events: state.events.filter((e: StudyEvent) => e.id !== id) }))
    await syncPlannerAlarms(get().events)
  },
  rescheduleEvent: async (id, startTime, endTime) => {
    const old = get().events.find((e: StudyEvent) => e.id === id)
    if (old && old.reminder?.enabled && !old.completed) {
      await cancelAlarm(id)
    }
    set((state: any) => ({
      events: state.events.map((event: StudyEvent) =>
        event.id === id ? normalizeStudyEvent({
          ...event, startTime, endTime,
          estimatedDuration: Math.round((endTime.getTime() - startTime.getTime()) / 60000),
          history: [...(event.history ?? []), { id: generateId(), at: new Date(), action: 'rescheduled' as const, note: `Moved to ${format(startTime, 'MMM d, h:mm a')}` }],
        }, state.plannerSettings) : event
      ),
    }))
    await syncPlannerAlarms(get().events)
  },
  markEventComplete: async (id, completed = true) => {
    const old = get().events.find((e: StudyEvent) => e.id === id)
    if (completed && old && old.reminder?.enabled) {
      await cancelAlarm(id)
    }
    set((state: any) => ({
      events: state.events.map((event: StudyEvent) =>
        event.id === id ? normalizeStudyEvent({
          ...event, completed, completedAt: completed ? new Date() : undefined,
          history: [...(event.history ?? []), { id: generateId(), at: new Date(), action: 'completed' as const, note: completed ? 'Marked complete' : 'Marked incomplete' }],
        }, state.plannerSettings) : event
      ),
    }))
  },
  attachFocusSessionToEvent: (eventId, focusSessionId, minutes, completed) => set((state: any) => ({
    events: state.events.map((event: StudyEvent) =>
      event.id === eventId ? normalizeStudyEvent({
        ...event,
        focusMinutes: (event.focusMinutes ?? 0) + sanitizeNumber(minutes, 0, 0, 1440),
        focusSessionIds: [...(event.focusSessionIds ?? []), sanitizeString(focusSessionId, '', 80)],
        completed: completed || event.completed,
        completedAt: completed ? new Date() : event.completedAt,
        history: [...(event.history ?? []), { id: generateId(), at: new Date(), action: completed ? 'completed' : 'focus-linked' as const, note: completed ? `Completed with linked focus session (${minutes}m)` : `Linked focus session (${minutes}m)` }],
      }, state.plannerSettings) : event
    ),
  })),
  setCarryForwardSuggestion: (id, suggestedFor) => set((state: any) => ({
    events: state.events.map((event: StudyEvent) =>
      event.id === id ? normalizeStudyEvent({ ...event, carryForwardSuggestedFor: suggestedFor ?? undefined }, state.plannerSettings) : event
    ),
  })),
})
