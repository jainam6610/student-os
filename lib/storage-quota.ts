// ─────────────────────────────────────────────────────────
//  Student OS — localStorage Quota Management
//  Production-grade storage monitoring and recovery
// ─────────────────────────────────────────────────────────

const STORAGE_KEY = 'student-os-storage-v3'
const ESTIMATED_QUOTA = 5 * 1024 * 1024 // 5MB conservative estimate
const WARN_THRESHOLD = 0.75 // 75%
const CRITICAL_THRESHOLD = 0.90 // 90%
const EMERGENCY_THRESHOLD = 0.95 // 95%

export interface StorageStats {
  used: number
  estimated: number
  percentage: number
  isNearQuota: boolean
  isCritical: boolean
  isEmergency: boolean
}

let cachedUsage = { value: 0, timestamp: 0 }
const CACHE_TTL = 30000 // 30 second cache

/**
 * Calculate current localStorage usage in bytes
 */
export function getStorageUsage(): number {
  try {
    const now = Date.now()
    if (now - cachedUsage.timestamp < CACHE_TTL) return cachedUsage.value
    let total = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key)
        if (value) {
          total += (key.length + value.length) * 2
        }
      }
    }
    cachedUsage = { value: total, timestamp: now }
    return total
  } catch {
    return 0
  }
}

/**
 * Get estimated quota (browser-dependent)
 */
export function getEstimatedQuota(): number {
  // Try StorageManager API (modern browsers)
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    // Return promise-based estimate, but we need sync for now
    return ESTIMATED_QUOTA
  }
  return ESTIMATED_QUOTA
}

/**
 * Get comprehensive storage statistics
 */
export function getStorageStats(): StorageStats {
  const used = getStorageUsage()
  const estimated = getEstimatedQuota()
  const percentage = estimated > 0 ? used / estimated : 0

  return {
    used,
    estimated,
    percentage,
    isNearQuota: percentage >= WARN_THRESHOLD,
    isCritical: percentage >= CRITICAL_THRESHOLD,
    isEmergency: percentage >= EMERGENCY_THRESHOLD,
  }
}

/**
 * Check if storage is near quota
 */
export function isNearQuota(): boolean {
  const stats = getStorageStats()
  return stats.isNearQuota
}

/**
 * Check if storage is critical
 */
export function isCriticalQuota(): boolean {
  const stats = getStorageStats()
  return stats.isCritical
}

/**
 * Archive old focus sessions (>90 days) to compressed format
 */
export function archiveOldSessions(): { archived: number; saved: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { archived: 0, saved: 0 }

    const parsed = JSON.parse(raw)
    if (!parsed.state || !Array.isArray(parsed.state.focusSessions)) {
      return { archived: 0, saved: 0 }
    }

    const now = Date.now()
    const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000

    const sessions = parsed.state.focusSessions
    const beforeSize = JSON.stringify(sessions).length

    // Keep only sessions from last 90 days
    const recentSessions = sessions.filter((s: any) => {
      const endTime = s.endTime ? new Date(s.endTime).getTime() : now
      return endTime > ninetyDaysAgo
    })

    const archived = sessions.length - recentSessions.length
    if (archived === 0) return { archived: 0, saved: 0 }

    parsed.state.focusSessions = recentSessions
    const afterSize = JSON.stringify(recentSessions).length
    const saved = beforeSize - afterSize

    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))

    window.dispatchEvent(new CustomEvent('sessions-archived', {
      detail: { archived, saved }
    }))

    return { archived, saved }
  } catch {
    return { archived: 0, saved: 0 }
  }
}

/**
 * Remove completed tasks older than 30 days
 */
export function cleanupOldTasks(): { removed: number; saved: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { removed: 0, saved: 0 }

    const parsed = JSON.parse(raw)
    if (!parsed.state || !Array.isArray(parsed.state.tasks)) {
      return { removed: 0, saved: 0 }
    }

    const now = Date.now()
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000

    const tasks = parsed.state.tasks
    const beforeSize = JSON.stringify(tasks).length

    // Keep incomplete tasks + recently completed tasks
    const activeTasks = tasks.filter((t: any) => {
      if (t.status !== 'done') return true
      if (!t.completedAt) return true
      const completedTime = new Date(t.completedAt).getTime()
      return completedTime > thirtyDaysAgo
    })

    const removed = tasks.length - activeTasks.length
    if (removed === 0) return { removed: 0, saved: 0 }

    parsed.state.tasks = activeTasks
    const afterSize = JSON.stringify(activeTasks).length
    const saved = beforeSize - afterSize

    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
    window.dispatchEvent(new CustomEvent('storage-data-cleaned'))
    return { removed, saved }
  } catch {
    return { removed: 0, saved: 0 }
  }
}

/**
 * Remove old calendar events (past events older than 60 days)
 */
export function cleanupOldEvents(): { removed: number; saved: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { removed: 0, saved: 0 }

    const parsed = JSON.parse(raw)
    if (!parsed.state || !Array.isArray(parsed.state.events)) {
      return { removed: 0, saved: 0 }
    }

    const now = Date.now()
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000

    const events = parsed.state.events
    const beforeSize = JSON.stringify(events).length

    // Keep future events + recent past events
    const activeEvents = events.filter((e: any) => {
      const endTime = e.endTime ? new Date(e.endTime).getTime() : now
      return endTime > sixtyDaysAgo
    })

    const removed = events.length - activeEvents.length
    if (removed === 0) return { removed: 0, saved: 0 }

    parsed.state.events = activeEvents
    const afterSize = JSON.stringify(activeEvents).length
    const saved = beforeSize - afterSize

    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
    window.dispatchEvent(new CustomEvent('storage-data-cleaned'))
    return { removed, saved }
  } catch {
    return { removed: 0, saved: 0 }
  }
}

/**
 * Comprehensive cleanup: archive + remove old data
 */
export function cleanupOldData(): {
  totalSaved: number
  sessionsArchived: number
  tasksRemoved: number
  eventsRemoved: number
} {
  const sessions = archiveOldSessions()
  const tasks = cleanupOldTasks()
  const events = cleanupOldEvents()

  return {
    totalSaved: sessions.saved + tasks.saved + events.saved,
    sessionsArchived: sessions.archived,
    tasksRemoved: tasks.removed,
    eventsRemoved: events.removed,
  }
}

/**
 * Emergency compaction: aggressive data reduction
 * Only call when storage is critically full
 */
export function emergencyCompact(): {
  success: boolean
  saved: number
  actions: string[]
} {
  const actions: string[] = []
  let totalSaved = 0

  try {
    // 1. Archive sessions older than 60 days (more aggressive)
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { success: false, saved: 0, actions }

    const parsed = JSON.parse(raw)
    if (!parsed.state) return { success: false, saved: 0, actions }

    const now = Date.now()
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000

    // Aggressive session cleanup
    if (Array.isArray(parsed.state.focusSessions)) {
      const before = JSON.stringify(parsed.state.focusSessions).length
      parsed.state.focusSessions = parsed.state.focusSessions.filter((s: any) => {
        const endTime = s.endTime ? new Date(s.endTime).getTime() : now
        return endTime > sixtyDaysAgo
      })
      const after = JSON.stringify(parsed.state.focusSessions).length
      totalSaved += before - after
      actions.push('Archived sessions older than 60 days')
    }

    // Remove all completed tasks older than 7 days
    if (Array.isArray(parsed.state.tasks)) {
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
      const before = JSON.stringify(parsed.state.tasks).length
      parsed.state.tasks = parsed.state.tasks.filter((t: any) => {
        if (t.status !== 'done') return true
        if (!t.completedAt) return true
        return new Date(t.completedAt).getTime() > sevenDaysAgo
      })
      const after = JSON.stringify(parsed.state.tasks).length
      totalSaved += before - after
      actions.push('Removed old completed tasks')
    }

    // Remove all past events
    if (Array.isArray(parsed.state.events)) {
      const before = JSON.stringify(parsed.state.events).length
      parsed.state.events = parsed.state.events.filter((e: any) => {
        const endTime = e.endTime ? new Date(e.endTime).getTime() : now
        return endTime > now
      })
      const after = JSON.stringify(parsed.state.events).length
      totalSaved += before - after
      actions.push('Removed past events')
    }

    // Strip optional fields from sessions to reduce size
    if (Array.isArray(parsed.state.focusSessions)) {
      parsed.state.focusSessions = parsed.state.focusSessions.map((s: any) => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        duration: s.duration,
        targetDuration: s.targetDuration,
        type: s.type,
        completed: s.completed,
        interrupted: s.interrupted,
        focusScore: s.focusScore,
        // Remove: reflection, category, energy, distractions
      }))
      actions.push('Compressed session data')
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
    window.dispatchEvent(new CustomEvent('storage-data-cleaned'))
    return { success: true, saved: totalSaved, actions }
  } catch {
    return { success: false, saved: 0, actions }
  }
}

/**
 * Safe write with quota check and retry
 */
function hasLocalStorage(): boolean {
  try { return typeof localStorage !== 'undefined' } catch { return false }
}

export function safeWrite(key: string, value: string): {
  success: boolean
  error?: string
  compacted?: boolean
} {
  if (!hasLocalStorage()) return { success: false, error: 'localStorage not available' }

  // Pre-flight quota check
  const stats = getStorageStats()

  if (stats.isEmergency) {
    // Emergency: try compaction first
    const compact = emergencyCompact()
    if (!compact.success) {
      return {
        success: false,
        error: 'Storage critically full. Please export your data and clear old items.',
      }
    }
  }

  // Attempt write
  try {
    localStorage.setItem(key, value)
    return { success: true }
  } catch (error) {
    // Write failed — likely quota exceeded
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      // Try emergency compaction
      const compact = emergencyCompact()
      if (compact.success) {
        // Retry write
        try {
          localStorage.setItem(key, value)
          return { success: true, compacted: true }
        } catch {
          return {
            success: false,
            error: 'Storage full even after cleanup. Export and clear data.',
          }
        }
      }
      return {
        success: false,
        error: 'Storage quota exceeded. Please export your data.',
      }
    }
    return { success: false, error: 'Failed to write to storage' }
  }
}

/**
 * Verify write integrity
 */
export function verifyWrite(key: string, expectedValue: string): boolean {
  try {
    const actual = localStorage.getItem(key)
    return actual === expectedValue
  } catch {
    return false
  }
}

/**
 * Get human-readable storage size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}


