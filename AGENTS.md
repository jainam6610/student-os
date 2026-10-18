# Student OS — Complete Technical & Product Overview

> **Internal engineering documentation for a premium offline-first student productivity workspace.**
>
> Built by Jainam Karnawat. Current version: 1.0.0. Stack: Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 + Framer Motion 12 + Zustand 5.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [User Experience Philosophy](#2-user-experience-philosophy)
3. [Architecture Overview](#3-architecture-overview)
4. [Codebase Structure](#4-codebase-structure)
5. [Feature Systems](#5-feature-systems)
6. [State Management & Persistence](#6-state-management--persistence)
7. [Design System](#7-design-system)
8. [Motion & Animation System](#8-motion--animation-system)
9. [Performance Strategy](#9-performance-strategy)
10. [Mobile Strategy & PWA](#10-mobile-strategy--pwa)
11. [App Lifecycle & Routing](#11-app-lifecycle--routing)
12. [Known Limitations & Future Roadmap](#12-known-limitations--future-roadmap)
13. [New Developer Onboarding Guide](#13-new-developer-onboarding-guide)

---

## 1. Product Overview

### What It Is

Student OS is a **premium, offline-first, single-page productivity workspace** designed specifically for students. It replaces the need for multiple disjointed tools (Pomodoro timer, task manager, habit tracker, calendar, note-taker, analytics dashboard) with a single cohesive, calm, and focused experience.

### The Vision

Most student productivity tools fall into two camps:
- **Over-engineered**: Notion-style infinite flexibility with crippling setup friction
- **Under-designed**: Bare-bones todo lists with no motivation system, no study-specific features, and no emotional consideration

Student OS occupies the middle ground: **opinionated but not rigid, premium but not complex, minimal but not sparse**.

The core belief is that **consistency beats intensity**. The app is designed to be used daily for months and years, not as a novelty that wears off after a week.

### Target Users

- University/college students managing multiple subjects
- Self-taught learners structuring independent study
- Students preparing for competitive exams
- Anyone who needs deep work sessions, habit tracking, and academic organization

### Core Values

| Value | How it Manifests |
|-------|------------------|
| **Calm productivity** | No notifications, no noise, no real-time collaboration pressure |
| **Local-first** | Your data stays on your device. No account, no server, no privacy concerns |
| **Premium feel** | OKLCH color space, glass morphism, subtle animations, thoughtful typography |
| **Deep focus** | Focus mode is the emotional centerpiece — a premium timer + ambient environment |
| **Long-term consistency** | Streaks, XP, habits, analytics — all designed to reward showing up daily |
| **Lightweight** | ~100KB of JS per view (lazy-loaded), no heavy 3D, no external API calls |

### What It Is NOT

- Not a collaboration tool. No real-time sync, no multiplayer, no sharing.
- Not a note-taking app (no rich text editor, no markdown support... yet).
- Not cloud-dependent. Everything works offline from install.
- Not a gamification trap. XP is earned, not purchased. There is no way to "cheat the system."

---

## 2. User Experience Philosophy

### Emotional Design Goals

Every screen in Student OS is designed around a specific emotional state:

| Screen | Emotional Goal | Design Strategy |
|--------|----------------|-----------------|
| **Dashboard** | Grounded, motivated | Greeting by time-of-day, daily quote, visible progress, heatmap of consistency |
| **Focus** | Calm, centered, undistractable | Dark ambient gradient, no UI chrome, timer as singular focal point, no notifications |
| **Tasks** | Clear, organized, in control | Clean list/kanban, priority badges, due dates, subtasks, one-click complete |
| **Habits** | Encouraged, consistent | Visual streak grid, celebratory animations on toggle, stat cards for wins |
| **Planner** | Prepared, intentional | Calendar with study/event types, hourly timeline view |
| **Analytics** | Reflective, insightful | Charts showing trends, not judgments; AI-like insights (e.g., "You focus best in the morning") |
| **Settings** | Safe, in control of data | Export/import, clear data, theme customization, avatar personalization |

### UX Principles

1. **Zero forced interruption.** No push notifications, no "reminders," no badges. The user comes to the app on their terms.
2. **Every interaction is a choice.** The app suggests (presets, quotes, priority levels) but never mandates.
3. **Motion must earn its place.** Animations are either functional (page transitions, state feedback) or ambient (subtle floating orbs, breathing timer ring). Never decorative noise.
4. **Data is sacred.** Local-first means local-only. Export is one click. There is always a path out.
5. **The first run sets the tone.** The onboarding screen is a glass panel with animated orbs, a single text input for the name, and the line "Your name stays on this device. No account needed."

---

## 3. Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                      Root Layout                     │
│  (Geist fonts, theme hydration, PWA meta, metadata)  │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│                   App Page (SPA Root)                │
│  ┌─────────────────────────────────────────────────┐ │
│  │           AnimatePresence (onboarding vs app)     │ │
│  └─────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────┐ │
│  │                  App Shell                        │ │
│  │  ┌──────────┐  ┌────────────────────────────┐   │ │
│  │  │ Sidebar  │  │       Main Content          │   │ │
│  │  │ (desktop │  │  ┌──────────────────────┐  │   │ │
│  │  │  + mob)  │  │  │ AnimatePresence (views) │  │   │ │
│  │  │          │  │  │ ┌──────────────────┐  │  │   │ │
│  │  │          │  │  │ │ Lazy-loaded View  │  │  │   │ │
│  │  │          │  │  │ └──────────────────┘  │  │   │ │
│  │  │          │  │  └──────────────────────┘  │   │ │
│  │  └──────────┘  │  ┌──────────────────────┐  │   │ │
│  │                │  │       Footer         │  │   │ │
│  │                │  └──────────────────────┘  │   │ │
│  │                └────────────────────────────┘   │ │
│  │  ┌─────────────────────────────────────────┐    │ │
│  │  │  MobileNav (bottom tab bar, < lg)        │    │ │
│  │  └─────────────────────────────────────────┘    │ │
│  │  ┌─────────────────────────────────────────┐    │ │
│  │  │  CommandPalette (⌘K overlay)             │    │ │
│  │  └─────────────────────────────────────────┘    │ │
│  │  ┌─────────────────────────────────────────┐    │ │
│  │  │  ToastProvider (notifications)            │    │ │
│  │  └─────────────────────────────────────────┘    │ │
│  │  ┌─────────────────────────────────────────┐    │ │
│  │  │  InstallPrompt (PWA install banner)      │    │ │
│  │  └─────────────────────────────────────────┘    │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                    State Layer                        │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Zustand Store (persisted to localStorage)       │ │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │ │
│  │  │ User │ │Theme │ │Progress│ │Tasks │ │Habits│  │ │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘  │ │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │ │
│  │  │Events│ │Focus │ │Nav   │ │CmdPal│ │Timer │  │ │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘  │ │
│  └─────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────┐ │
│  │  IndexedDB (Dexie) — optional data export layer  │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

**1. Single-Page App (SPA) on Next.js App Router**
- The app uses Next.js App Router but functions as a pure SPA — there is exactly one route (`/`), and all "navigation" happens via Zustand state + URL search params.
- This was chosen because the app does not need SSR, SEO, or multi-route URLs. All views are lazy-loaded with React.lazy/Suspense.
- URL params (`?view=focus`) are synced bidirectionally: state changes update the URL via `pushState`, and back/forward buttons read the URL via `popstate`.

**2. No Backend, No Authentication**
- This is an intentional, philosophical decision. Student data should not require an account.
- All data lives in localStorage (via Zustand persist) and optionally in IndexedDB (via Dexie).
- This eliminates: server costs, GDPR/COPPA compliance complexity, authentication UX friction, data breach surface area.
- The trade-off: no cross-device sync, no cloud backup (except manual JSON export).

**3. Zustand as Single Source of Truth**
- All application state lives in one Zustand store.
- UI state (sidebar open, active view, command palette open) lives alongside domain state (tasks, habits, focus sessions).
- The store uses `persist` middleware with a custom reviver for Date objects.
- Schema versioning allows data migration as the app evolves.

**4. Framer Motion for All Animation**
- Every animation in the app — page transitions, list items, modals, microinteractions, ambient effects — uses Framer Motion.
- Motion presets are centralized in `components/motion.tsx` to ensure consistent feel across the app.
- Spring physics are tuned for a "premium" feel: snappy but not jarring, smooth but not slow.

---

## 4. Codebase Structure

```
student-os-app/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout: fonts, metadata, theme hydration
│   ├── page.tsx                  # SPA root: orchestrator, routing, lazy-loading
│   ├── globals.css               # Design system: themes, utilities, animations
│   └── error.tsx                 # Global error boundary UI
│
├── components/                   # React components
│   ├── navigation.tsx            # Sidebar, MobileNav, MobileHeader
│   ├── dashboard.tsx             # Dashboard view
│   ├── focus-mode.tsx            # Focus mode orchestrator
│   ├── tasks.tsx                 # Task management view
│   ├── habits.tsx                # Habit tracking view
│   ├── planner.tsx               # Study planner/calendar view
│   ├── analytics.tsx             # Analytics & charts view
│   ├── settings.tsx              # Settings view
│   ├── welcome-screen.tsx        # Onboarding flow
│   ├── quick-capture.tsx         # Quick capture FAB + parser
│   ├── footer.tsx                # App footer
│   ├── loader.tsx                # Suspense fallback
│   ├── modal.tsx                 # Reusable modal component
│   ├── motion.tsx                # Centralized animation presets
│   ├── error-boundary.tsx        # Error boundary components
│   ├── install-prompt.tsx        # PWA install prompt
│   ├── profile-avatar.tsx        # Avatar component
│   │
│   ├── focus/                    # Focus mode subsystem
│   │   ├── focus-timer.tsx       # SVG countdown timer visualization
│   │   ├── focus-controls.tsx    # Timer presets, custom picker, play/pause
│   │   └── focus-stats.tsx       # Today's stats panel
│   │
│   ├── ui/                       # UI primitives (design system)
│   │   ├── badge.tsx             # Priority/status badge
│   │   ├── button.tsx            # Button component
│   │   ├── glass-card.tsx        # Card component (glass/elevated/surface)
│   │   ├── input.tsx             # Input, Textarea, Select
│   │   ├── quote-display.tsx     # Daily motivational quote
│   │   ├── skeleton.tsx          # Loading skeleton
│   │   └── toast.tsx             # Toast notification system
│   │
│   └── command-palette/          # ⌘K command palette subsystem
│       ├── command-palette.tsx   # Full-screen command palette modal
│       ├── command-palette-item.tsx # Individual command row
│       ├── types.ts              # Type definitions
│       └── action-registry.ts    # Command factory & registry
│
├── hooks/                        # Custom React hooks
│   ├── use-daily-quote.ts        # Deterministic daily quote selection
│   ├── use-keyboard-shortcut.ts  # Global keyboard shortcut listener
│   ├── use-performance-tier.ts   # Device capability detection
│   ├── use-reduced-motion.ts     # prefers-reduced-motion observer
│   └── use-tab-visible.ts        # Document visibility observer
│
├── lib/                          # Core utilities & state
│   ├── store.ts                  # Zustand store (619 lines)
│   ├── utils.ts                  # cn(), formatTime(), generateId(), etc.
│   ├── db.ts                     # Dexie IndexedDB layer (optional)
│   └── quick-capture.ts          # NLP task parser
│
├── data/                         # Static data
│   └── quotes.ts                 # 30 motivational quotes
│
├── public/                       # Static assets
│   ├── manifest.json             # PWA manifest
│   ├── sw.js                     # Service worker
│   ├── icon.svg                  # App icon (SVG)
│   ├── icon-512.svg              # Large app icon
│   ├── icon-dark-32x32.png       # Dark-mode favicon
│   ├── icon-light-32x32.png      # Light-mode favicon
│   ├── apple-icon.png            # Apple touch icon
│   └── bg-cinematic.jpg          # Background asset
│
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
├── next.config.mjs               # Next.js configuration
├── postcss.config.mjs            # PostCSS configuration
└── globals.css                   # (already in app/)
```

### Folder Responsibility

| Directory | Responsibility | Scale Pattern |
|-----------|---------------|---------------|
| `app/` | App shell, routing, layout, global styles | Thin — routing only, no business logic |
| `components/` | All React components | Flat for top-level views, nested for subsystems |
| `components/focus/` | Focus timer subsystem | Co-located: timer, controls, stats |
| `components/ui/` | Design system primitives | Generic, reusable, presentational |
| `components/command-palette/` | Command palette subsystem | Self-contained with types + registry |
| `hooks/` | Shared custom hooks | One file per hook, no barrel exports |
| `lib/` | Core logic: state, utilities, data layer | Monolithic store, focused utilities |
| `data/` | Static data files | Simple arrays/constants |
| `public/` | Static assets | PWA assets, icons, images |

### Why This Structure Was Chosen

- **Flat view components** avoid deep nesting. A new developer can immediately find "the dashboard file" without guessing subdirectories.
- **Subsystems** (focus/, command-palette/) use colocation when a feature has multiple tightly coupled files. This prevents cross-feature coupling while keeping related code together.
- **UI primitives** are separated from business components. This enforces the design system boundary: UI components have no knowledge of the store or domain logic.
- **Centralized state** in `lib/store.ts` makes data flow predictable. Components never manage their own server state or caching layers.
- **Hooks** are separated to avoid circular dependencies and to make them independently testable.

---

## 5. Feature Systems

### 5.1 Dashboard

**Purpose:** The default landing view. Provides an at-a-glance summary of the student's academic life: today's focus time, tasks, habits, streak, weekly goal.

**UX Logic:**
- Greeting adapts to time of day ("Good morning/afternoon/evening")
- Avatar appears next to greeting for personalization
- Daily motivational quote below greeting
- 4 stat cards in a 2x2 grid (Focus today, Tasks done, Streak, Weekly goal)
- 7-day focus heatmap bar chart (proportional intensity)
- Streak circular progress ring with XP progress bar
- "This Week" summary card
- Tasks due today (focus queue) with one-click completion
- "Ready to focus?" CTA button linking to Focus mode

**Technical Implementation:**
- Pure computation from store state — no API calls
- `useMemo` for all derived data (today's tasks, focus time, heatmap data, weekly comparisons)
- `memo` for `TaskRow` and `StudyStatsCard` to prevent unnecessary re-renders
- Re-renders only when relevant store slices change (via selector granularity)

**Data Flow:**
```
Store (tasks, focusSessions, progress, userName)
  └──> Dashboard reads via selectors
        └──> useMemo derives: todaysTasks, todayFocusTime, heatmapData, etc.
              └──> Renders stat cards, charts, task rows
```

---

### 5.2 Focus Mode

**Purpose:** The emotional and functional centerpiece of the app. A premium deep work session timer designed to help students enter and maintain flow state.

**UX Logic:**
- Full-screen ambient gradient environment — no Spline/3D, just calm color and motion
- The timer is the singular focal point: large SVG countdown ring with monospace time display
- Preset durations: 30m, 1h, 1h 30m, 2h — default is 1 hour (not 25 minutes)
- Custom duration stepper: hours (0-23) + minutes (0-55 in 5-min increments)
- Play/pause/reset controls below timer
- Stats panel (toggleable gear icon): today's focus time, current streak
- Motivational quote in top-left corner
- Ambient floating orbs (CSS-only) with slow drift animation
- Audio chime (Web Audio API oscillator, two-tone) on session completion

**Timer System (Timestamp-Based):**

The timer uses a **timestamp-based** approach rather than simple `setInterval` counting, which eliminates drift:

```
On Start:
  endTimestamp = Date.now() + durationInSeconds * 1000
  Store to Zustand (persisted to localStorage)

On Tick (every 200ms):
  timeLeft = Math.max(0, (endTimestamp - Date.now()) / 1000)

On Pause:
  elapsedBeforePause = duration - timeLeft
  Store paused state

On Resume:
  endTimestamp = Date.now() + (duration - elapsedBeforePause) * 1000

On Page Refresh:
  Read persisted focusTimerState from localStorage
  If endTimestamp > Date.now(), resume with remaining time
  If expired, clear state (no stale timer)

Visibility Change (tab switch):
  On return, recalculate immediately from wall clock
  No drift, no accumulated error
```

**Persistence:**
- `focusTimerState` in Zustand store is persisted to localStorage
- Schema: `{ endTimestamp, duration, isRunning, elapsedBeforePause }`
- On refresh, the app restores the timer exactly where it was
- If the timer completed while the tab was closed, it clears gracefully

**Background Tolerance:**
- `setInterval` runs every 200ms (not 1s) for smoother display updates
- `visibilitychange` event recalculates time on tab return
- No reliance on `setInterval` accuracy — it's only used for display updates

**Technical Implementation:**
- `endTimestampRef` (ref) holds the authoritative end timestamp
- `pausedElapsedRef` (ref) holds accumulated time before pause
- `useEffect` for interval management, cleaned up on pause/reset/unmount
- Completion detection in the tick function, not via a separate setTimeout
- `completedRef` prevents double-completion on rapid ticks

**Data Flow:**
```
User selects preset (30m/1h/90m/2h/custom)
  └──> setDuration / setTimeLeft / setSelectedDuration
User presses Play
  └──> endTimestampRef = Date.now() + timeLeft * 1000
  └──> setIsRunning(true)
  └──> Interval starts (200ms)
        └──> Each tick: timeLeft = (endTimestamp - Date.now()) / 1000
        └──> If timeLeft <= 0:
              ├──> playNotification()
              ├──> endFocusSession() → creates session record + XP
              └──> setFocusTimerState(null) → clears persisted state
User presses Pause
  └──> elapsedBeforePause = duration - timeLeft
  └──> setIsRunning(false), clear interval
  └──> Persist paused state
```

---

### 5.3 Task Manager

**Purpose:** A full-featured task management system with list and kanban views, priority system, subjects, due dates, subtasks, and XP rewards.

**UX Logic:**
- Two view modes: List (chronological) and Kanban (by status: todo/in-progress/done)
- Search bar with real-time filtering
- Status filter tabs (all/todo/in-progress/done)
- Add task via modal: title, description, subject, priority (low/medium/high), due date
- Each task shows: priority badge, subject tag, due date, subtask count
- Click to expand: shows full details with subtask list
- One-click completion: checkmark button with scale animation
- XP earned on completion: high=50, medium=30, low=15
- Empty state with CTA to create first task
- XP toast notification on task completion

**Technical Implementation:**
- Tasks stored in Zustand with full CRUD operations
- `addTask` generates UUID via `crypto.randomUUID()`
- `completeTask` awards XP proportional to priority and recalculates level
- Task rows use `memo` + `useCallback` to prevent re-render cascade on completion
- List/kanban views are computed from the same `tasks` array (no separate state)
- Search uses simple string inclusion (case-insensitive) on title + description

---

### 5.4 Habit Tracker

**Purpose:** A visual habit tracking system with streak mechanics, weekly grid view, and celebration animations.

**UX Logic:**
- Habit cards show: name, icon (emoji), weekly grid (last 7 days), streak counter
- Click a day to toggle completion — animated streak counter updates
- Add habit modal: name, emoji picker (grid of 30 emojis), frequency (daily/weekly)
- Stat cards: Completed today, Total streaks, Today's rate, Best streak
- Completion triggers a celebration animation on the streak number
- Streaks are calculated based on consecutive calendar days

**Streak Calculation Algorithm:**
```
1. Sort completed dates descending
2. Start from today, count consecutive days going backward
3. Break on first missing day
4. Best streak: scan entire history for longest consecutive run
```

**Implementation Detail:**
- Dates stored as `YYYY-MM-DD` strings for easy comparison
- `calculateStreak()` and `calculateBestStreak()` in store.ts are pure functions
- Streak recalculation happens on every toggle
- No backend — all streaks are computed client-side

---

### 5.5 Study Planner

**Purpose:** A calendar-based study planner with event types (study/exam/revision/break) and multiple view modes.

**UX Logic:**
- Three view modes: Month (grid of days), Week (hourly columns), Day (vertical timeline)
- Navigation arrows to move between periods
- Month view: colored dots for events on each day
- Week view: horizontal scroll with hour columns (6am-9pm), event blocks positioned by time
- Day view: vertical timeline with event blocks
- Add event modal: title, description, subject, start/end time, type (study/exam/revision/break), color
- Events persist in Zustand store

**Technical Implementation:**
- All date math uses date-fns (`format`, `startOfMonth`, `addMonths`, `startOfWeek`, `addDays`, etc.)
- Week/day views compute event positions based on start/end times
- Colors map to event types: blue=study, red=exam, purple=revision, green=break
- Calendar navigation uses simple state: `currentMonth`, `currentDate`, `viewMode`

---

### 5.6 Analytics

**Purpose:** A comprehensive analytics dashboard with charts, trends, and AI-like insights to help students understand their study patterns.

**UX Logic:**
- Multiple Recharts chart types: Bar, Line, Pie (with donut), Area
- Weekly focus time bar chart
- Subject distribution pie chart (from task subjects)
- Activity trends: dual line chart (tasks completed vs habits done)
- Productivity patterns: area chart showing focus time by hour of day
- Task priority mix: pie chart
- XP growth: cumulative area chart
- Habit consistency: 30-day colored grid (green/amber/red)
- Insight cards: "Peak productivity hour", "Habit score", "Impact score", "Completion rate"
- Trend arrows (up/down) with percentage changes

**Technical Implementation:**
- All data derived from store state via useMemo
- Recharts components wrapped in responsive containers
- Charts use Tailwind CSS color variables via OKLCH (chart-1 through chart-5)
- Insight calculations:
  - Peak hour: find the hour with the most completed focus sessions
  - Habit score: `(days with ≥1 habit completed / 30) * 100`
  - Impact score: `(tasks completed + habits completed) / 30`
  - Completion rate: `(tasks done / total tasks created) * 100`
- All calculations are pure — no side effects, no async

---

### 5.7 Settings

**Purpose:** User profile management, theme customization, and data control center.

**UX Logic:**
- Profile section: clickable avatar (opens avatar picker modal), editable name, level/XP/stats grid
- Avatar picker: 4-column grid with 9 options (initials + 8 gradient presets)
- Theme switcher: Light/Dark/AMOLED with icon buttons
- Focus settings: info rows (default timer, sound, weekly goal)
- Data section: Export JSON (downloads a file), Reset onboarding, Clear all data (with confirmation)
- Creator section: Jainam Karnawat credit with Instagram link
- All destructive actions have confirmation dialogs with cancel/confirm buttons

**Technical Implementation:**
- Theme state → `setTheme()` → `applyTheme()` in page.tsx → CSS class toggle
- Export: `JSON.stringify(localStorage.getItem('student-os-storage-v3'))` → Blob → download
- Clear data: `localStorage.removeItem()` → `window.location.reload()`
- Avatar picker uses `AVATAR_OPTIONS` and `AVATAR_GRADIENTS` from profile-avatar.tsx

---

### 5.8 Onboarding / Welcome Screen

**Purpose:** The first experience. Sets the tone for the entire app.

**UX Logic:**
- Full-screen overlay with glass panel, ambient background orbs, gradient lighting
- "Welcome to Student OS" / "Your calm academic workspace."
- Single text input: "Your name" (max 50 chars, validation on empty)
- Submit button with animated states:
  1. Default: "Continue"
  2. Loading: spinner + "Just a moment..."
  3. Success: animated checkmark + "Welcome!"
- After success → `setOnboardingComplete(true)` → app renders
- Privacy note: "Your name stays on this device. No account needed."
- Skippable? No — the user's name is needed for the greeting system. But there is no account creation.

**Technical Implementation:**
- `showContent` state with 100ms delay for entrance animation
- `AnimatePresence` for smooth transition from onboarding to app
- Arrow function + setTimeout for the "loading" animation illusion
- `useCallback` for all handlers to prevent re-renders
- `autoFocus` on the input after entrance animation completes

---

### 5.9 Quick Capture

**Purpose:** A floating action button that allows rapid task creation with natural language parsing.

**UX Logic:**
- FAB button in sidebar (expands to input panel on click)
- Text input with real-time NLP parsing preview
- Detects: priority (critical/urgent/important/asap), subject (physics/math/etc.), due date (today/tomorrow/next week/day names, "at 2pm"), tags (#hashtags)
- Parsed result shows as structured preview below input
- Enter to submit, Escape to dismiss
- XP toast on successful capture

**Technical Implementation:**
- NLP parser in `lib/quick-capture.ts` uses keyword matching:
  - Priority keywords: regex matching against a list
  - Subject detection: regex matching against academic subjects
  - Date parsing: relative keywords + day names, optionally with time
  - Tags: `#word` pattern
- Returns `ParsedCapture` with confidence score and formatted preview
- The parser is intentionally simple — no ML, no LLM, just pattern matching. It works for 90% of student task entry.

---

### 5.10 Command Palette

**Purpose:** ⌘K (or Ctrl+K) for power users. Quick access to all app functions without mouse navigation.

**UX Logic:**
- Trigger: ⌘K (Mac) / Ctrl+K (Windows/Linux)
- Full-screen semi-transparent overlay with search input
- Filter-as-you-type: searches title, description, and keywords
- Grouped results: Navigation (7 views), Actions (add task/habit/event, start focus), Preferences (3 themes, toggle sidebar), Data (export, clear)
- Keyboard navigation: arrows to move, enter to select, escape to dismiss
- Keyboard shortcuts shown as badges (e.g., "G then D" for dashboard)
- Focus restoration on close (returns to previously focused element)

**Technical Implementation:**
- `action-registry.ts` exports `createCommandRegistry()` factory
- Registry integrates with Zustand store via `useStore.getState()`
- Categories ordered by `CATEGORY_ORDER` array
- Filtering: case-insensitive search against `title + description + keywords.join(' ')`
- `useCallback` + `useMemo` for performance on every keystroke
- Keyboard event handling with `onKeyDown` on the search input
- `useEffect` with `keydown` listener for the global ⌘K trigger

---

### 5.11 PWA / Install Prompt

**Purpose:** Makes the app installable as a native app on mobile and desktop.

**UX Logic:**
- Listens for `beforeinstallprompt` event (browser fires this when the app meets PWA criteria)
- Shows a glass panel: "Install Student OS" with "Install" and "Not now" buttons
- Once dismissed, `installPromptDismissed` flag persists for the session (not forever)
- On install: app opens in standalone mode (no browser chrome)

**Technical Implementation:**
- PWA manifest in `/public/manifest.json` with icons, screenshots, shortcuts, display modes
- Service worker in `/public/sw.js` with cache-first strategy for static assets
- Service worker registration in `layout.tsx` via inline script
- Install prompt state managed in component (not Zustand — it's ephemeral)

---

### 5.12 Motivational Quotes

**Purpose:** Subtle motivational context that changes daily.

**UX Logic:**
- Dashboard: prominent quote below greeting
- Focus mode: subtle quote in the top-left corner
- Changes daily (deterministic — same quote all day for all users)
- Topics: consistency, focus, discipline, learning, growth

**Technical Implementation:**
- 30 quotes in `data/quotes.ts`
- `use-daily-quote.ts` hook:
  1. Hash today's date string to get a deterministic index
  2. Store selected index in localStorage for the day
  3. This ensures the same quote is shown all day, even if the hash changes
- `QuoteDisplay` component: two variants (`default` with author context, `subtle` for Focus mode)
- Fade animation on quote change (using `AnimatePresence` + `key`)

---

## 6. State Management & Persistence

### 6.1 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Zustand Store                         │
│  create<StudentOSState>()(persist(...))                   │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Domain State (persisted to localStorage)            │ │
│  │  ┌───────┐ ┌───────┐ ┌────────┐ ┌───────┐ ┌──────┐ │ │
│  │  │ User  │ │ Theme │ │Progress│ │ Tasks │ │Habits│ │ │
│  │  └───────┘ └───────┘ └────────┘ └───────┘ └──────┘ │ │
│  │  ┌───────┐ ┌───────┐ ┌────────┐ ┌────────────────┐  │ │
│  │  │Events │ │Focus  │ │Timer   │ │ CommandPalette │  │ │
│  │  │       │ │Session│ │State   │ │ (not persisted)│  │ │
│  │  └───────┘ └───────┘ └────────┘ └────────────────┘  │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  UI State (not persisted)                            │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │ │
│  │  │sidebar   │ │activeView│ │commandPaletteOpen    │ │ │
│  │  │Open      │ │          │ │                      │ │ │
│  │  └──────────┘ └──────────┘ └──────────────────────┘ │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

                         ▼
┌─────────────────────────────────────────────────────────┐
│                Persistence Layer                          │
│                                                          │
│  localStorage (key: 'student-os-storage-v3')             │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  partialize: whitelist of persisted fields           │ │
│  │  version: 2 (with migration from v1)                 │ │
│  │  reviver: custom Date deserialization                │ │
│  │  validatePersistedData: schema guard                 │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  IndexedDB (optional, via Dexie)                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Tables: tasks, habits, focusSessions, events        │ │
│  │  exportAllData() / importAllData() / clearAllData()  │ │
│  │  Currently separate from Zustand (not synced)        │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Store Structure

```typescript
interface StudentOSState {
  // User profile
  userName: string
  avatar: string                  // 'initials' | 'gradient-1'..'gradient-8'
  onboardingComplete: boolean

  // Theme
  theme: 'light' | 'dark' | 'amoled'

  // Progress / Gamification
  progress: {
    xp: number
    level: number                 // Math.floor(xp / 1000) + 1
    totalFocusTime: number
    totalTasksCompleted: number
    currentStreak: number
    bestStreak: number
    weeklyGoal: number            // in minutes
    weeklyProgress: number        // in minutes
  }

  // Domain entities
  tasks: Task[]
  habits: Habit[]
  focusSessions: FocusSession[]
  events: StudyEvent[]

  // Focus timer persistence (survives refresh)
  focusTimerState: {
    endTimestamp: number
    duration: number
    isRunning: boolean
    elapsedBeforePause: number
  } | null

  // Ephemeral UI state (not persisted)
  currentSession: FocusSession | null
  sidebarOpen: boolean
  activeView: View
  commandPaletteOpen: boolean
}
```

### 6.3 Persistence Strategy

**Primary: Zustand persist → localStorage**

The `persist` middleware with `createJSONStorage(() => localStorage)` handles:
- Automatic serialization on state change (debounced by Zustand)
- Deserialization on page load
- Partialization: only whitelisted fields are saved
- Schema versioning with migration functions
- Error handling via `onRehydrateStorage`

**Partialize (what gets persisted):**
```
userName, onboardingComplete, avatar, theme, progress,
tasks, habits, focusSessions, focusTimerState, events
```

**What is NOT persisted:**
```
currentSession (recreated on new session)
sidebarOpen (starts open by default)
activeView (starts at dashboard)
commandPaletteOpen (always starts closed)
```

**Migration Strategy:**
```typescript
// Current: version 2
// v1 -> v2: Adds subtasks array to tasks, moves weeklyGoal into progress object
// Future migrations: increment CURRENT_SCHEMA_VERSION, add case to migrate block

migrate: (persistedState, version) => {
  if (version === 0) { /* v1 migration logic */ }
  if (version === 1) { /* v2 migration logic */ }
  return state
}
```

**Hydration Guard:**
- Theme hydration is performed **before React mounts** via an inline `<script>` in `layout.tsx`. This prevents flash of wrong theme.
- The script reads `localStorage` directly, parses the JSON, finds the theme, and applies it to `document.documentElement.classList`.
- All other hydration happens via Zustand's `persist` on mount.

### 6.4 Data Integrity

- **Date revival**: Custom `reviveDates` function walks the entire persisted tree and converts ISO date strings back to Date objects. This is necessary because JSON serialization loses Date types.
- **Schema validation**: `validatePersistedData()` checks that the persisted data has the expected shape (version number + state object). Corrupt data is discarded.
- **Old key cleanup**: On app boot, old storage keys (`student-os-storage`, `student-os-storage-v2`) are deleted.

### 6.5 Timer Persistence (Special Case)

Focus timer persistence required special handling because:
- Timer state changes every 200ms (too frequent for full store persistence)
- Timer must survive page refresh
- Timer must be accurate after tab switch or device sleep

**Solution:**
- `focusTimerState` is written to store (and thus localStorage) on meaningful events: start, pause, and periodically during runtime
- On load, if `focusTimerState.isRunning` is true, the timer is restored with the remaining time calculated from `endTimestamp - Date.now()`
- The timer is NOT persisted every tick — only on state transitions + periodic sync

---

## 7. Design System

### 7.1 Color System

Student OS uses **OKLCH color space** throughout, which provides:
- Perceptually uniform lightness (colors at the same lightness level appear equally bright)
- Wide gamut support (works on modern displays)
- Predictable dark/light theme mapping

**Theme Tokens:**

Each theme (light, dark, AMOLED) defines ~40 CSS custom properties in `globals.css`. The most important:

| Token | Light | Dark | AMOLED |
|-------|-------|------|--------|
| `--background` | oklch(0.97 0.003 260) | oklch(0.08 0.004 260) | oklch(0 0 0) |
| `--foreground` | oklch(0.12 0.008 260) | oklch(0.93 0.003 260) | — |
| `--primary` | oklch(0.42 0.19 270) | oklch(0.68 0.16 275) | — |
| `--card` | oklch(0.99 0.002 260) | oklch(0.115 0.005 260) | oklch(0.035 0.003 260) |
| `--sidebar` | oklch(0.98 0.002 260) | oklch(0.09 0.005 260) | oklch(0.015 0.003 260) |

**AMOLED theme** sets background to true black (`oklch(0 0 0)`) for power savings on OLED screens and maximum contrast.

### 7.2 Typography

- **Primary**: Geist (sans-serif) — Vercel's typeface, modern and geometric
- **Mono**: Geist Mono — used for timer display, code, tabular numbers
- **Scale**:
  - xs: 0.75rem (12px)
  - sm: 0.8125rem (13px)
  - base: 0.9375rem (15px)
  - lg: 1.0625rem (17px)
  - xl: 1.25rem (20px)
  - 2xl: 1.5rem (24px)
  - 3xl: 1.875rem (30px)
- **Font features**: `cv02, cv03, cv04, cv11` (Geist stylistic alternates)
- **Tabular nums**: Used in timer display for consistent digit widths during countdown

### 7.3 Glassmorphism

The app uses three glass levels:

| Class | Blur | Background | Usage |
|-------|------|------------|-------|
| `glass-card` | 24px | `oklch(1 0 0 / 0.55)` or `rgba(20,20,28,0.65)` | Cards, panels |
| `glass-card-subtle` | 16px | Same, lighter | Stat cards, secondary panels |
| `glass-panel` | 32px | Same, strongest | Modals, welcome screen |

Glass cards have:
- A subtle border (1px `var(--glass-border)`) with a lighter top border for depth
- `shadow-lg` for elevation
- Slightly different background opacity in each theme

### 7.4 Shadows

Six shadow levels defined using OKLCH for natural shading:

| Token | Usage |
|-------|-------|
| `--shadow-xs` | Subtle line separation |
| `--shadow-sm` | Card defaults |
| `--shadow-md` | Elevated cards |
| `--shadow-lg` | Glass panels, dropdowns |
| `--shadow-xl` | Modals, sheets |
| `--shadow-2xl` | Highest emphasis |

In dark theme, shadows use higher opacity (up to 0.5) to maintain visibility against dark backgrounds.

### 7.5 Ambient Backgrounds

Two CSS-only ambient orb classes for background atmosphere:

| Class | Size | Color (Dark) | Animation |
|-------|------|-------------|-----------|
| `.ambient-orb-1` | 500px | oklch(0.55 0.25 290 / 0.12) violet | 20s drift |
| `.ambient-orb-2` | 400px | oklch(0.55 0.22 255 / 0.10) blue | 25s reverse drift |

Used on:
- Welcome screen (behind glass panel)
- Focus mode (background)
- Ambient utility classes for inline use

### 7.6 Spacing Rhythm

```css
--space-1: 0.25rem    /* 4px  */
--space-2: 0.5rem     /* 8px  */
--space-3: 0.75rem    /* 12px */
--space-4: 1rem       /* 16px */
--space-5: 1.25rem    /* 20px */
--space-6: 1.5rem     /* 24px */
--space-8: 2rem       /* 32px */
--space-10: 2.5rem    /* 40px */
--space-12: 3rem      /* 48px */
```

The app uses multiples of 4px with a preference for `--space-3` through `--space-6` in component design.

### 7.7 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | calc(var(--radius) - 4px) | Badges, inline elements |
| `--radius-md` | calc(var(--radius) - 2px) | Inputs, buttons |
| `--radius-lg` | var(--radius) = 0.75rem | Cards, containers |
| `--radius-xl` | calc(var(--radius) + 4px) | Modals, panels |
| `--radius-2xl` | calc(var(--radius) + 10px) | Large dialogs |
| `--radius-3xl` | calc(var(--radius) + 18px) | Hero elements |

---

## 8. Motion & Animation System

### 8.1 Philosophy

Every animation in Student OS follows these rules:
1. **Must be purposeful.** Animations communicate state changes, provide spatial orientation, or enhance calmness — never just decorative.
2. **Must respect reduced motion.** The `prefers-reduced-motion` media query disables all animations (`animation-duration: 0.01ms`, `transition-duration: 0.01ms`).
3. **Spring physics over duration-based.** Spring-based animations feel more natural and responsive than linear/cubic-bezier transitions.
4. **Performance first.** Only use `opacity` and `transform` for animations (GPU composited). Never animate `width`, `height`, `top`, `left`, or `box-shadow` on the main thread.

### 8.2 Centralized Presets

All animation presets live in `components/motion.tsx`. Key exports:

```
spring.snappy    — { stiffness: 400, damping: 30, mass: 0.8 }
spring.smooth    — { stiffness: 300, damping: 25, mass: 1 }
spring.gentle    — { stiffness: 200, damping: 22, mass: 1 }
spring.bouncy    — { stiffness: 350, damping: 18, mass: 0.9 }
spring.heavy     — { stiffness: 500, damping: 35, mass: 1.2 }

easing.standard  — { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
easing.quick     — { duration: 0.15, ease: [0.16, 1, 0.3, 1] }
```

### 8.3 Animation Patterns

| Pattern | Implementation | Variants Used |
|---------|---------------|---------------|
| **Page transitions** | `AnimatePresence` + variants | `pageTransition` (slide+fade) |
| **Stagger lists** | `staggerContainer` + `staggerItem` | Items enter 50ms apart, 12px slide-up |
| **Microinteractions** | `whileHover` / `whileTap` | Scale 1.05 / 0.94-0.96 |
| **Modal entry** | Spring bouncy | Modal content scales from 0.92 |
| **Timer breathing** | Continuous `scale` pulse | 1 → 1.008 → 1 over 4s |
| **Streak celebration** | Scale pulse on counter | 1 → 1.2 → 1 |
| **Toast entry** | Slide in from right | 80px slide + scale + opacity |
| **Command palette** | Spring bouncy entry | 24px slide-up |
| **XP ring fill** | `strokeDashoffset` animation | 0.5s ease-out |
| **Habit toggle** | Scale pulse on completion | 1 → 1.15 → 1 |
| **Badge idle** | Continuous pulse | 1s infinite |

### 8.4 Focus Mode Animations

The timer ring uses:
- `strokeDashoffset` animation for smooth progress transition (0.5s ease)
- `opacity` pulse on the progress ring (85% ↔ 100%, 3s cycle) when running
- Subtle `scale` breathing on the entire timer container (1 ↔ 1.008, 4s cycle)
- Digit transitions: `scale: 1.02 → 1` with opacity blend on time change

Background orbs:
- CSS `@keyframes ambientDrift` — translate + scale over 20-25s infinite
- Pure CSS, no JS animation overhead
- Respects reduced motion media query

---

## 9. Performance Strategy

### 9.1 Bundle Strategy

| Technique | Implementation | Impact |
|-----------|---------------|--------|
| **Lazy loading** | All 7 views loaded via `React.lazy()` + `Suspense` | ~100KB per view, loaded on demand |
| **No 3D** | Removed Spline iframe entirely | Eliminated ~2MB Spline runtime overhead |
| **CSS-only ambience** | Background orbs use CSS animations, not JS | Zero JS memory for visual effects |

### 9.2 Rendering Optimization

| Technique | Where |
|-----------|-------|
| `React.memo` | `StatBlock`, `TaskRow`, `StudyStatsCard` |
| `useMemo` | All derived data in dashboard, analytics, focus mode |
| `useCallback` | All event handlers in tight loops (task completion, habit toggle) |
| Selector granularity | Components subscribe only to the store slice they need (e.g., `useStore(s => s.tasks)`) |
| Conditional rendering | Focus mode Spline/ambient backgrounds only render when view is active |
| `AnimatePresence mode="wait"` | Prevents simultaneous exit/enter animations |

### 9.3 Timer Performance

- **200ms tick interval** instead of 1000ms: smoother display without significant CPU cost
- **Ref-based timestamp**: no re-renders on the timing reference, only on the displayed `timeLeft`
- **Visibility check**: timer recalculates on tab return, preventing backlog of queued callbacks
- **No setInterval for time tracking**: interval only updates the display; accuracy comes from `Date.now()` comparison

### 9.4 Memory Management

- **AudioContext reuse**: `notificationRef.current` is reused across completions (no new AudioContext per session)
- **Interval cleanup**: All `setInterval` refs are cleaned up on unmount, pause, and completion
- **Store subscriptions**: Zustand's selector equality prevents unnecessary re-renders
- **Debounced persistence**: Zustand's `persist` middleware batches writes

### 9.5 What Was Removed / Why

**Spline 3D iframe** was removed because:
- It loaded ~2MB of WebGL runtime for a single decorative background
- The iframe consumed GPU resources even when in background (after navigation away)
- It caused ~10s load time with a spinner
- The scene URL was external (my.spline.design) — required network, broke offline
- It violated the "calm, distraction-free" design philosophy

**Replaced with**:
- CSS-only ambient gradient orbs (zero JS, zero network, zero GPU overhead)
- Works offline, instant render, battery-friendly

---

## 10. Mobile Strategy & PWA

### 10.1 Responsive Architecture

**Breakpoints:**
- Mobile: `< 1024px` (lg breakpoint)
- Desktop: `>= 1024px`

**Layout Adaptation:**

| Element | Desktop | Mobile |
|---------|---------|--------|
| Sidebar | 240px (expanded) / 56px (collapsed), persistent | Slide-out overlay, triggered by hamburger |
| Navigation | Sidebar links | Bottom tab bar (7 items) |
| Header | None (sidebar has branding) | Sticky top bar: hamburger + page title + XP badge |
| Content | max-w-5xl centered | Full-width with 16px padding |
| Footer | Inline at bottom | Hidden (shown in settings) |
| Focus stats panel | Fixed floating card (right side) | Inline below timer |

### 10.2 Touch Ergonomics

- `.touch-target` class: `min-height: 44px, min-width: 44px` (Apple HIG recommendation)
- Bottom tab bar: 7 items with equal flex, `overscroll-behavior: contain`
- All interactive elements have `whileTap` scale feedback (visual touch confirmation)
- No hover-dependent interactions (all hover states are enhancements, not requirements)

### 10.3 Safe Area Handling

```css
.safe-bottom  { padding-bottom: env(safe-area-inset-bottom, 0px);  }
.safe-top     { padding-top: env(safe-area-inset-top, 0px);       }
.safe-left    { padding-left: env(safe-area-inset-left, 0px);      }
.safe-right   { padding-right: env(safe-area-inset-right, 0px);   }
```

- MobileNav (bottom tab bar) uses `safe-bottom` to avoid notched phone cutouts
- MobileHeader uses `safe-top` for Dynamic Island compatibility
- Viewport meta: `viewportFit: 'cover'` allows content under the status bar

### 10.4 PWA Strategy

- **Manifest**: Name, icons (192x512 + SVG + Apple), shortcuts (Quick Capture, Focus, Tasks, Dashboard), screenshots, Edge side panel config
- **Service Worker**: Pre-caches `/`, `/manifest.json`, `/icon.svg`. Cache-first strategy for GET requests with network update. Skip-waiting on install. Old cache cleanup.
- **Install prompt**: `beforeinstallprompt` listener with glass-panel UI
- **Status bar**: `'black-translucent'` for immersive feel on iOS
- **Theme color**: Dynamic per theme (light `#fafafa`, dark `#0a0a14`)

### 10.5 Battery Optimization

- No WebGL (removed Spline)
- No continuous network requests
- CSS animations over JS animations
- `requestAnimationFrame` not used (CSS animations are GPU-composited)
- Timer interval is 200ms, not 16ms (60fps would be overkill for a seconds display)

---

## 11. App Lifecycle & Routing

### 11.1 Loading Sequence

```
1. HTML loads → <head> theme hydration script runs
   ├── Reads localStorage, applies correct theme class
   └── Prevents flash of wrong theme

2. React hydrates → layout.tsx renders
   ├── Inline theme script (beforeInteractive)
   ├── Service worker registration (afterInteractive)
   └── {children} = page.tsx

3. page.tsx renders StudentOS component
   ├── useState(false) for mounted (hydration guard)
   ├── useEffect → setMounted(true)
   ├── Checks onboardingComplete from store
   │   ├── false → WelcomeScreen
   │   └── true → App shell
   └── AnimatePresence wraps the choice

4. Zustand persist hydrates from localStorage
   ├── onRehydrateStorage callback
   ├── If error → console.warn, use defaults
   ├── Date revival for stored Date objects
   └── Schema migration if needed

5. App shell renders
   ├── RootErrorBoundary
   │   └── ToastProvider
   │       ├── CommandPalette (⌘K)
   │       ├── InstallPrompt
   │       ├── flex layout
   │       │   ├── Skip-to-content link (a11y)
   │       │   ├── Sidebar (desktop) / MobileHeader (mobile)
   │       │   ├── Main content area
   │       │   │   ├── AnimatePresence for view transitions
   │       │   │   └── Suspense fallback = Loader
   │       │   └── MobileNav (bottom tabs)
   │       └── Footer
   └── initialView from URL?view= param
```

### 11.2 View Routing

Since this is a SPA with no Next.js routes, routing is handled manually:

```
State change:
  setActiveView('focus')
    └── useEffect detects activeView !== lastView
          └── Computes direction (forward/backward) for animation
          └── window.history.pushState(null, '', '?view=focus')
          └── lastView.current = 'focus'

Browser back/forward:
  popstate event fires
    └── getViewFromUrl() reads URLSearchParams
    └── isNavigatingFromPopstate = true (suppress pushState)
    └── setActiveView(parsedView)
    └── Direction computed for animation
```

### 11.3 Error Handling

**ViewErrorBoundary** (per-view):
- Catches errors in individual lazy-loaded components
- Shows "Something went wrong" with retry/refresh buttons
- Prevents one broken view from crashing the entire app

**RootErrorBoundary** (app-wide):
- Catches errors in shell components (sidebar, navigation)
- Shows full-screen error state
- Refresh button for full recovery

**Global error.tsx** (Next.js):
- Catches errors during SSR/hydration
- Styled with destructive theme colors

---

## 12. Known Limitations & Future Roadmap

### 12.1 Current Limitations

| Area | Limitation | Impact |
|------|-----------|--------|
| **Syncing** | No cross-device sync | Data is tied to a single device |
| **Backup** | Manual JSON export only | No automatic cloud backup |
| **Search** | Simple string inclusion only | No fuzzy search, no full-text indexing |
| **Tasks** | No recurring tasks | Must recreate recurring assignments |
| **Notes** | No note-taking system | Must use external tool for notes |
| **Calendar** | No calendar sync (Google/Apple) | Must enter events manually |
| **Sharing** | No collaboration | Cannot share task lists or study plans |
| **Accessibility** | Limited screen reader testing | Core structure is semantic but untested |
| **Data portability** | JSON export only | No Markdown, CSV, or PDF export |
| **Performance** | All data in memory (localStorage) | Could become slow with 10,000+ items |
| **Offline** | Works offline | No conflict resolution since no sync |

### 12.2 Technical Debt

| Item | Location | Notes |
|------|----------|-------|
| Monolithic store | `lib/store.ts` (619 lines) | Single file handles all state; could be split by domain |
| Date serialization | Store reviver runs on every read | Slight overhead on every state access |
| Optional IndexedDB | `lib/db.ts` | Exists but not integrated with Zustand; could replace localStorage |
| No data pagination | All lists render every item | Could lag with 1000+ tasks/habits |
| Limited testing | No test files found | No Jest, no Cypress, no Playwright |
| CSS in globals.css | 515 lines | Could be split into modules |
| Ambient orb duplication | CSS + inline in components | `.ambient-orb` classes defined globally but also inlined in components |

### 12.3 Future Roadmap

**Short-term (next 1-3 months):**
- [ ] Automatic backup reminder (weekly prompt to export)
- [ ] Recurring tasks support (daily/weekly/monthly)
- [ ] Simple note-taking (markdown-based, per-subject)
- [ ] Task drag-and-drop reordering
- [ ] Focus mode: white noise / lo-fi player
- [ ] Analytics: export charts as images

**Medium-term (3-6 months):**
- [ ] End-to-end encrypted sync via WebRTC or third-party storage (Dropbox/iCloud)
- [ ] Subject-based organization (color-coded subjects with filters)
- [ ] Grade tracking (GPA calculator, grade per subject)
- [ ] Pomodoro variant (25/5 min work/break) as optional preset
- [ ] Study plan generator (AI-powered schedule from tasks + exams)
- [ ] Dark/light/AMOLED theme per-schedule (auto-switch)

**Long-term (6-12 months):**
- [ ] Full offline-first sync protocol (CRDT-based)
- [ ] Public shareable study plans
- [ ] Flashcards integration (spaced repetition)
- [ ] API for third-party integrations (calendar, LMS)
- [ ] Desktop apps (Tauri/Electron) with native notifications
- [ ] Cloud backup with zero-knowledge encryption

---

## 13. New Developer Onboarding Guide

### 13.1 First Setup

```bash
# Clone and install
git clone <repo>
cd student-os
npm install

# Start development
npm run dev

# Build for production
npm run build

# Lint
npm run lint
```

### 13.2 Key Technologies to Know

| Technology | Role | Learn More |
|-----------|------|------------|
| **Next.js 16** | Framework (App Router) | https://nextjs.org/docs |
| **React 19** | UI library | https://react.dev |
| **TypeScript** | Type safety | https://www.typescriptlang.org |
| **Tailwind CSS v4** | Styling | https://tailwindcss.com |
| **Framer Motion 12** | Animation | https://www.framer.com/motion |
| **Zustand 5** | State management | https://zustand.docs.pmnd.rs |
| **Recharts 2** | Charts | https://recharts.org |
| **Lucide React** | Icons | https://lucide.dev |
| **date-fns 4** | Date utilities | https://date-fns.org |
| **Dexie 4** | IndexedDB wrapper | https://dexie.org |

### 13.3 Development Workflow

1. **State changes**: If you need new state, add it to `lib/store.ts`. Follow the existing pattern: interface field → default value → setter function → add to `partialize` if it needs persistence.

2. **New views**: Add an entry to the `navItems` array in `components/navigation.tsx`, add the lazy import in `app/page.tsx`, add to the `VIEW_ORDER` and `VALID_VIEWS` arrays, and add the switch case in `handleViewRender`.

3. **New UI components**: Create in `components/ui/` if the component is generic and reusable. Create in `components/` if it's a view-level component. Create a subsystem folder (like `components/focus/`) if it has multiple tightly coupled files.

4. **New animations**: Add new presets to `components/motion.tsx`. Always use `transform` and `opacity` for performance. Always respect reduced motion. Use spring physics (`spring.snappy`, `spring.smooth`, etc.) rather than hardcoded durations.

5. **New hooks**: Create in `hooks/`. One file per hook. No barrel exports.

### 13.4 Coding Conventions

**Imports order:**
```typescript
// 1. React/hooks
import { useState, useEffect } from 'react'

// 2. External libraries
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'

// 3. Internal components
import { Card } from './ui/glass-card'

// 4. Icons
import { Sparkles } from 'lucide-react'

// 5. Utilities
import { cn } from '@/lib/utils'
```

**Component structure:**
```typescript
'use client'

import { useState, useCallback } from 'react'

interface Props {
  // typed interface
}

export function ComponentName({ prop1, prop2 }: Props) {
  // 1. Store selectors
  const value = useStore(s => s.value)

  // 2. Local state
  const [local, setLocal] = useState(false)

  // 3. Callbacks
  const handleAction = useCallback(() => {
    // ...
  }, [])

  // 4. Effects
  useEffect(() => {
    // ...
  }, [])

  // 5. Derived values
  const computed = useMemo(() => {
    // ...
  }, [])

  // 6. Render
  return (
    // JSX
  )
}
```

**Naming conventions:**
- Components: PascalCase
- Functions: camelCase
- Interfaces: PascalCase (Props interfaces without "I" prefix)
- Types: PascalCase
- Files: kebab-case for components (`focus-timer.tsx`), camel-case for hooks (`use-store.ts`)
- Constants: UPPER_SNAKE_CASE

### 13.5 Common Pitfalls

1. **Store re-renders**: Always use selector functions, not the entire store. `useStore(s => s.tasks)` not `useStore()`.
2. **Timer persistence**: The focus timer uses `ref` for tracking and `store` for persistence. Don't mix them up. The ref is the source of truth during a session.
3. **Date handling**: Always use date-fns for date operations. Store dates as Date objects. The Zustand reviver handles serialization.
4. **Animation performance**: Only animate `opacity` and `transform`. Never animate layout properties on the main thread.
5. **Mobile testing**: Always test on mobile viewport first. The app is mobile-first. Desktop is the enhancement.
6. **Theme testing**: Test all three themes (light, dark, AMOLED) when making visual changes.

### 13.6 Deployment

```bash
# Build
npm run build

# The build output goes to .next/
# Deploy the entire project to Vercel (recommended)
# Or serve static export with:
npx serve@latest out
```

The app is currently deployed via Vercel with automatic deployments from the main branch.

---

## Appendix: Key File Reference

| File | Lines | What You'll Find Here |
|------|-------|----------------------|
| `app/page.tsx` | 234 | App orchestrator, routing, lazy imports |
| `lib/store.ts` | 619 | All state, actions, migrations |
| `app/globals.css` | 515 | Design system, themes, utilities |
| `components/focus-mode.tsx` | 328 | Focus timer logic, timestamp-based |
| `components/motion.tsx` | 201 | All animation presets |
| `components/dashboard.tsx` | 419 | Main view, stat cards, heatmap |
| `components/navigation.tsx` | 329 | Sidebar, mobile nav, header |
| `components/analytics.tsx` | 441 | All charts and insights |
| `components/settings.tsx` | 336 | Profile, theme, data management |
| `components/command-palette/action-registry.ts` | 232 | All command palette actions |
| `lib/quick-capture.ts` | 150 | NLP task parser |
| `data/quotes.ts` | 37 | All motivational quotes |

---

## Anchored Summary

*Last updated: 2026-07-13*

### Phase
Scheduling Architecture Audit — Runtime execution paths are now confirmed via structured logging on device.

### Build Status
| Check | Status |
|-------|--------|
| Next.js build (static export) | ✅ Pass |
| TypeScript strict | ✅ Pass (0 errors) |
| ESLint | ✅ Pass (58 warnings, 0 errors) |
| `assembleDebug` (incremental) | ✅ Pass (~30-54s) |
| `assembleRelease` (R8 enabled) | ✅ Pass (2.1 MB APK) |
| Unit tests (62) | ✅ All passing |
| Android Lint | ✅ No blocking issues |

### Critical Bugs Fixed (11)
1. **`scheduleAtMs` Capacitor bridge serialization**: `call.getDouble("scheduleAtMs")` returned null for large integer values (~1.78e12). Fixed by using `JSObject.opt()` which correctly returns `java.lang.Long`, extracted via `((Number) raw).longValue()`. This unblocked the entire alarm scheduling pipeline.
2. **Data loss**: `importedTracks` partialize stripped `fileId` → ghost unplayable tracks after reload
3. **Permanently locked achievements**: `checkAchievements()` switch statement missing `habits-30`, `early-bird`, `night-owl` cases
4. **Contract modal loops**: Session counter incremented AFTER contract check — shown every single session
5. **Unmount crash**: `cinematic-intro.tsx` handleSkip timeout fired on unmounted component
6. **Misleading stat**: Dashboard "Tasks done" used ALL tasks as denominator instead of today-only
7. **Focus session Error 185**: `localStorage QuotaExceededError` from Zustand persist middleware unhandled — crashed timer interval mid-session. All 8 `set()` calls in `focus-mode.tsx` wrapped in try/catch
8. **Dashboard division by zero**: `weeklyGoalProgress` and focus bar width divide by zero when `weeklyGoal` or `dailyGoal` is 0
9. **Store falsy-coalescing**: `completeHabit` uses `||` instead of `??` for `longestStreak`/`bestStreak` — hidden as 0 when value was `0`
10. **Analytics trend (3 bugs)**: `lastWeekFocus` captured 1 day instead of 7; `inferSubject` called with wrong argument positions; peak hour picked longest session instead of most common hour
11. **DeepLockManager race condition**: Fire-and-forget `startDeepLock` could race with cleanup on React re-render; `SessionManager` state mutations unsynchronized on native side

### Runtime Execution Audit (Completed 2026-07-13)
Structured logging (`[SCHEDULING_AUDIT]`) was added to all scheduling entry points in JS and native layers. APK deployed to Samsung device and execution paths captured via logcat.

**Confirmed execution path (habit alarms):**
```
App cold start → AlarmPlugin.load() ✅
              → AlarmBootReceiver.onReceive() ✅ (3 persisted alarms)
                → AlarmScheduler.scheduleNextDay() ✅ (3x)
                  → AlarmScheduler.schedule() ✅ (3x, setExact)
              → JS rehydration → syncHabitAlarms() ✅ (4 habits processed)
                → cancelAlarm() → AlarmScheduler.cancel() ✅ (3x)
                → scheduleAlarm() → AlarmPlugin.scheduleAlarm() ✅ (3x)
                  → AlarmScheduler.schedule() → setExact() ✅ SUCCESS
                → checkExactAlarmPermission() ✅ (granted: true)
```

**Components NOT reached during audit (verified dead or latent):**
- `AlarmForegroundService` — latent (only fires when alarm triggers, scheduled for future)
- `AlarmFullScreenActivity` — latent (same)
- `AlarmReceiver.onReceive()` — latent (same, alarm times are 00:28/00:46/02:03)

**Key finding**: Single unified scheduling system confirmed:
- Both habit and planner alarms route through `scheduleAlarm()` → `AlarmPlugin` → `AlarmScheduler` → `AlarmManager.setExact()`. No `@capacitor/local-notifications` dependency — the custom AlarmPlugin bridge is the only native scheduling path.

### Major Bug Fixes (17)
- Dexie/IndexedDB operations (4 methods) without try/catch → unhandled rejections
- All Capacitor notification calls (7 sites) without try/catch → crash on permission denial
- Settings `localStorage.removeItem` without try/catch → crash in private browsing
- Focus quit confirm modal timer leak (auto-dismiss timer survived "Continue" click)
- AudioContext.resume() not awaited → silent notification failures
- `completeTimer` not awaited where it calls `playNotification()` (now async)
- Welcome screen focus timeout no cleanup on step change
- Storage monitor setTimeout in event listener never tracked for cleanup
- Storage monitor handleExport not wrapped in try/catch
- AudioEngine SSR guard (window.AudioContext accessed without typeof check)
- Layout SW daily update interval never stopped on page hide
- Real-time clock reference `100vh` → `100dvh` for mobile browser toolbar
- **Timer interval restart spam**: `tasksCompletedToday` in `completeTimer` deps caused interval effect to restart on every unrelated task completion — replaced with `initialTasksCompletedRef`
- **Welcome screen**: Review summary shows `0 min` for custom duration — uses `focusDur` (0 for custom) instead of `effectiveFocusDur`
- **Command palette**: `previousActiveElement.focus()` throws when element unmounted — added `isConnected` guard
- **QuickCapture**: `getNextWeekday` returns mutated `Date` reference — returns `new Date(today)` defensive copy instead
- **Analytics task trend**: `thirteenDaysAgo` variable renamed to `fourteenDaysAgo` but reference not updated — reference error

### Dead Code Removed (15 files)
- `components/spline-scene.tsx` — 116 lines, unreferenced
- `components/spline-companion.tsx` — 95 lines, unreferenced
- `package.json`: 3 unused deps (`@splinetool/react-spline`, `@splinetool/runtime`, `@splinetool/viewer`)
- `public/bg-cinematic.jpg` — unused background asset
- `android/.../DeepLockAccessibilityService.java` — legacy (93 lines)
- `android/.../DeepLockOverlayService.java` — legacy (75 lines)
- `AndroidManifest.xml` — 2 legacy service declarations
- 10 stale planning/audit `.md` documentation files

### UI Audit — Touch Targets Fixed
- Sidebar `overflow-hidden` removed → QuickCapture panel no longer clipped
- Accent color swatches: `w-8 h-8` → `min-h-[44px] min-w-[44px]`
- Focus duration segmented control: `py-2.5` → `py-3` + `min-h-[44px]`
- Custom duration stepper: `w-8 h-8` → `min-h-[44px] min-w-[44px]`
- Install prompt dismiss button: `p-0.5` → `min-h-[44px] min-w-[44px]`

### RC-1 Improvements
- **R8/ProGuard enabled**: `minifyEnabled true` + `shrinkResources true`. APK: 2.1 MB (62.7% reduction from 5.74 MB)
- **Accent color**: Wired to CSS via `--accent-hue` OKLCH variable (`data-accent-color`). 6 colors: purple/blue/green/orange/pink/teal
- **Font size**: Applied via `data-font-size` attribute. 3 sizes: small/medium/large
- **Settings**: `defaultReminderMinutes` onClick now prompts for value
- **ProGuard rules tightened**: Removed overly broad `-keep class com.getcapacitor.**` and `-keep class org.json.**`. Only kept Plugin subclasses and manifest-registered components
- **DeepLockPlugin null safety**: `getActivity().startLockTask()` now guarded with null check; `queryUsageStats()` wrapped in `SecurityException` try/catch
- **Splash fallback**: Added `drawable/splash.png` base fallback to prevent landscape crash
- **Duplicate code**: Removed duplicate `performGlobalActionImpl` assignment in `FocusShieldManager.setup()`
- **Jetifier**: Added `android.enableJetifier=true` in gradle.properties
- **Crash logs**: Removed `hs_err_pid*.log` and `replay_pid*.log` from repo
- **Console.log/TODO/FIXME audit**: Zero must-fix items. All 8 console.warn/error are in catch blocks
- **Navigation**: Verified 6 primary tabs, all 21 views mapped in PARENT_VIEW
- **Kotlin JVM target**: `kotlinOptions.jvmTarget = "17"` set in root build.gradle subprojects block (Kotlin 2.1.0 ignores gradle.properties JVM target props)
- **SessionManager synchronized**: All 5 state-mutating methods (`startSession`, `pauseSession`, `resumeSession`, `completeSession`, `cancelSession`) annotated `@Synchronized` to prevent concurrent session corruption
- **DeepLockManager inflight guard**: `startingRef` prevents duplicate `startDeepLock` calls across React re-renders before bridge resolves

### Open Items (for next session)
1. ~~**Remove instrumentation**: All `[SCHEDULING_AUDIT]` logs across 7 files need to be removed after audit analysis is confirmed~~ ✅ Done
2. ~~**Two parallel scheduling systems**: Merge planner reminders (`@capacitor/local-notifications`) into the custom AlarmPlugin pipeline for unified scheduling~~ ✅ Not applicable — single unified system already (docs were stale)
3. ~~**Dead code removal**: `syncPlannerAlarms`, `syncPlannerReminders`, `scheduleBrowserNotification`, `registerAlarmActionTypes`, `attachAlarmActionListener` JS code paths are never reached~~ ✅ Not applicable — `syncPlannerAlarms` and `scheduleBrowserNotification` are active code paths; other functions never existed in source
4. **AlarmReceiver physical testing**: Verify that scheduled alarms (00:28, 00:46, 02:03) actually fire and trigger AlarmReceiver → AlarmForegroundService → AlarmFullScreenActivity
5. ~~**Calendar touch targets**: MonthGrid day cells at ~41px cannot meet 44px minimum without UX redesign~~ ✅ Already fixed — cells are `h-20` (80px) on mobile, above 44px minimum
6. ~~**Planner week view**: Stacks 7 days vertically on mobile — consider horizontal swipe layout~~ ✅ Fixed — added `sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7` responsive breakpoints; 2 columns on mobile
7. ~~**MP3 audio files** in project root: verify reachable from audio engine~~ ✅ Done — 2 dead MP3s deleted (23 MB freed), only `studentos_alarm.mp3` in `res/raw/` remains and is wired
8. ~~**Monolithic store**: `lib/store.ts` at 2803 lines — candidate for splitting into domain modules~~ ✅ Done — split into 15 files (~1771 total) under `lib/store/` with per-domain slices
9. **ExampleUnitTest.java**: Default placeholder in wrong namespace (`com.getcapacitor.myapp`)
10. **Post-RC-1**: Consider removing `subprojects { afterEvaluate { compileOptions VERSION_17 } }` block from root build.gradle once CI JDK is upgraded to 21

### Key Architectural Facts
- 21 lazy-loaded views, ~100KB per view, SSR via static export
- OKLCH color space, glass morphism design system, 3 themes (light/dark/AMOLED)
- Zustand persist → localStorage (schema v15), Date revival, auto-repair on boot
- 8 Kotlin FocusShield components + MotivationEngine for deep lock
- 7 Capacitor plugin methods bridging JS ↔ Android
- Three.js wireframe torus knot animation (focus-brain-canvas) as ambient decoration
- **Single unified scheduling system**: `syncPlannerAlarms` and `syncHabitAlarms` both call `scheduleAlarm()` → `AlarmPlugin.scheduleAlarm()` → `AlarmScheduler.schedule()` → `AlarmManager.setExact()`. No `@capacitor/local-notifications` dependency.
- `AlarmBootReceiver` restores 3 persisted alarms on cold boot via `AlarmScheduler.scheduleNextDay()` → `AlarmScheduler.schedule()` → `setExact()`
- `scheduleAtMs` arrives as `java.lang.Long` (not Double) across Capacitor bridge; must use `JSObject.opt()` + `((Number) raw).longValue()` for safe extraction

---

*Generated for contributors, maintainers, AI coding agents, and future developers of Student OS.*
*Questions? Reach out to Jainam Karnawat on Instagram: @thats.jainam*
