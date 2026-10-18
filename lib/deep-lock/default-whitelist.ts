import type { WhitelistApp } from './types'

export const SYSTEM_APPS: WhitelistApp[] = [
  { packageName: 'com.android.phone', appName: 'Phone', selected: true, system: true },
  { packageName: 'com.android.dialer', appName: 'Dialer', selected: true, system: true },
  { packageName: 'com.google.android.dialer', appName: 'Phone (Google)', selected: true, system: true },
  { packageName: 'com.android.contacts', appName: 'Contacts', selected: true, system: true },
  { packageName: 'com.android.deskclock', appName: 'Clock', selected: true, system: true },
  { packageName: 'com.google.android.deskclock', appName: 'Clock (Google)', selected: true, system: true },
  { packageName: 'com.android.settings', appName: 'Settings', selected: true, system: true },
  { packageName: 'com.android.systemui', appName: 'System UI', selected: true, system: true },
  { packageName: 'com.google.android.gms', appName: 'Google Play Services', selected: true, system: true },
  { packageName: 'com.android.vending', appName: 'Google Play Store', selected: true, system: true },
]

export const COMMON_APPS: WhitelistApp[] = [
  { packageName: 'com.whatsapp', appName: 'WhatsApp', selected: false, system: false },
  { packageName: 'com.google.android.calculator', appName: 'Calculator', selected: false, system: false },
  { packageName: 'com.android.calculator2', appName: 'Calculator', selected: false, system: false },
  { packageName: 'com.google.android.apps.messaging', appName: 'Messages', selected: false, system: false },
  { packageName: 'com.android.mms', appName: 'Messages', selected: false, system: false },
  { packageName: 'com.google.android.camera', appName: 'Camera', selected: false, system: false },
  { packageName: 'com.android.camera', appName: 'Camera', selected: false, system: false },
  { packageName: 'com.android.chrome', appName: 'Chrome', selected: false, system: false },
  { packageName: 'com.google.android.apps.docs', appName: 'Google Docs', selected: false, system: false },
  { packageName: 'com.google.android.apps.pdfviewer', appName: 'PDF Viewer', selected: false, system: false },
  { packageName: 'com.adobe.reader', appName: 'Adobe Acrobat', selected: false, system: false },
  { packageName: 'com.google.android.youtube', appName: 'YouTube', selected: false, system: false },
  { packageName: 'com.spotify.music', appName: 'Spotify', selected: false, system: false },
  { packageName: 'com.google.android.apps.maps', appName: 'Maps', selected: false, system: false },
  { packageName: 'com.google.android.gm', appName: 'Gmail', selected: false, system: false },
]

export const FAILSAFE_PACKAGES = new Set([
  'com.android.phone',
  'com.android.dialer',
  'com.google.android.dialer',
  'com.android.contacts',
  'com.android.deskclock',
  'com.google.android.deskclock',
  'com.android.settings',
  'com.android.systemui',
  'com.android.emergency',
  'com.android.server.telecom',
  'com.jainam.studentos',
])
