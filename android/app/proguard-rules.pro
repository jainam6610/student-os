# ── Capacitor Framework ──────────────────────────────────────────
-keepclassmembers class * {
    @com.getcapacitor.annotation.PluginMethod *;
}
-keepclassmembers class * extends com.getcapacitor.Plugin {
    public void load();
}
-keepattributes *Annotation*, InnerClasses, Signature, EnclosingMethod
-keepattributes JavascriptInterface

# ── Android Components (registered in manifest) ─────────────────
-keep class com.jainam.studentos.MainActivity { *; }
-keep class com.jainam.studentos.DeepLockService { *; }
-keep class com.jainam.studentos.BootReceiver { *; }
-keep class com.jainam.studentos.WarningActivity { *; }
-keep class com.jainam.studentos.DeepLockPlugin { @com.getcapacitor.annotation.PluginMethod *; }

# ── Alarm Plugin & Services ───────────────────────────────────
-keep class com.jainam.studentos.alarm.AlarmPlugin { *; }
-keep class com.jainam.studentos.alarm.AlarmForegroundService { *; }
-keep class com.jainam.studentos.alarm.AlarmReceiver { *; }
-keep class com.jainam.studentos.alarm.AlarmBootReceiver { *; }
-keep class com.jainam.studentos.alarm.AlarmFullScreenActivity { *; }
-keep class com.jainam.studentos.alarm.AlarmScheduler { *; }
-keep class com.jainam.studentos.alarm.AlarmDataStore { *; }

# ── Kotlin Companion Objects & Singletons ──────────────────────
-keepclassmembers class com.jainam.studentos.DeepLockService {
    static *** getInstance();
    static *** isServiceRunning();
}
-keep class com.jainam.studentos.focusshield.MotivationEngine { *; }

# ── Focus Shield Core (instantiated via bridge/reflection) ─────
-keep class com.jainam.studentos.focusshield.FocusShieldBridge { *; }
-keep class com.jainam.studentos.focusshield.FocusShieldManager { *; }
-keep class com.jainam.studentos.focusshield.manager.FocusSessionManager { *; }

# ── Services (registered in AndroidManifest) ──────────────────
-keep class com.jainam.studentos.focusshield.service.FocusForegroundService { *; }
-keep class com.jainam.studentos.focusshield.service.DoNotDisturbService { *; }

# ── Blocking Engine ──────────────────────────────────────────
-keep class com.jainam.studentos.focusshield.feature.blocking.BlockingEngine { *; }
-keep class com.jainam.studentos.focusshield.feature.blocking.EssentialSystemLayer { *; }

# ── Room Database (entities + DAOs) ──────────────────────────
-keep class com.jainam.studentos.focusshield.data.AppDatabase { *; }
-keep class com.jainam.studentos.focusshield.data.AppCategoryDao { *; }
-keep class com.jainam.studentos.focusshield.data.DistractionDao { *; }
-keep class com.jainam.studentos.focusshield.data.AppCategory { *; }
-keep class com.jainam.studentos.focusshield.data.DistractionLog { *; }
-keep class com.jainam.studentos.focusshield.data.CategoryType { *; }

# ── Debugging ──────────────────────────────────────────────────
-keepattributes SourceFile, LineNumberTable
-renamesourcefileattribute SourceFile
