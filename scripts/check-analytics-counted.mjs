// Self-check for the "counted vs completed" split in lib/analytics-engine.ts.
// Run: node scripts/check-analytics-counted.mjs  (exit 0 = pass)
// ponytail: .mjs on purpose — no tsconfig/eslint/build surface.

import {
  getFocusDataForRange,
  getRangeSummaryStats,
  getXPDataForRange,
  getTaskDataForRange,
} from '../lib/analytics-engine.ts'

const NOW = new Date('2026-10-05T12:00:00')

const completedSession = {
  id: 's-done',
  startTime: new Date('2026-10-05T09:00:00'),
  endTime: new Date('2026-10-05T10:00:00'),
  duration: 60,
  targetDuration: 60,
  type: 'custom',
  completed: true,
  interrupted: false,
  status: 'completed',
  createdAt: new Date('2026-10-05T09:00:00'),
}

const interruptedSession = {
  id: 's-stopped',
  startTime: new Date('2026-10-04T09:00:00'),
  endTime: new Date('2026-10-04T09:20:00'),
  duration: 20,
  targetDuration: 60,
  type: 'custom',
  completed: false,
  interrupted: true,
  status: 'interrupted',
  createdAt: new Date('2026-10-04T09:00:00'),
}

const sessions = [completedSession, interruptedSession]

let failures = 0
function assertEq(label, actual, expected) {
  const ok = actual === expected
  if (!ok) failures++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}: ${actual}${ok ? '' : ` (expected ${expected})`}`)
}

const focus = getFocusDataForRange('7d', sessions, NOW)
assertEq('totalFocusMinutes counts the interrupted 20m session', focus.totalFocusMinutes, 80)
assertEq('completedSessions counts only the finished session', focus.completedSessions, 1)
assertEq('avgSessionMinutes uses counted sessions as denominator', focus.avgSessionMinutes, 40)

const stats = getRangeSummaryStats('7d', [], [], sessions, NOW)
assertEq('totalFocusMinutes in summary = 80', stats.totalFocusMinutes, 80)
assertEq('bestStreak ignores the interrupted day (1, not 2)', stats.bestStreak, 1)
assertEq('completedSessions in summary = 1', stats.completedSessions, 1)

const xp = getXPDataForRange('7d', sessions, [], NOW)
assertEq('XP includes the interrupted session (120 + 40)', xp.totalXp, 160)

// Break sessions must never count toward focus totals/XP.
const breakSession = {
  id: 's-break',
  startTime: new Date('2026-10-05T10:00:00'),
  endTime: new Date('2026-10-05T10:10:00'),
  duration: 10,
  targetDuration: 10,
  type: 'break',
  completed: true,
  interrupted: false,
  status: 'completed',
  createdAt: new Date('2026-10-05T10:00:00'),
}
const withBreak = getFocusDataForRange('7d', [...sessions, breakSession], NOW)
assertEq('break session excluded from focus minutes', withBreak.totalFocusMinutes, 80)
assertEq('break session excluded from XP', getXPDataForRange('7d', [...sessions, breakSession], [], NOW).totalXp, 160)

// Break time = auto-break durations + minutes paused during focus sessions.
assertEq('auto-break session counts toward totalBreakMinutes', withBreak.totalBreakMinutes, 10)
const breakDay = withBreak.period.find((p) => p.date === '2026-10-05')
assertEq('break minutes attributed to the session day', breakDay?.breakMinutes, 10)

const pausedSession = { ...completedSession, id: 's-paused', duration: 60, pauseMinutes: 15 }
const paused = getFocusDataForRange('7d', [pausedSession], NOW)
assertEq('paused minutes count as break time', paused.totalBreakMinutes, 15)
assertEq('paused minutes do not inflate focus', paused.totalFocusMinutes, 60)
assertEq('summary exposes totalBreakMinutes', getRangeSummaryStats('7d', [], [], [pausedSession], NOW).totalBreakMinutes, 15)

// Task range totals must be scoped to the range, not all-time.
const inRangeTask = { id: 't-now', status: 'done', priority: 'high', createdAt: new Date('2026-10-04T09:00:00'), completedAt: new Date('2026-10-05T09:00:00') }
const oldTask = { id: 't-old', status: 'done', priority: 'low', createdAt: new Date('2026-08-01T09:00:00'), completedAt: new Date('2026-08-02T09:00:00') }
const tasks = getTaskDataForRange('7d', [inRangeTask, oldTask], NOW)
assertEq('7d tasksCompleted excludes the old task', tasks.totalCompleted, 1)

// Focus stats must be range-scoped, not all-time.
const oldCompletedSession = {
  id: 's-old',
  startTime: new Date('2026-08-02T09:00:00'),
  endTime: new Date('2026-08-02T10:00:00'),
  duration: 60,
  targetDuration: 60,
  type: 'custom',
  completed: true,
  interrupted: false,
  status: 'completed',
  createdAt: new Date('2026-08-02T09:00:00'),
}
const scoped = getFocusDataForRange('7d', [...sessions, oldCompletedSession], NOW)
assertEq('7d completedSessions excludes the out-of-range session', scoped.completedSessions, 1)
assertEq('7d totalFocusMinutes excludes the out-of-range session', scoped.totalFocusMinutes, 80)

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed`)
  process.exit(1)
}
console.log('\nall assertions passed')
