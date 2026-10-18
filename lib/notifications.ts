// ─────────────────────────────────────────────────────────
//  Student OS — Browser Notifications
//  Focus session completion notifications (Android/PWA)
// ─────────────────────────────────────────────────────────

const NOTIFICATION_PERMISSION_KEY = 'student-os-notification-permission'

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

/**
 * Check if notifications are supported
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'permission' in Notification
}

/**
 * Get current notification permission state
 */
export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.permission as NotificationPermissionState
}

/**
 * Check if user has previously dismissed permission request
 */
export function hasUserDismissedPermission(): boolean {
  try {
    const dismissed = localStorage.getItem(NOTIFICATION_PERMISSION_KEY)
    return dismissed === 'dismissed'
  } catch {
    return false
  }
}

/**
 * Mark permission request as dismissed
 */
export function markPermissionDismissed(): void {
  try {
    localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'dismissed')
  } catch {
    // Silent fail
  }
}

/**
 * Request notification permission (graceful, non-spammy)
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) return 'unsupported'

  const current = Notification.permission
  if (current === 'granted') return 'granted'
  if (current === 'denied') return 'denied'

  // Check if user previously dismissed
  if (hasUserDismissedPermission()) return 'default'

  try {
    const result = await Notification.requestPermission()
    if (result === 'denied' || result === 'default') {
      markPermissionDismissed()
    }
    return result as NotificationPermissionState
  } catch {
    return 'denied'
  }
}

/**
 * Show focus session completion notification
 */
export function showFocusCompleteNotification(
  duration: number,
  options?: {
    motivationalLine?: string
    focusScore?: number
  }
): Notification | null {
  if (!isNotificationSupported()) return null
  if (Notification.permission !== 'granted') return null

  const hours = Math.floor(duration / 60)
  const minutes = duration % 60
  const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

  const motivational = options?.motivationalLine || getRandomMotivationalLine()
  const scoreEmoji = options?.focusScore
    ? options.focusScore >= 90
      ? '🔥'
      : options.focusScore >= 70
      ? '✨'
      : '💪'
    : '✅'

  try {
    const notification = new Notification('Focus Session Complete', {
      body: `${scoreEmoji} ${timeStr} of deep work\n${motivational}`,
      icon: '/icon-512.svg',
      badge: '/icon-192x192.png',
      tag: 'focus-complete',
      requireInteraction: false,
      silent: false,
      data: {
        type: 'focus-complete',
        duration,
        timestamp: Date.now(),
      },
    })

    // Auto-close after 10 seconds
    setTimeout(() => {
      notification.close()
    }, 10000)

    // Handle click: focus app
    notification.onclick = () => {
      window.focus()
      notification.close()
      // Navigate to focus view if possible
      if (window.location.search !== '?view=focus') {
        window.history.pushState(null, '', '?view=focus')
      }
    }

    return notification
  } catch (error) {
    console.warn('Failed to show notification:', error)
    return null
  }
}

/**
 * Show storage warning notification
 */
export function showStorageWarningNotification(percentage: number): Notification | null {
  if (!isNotificationSupported()) return null
  if (Notification.permission !== 'granted') return null

  try {
    const notification = new Notification('Storage Warning', {
      body: `Your Student OS storage is ${Math.round(percentage * 100)}% full. Consider exporting and clearing old data.`,
      icon: '/icon-512.svg',
      badge: '/icon-192x192.png',
      tag: 'storage-warning',
      requireInteraction: true,
      silent: true,
      data: {
        type: 'storage-warning',
        percentage,
        timestamp: Date.now(),
      },
    })

    notification.onclick = () => {
      window.focus()
      notification.close()
      // Navigate to settings
      if (window.location.search !== '?view=settings') {
        window.history.pushState(null, '', '?view=settings')
      }
    }

    return notification
  } catch {
    return null
  }
}

/**
 * Test notification (for settings)
 */
export function showTestNotification(): Notification | null {
  if (!isNotificationSupported()) return null
  if (Notification.permission !== 'granted') return null

  try {
    const notification = new Notification('Student OS', {
      body: 'Notifications are working! You\'ll receive alerts when focus sessions complete.',
      icon: '/icon-512.svg',
      badge: '/icon-192x192.png',
      tag: 'test',
      requireInteraction: false,
      silent: true,
    })

    setTimeout(() => notification.close(), 5000)

    notification.onclick = () => {
      window.focus()
      notification.close()
    }

    return notification
  } catch {
    return null
  }
}

/**
 * Vibrate device (if supported)
 */
export function vibrate(pattern: number | number[]): boolean {
  if (!('vibrate' in navigator)) return false
  try {
    return navigator.vibrate(pattern)
  } catch {
    return false
  }
}

/**
 * Get random motivational line for completion
 */
function getRandomMotivationalLine(): string {
  const lines = [
    'Excellent work! Keep the momentum.',
    'Another win. You\'re building consistency.',
    'Deep work complete. Well done.',
    'Focus session conquered.',
    'You showed up. That\'s what matters.',
    'Progress over perfection.',
    'One more step toward your goals.',
    'Consistency is your superpower.',
  ]
  return lines[Math.floor(Math.random() * lines.length)]
}

/**
 * Initialize notification system
 */
export function initNotifications(): {
  isSupported: boolean
  permission: NotificationPermissionState
  requestPermission: () => Promise<NotificationPermissionState>
} {
  return {
    isSupported: isNotificationSupported(),
    permission: getNotificationPermission(),
    requestPermission: requestNotificationPermission,
  }
}
