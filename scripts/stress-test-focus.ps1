# Stress test: 100 focus sessions via ADB
# Run this with the app installed on a connected device/emulator
# Prerequisites: adb in PATH, device connected, app in foreground

$PACKAGE = "com.jainam.studentos"
$TOTAL = 100
$PASS = 0
$FAIL = 0
$RESULTS = @()

Write-Host "=== Focus Session Stress Test ===" -ForegroundColor Cyan
Write-Host "Package: $PACKAGE"
Write-Host "Iterations: $TOTAL"
Write-Host ""

# Verify device
$DEVICE = adb devices | Select-String -Pattern "device$" | Select-Object -First 1
if (-not $DEVICE) {
    Write-Host "ERROR: No device connected" -ForegroundColor Red
    exit 1
}
Write-Host "Device: $DEVICE"
Write-Host ""

for ($i = 1; $i -le $TOTAL; $i++) {
    Write-Host "[$i/$TOTAL] " -NoNewline

    # Launch app
    adb shell am start -n "$PACKAGE/com.jainam.studentos.MainActivity" 2>$null | Out-Null
    Start-Sleep -Milliseconds 500

    # Start focus session via intent with action (uses DeepLockPlugin bridge)
    adb shell am broadcast -a "$PACKAGE.START_FOCUS" --ei durationMinutes 1 2>$null | Out-Null

    # Wait for timer to register (tick + native sync)
    Start-Sleep 3

    # Stop focus session
    adb shell am broadcast -a "$PACKAGE.STOP_FOCUS" 2>$null | Out-Null

    # Verify via logs
    $LOG = adb logcat -d -s "[FocusSession] FocusSessionManager" | Select-String "startSession" | Select-Object -First 1
    if ($LOG) {
        $PASS++
        Write-Host "PASS" -ForegroundColor Green
        $RESULTS += "PASS"
    } else {
        $FAIL++
        Write-Host "FAIL" -ForegroundColor Red
        $RESULTS += "FAIL"
    }

    # Kill app for clean state
    adb shell am force-stop $PACKAGE 2>$null | Out-Null
    Start-Sleep 1
}

# Summary
Write-Host ""
Write-Host "=== Results ===" -ForegroundColor Cyan
Write-Host "Total: $TOTAL"
Write-Host "Pass:  $PASS" -ForegroundColor Green
Write-Host "Fail:  $FAIL" -ForegroundColor $(if ($FAIL -gt 0) { "Red" } else { "Green" })
Write-Host "Rate:  $([math]::Round($PASS / $TOTAL * 100, 1))%"
