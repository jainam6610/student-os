export type SessionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'cancelled'

export type SessionKind = 'focus' | 'break'

export interface FocusSession {
  sessionId: string
  kind: SessionKind
  status: SessionStatus
  startTime: number
  endTime: number
  plannedDuration: number
  elapsed: number
  remaining: number
  pausedDuration: number
  pauseCount: number
  completed: boolean
  interrupted: boolean
}

export interface CompletionData {
  duration: number
  score: number
  interrupted: boolean
}

export type FocusEventType =
  | 'sessionStarted'
  | 'sessionPaused'
  | 'sessionResumed'
  | 'sessionStopped'
  | 'sessionCompleted'
  | 'tick'

export interface FocusEvent {
  type: FocusEventType
  session: FocusSession
  remaining?: number
  elapsed?: number
}
