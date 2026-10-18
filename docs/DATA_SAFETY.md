# Data Safety — Google Play Answers

**Generated for Google Play Console Data Safety section.**

---

## 1. Data Collected

| Data Type | Collected | Shared | Purpose | Optional |
|-----------|-----------|--------|---------|----------|
| App usage (sessions, screens viewed) | Yes | No | App functionality — focus time tracking, distraction analytics | No |
| Personal info (name) | Yes | No | Personalization (greeting, avatar) | No |
| User-generated content (tasks, habits, events) | Yes | No | Core app functionality | No |
| Device ID | No | N/A | N/A | N/A |
| Location | No | N/A | N/A | N/A |
| Photos / Media / Files | No | N/A | N/A | N/A |
| Contacts | No | N/A | N/A | N/A |
| Financial info | No | N/A | N/A | N/A |
| Web browsing history | No | N/A | N/A | N/A |
| Health / Fitness | No | N/A | N/A | N/A |
| Messages / Email | No | N/A | N/A | N/A |
| Voice / Sound recordings | No | N/A | N/A | N/A |
| Calendar | No | N/A | N/A | N/A |

## 2. Data Sharing

**Student OS does not share any data with third parties.**

- No analytics SDK
- No advertising SDK
- No crash reporting SDK (unless opted in)
- No social media SDK
- No third-party servers

## 3. Data Storage

| Data | Storage Location | Encryption |
|------|-----------------|------------|
| User name | Device (localStorage) | Device-level encryption |
| Tasks | Device (localStorage) | Device-level encryption |
| Habits | Device (localStorage) | Device-level encryption |
| Focus sessions | Device (localStorage) | Device-level encryption |
| Events | Device (localStorage) | Device-level encryption |
| Distraction records | Device (SharedPreferences) | Device-level encryption |
| Preferences | Device (localStorage) | Device-level encryption |

**No data is stored on remote servers.**

## 4. Account Requirements

**No account is required to use Student OS.**

- No sign-up
- No login
- No email verification
- No password

## 5. Data Deletion

Users can delete all data at any time:

- **In-app:** Settings → Data → Clear All Data
- **Device:** Uninstall the app (removes all local data)
- **Export:** Settings → Data → Export (downloads a JSON backup before deletion)

## 6. Security Practices

- All data is encrypted at rest via Android device encryption
- No network data transmission
- No authentication system (no credentials to compromise)
- Minimal permission model
- Accessibility Service limited to specific feature only

## 7. Children's Privacy

- No personal information collected from children
- Complies with COPPA
- No account creation required
- No behavioral advertising
- No third-party data sharing

---

## Google Play Declaration Summary

```
Does your app collect data?          → Yes (minimal, locally only)
Is any data shared with third parties? → No
Is data transmission encrypted?      → N/A (no transmission)
Is account required?                 → No
Can users request data deletion?     → Yes (Settings → Data → Clear All)
Is data collection optional?         → Yes (most features opt-in)
Is accessibility service used?       → Yes (Deep Lock only)
Is foreground service used?          → Yes (Focus Sessions only)
Target SDK                           → 35
```
