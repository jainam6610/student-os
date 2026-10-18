// ponytail: single source of truth for AccessibilityService data-use claims.
// The prominent disclosure modal, the in-app Privacy Policy, docs/, and the
// Play Console declaration all quote these exact strings — edit here only.
//
// The two data-type LABELS ("Other personal info", "Other user-generated
// content") are inlined verbatim at each render site so a source grep of
// AccessibilityDisclosure.tsx / PrivacyPolicy.tsx finds them literally.
// They are Google policy taxonomy terms — never reword either label.

export const ACCESSIBILITY_CLAIMS = {
  purpose:
    'Student OS uses the Android Accessibility Service to detect the foreground app during user-initiated focus sessions, in order to block distracting apps as part of the Deep Lock feature.',

  coreFunctionality:
    'Deep Lock is an opt-in study focus tool that blocks user-selected distracting apps during a session the student starts voluntarily. The Accessibility Service is not active at any other time.',

  personalInfo:
    'The package name and display name of the app in the foreground (e.g., "Instagram"). This identifies which app the user is using, not any content within it.',

  userGeneratedContent:
    "A local log of blocked-app attempts during focus sessions, containing the app name, timestamp, and session reference. This is user-facing history shown in the app's distraction log.",

  notCollected:
    'The Accessibility Service does NOT read screen content, keystrokes, passwords, messages, or any data from apps not in the foreground. It is never active outside a user-started focus session and can be revoked at any time via Android Settings.',

  storage:
    'All data stays on-device. Nothing is transmitted to our servers or third parties.',

  prominentDisclosure:
    'Users are shown a full-screen prominent disclosure explicitly naming these data types before the permission is requested, and must explicitly acknowledge it before the permission dialog opens.',
} as const
