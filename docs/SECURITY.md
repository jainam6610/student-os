# Security Overview

**Student OS — Offline-First Security Architecture**

---

## Security Principles

Student OS is built on a **local-first, zero-trust** security model. The app operates on the principle that user data should never leave the device.

1. **No data transmission** — No network calls, no servers, no cloud sync
2. **No authentication** — No passwords, no tokens, no sessions to compromise
3. **Minimal permissions** — Only the permissions absolutely required for functionality
4. **Data isolation** — Each user's data is isolated at the device level
5. **Transparency** — Full source code, no obfuscated logic

---

## Data at Rest

### Storage

| Storage Mechanism | Data Stored | Encryption |
|------------------|-------------|------------|
| localStorage | App state, tasks, habits, sessions, events | Device-level encryption (Android file-based encryption) |
| SharedPreferences | Distraction records, Deep Lock settings | Device-level encryption |
| IndexedDB | Export/import data (optional) | Device-level encryption |

All data storage uses Android's built-in file-based encryption (FBE) which encrypts files at the kernel level using per-file keys. This means data is encrypted at rest even without app-level encryption.

### Future Considerations

If cloud backup is added in the future, it will use:
- End-to-end encryption (zero-knowledge)
- Client-side encryption key derived from user's passphrase
- No server-side access to plaintext data

---

## Data in Transit

**Student OS does not transmit data over any network.**

- No HTTP/HTTPS requests
- No WebSocket connections
- No cloud API calls
- No analytics telemetry
- No crash reporting (unless explicitly enabled by the user)

The app functions entirely offline. Network access, if any, is limited to:
- PWA service worker caching (static assets only, same origin)
- Web Audio API (local oscillator, no network audio)

---

## Permission Security

### Foreground Service

- Runs only during active Focus Sessions
- Shows a persistent notification so the user is always aware
- Automatically terminates when the session ends
- Cannot be started by any external trigger (only user action)

### Accessibility Service

- Off by default — must be explicitly enabled by the user in system Settings
- During active Focus sessions, uses the foreground app package name and display name to apply the user&apos;s allowed-app list
- Never reads text content, keystrokes, notifications, passwords, or app window content
- Stores allowed-app lists and blocked-app attempts locally; never transmits Accessibility-derived data
- Can be disabled at any time

### Warning Screen (no `SYSTEM_ALERT_WINDOW`)

- `SYSTEM_ALERT_WINDOW` is NOT declared and no overlay is used; warnings use a normal full-screen Activity (`WarningActivity`)
- Shown only when a blocked app is detected during an active Focus Session
- Dismissed when user selects an action (Return to Focus / Dismiss)
- Never used for advertising, tracking, or persistent overlays

### Usage Access (`PACKAGE_USAGE_STATS`)

- Required for Deep Lock foreground-app detection (special access granted via system Settings)
- Reads only the foreground app package name during active Focus Sessions
- Runs only while a Focus Session is active; raw usage events are not persisted or transmitted
- Accessibility remains the primary event-driven detection path

---

## Input Validation

All user input is validated before storage:

- **String lengths** are capped (e.g., task titles: 200 chars)
- **Special characters** are stored as-is (no injection risk since no SQL/backend)
- **Date values** are validated using date-fns
- **Numeric values** are clamped to reasonable ranges

---

## Deep Lock Security

Deep Lock is designed to be a user-empowerment tool, not a security boundary:

- **It is not a parental control tool** — Users can bypass it (dismiss warning, disable service)
- **It is not a security lock** — The purpose is mindfulness, not enforcement
- **All data is local** — No remote configuration or monitoring

### Threat Model

| Threat | Mitigation |
|--------|-----------|
| Unauthorized access to local data | Protected by Android device lock screen + FBE |
| Malicious app using Accessibility Service | Service is only active during sessions; user must explicitly enable |
| Data leakage via export | Export requires explicit user action; data is not encrypted in export (user controls the file) |
| Service abuse by other apps | Foreground Service cannot be started by external intents |

---

## Dependencies

All third-party dependencies are:

- Open source with permissive licenses (MIT, Apache 2.0, ISC, SIL OFL)
- Regularly updated via `npm audit` and `npm update`
- Scanned for known vulnerabilities

See [THIRD_PARTY_LICENSES.md](./THIRD_PARTY_LICENSES.md) for the complete list.

---

## Reporting Vulnerabilities

If you discover a security vulnerability in Student OS:

1. **Do not** open a public GitHub issue
2. **Email** [security@studentos.app](mailto:security@studentos.app)
3. Include a detailed description and reproduction steps
4. We will respond within 72 hours

We practice responsible disclosure and will coordinate fixes before public disclosure.

---

## Compliance

- **GDPR:** Data is stored locally; no personal data is processed by us
- **COPPA:** No personal information collected from children
- **CCPA:** All data is local; no sale of personal information
- **FERPA:** App can be used for educational purposes; no student records leave the device

---

**Student OS — Security is not a feature. It's the foundation.**
