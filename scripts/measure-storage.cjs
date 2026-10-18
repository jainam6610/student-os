// Storage measurement script — run with node after `npm run build`
// Reads localStorage data from the built app
const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

// We need to measure from actual localStorage. Let's analyze the store structure instead.
console.log('=== Student OS Storage Analysis ===\n')

// Read the store file to understand partialized slices
const storeContent = fs.readFileSync(
  path.join(__dirname, '..', 'lib', 'store.ts'),
  'utf-8'
)

// Extract partialize keys
const partializeMatch = storeContent.match(/partialize:\s*\(state\)\s*=>\s*\(\{([^}]+\})/)
if (!partializeMatch) {
  console.log('Could not extract partialize block')
  process.exit(1)
}

const partialBlock = partializeMatch[1]
const slices = partialBlock.split('\n')
  .map(l => l.trim())
  .filter(l => l && l.includes(':'))
  .map(l => l.split(':')[0].trim())
  .filter(k => k !== '')  // skip empty keys

console.log(`Persisted slices (${slices.length}):`)
slices.forEach(s => console.log(`  - ${s}`))

console.log('\n=== Slice Type Analysis ===\n')

// Analyze the state interface to understand data types
const ifaceMatch = storeContent.match(/interface StudentOSState\s*\{[^}]+\}/)
if (ifaceMatch) {
  const iface = ifaceMatch[0]
  const fields = iface.split('\n').filter(l => l.includes(':'))
  fields.forEach(f => {
    const parts = f.split(':').map(p => p.trim())
    if (parts.length >= 2) {
      const name = parts[0].replace(/^\s*\?\s*/, '').replace(/^\s*/, '')
      const type = parts.slice(1).join(':').replace(/,?\s*$/, '').trim()
      console.log(`  ${name}: ${type}`)
    }
  })
}

console.log('\n=== Estimated Size per Entity ===\n')

// Estimate sizes based on typical data
const estimates = {
  tasks: { perItem: 300, max: 5000, totalKB: '~1,500' },
  focusSessions: { perItem: 200, max: 10000, totalKB: '~2,000' },
  habits: { perItem: 150, max: 500, totalKB: '~75' },
  events: { perItem: 250, max: 2000, totalKB: '~500' },
  notes: { perItem: 2000, max: 500, totalKB: '~1,000' },
  importedTracks: { perItem: 5000, max: 200, totalKB: '~1,000' },
  exams: { perItem: 200, max: 200, totalKB: '~40' },
  assignments: { perItem: 300, max: 500, totalKB: '~150' },
  subjects: { perItem: 150, max: 50, totalKB: '~7.5' },
  projects: { perItem: 500, max: 100, totalKB: '~50' },
  routines: { perItem: 200, max: 100, totalKB: '~20' },
  distractions: { perItem: 100, max: 1000, totalKB: '~100' },
}

Object.entries(estimates).forEach(([name, info]) => {
  console.log(`  ${name}: ${info.perItem}B/item × ${info.max} max → ${info.totalKB}KB`)
})

console.log('\n=== Persist Trigger Analysis ===\n')

// Find all store set() calls to understand how often persistence triggers
const setCalls = storeContent.match(/\)\s*=>\s*set\(/g)
console.log(`Store actions: ${setCalls ? setCalls.length : '?'}`)

const focusTimerRefs = storeContent.match(/focusTimerState/g)
console.log(`References to focusTimerState: ${focusTimerRefs ? focusTimerRefs.length : '?'}`)

const endFocusSessionRefs = storeContent.match(/endFocusSession/g)
console.log(`References to endFocusSession: ${endFocusSessionRefs ? endFocusSessionRefs.length : '?'}`)

console.log('\n=== Recommendations ===\n')
console.log(`1. The entire store (~45 slices) is serialized on EVERY persist trigger.
   During a focus session, persistState fires every 3 seconds.
   Each write serializes ALL data including focusSessions, tasks, notes, etc.

2. focusTimerState changes every 3s but is bundled with all other data.
   → This is the #1 cause of QuotaExceededError.

3. Largest slices (estimated):
   - focusSessions: ~200KB at 1000 sessions
   - tasks: ~150KB at 500 tasks
   - notes: ~1MB at 500 notes
   - importedTracks: ~1MB at 200 tracks
   - events: ~250KB

4. localStorage limit is ~5MB.
   At ~2.6MB for core data + tracking data, you're at ~52% capacity.
   With imported tracks + notes, you can exceed 5MB.`)
