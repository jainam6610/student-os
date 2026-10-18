# Google Play Compliance Audit — Student OS

**Audit Date:** July 2026  
**Version:** 1.1.0 (Build 10)  
**Target SDK:** 36 (Android 16) | **Min SDK:** 24 (Android 7.0)

---

## Overall Readiness Score: **6.5 / 10**

The app has excellent in-app compliance UI, thorough documentation, and zero tracking/analytics code. With the fixes applied in this session and the remaining items below addressed, the app will be ready for submission.

---

## Items Fixed in This Session

| # | Item | Change | File |
|---|------|--------|------|
| 1 | `allowBackup` set to `false` | Prevents silent cloud backup contradicting privacy policy | `AndroidManifest.xml:5` |
| 2 | Removed `canRequestFilterKeyEvents` | Eliminates overly broad accessibility capability | `accessibility_service_config.xml:8` |
| 3 | Added `<uses-feature android:name="android.hardware.touchscreen" android:required="false" />` | Prevents device filtering on tablets | `AndroidManifest.xml` |
| 4 | Accessibility disclosure uses standalone in-app dialog | Single `AccessibilityDisclosure` component with "Allow Deep Lock" / "Not now" buttons | `AccessibilityDisclosure.tsx` |
| 5 | Accessibility affirmative-consent record | Consent is set only by the explicit "Allow Deep Lock" tap and persisted (`prominentDisclosureAccepted`) as consent evidence; native SharedPreferences guard mirrors it | `shield-slice.ts`, `DeepLockPlugin.java` |

---

## Remaining Critical Items (Must Fix Before Submission)

### C1. INTERNET Permission vs Privacy Policy
**File:** `AndroidManifest.xml:72`, `docs/PRIVACY_POLICY.md:9`  
**Issue:** INTERNET permission is declared but privacy policy claims no data is transmitted. The app loads Material Symbols from Google Fonts CDN.  
**Fix:** Either:
- Option A (recommended): Remove INTERNET permission and bundle Material Symbols locally.
- Option B: Update privacy policy to state: "Internet access is used solely for loading icon fonts. No user data is transmitted."
**Effort:** 1-2 hours (Option A) / 15 minutes (Option B)

### C2. Material Symbols CDN Dependency
**File:** `app/layout.tsx:94`  
**Issue:** External Google Fonts request breaks offline-first claim and contradicts privacy policy.  
**Fix:** Bundle Material Symbols locally by downloading and hosting via static assets.  
**Effort:** 1-2 hours

### C3. ~~QUERY_ALL_PACKAGES Policy Declaration~~ — RESOLVED / NOT APPLICABLE
**Status:** `QUERY_ALL_PACKAGES` is **NOT DECLARED** in the manifest or shipped APK. The app uses a scoped `<queries>` element (MAIN + LAUNCHER) instead. **Do not submit any QUERY_ALL_PACKAGES declaration in Play Console.** No action required.

### C4. Target SDK Migration Testing
**File:** `android/variables.gradle:4`  
**Issue:** Target SDK 36 (Android 16) is bleeding edge. Test foreground service, notification, and accessibility behavior changes.  
**Fix:** Run full regression on Android 16 device/emulator.  
**Effort:** 1-2 hours

---

## Remaining Major Items

### M1. Accessibility Idle Notification
**File:** `DeepLockService.kt`  
**Issue:** Notification text says "Ready to protect your focus" even when no session is active.  
**Fix:** Change idle notification text to "Deep Lock is inactive. Start a Focus Session to enable."

### M2. Privacy Policy Contact Domain
**File:** `docs/PRIVACY_POLICY.md:153`  
**Issue:** `privacy@studentos.app` and `student-os.app` domain must be functional.  
**Fix:** Ensure domains resolve and emails are monitored.

### M3. Material Symbols Attribution
**File:** `docs/THIRD_PARTY_LICENSES.md`  
**Issue:** Material Symbols (Apache 2.0, Google) not listed.  
**Fix:** Add attribution entry.

### M4. ~~Screen Pinning Disclosure~~ — RESOLVED / NOT REACHED
**Status:** `requestScreenPinning` (`DeepLockPlugin.java:349`) is no longer invoked by any UI flow — no component calls it. The native capability remains but is unreachable from the app. No disclosure required while no call path exists. If pinning is ever re-wired into a user flow, add a disclosure to the Deep Lock setup first.

### M5. ~~In-App Privacy Policy Should Mention Android Backup~~ — RESOLVED / NOT APPLICABLE
**Status:** `allowBackup=false` and `fullBackupContent=false` are declared in `AndroidManifest.xml`. There is no Android Backup Service data flow, so no backup disclosure is needed.

---

## Items Already Compliant

| Area | Status | Evidence |
|------|--------|----------|
| In-app Privacy Policy | ✅ | Full-screen component in Settings \u2192 Compliance |
| In-app Terms of Service | ✅ | Full-screen component in Settings \u2192 Compliance |
| In-app Accessibility Disclosure | ✅ | Full-screen component + onboarding step |
| In-app Permissions Explanation | ✅ | Full-screen component with all permissions |
| In-app Open Source Licenses | ✅ | Full-screen component with 14 libraries |
| In-app About/Version Info | ✅ | Full-screen component |
| Accessibility Disclosure in Onboarding | ✅ | Standalone disclosure with affirmative "Allow Deep Lock" consent (no checkbox, no timeout); sole gateway to Accessibility Settings |
| Accessibility Service Off by Default | ✅ | User must enable in system settings |
| Deep Lock Off by Default | ✅ | User must enable in Focus Shield settings |
| Foreground Service Stops with Session | ✅ | Service lifecycle tied to session |
| No Analytics/Tracking SDK | ✅ | Zero analytics code found |
| No Crash Reporting SDK | ✅ | Zero crash reporting code found |
| No Social Media SDK | ✅ | Instagram link is just a hyperlink |
| Data Export Available | ✅ | Settings \u2192 Data \u2192 Export |
| Data Deletion Available | ✅ | Settings \u2192 Data \u2192 Clear All Data |
| Privacy Policy in /docs/ | ✅ | Full markdown document |
| Terms of Service in /docs/ | ✅ | Full markdown document |
| Accessibility Disclosure in /docs/ | ✅ | Full markdown document |
| Data Safety Declaration | ✅ | Full markdown document |
| Permission Justification | ✅ | Full markdown document |
| Third Party Licenses | ✅ | Full markdown document |
| Security Overview | ✅ | Full markdown document |
| Google Play Checklist | ✅ | Full checklist document |

---

## Submission Checklist

### Before Build
- [ ] Bundle Material Symbols locally (or update privacy policy for C1)
- [ ] Remove INTERNET permission if fonts are bundled (C1)
- [ ] Fix idle notification text (M1)

### In Play Console
- [ ] ~~Submit QUERY_ALL_PACKAGES declaration with video (C3)~~ — NOT APPLICABLE: permission is not declared; do not declare it
- [ ] Complete Accessibility declaration (App functionality) + prominent-disclosure video per https://support.google.com/googleplay/android-developer/answer/10964491
- [ ] Complete Foreground Service declarations (specialUse ×2, mediaPlayback)
- [ ] Complete Data Safety section matching `docs/DATA_SAFETY.md` (no collection, no sharing — on-device only)
- [ ] Complete Content Rating questionnaire
- [ ] Upload screenshots matching current UI
- [ ] Set contact email to a monitored address (M2)

### Testing
- [ ] Full regression on Android 16 (C4)
- [ ] Test offline: airplane mode + launch
- [ ] Test Focus Session: start, pause, complete
- [ ] Test Deep Lock: block app, warning screen, return to focus
- [ ] Test Accessibility Service: enable, disable, verify no idle notification issue
- [ ] Test data export/import
- [ ] Test all 3 themes
- [ ] Test onboarding: full flow + skip + guest

---

*Generated for Student OS compliance documentation.*
