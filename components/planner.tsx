'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  addDays,
  addMinutes,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  isToday,
  isTomorrow,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, AlertTriangle, CalendarPlus2, CheckCircle2, Circle, Sparkles } from 'lucide-react'

import { BottomSheet } from '@/components/planner/bottom-sheet'
import { CalendarSwitcher, type PlannerViewMode } from '@/components/planner/calendar-switcher'
import { EmptyState } from '@/components/planner/empty-state'
import { SyllabusView } from '@/components/planner/syllabus-view'
import { PlannerHeader } from '@/components/planner/planner-header'
import { QuickActions } from '@/components/planner/quick-actions'
import { InlineTaskEditor } from '@/components/planner/inline-editor'
import { Timeline } from '@/components/planner/timeline'
import { WeeklyStrip } from '@/components/planner/weekly-strip'
import { AnalyticsCard } from '@/components/planner/analytics-card'
import { staggerContainer, staggerItem } from '@/components/motion'
import { Card } from '@/components/ui/glass-card'
import { Input } from '@/components/ui/input'
import { useDeferredRender } from '@/hooks/use-deferred-effect'
import { getPlannerDailyAnalytics, getPlannerWeeklyAnalytics } from '@/lib/planner/analytics'

import { buildCarryForwardSuggestion, eventsOverlap, findNearestAvailableSlots } from '@/lib/planner/scheduling'
import { buildTimelineSlots } from '@/lib/planner/timeline'
import { getEventsForDate, getTimelineBounds, normalizePlannerSettings } from '@/lib/planner/utils'
import { type PlannerSettings, type StudyEvent, useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

function MonthGrid({
  currentDate,
  events,
  onOpenDate,
}: {
  currentDate: Date
  events: StudyEvent[]
  onOpenDate: (date: Date) => void
}) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const paddingDays = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1

  return (
    <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
        <h3 className="text-base font-bold text-foreground">{format(currentDate, 'MMMM yyyy')}</h3>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">{monthDays.length} days</span>
      </div>
      <div className="grid grid-cols-7 border-b border-border/20">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="px-2 py-2.5 text-center text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {Array.from({ length: paddingDays }).map((_, index) => (
          <div key={`padding-${index}`} className="h-20 md:h-28 border-b border-r border-border/10" />
        ))}

        {monthDays.map((day) => {
          const dayEvents = getEventsForDate(events, day)
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onOpenDate(day)}
              className={cn(
                'h-20 md:h-28 border-b border-r border-border/10 px-1.5 md:px-2 py-1.5 md:py-2 text-left align-top transition-colors hover:bg-secondary/20 relative',
                !isSameMonth(day, currentDate) && 'opacity-25'
              )}
            >
              <div className={cn(
                'inline-flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-full text-[11px] md:text-xs font-semibold transition-colors',
                isToday(day)
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : dayEvents.length > 0
                    ? 'text-foreground'
                    : 'text-muted-foreground/40'
              )}>
                {format(day, 'd')}
              </div>
              {dayEvents.length > 0 && (
                <div className="mt-1 md:mt-1.5 space-y-0.5">
                  {dayEvents.slice(0, isToday(day) ? 3 : 2).map((event) => (
                    <div key={event.id} className="flex items-center gap-1">
                      <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', {
                        'bg-[#6366f1]': event.type === 'study',
                        'bg-[#ef4444]': event.type === 'exam',
                        'bg-[#a855f7]': event.type === 'revision',
                        'bg-[#22c55e]': event.type === 'break',
                      })} />
                      <span className="truncate text-[9px] md:text-[10px] text-foreground/80 font-medium leading-tight">
                        {event.title}
                      </span>
                    </div>
                  ))}
                  {dayEvents.length > (isToday(day) ? 3 : 2) && (
                    <div className="text-[9px] text-muted-foreground/50 pl-2.5">+{dayEvents.length - (isToday(day) ? 3 : 2)}</div>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function StudyPlanner() {
  const events = useStore((state) => state.events)
  const plannerSettings = useStore((state) => state.plannerSettings)
  const setPlannerSettings = useStore((state) => state.setPlannerSettings)
  const plannerSetupComplete = useStore((state) => state.plannerSetupComplete)
  const setPlannerSetupComplete = useStore((state) => state.setPlannerSetupComplete)
  const updateEvent = useStore((state) => state.updateEvent)
  const rescheduleEvent = useStore((state) => state.rescheduleEvent)
  const markEventComplete = useStore((state) => state.markEventComplete)
  const setCarryForwardSuggestion = useStore((state) => state.setCarryForwardSuggestion)
  const setActiveView = useStore((state) => state.setActiveView)
  const focusSessions = useStore((state) => state.focusSessions)

  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<PlannerViewMode>(plannerSettings.defaultView)
  const [editorDate, setEditorDate] = useState<Date | null>(null)
  const [editingEvent, setEditingEvent] = useState<StudyEvent | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [showSleepSettings, setShowSleepSettings] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const chartsReady = useDeferredRender(100)

  useEffect(() => {
    if (!plannerSetupComplete && events.length === 0) {
      setShowSetup(true)
    }
  }, [plannerSetupComplete, events.length])

  const handleSetupSave = useCallback(() => {
    setPlannerSetupComplete(true)
    setShowSetup(false)
  }, [setPlannerSetupComplete])

  const normalizedSettings = useMemo(
    () => normalizePlannerSettings(plannerSettings as Partial<PlannerSettings>),
    [plannerSettings]
  )

  const launchFocus = useCallback((event: StudyEvent) => {
    const eventDuration = event.estimatedDuration ?? Math.max(1, Math.round((event.endTime.getTime() - event.startTime.getTime()) / 60000))
    try {
      const { focusService } = require('@/Focus/service/FocusService')
      focusService.start(eventDuration)
    } catch {}
    const store = useStore.getState()
    store.setFocusShieldMode('deep-lock')
    setActiveView('focus')
  }, [setActiveView])

  useEffect(() => {
    setPlannerSettings({ defaultView: viewMode })
  }, [setPlannerSettings, viewMode])

  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate])
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart])
  const dayEvents = useMemo(() => getEventsForDate(events, currentDate), [events, currentDate])
  const slots = useMemo(() => buildTimelineSlots(currentDate, normalizedSettings), [currentDate, normalizedSettings])
  const dailyAnalytics = useMemo(
    () => getPlannerDailyAnalytics(events, focusSessions, currentDate),
    [events, focusSessions, currentDate]
  )
  const weeklyAnalytics = useMemo(
    () => getPlannerWeeklyAnalytics(events, focusSessions, currentDate),
    [events, focusSessions, currentDate]
  )

  const incompletePastEvents = useMemo(
    () =>
      dayEvents.filter(
        (event) => !event.completed && new Date(event.endTime).getTime() < Date.now()
      ),
    [dayEvents]
  )

  const carryForwardSuggestions = useMemo(
    () =>
      incompletePastEvents
        .map((event) => ({
          event,
          suggestion: buildCarryForwardSuggestion(event, normalizedSettings, events),
        }))
        .filter((item) => item.suggestion),
    [events, incompletePastEvents, normalizedSettings]
  )

  const agendaGroups = useMemo(() => {
    const sorted = [...events].sort(
      (left, right) => new Date(right.startTime).getTime() - new Date(left.startTime).getTime()
    )
    const groups: { dateKey: string; date: Date; events: StudyEvent[] }[] = []
    for (const event of sorted) {
      const d = new Date(event.startTime)
      const key = format(d, 'yyyy-MM-dd')
      let group = groups.find((g) => g.dateKey === key)
      if (!group) {
        group = { dateKey: key, date: d, events: [] }
        groups.push(group)
      }
      group.events.push(event)
    }
    return groups
  }, [events])

  const currentTimeTop = useMemo(() => {
    if (!isToday(currentDate)) return null
    const { start } = getTimelineBounds(currentDate, normalizedSettings)
    const diffMinutes = Math.max(0, Math.round((Date.now() - start.getTime()) / 60000))
    return (diffMinutes / normalizedSettings.slotMinutes) * 48
  }, [currentDate, normalizedSettings])

  function openEditor(date: Date, event?: StudyEvent) {
    setEditorDate(date)
    setEditingEvent(event ?? null)
    setShowEditor(true)
  }

  function closeEditor() {
    setShowEditor(false)
    setEditorDate(null)
    setEditingEvent(null)
  }

  function showOverlapMessage(event: StudyEvent, proposedStart: Date, proposedEnd: Date) {
    const suggestions = findNearestAvailableSlots({
      events,
      targetDate: proposedStart,
      durationMinutes: Math.max(15, Math.round((proposedEnd.getTime() - proposedStart.getTime()) / 60000)),
      settings: normalizedSettings,
      excludeEventId: event.id,
      limit: 1,
    })

    if (suggestions[0]) {
      setStatusMessage(`Overlap detected. Suggested slot: ${format(suggestions[0].startTime, 'h:mm a')} - ${format(suggestions[0].endTime, 'h:mm a')}.`)
      setCarryForwardSuggestion(event.id, suggestions[0].startTime)
    } else {
      setStatusMessage('Overlap detected and no nearby free slot is available.')
    }
  }

  function canPlaceEvent(event: StudyEvent, startTime: Date, endTime: Date): boolean {
    const candidate: StudyEvent = { ...event, startTime, endTime }
    const overlaps = events.some((existing) => eventsOverlap(candidate, existing))
    return !overlaps
  }

  function moveEvent(event: StudyEvent, minutes: number) {
    const nextStart = addMinutes(new Date(event.startTime), minutes)
    const nextEnd = addMinutes(new Date(event.endTime), minutes)
    if (nextStart.getTime() < Date.now()) {
      setStatusMessage('Past time slots stay visible but cannot receive new tasks.')
      return
    }
    if (canPlaceEvent(event, nextStart, nextEnd)) {
      rescheduleEvent(event.id, nextStart, nextEnd)
      setStatusMessage(null)
    } else {
      showOverlapMessage(event, nextStart, nextEnd)
    }
  }

  function resizeEvent(event: StudyEvent, minutes: number) {
    const nextEnd = addMinutes(new Date(event.endTime), minutes)
    if (nextEnd <= new Date(event.startTime)) return
    if (canPlaceEvent(event, new Date(event.startTime), nextEnd)) {
      rescheduleEvent(event.id, new Date(event.startTime), nextEnd)
      setStatusMessage(null)
    } else {
      showOverlapMessage(event, new Date(event.startTime), nextEnd)
    }
  }

  function handleDropTask(eventId: string, slotTime: Date) {
    const event = events.find((item) => item.id === eventId)
    if (!event) return
    const durationMinutes = Math.max(15, event.estimatedDuration ?? Math.round((new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / 60000))
    const endTime = addMinutes(slotTime, durationMinutes)
    if (canPlaceEvent(event, slotTime, endTime)) {
      rescheduleEvent(event.id, slotTime, endTime)
      setStatusMessage(null)
    } else {
      showOverlapMessage(event, slotTime, endTime)
    }
  }



  function navigate(direction: 'prev' | 'next') {
    const delta = direction === 'prev' ? -1 : 1
    setCurrentDate((value) => {
      if (viewMode === 'month') return new Date(value.getFullYear(), value.getMonth() + delta, 1)
      if (viewMode === 'week') return addDays(value, delta * 7)
      return addDays(value, delta)
    })
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-5 pb-32">
      <PlannerHeader completionPercent={dailyAnalytics.completionPercent} />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <CalendarSwitcher value={viewMode} onChange={setViewMode} />
        <QuickActions
          onAdd={() => openEditor(new Date())}
          onSleepSettings={() => setShowSleepSettings(true)}
          onCarryForwardReview={() => setShowSuggestions(true)}
        />
      </div>

      <WeeklyStrip days={weekDays} currentDate={currentDate} onSelect={setCurrentDate} />

      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <button type="button" onClick={() => navigate('prev')} aria-label={`Previous ${viewMode}`} className="rounded-xl p-2 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-center">
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Schedule</div>
          <div className="text-sm font-semibold text-foreground">
            {viewMode === 'month'
              ? format(currentDate, 'MMMM yyyy')
              : viewMode === 'week'
                ? `${format(weekStart, 'MMM d')} - ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`
                : format(currentDate, 'EEEE, MMM d, yyyy')}
          </div>
        </div>
        <button type="button" onClick={() => navigate('next')} aria-label={`Next ${viewMode}`} className="rounded-xl p-2 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <ChevronRight className="h-4 w-4" />
        </button>
      </motion.div>

      <InlineTaskEditor
        key={editingEvent?.id ?? editorDate?.getTime() ?? 'closed'}
        visible={showEditor}
        initialDate={editorDate ?? new Date()}
        event={editingEvent}
        onClose={closeEditor}
      />

      {statusMessage && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-warning/10 border border-warning/20 px-4 py-2 text-xs text-warning flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage(null)} className="ml-auto shrink-0 text-warning/60 hover:text-warning" aria-label="Dismiss">✕</button>
        </motion.div>
      )}
      {events.length === 0 ? (
        <EmptyState onPlanDay={() => openEditor(new Date())} />
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === 'day' && (
            <Timeline
              key="planner-day"
              date={currentDate}
              events={dayEvents}
              settings={normalizedSettings}
              slots={slots}
              currentTimeTop={currentTimeTop}
              onCreateAt={(date) => openEditor(date)}
              onOpenTask={(event) => openEditor(new Date(event.startTime), event)}
              onDropTask={handleDropTask}
              onMoveEarlier={(event) => moveEvent(event, -30)}
              onMoveLater={(event) => moveEvent(event, 30)}
              onResizeShorter={(event) => resizeEvent(event, -15)}
              onResizeLonger={(event) => resizeEvent(event, 15)}
              onStartFocus={launchFocus}
              onToggleComplete={(event) => markEventComplete(event.id, !event.completed)}
            />
          )}

          {viewMode === 'week' && (
            <motion.div key="planner-week" variants={staggerItem} className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
              {weekDays.map((day) => {
                const items = getEventsForDate(events, day)
                const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                return (
                  <div key={day.toISOString()} className={cn(
                    'rounded-2xl border bg-card p-4 transition-shadow',
                    isToday ? 'border-primary/30 shadow-sm' : 'border-border/50'
                  )}>
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <div className={cn('text-[11px] uppercase tracking-[0.2em] font-semibold', isToday ? 'text-primary' : 'text-muted-foreground')}>
                          {format(day, 'EEE')}
                        </div>
                        <div className={cn('text-xl font-bold', isToday ? 'text-primary' : 'text-foreground')}>
                          {format(day, 'd')}
                        </div>
                      </div>
                      <button type="button" onClick={() => openEditor(day)} className="rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors">
                        + Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {items.length === 0 ? (
                        <button type="button" onClick={() => openEditor(day)} className="w-full rounded-xl border border-dashed border-border/60 px-3 py-5 text-xs text-muted-foreground/60 hover:text-foreground hover:border-border transition-colors">
                          Tap to schedule
                        </button>
                      ) : (
                        items.map((event) => (
                          <div key={event.id}>
                            <TimelineMiniCard
                              event={event}
                              onOpen={() => openEditor(new Date(event.startTime), event)}
                              onStartFocus={() => launchFocus(event)}
                              onToggleComplete={() => markEventComplete(event.id, !event.completed)}
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </motion.div>
          )}

          {viewMode === 'month' && <MonthGrid key="planner-month" currentDate={currentDate} events={events} onOpenDate={openEditor} />}

          {viewMode === 'agenda' && (
            <motion.div key="planner-agenda" variants={staggerItem} className="space-y-6">
              {agendaGroups.length === 0 ? (
                <EmptyState onPlanDay={() => openEditor(new Date())} />
              ) : (
                agendaGroups.map(({ dateKey, date, events: groupEvents }) => {
                  const isCurrentDay = isToday(date)
                  const isTomorrowDay = isTomorrow(date)
                  const completedCount = groupEvents.filter((e) => e.completed).length
                  const totalCount = groupEvents.length
                  const isAllDone = totalCount > 0 && completedCount === totalCount

                  const dateHeading = isCurrentDay
                    ? `Today • ${format(date, 'EEEE, MMM d')}`
                    : isTomorrowDay
                      ? `Tomorrow • ${format(date, 'EEEE, MMM d')}`
                      : format(date, 'EEEE, MMMM d, yyyy')

                  return (
                    <div key={dateKey} className="space-y-2.5">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'text-xs font-bold uppercase tracking-wider',
                            isCurrentDay ? 'text-primary' : 'text-foreground/80'
                          )}>
                            {dateHeading}
                          </span>
                          {isCurrentDay && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                              Today
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-medium">
                          {completedCount}/{totalCount} done
                          {isAllDone && <span className="ml-1 text-emerald-500 font-bold">✓</span>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {groupEvents.map((event) => (
                          <TimelineMiniCard
                            key={event.id}
                            event={event}
                            onOpen={() => openEditor(new Date(event.startTime), event)}
                            onStartFocus={() => launchFocus(event)}
                            onToggleComplete={() => markEventComplete(event.id, !event.completed)}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {viewMode === 'syllabus' && <SyllabusView />}

      {chartsReady && <AnalyticsCard daily={dailyAnalytics} weekly={weeklyAnalytics} />}

      <BottomSheet open={showSleepSettings} onClose={() => setShowSleepSettings(false)} title="Planner Settings">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              id="planner-bed-time"
              label="Bed Time"
              type="time"
              value={normalizedSettings.bedTime}
              onChange={(event) => setPlannerSettings({ bedTime: event.target.value })}
            />
            <Input
              id="planner-wake-time"
              label="Wake Time"
              type="time"
              value={normalizedSettings.wakeTime}
              onChange={(event) => setPlannerSettings({ wakeTime: event.target.value })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              id="planner-slot"
              label="Slot Minutes"
              type="number"
              min={15}
              max={60}
              value={String(normalizedSettings.slotMinutes)}
              onChange={(event) => setPlannerSettings({ slotMinutes: Number.parseInt(event.target.value || '30', 10) || 30 })}
            />
            <Input
              id="planner-reminder-default"
              label="Default Reminder (minutes)"
              type="number"
              min={0}
              max={1440}
              value={String(normalizedSettings.defaultReminderMinutes)}
              onChange={(event) =>
                setPlannerSettings({ defaultReminderMinutes: Number.parseInt(event.target.value || '10', 10) || 10 })
              }
            />
          </div>
          <div className="rounded-2xl bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
            Sleep duration: <span className="font-semibold text-foreground">{normalizedSettings.sleepDurationMinutes} minutes</span>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet open={showSuggestions} onClose={() => setShowSuggestions(false)} title="Recovery Suggestions">
        <div className="space-y-3">
          {carryForwardSuggestions.length === 0 ? (
            <div className="rounded-2xl bg-secondary/60 px-4 py-6 text-sm text-muted-foreground">
              No missed tasks need carry-forward suggestions right now.
            </div>
          ) : (
            carryForwardSuggestions.map(({ event, suggestion }) => (
              <div key={event.id} className="rounded-2xl border border-border p-4">
                <div className="text-sm font-semibold text-foreground">{event.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Suggested slot: {suggestion ? `${format(suggestion.startTime, 'EEE h:mm a')} - ${format(suggestion.endTime, 'h:mm a')}` : 'No suggestion'}
                </div>
                {suggestion && (
                  <button
                    type="button"
                    onClick={() => {
                      rescheduleEvent(event.id, suggestion.startTime, suggestion.endTime)
                      markEventComplete(event.id, false)
                      setCarryForwardSuggestion(event.id, suggestion.startTime)
                      setShowSuggestions(false)
                    }}
                    className="mt-3 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                  >
                    Carry Forward
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </BottomSheet>

      {/* FAB */}
      <motion.button
        type="button"
        onClick={() => openEditor(new Date())}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        className="fixed right-6 bottom-[calc(56px+max(env(safe-area-inset-bottom,0px),16px))] z-fab w-14 h-14 bg-primary text-primary-foreground rounded-2xl shadow-2xl shadow-primary/40 flex items-center justify-center"
        aria-label="Add task"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* First-time setup overlay */}
      <AnimatePresence>
        {showSetup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-background flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-md space-y-6 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <CalendarPlus2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Your study calendar</h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Block time for sessions, exams, and breaks. Start by adding an event.
                </p>
              </div>
              <button
                onClick={handleSetupSave}
                className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                <Sparkles className="w-5 h-5" />
                Let&apos;s Go
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const TYPE_ACCENT: Record<string, string> = {
  study: 'border-l-[#6366f1]/50',
  exam: 'border-l-[#ef4444]/50',
  revision: 'border-l-[#a855f7]/50',
  break: 'border-l-[#22c55e]/50',
}

const TYPE_BADGE: Record<string, string> = {
  study: 'bg-[#6366f1]/10 text-[#6366f1]',
  exam: 'bg-[#ef4444]/10 text-[#ef4444]',
  revision: 'bg-[#a855f7]/10 text-[#a855f7]',
  break: 'bg-[#22c55e]/10 text-[#22c55e]',
}

function TimelineMiniCard({
  event,
  onOpen,
  onStartFocus,
  onToggleComplete,
}: {
  event: StudyEvent
  onOpen: () => void
  onStartFocus: () => void
  onToggleComplete: () => void
}) {
  const now = Date.now()
  const startMs = new Date(event.startTime).getTime()
  const endMs = new Date(event.endTime).getTime()
  const durationMin = Math.round((endMs - startMs) / 60000)
  const isOverdue = !event.completed && endMs < now
  const isDueSoon = !event.completed && !isOverdue && endMs < now + 24 * 60 * 60 * 1000
  const elapsed = now - startMs
  const progress = startMs <= now && endMs > now && durationMin > 0 ? Math.min(100, Math.round((elapsed / (endMs - startMs)) * 100)) : 0

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(eventKey) => {
        if (eventKey.key === 'Enter' || eventKey.key === ' ') {
          eventKey.preventDefault()
          onOpen()
        }
      }}
      className="block w-full text-left"
    >
      <div className={cn(
        'relative rounded-xl border bg-card px-4 py-3 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 overflow-hidden',
        TYPE_ACCENT[event.type] ?? 'border-l-[#6366f1]/30',
        isOverdue ? 'border-l-[3px] border-l-destructive bg-destructive/[0.04]' : 'border-l-[3px]',
        isDueSoon && !isOverdue ? 'border-l-[3px] border-l-chart-5 bg-chart-5/[0.04]' : '',
        event.completed ? 'opacity-55' : ''
      )}>
        {progress > 0 && progress < 100 && (
          <div className="absolute bottom-0 left-0 h-0.5 bg-primary/30" style={{ width: `${progress}%` }} />
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider', TYPE_BADGE[event.type] ?? 'bg-primary/10 text-primary')}>
                {event.type}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
                {format(new Date(event.startTime), 'h:mm a')} — {format(new Date(event.endTime), 'h:mm a')}
              </span>
              <span className="text-[10px] text-muted-foreground/60">{durationMin}m</span>
            </div>
            <div className="mt-1.5 text-sm font-semibold text-foreground flex items-center gap-1.5">
              {event.completed && <span className="text-[10px] text-emerald-500 font-medium">✓</span>}
              {event.title}
              {isOverdue && <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />}
            </div>
            {event.subject && (
              <div className="mt-0.5 text-xs text-muted-foreground/70">{event.subject}</div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={(buttonEvent) => {
                buttonEvent.stopPropagation()
                onToggleComplete()
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
              aria-label={event.completed ? `Mark ${event.title} incomplete` : `Mark ${event.title} complete`}
              aria-pressed={event.completed}
            >
              {event.completed ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/70" />
              )}
            </button>
            <button
              type="button"
              onClick={(buttonEvent) => {
                buttonEvent.stopPropagation()
                onStartFocus()
              }}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                isOverdue ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'bg-primary/10 text-primary hover:bg-primary/20'
              )}
            >
              Focus
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
