import { createJSONStorage } from 'zustand/middleware'
import { safeWrite, verifyWrite, getStorageStats, cleanupOldData } from '../storage-quota'
import { STORAGE_KEY, MAX_XP, MAX_FOCUS_MINUTES } from './constants'
import { safeReviver, sanitizeNumber, sanitizeDate } from './helpers'
import type { FocusSession } from './types'

export function validatePersistedData(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false
  const obj = raw as Record<string, unknown>
  if (typeof obj.version !== 'number') return false
  if (!obj.state || typeof obj.state !== 'object') return false
  return true
}

export function safeDeserialize(raw: string): { version: number; state: Record<string, unknown> } | null {
  try {
    const parsed = JSON.parse(raw)
    if (!validatePersistedData(parsed)) return null
    return parsed as { version: number; state: Record<string, unknown> }
  } catch {
    return null
  }
}

const createSafeStorage = () => ({
  getItem: (name: string) => {
    try {
      const raw = localStorage.getItem(name)
      if (raw === null) return null

      // Validate JSON before Zustand touches it — if this throws,
      // the data is corrupt and would cause hasHydrated to stay false forever
      try {
        JSON.parse(raw)
      } catch {
        // Log the corruption for debugging
        try {
          localStorage.setItem('student-os-corruption-log',
            JSON.stringify({
              key: name,
              timestamp: Date.now(),
              rawLength: raw.length,
              rawPreview: raw.slice(0, 100),
            })
          )
        } catch { /* best-effort logging */ }

        // Clear the bad data — fresh start is better than an app that hangs forever
        localStorage.removeItem(name)
        return null // triggers Zustand default state
      }

      return raw // valid JSON — safe to pass to Zustand
    } catch {
      return null // localStorage unavailable
    }
  },
  setItem: (name: string, value: string) => {
    const result = safeWrite(name, value)
    if (!result.success) {
      if (result.error) console.error('Storage write failed:', result.error)
    }
  },
  removeItem: (name: string) => {
    try { localStorage.removeItem(name) } catch {}
  },
})

export const storage = createJSONStorage(createSafeStorage, { reviver: safeReviver })

export function validateSessions(sessions: FocusSession[]): FocusSession[] {
  const seen = new Set<string>()
  return sessions.filter((s) => {
    if (!s || typeof s !== 'object') return false
    if (typeof s.id !== 'string' || !s.id) return false
    if (seen.has(s.id)) return false
    seen.add(s.id)
    if (!s.startTime) return false
    const startTime = typeof s.startTime === 'string' ? new Date(s.startTime) : s.startTime
    if (!(startTime instanceof Date) || Number.isNaN(startTime.getTime())) return false
    if (typeof s.duration !== 'number' || Number.isNaN(s.duration) || s.duration < 0 || s.duration > MAX_FOCUS_MINUTES) return false
    if (typeof s.targetDuration !== 'number' || Number.isNaN(s.targetDuration) || s.targetDuration < 0 || s.targetDuration > MAX_FOCUS_MINUTES) return false
    if (s.endTime) {
      const endTime = typeof s.endTime === 'string' ? new Date(s.endTime) : s.endTime
      if (endTime instanceof Date && !Number.isNaN(endTime.getTime()) && endTime.getTime() < startTime.getTime()) return false
    }
    return true
  })
}

export function repairFocusSessions(sessions: FocusSession[]): FocusSession[] {
  return validateSessions(sessions)
}

export function exportBackup(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = safeDeserialize(raw)
    if (!parsed) return null
    return raw
  } catch {
    return null
  }
}

export function importBackup(json: string): boolean {
  try {
    const parsed = JSON.parse(json)
    if (!validatePersistedData(parsed)) return false
    try {
      localStorage.setItem(STORAGE_KEY, json)
    } catch (e) {
      console.error('Storage write failed during import:', e)
      return false
    }
    window.location.reload()
    return true
  } catch {
    return false
  }
}

export function autoRepair(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (!parsed.state) return
    const state = parsed.state
    let changed = false

    if (Array.isArray(state.focusSessions)) {
      const before = state.focusSessions.length
      state.focusSessions = validateSessions(state.focusSessions as FocusSession[])
      if (state.focusSessions.length !== before) changed = true
    }

    if (state.progress && typeof state.progress === 'object') {
      const p = state.progress as Record<string, unknown>
      if (typeof p.xp === 'number' && (Number.isNaN(p.xp) || p.xp < 0 || p.xp > MAX_XP)) {
        p.xp = sanitizeNumber(p.xp, 0, 0, MAX_XP)
        changed = true
      }
      if (typeof p.level === 'number' && (Number.isNaN(p.level) || p.level < 1)) {
        p.level = Math.max(1, Math.floor((p.xp as number || 0) / 1000) + 1)
        changed = true
      }
    }

    if (changed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
    }

    const oldKeys = ['student-os-storage', 'student-os-storage-v2']
    for (const key of oldKeys) {
      if (localStorage.getItem(key)) localStorage.removeItem(key)
    }
  } catch { /* noop */ }
}

if (typeof window !== 'undefined') {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => { try { autoRepair() } catch {} }, { timeout: 3000 })
  } else {
    setTimeout(() => { try { autoRepair() } catch {} }, 1000)
  }

  window.addEventListener('load', () => {
    setTimeout(() => {
      try { autoRepair(); cleanupOldData() } catch {}
    }, 5000)
  })
}
