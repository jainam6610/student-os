# Accessibility Service Disclosure

**Last updated:** July 2026

## Purpose

Student OS uses the Android Accessibility Service **exclusively** to power the **Deep Lock** feature — a tool that helps you stay focused by detecting when you open distracting apps during a Focus Session.

## Why Accessibility Is Required

Android's Accessibility Service is the only public API that allows an app to reliably detect when the foreground app changes. Student OS uses this capability for one purpose only:

> **To detect which app is currently in the foreground during an active Focus Session.**

## Core functionality

Deep Lock is an opt-in study focus tool that blocks user-selected distracting apps during a session the student starts voluntarily. The Accessibility Service is not active at any other time.

## What Student OS Detects

When Deep Lock is enabled and a Focus Session is running, Student OS detects:

| Data | Example | Purpose |
|------|---------|---------|
| Foreground app package name | `com.instagram.android` | Identify the app attempting to open |
| Foreground app display name | `Instagram` | Show the app name in the warning screen |

## Data Types Collected

<!-- Sync source: components/compliance/accessibility-claims.ts (keep these paragraphs verbatim) -->

### Other personal info

The package name and display name of the app in the foreground (e.g., "Instagram"). This identifies which app the user is using, not any content within it.

### Other user-generated content

A local log of blocked-app attempts during focus sessions, containing the app name, timestamp, and session reference. This is user-facing history shown in the app's distraction log.

The Accessibility Service does NOT read screen content, keystrokes, passwords, messages, or any data from apps not in the foreground. It is never active outside a user-started focus session and can be revoked at any time via Android Settings.

All data stays on-device. Nothing is transmitted to our servers or third parties.

## What Student OS Does NOT Access

Student OS **never** uses the Accessibility Service to:

| ❌ Not Accessed | Explanation |
|----------------|-------------|
| Passwords or credentials | Never read from any app |
| Personal messages or chats | WhatsApp, Instagram DM, SMS content are never accessed |
| Keystrokes or touch input | No keylogging, no touch event monitoring |
| Screen content or text | No OCR, no screen scraping, no text extraction |
| Browsing history or URLs | No browser content monitoring |
| Banking or financial app content | No access to financial data |
| Photos, media, or files | No media reading capabilities |
| Personal identification info | No name, email, or phone extraction |
| Clipboard content | Never accessed |
| Notifications content | Read only for blocked app detection, not for content |

## When Accessibility Is Active

The Accessibility Service is **only** active when **all** of the following conditions are met:

1. You have enabled **Deep Lock** in Settings → Focus Shield.
2. You have started a **Focus Session**.
3. The session is currently **running** (not paused or completed).

At all other times, the Accessibility Service is inactive and does not process any events.

## Data Handling

All data detected by the Accessibility Service is:

- **Processed locally** on your device
- **Never transmitted** to any server or third party
- **Stored only** in local app storage
- **Deleted** when you clear app data or uninstall

## User Control

You have full control over the Accessibility Service:

- **Enable:** Settings → Accessibility → Student OS (system settings)
- **Disable:** Settings → Accessibility → Student OS (system settings), or turn off Deep Lock in the App
- **The service is off by default** and must be explicitly enabled by you
- **Deep Lock is off by default** and must be explicitly enabled in App Settings

## No Side Effects

Student OS does not:

- Modify system settings outside of Focus Sessions
- Interfere with other apps' functionality
- Inject code into other apps
- Collect data for advertising or profiling
- Send data over the network

## Compliance

This disclosure complies with Google Play's requirements for apps using the Accessibility Service API. The use of the Accessibility Service is strictly limited to the purposes described above and does not extend to any other functionality.

---

**If you have questions about this disclosure, contact: [privacy@studentos.app](mailto:privacy@studentos.app)**
