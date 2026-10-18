import { sanitizeString, sanitizeNumber } from '../helpers'
import { MAX_SESSIONS, MAX_FOCUS_MINUTES, MAX_XP } from '../constants'
import { generateId } from '../../utils'
import { normalizeStudyEvent, calculateLevel } from '../helpers'
import { computeRecomputedProgress } from '../../analytics-engine'
import type { FocusSession } from '../types'

export interface FocusSlice {
  focusSessions: FocusSession[]
  addFocusSession: (session: Omit<FocusSession, 'id'>) => void
  addSessionReflection: (sessionId: string, reflection: string) => void
  recomputeProgress: () => void
}

export const createFocusSlice = (set: any, get: any, _api?: any): FocusSlice => ({
  focusSessions: [],
  addFocusSession: (session) => set((state: any) => {
    if (state.focusSessions.length >= MAX_SESSIONS) return state
    const completed = session.completed !== false
    const interrupted = !!session.interrupted
    let status = session.status
    if (status !== 'completed' && status !== 'interrupted' && status !== 'cancelled') {
      if (completed && !interrupted) status = 'completed'
      else if (interrupted) status = 'interrupted'
      else status = 'cancelled'
    }
    const newSessions = [...state.focusSessions, {
      ...session, id: generateId(),
      duration: sanitizeNumber(session.duration, 0, 0, MAX_FOCUS_MINUTES),
      targetDuration: sanitizeNumber(session.targetDuration, 0, 0, MAX_FOCUS_MINUTES),
      status, createdAt: session.createdAt ?? new Date(),
    }]
    return { focusSessions: newSessions, progress: computeRecomputedProgress(newSessions, state.progress) }
  }),
  addSessionReflection: (sessionId, reflection) => set((state: any) => ({
    focusSessions: state.focusSessions.map((s: FocusSession) => s.id === sessionId ? { ...s, reflection: sanitizeString(reflection, '', 5000) } : s),
  })),
  recomputeProgress: () => set((state: any) => ({ progress: computeRecomputedProgress(state.focusSessions, state.progress) })),
})
