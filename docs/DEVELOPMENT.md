# Development Notes

## Release checklist — always run in this order

1. `npm run check`        (tsc + eslint + next build)
2. `npx cap sync android` (sync web assets to Android)
3. Grep assets to confirm latest changes are present:
   ```powershell
   Select-String -Path "android\app\src\main\assets\public\_next\static\chunks\*.js" -Pattern "<your new string>" | Select-Object -First 3
   ```
4. `.\android\gradlew.bat assembleDebug` (or assembleRelease)
5. `adb install` + fresh install test on device

NEVER run assembleDebug without cap sync first.
A stale cap sync is invisible — Gradle will report BUILD SUCCESSFUL with old JS assets packaged inside. This exact issue caused the Motivation Engine section to be missing after fresh install on 2026-08-25.
