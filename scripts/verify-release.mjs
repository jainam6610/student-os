#!/usr/bin/env node
/**
 * verify-release.mjs
 * Run before every Play Store submission:
 *   node scripts/verify-release.mjs
 *
 * Checks:
 * 1. versionCode and versionName in build.gradle match package.json
 * 2. Manifest does not contain forbidden permissions
 * 3. Manifest contains required permissions
 * 4. Schema version in store constants matches expected
 * 5. No debug flags in production config
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

let passed = 0
let failed = 0

function pass(msg) {
  console.log(`  ✓  ${msg}`)
  passed++
}

function fail(msg) {
  console.error(`  ✗  ${msg}`)
  failed++
}

function check(label, fn) {
  console.log(`\n[ ${label} ]`)
  try { fn() } catch (e) { fail(`threw: ${e.message}`) }
}

// ── 1. Version consistency ──────────────────────────────────
check('Version consistency', () => {
  const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
  const gradle = readFileSync(
    resolve(root, 'android/app/build.gradle'), 'utf8')

  const pkgVersion = pkg.version
  const [, gradleCode] = gradle.match(/versionCode\s+(\d+)/) ?? []
  const [, gradleName] = gradle.match(/versionName\s+"([^"]+)"/) ?? []

  if (gradleName === pkgVersion) {
    pass(`versionName "${gradleName}" matches package.json "${pkgVersion}"`)
  } else {
    fail(`versionName "${gradleName}" ≠ package.json "${pkgVersion}"`)
  }

  if (gradleCode && parseInt(gradleCode) > 0) {
    pass(`versionCode ${gradleCode} is valid`)
  } else {
    fail(`versionCode "${gradleCode}" is invalid`)
  }
})

// ── 2. Forbidden permissions ────────────────────────────────
check('No forbidden permissions', () => {
  const manifest = readFileSync(
    resolve(root, 'android/app/src/main/AndroidManifest.xml'), 'utf8')

  const forbidden = [
    'SYSTEM_ALERT_WINDOW',
    'QUERY_ALL_PACKAGES',
    'READ_CONTACTS',
    'READ_SMS',
    'ACCESS_FINE_LOCATION',
    'ACCESS_COARSE_LOCATION',
    'RECORD_AUDIO',
    'CAMERA',
    'REQUEST_INSTALL_PACKAGES',
  ]

  for (const perm of forbidden) {
    if (manifest.includes(perm)) {
      fail(`Forbidden permission found: ${perm}`)
    } else {
      pass(`${perm} not present`)
    }
  }
})

// ── 3. Required permissions ─────────────────────────────────
check('Required permissions present', () => {
  const manifest = readFileSync(
    resolve(root, 'android/app/src/main/AndroidManifest.xml'), 'utf8')

  const required = [
    'BIND_ACCESSIBILITY_SERVICE',
    'PACKAGE_USAGE_STATS',
    'SCHEDULE_EXACT_ALARM',
    'POST_NOTIFICATIONS',
    'RECEIVE_BOOT_COMPLETED',
    'FOREGROUND_SERVICE',
  ]

  for (const perm of required) {
    if (manifest.includes(perm)) {
      pass(`${perm} present`)
    } else {
      fail(`Required permission missing: ${perm}`)
    }
  }
})

// ── 4. Schema version ───────────────────────────────────────
check('Store schema version', () => {
  const constants = readFileSync(
    resolve(root, 'lib/store/constants.ts'), 'utf8')
  const [, version] = constants.match(
    /CURRENT_SCHEMA_VERSION\s*=\s*(\d+)/) ?? []

  const expected = 18 // bump this manually when schema changes
  if (parseInt(version) === expected) {
    pass(`CURRENT_SCHEMA_VERSION = ${version}`)
  } else if (parseInt(version) > expected) {
    pass(`CURRENT_SCHEMA_VERSION = ${version} (update expected in script)`)
  } else {
    fail(`CURRENT_SCHEMA_VERSION = ${version}, expected >= ${expected}`)
  }
})

// ── 5. No debug flags in production config ──────────────────
check('No debug flags', () => {
  const capConfig = readFileSync(
    resolve(root, 'capacitor.config.ts'), 'utf8')

  if (capConfig.includes('webContentsDebuggingEnabled: true')) {
    fail('webContentsDebuggingEnabled is true — must be false for release')
  } else {
    pass('webContentsDebuggingEnabled is not true')
  }

  if (capConfig.includes('loggingBehavior')) {
    pass('loggingBehavior is configured')
  }
})

// ── Result ──────────────────────────────────────────────────
console.log(`\n${'─'.repeat(48)}`)
console.log(`  ${passed} passed   ${failed} failed`)
console.log('─'.repeat(48))

if (failed > 0) {
  console.error('\nRelease verification FAILED. Fix issues before submitting.\n')
  process.exit(1)
} else {
  console.log('\nRelease verification PASSED. Safe to submit.\n')
}
