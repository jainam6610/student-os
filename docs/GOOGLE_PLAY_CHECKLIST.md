# Google Play Release Checklist

## Pre-Release Checks

### Build Configuration

- [ ] Target SDK is set to 36 (variables.gradle)
- [ ] Min SDK is 24 (variables.gradle)
- [ ] App is built with release signing configuration
- [ ] R8/ProGuard is enabled for minification
- [ ] `minifyEnabled = true` and `shrinkResources = true`
- [ ] Version name and version code are incremented
- [ ] APK size is reasonable (current: ~2.1 MB)

### Foreground Service Requirements

- [ ] Foreground service type declared in manifest: `specialUse`
- [ ] `<uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>`
- [ ] `<uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE"/>`
- [ ] Foreground service notification is shown when service is running
- [ ] Service is stopped when Focus Session ends
- [ ] Valid justification for foreground service type documented

### Accessibility Service

- [ ] Accessibility service is declared in AndroidManifest.xml
- [ ] Accessibility service config XML exists (`accessibility_service_config.xml`)
- [ ] Accessibility disclosure is shown before service is requested
- [ ] User explicitly acknowledges disclosure
- [ ] Service is only active during Focus Sessions
- [ ] Service is disabled at all other times
- [ ] Service is off by default (user must enable in system settings)
- [ ] Deep Lock feature is off by default (user must enable in app)
- [ ] Accessibility purpose documented in Privacy Policy
- [ ] Accessibility purpose documented in Google Play declaration

### Permissions

- [ ] `INTERNET` — declared (Capacitor WebView runtime + external links); no app feature transmits data
- [ ] `FOREGROUND_SERVICE` — required for Focus Sessions ✓
- [ ] `FOREGROUND_SERVICE_SPECIAL_USE` — required for Deep Lock ✓
- [ ] `FOREGROUND_SERVICE_MEDIA_PLAYBACK` — required for alarm playback ✓
- [ ] ~~`SYSTEM_ALERT_WINDOW`~~ — NOT DECLARED; warnings use a normal full-screen Activity. Do not declare.
- [ ] ~~`QUERY_ALL_PACKAGES`~~ — NOT DECLARED; scoped `<queries>` (MAIN+LAUNCHER) used instead. Do not declare.
- [ ] `RECEIVE_BOOT_COMPLETED` — required for reminder after reboot ✓
- [ ] `POST_NOTIFICATIONS` — required for session notifications ✓
- [ ] `PACKAGE_USAGE_STATS` — required for Deep Lock foreground-app detection (special access granted via Settings)
- [ ] `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` — recommended, for service reliability

Each permission has a clear, documented justification (see PERMISSION_JUSTIFICATION.md).

### Privacy Policy

- [ ] Privacy Policy document exists
- [ ] Policy covers all data collection and usage
- [ ] Policy explains Accessibility Service usage
- [ ] Policy explains Foreground Service usage
- [ ] Policy states no data is transmitted off-device
- [ ] Policy includes contact information
- [ ] Policy is accessible from within the app
- [ ] Policy URL is provided in Google Play Console

### Data Safety

- [ ] Data Safety section completed in Google Play Console
- [ ] All data types accurately declared
- [ ] Data sharing status correctly marked as "No"
- [ ] Security practices documented
- [ ] Data deletion process described

### App Content

- [ ] App is rated for Everyone or Everyone 10+
- [ ] No violent, hateful, or inappropriate content
- [ ] No misleading claims about functionality
- [ ] No deceptive behavior

### Store Listing

- [ ] App description accurately describes functionality
- [ ] Screenshots show actual app UI
- [ ] Feature graphics are appropriate
- [ ] Category is correctly selected (Education / Productivity)
- [ ] Tags are relevant and accurate

### Testing

- [ ] App installs and launches on a physical device
- [ ] Focus Session starts and completes successfully
- [ ] Deep Lock blocks configured apps
- [ ] Warning screen appears on blocked app attempt
- [ ] Return to Focus button works
- [ ] Countdown auto-return works
- [ ] Allowed apps remain accessible
- [ ] Accessibility service can be enabled/disabled
- [ ] Do Not Disturb (optional) enables and disables correctly
- [ ] Data export produces a valid JSON file
- [ ] Data import restores data correctly
- [ ] Clear Data removes all data
- [ ] App works in airplane mode (offline)
- [ ] Theme switching works (Light/Dark/AMOLED)
- [ ] No crashes on orientation change
- [ ] No crashes on app switch / return

### Legal

- [ ] Terms of Service are accessible from within the app
- [ ] Privacy Policy is accessible from within the app
- [ ] Accessibility Disclosure is accessible from within the app
- [ ] Open Source Licenses are accessible from within the app
- [ ] Third-party library attributions are included

### Play Console Submission

- [ ] App signing key is secured
- [ ] App bundle (.aab) is uploaded
- [ ] All store listing fields are complete
- [ ] Content rating questionnaire is completed
- [ ] Target audience is correctly set
- [ ] Ads declaration is accurate (no ads)
- [ ] COVID-19 contact tracing status: Not applicable
- [ ] Government restriction status: None
- [ ] US export laws compliance confirmed

---

## Critical Items (must fix before submission)

- [ ] Accessibility disclosure is shown before first accessibility request
- [ ] Deep Lock is off by default
- [ ] Foreground service stops when not in session
- [ ] Privacy Policy covers all data usage
- [ ] No hidden APIs or unsupported techniques

## Recommended (not blocking)

- [ ] Play Store description highlights privacy-first design
- [ ] Screenshots show key features (Focus, Deep Lock, Tasks)
- [ ] App is tested on Android 14+ for latest API compliance
