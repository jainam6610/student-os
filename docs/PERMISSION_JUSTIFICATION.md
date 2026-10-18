# Permission Justification

**For Google Play Console declaration.**

---

## Permissions Used

### 1. `FOREGROUND_SERVICE`

**Status:** Required  
**Type:** Normal  
**Purpose:** Maintain Focus Session timer accuracy when the app is in the background. The timer must continue running and the Deep Lock feature must continue monitoring blocked apps.

**Justification:** Android kills app processes when they move to the background. Without a Foreground Service, a Focus Session would be interrupted every time the user switches apps or locks the device. This is the standard Android API for long-running user-initiated tasks.

---

### 2. `FOREGROUND_SERVICE_SPECIAL_USE`

**Status:** Required  
**Type:** Normal  
**Purpose:** Declared for the Deep Lock feature which uses special-use foreground service for monitoring app usage during Focus Sessions.

**Justification:** Required by Google Play policy for foreground services that provide system-integrated functionality. This is used exclusively during active Focus Sessions initiated by the user.

---

### 3. Foreground-app warning (no `SYSTEM_ALERT_WINDOW`)

**Status:** NOT DECLARED — do not declare in Play Console  
**Purpose:** When a blocked app is detected during a Focus Session, Deep Lock launches a normal full-screen Activity (`WarningActivity`). No overlay permission exists or is needed.

---

### 4. App visibility via `<queries>` (NO `QUERY_ALL_PACKAGES`)

**Status:** NOT DECLARED — do not declare in Play Console  
**Purpose:** The manifest uses a scoped `<queries>` element (MAIN + LAUNCHER intent) instead of `QUERY_ALL_PACKAGES`. `PackageScanner.queryIntentActivities()` enumerates launchable apps for the Deep Lock "Allowed Apps" configuration screen.

**Justification:** Scoped package visibility is the Play-policy-compliant alternative to `QUERY_ALL_PACKAGES`. Only package names and display names of launchable apps are accessed; no app data is read and nothing is transmitted.

---

### 5. `RECEIVE_BOOT_COMPLETED`

**Status:** Required  
**Type:** Normal  
**Purpose:** Reschedule any active Focus Session alarms or reminders after a device reboot.

**Justification:** If a user scheduled a reminder for a study session and the device reboots, this permission allows the app to reschedule the notification. This is a standard pattern for apps with time-based functionality.

---

### 6. `POST_NOTIFICATIONS`

**Status:** Required  
**Type:** Normal  
**Purpose:** Show notifications for Focus Session completion, Deep Lock warnings, and session reminders.

**Justification:** Notifications are essential for:
- Alerting the user when a Focus Session completes
- Showing the persistent Foreground Service notification during sessions
- Informing the user of distraction attempts
- Reminding the user of scheduled study sessions

Users can disable notifications at any time via system Settings.

---

### 7. `PACKAGE_USAGE_STATS`

**Status:** Required for Deep Lock  
**Type:** Special access (App usage access, granted via system Settings)  
**Purpose:** Detect the currently running foreground app so Deep Lock can block distractions during active Focus Sessions.

**Justification:** Complements the Accessibility Service's event-driven detection with a periodic foreground-app check while a Focus Session is active. It reads only the foreground app package name, raw usage events are not persisted, and nothing is transmitted.

---

### 8. `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`

**Status:** Recommended  
**Type:** Normal  
**Purpose:** Prevent the system from killing the Foreground Service during Focus Sessions.

**Justification:** Android's battery optimization may kill the Foreground Service even while a Focus Session is active, causing the timer to stop and Deep Lock to fail. This permission allows the app to request exemption from battery optimization for the duration of the session only.

---

## Permissions NOT Used (for declaration)

| Permission | Why Not Used |
|-----------|-------------|
| `INTERNET` | **Declared** (required by the Capacitor WebView runtime and external links). No app feature transmits data. Do NOT list as unused. |
| `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` | App does not use location. |
| `CAMERA` | App does not use the camera. |
| `RECORD_AUDIO` | App does not record audio. |
| `READ_CONTACTS` / `READ_CALL_LOG` | App does not access contacts. |
| `READ_SMS` / `RECEIVE_SMS` | App does not read SMS. |
| `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` | App uses scoped storage or local storage only. |
| `ACCESS_MEDIA_LOCATION` | App does not access media files. |
| `BLUETOOTH` / `BLUETOOTH_ADMIN` | App does not use Bluetooth. |
| `NFC` | App does not use NFC. |
| `BODY_SENSORS` | App does not access sensor data. |
| `ACTIVITY_RECOGNITION` | App does not track physical activity. |

---

## Summary

| Permission | Required | Optional | Declaration |
|-----------|----------|----------|-------------|
| `FOREGROUND_SERVICE` | ✓ | | App functionality |
| `FOREGROUND_SERVICE_SPECIAL_USE` | ✓ | | App functionality |
| `SYSTEM_ALERT_WINDOW` | — | — | **NOT DECLARED** — WarningActivity is a normal Activity; no overlay |
| `QUERY_ALL_PACKAGES` | — | — | **NOT DECLARED** — replaced by scoped `<queries>` (MAIN+LAUNCHER) |
| `RECEIVE_BOOT_COMPLETED` | ✓ | | App functionality |
| `POST_NOTIFICATIONS` | ✓ | | App functionality |
| `PACKAGE_USAGE_STATS` | ✓ | | Deep Lock functionality |
| `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` | | ✓ | App functionality |

## Current Architecture (authoritative, verified against APK 1.1.0)

- AccessibilityService for Deep Lock (`canRetrieveWindowContent=false`, `TYPE_WINDOW_STATE_CHANGED` only, foreground package name only)
- Usage Access (`UsageStatsManager`) as foreground-app detection/fallback during active sessions
- Scoped `<queries>` for app visibility — **NO `QUERY_ALL_PACKAGES`**
- **NO `SYSTEM_ALERT_WINDOW`** — warnings use a normal full-screen Activity
- In-app Accessibility prominent disclosure + affirmative consent ("Allow Deep Lock"), sole gateway to Accessibility Settings
- On-device processing/storage only; no Accessibility-derived data transmission
