'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { addMinutes, format, set as dateSet } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

import type { StudyEvent } from '@/lib/store'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface InlineTaskEditorProps {
  visible: boolean
  initialDate: Date
  event?: StudyEvent | null
  onClose: () => void
}

const CATEGORIES = [
  { value: 'study', label: 'Study' },
  { value: 'exam', label: 'Exam' },
  { value: 'revision', label: 'Revision' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'personal', label: 'Personal' },
] as const

function suggestCategory(title: string): string {
  const t = title.toLowerCase()
  if (/\b(exam|test|quiz|midterm|final|sat|act|gre|gmat)\b/.test(t)) return 'exam'
  if (/\b(revise|review|practice|revision)\b/.test(t)) return 'revision'
  if (/\b(homework|assignment|project|paper|essay|lab)\b/.test(t)) return 'assignment'
  if (/\b(workout|gym|run|meditate|read|study|class|lecture|tutorial)\b/.test(t)) return 'study'
  return 'study'
}

const DURATION_PRESETS = [30, 60, 90, 120] as const

function durationFromEvent(event: StudyEvent): number {
  const ev = event.estimatedDuration
  if (typeof ev === 'number' && ev >= 15 && ev <= 480) return ev
  const mins = Math.round((new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / 60000)
  return mins >= 15 ? mins : 60
}

const TIME_SLOTS: { value: string; label: string }[] = []
for (let h = 0; h <= 23; h++) {
  for (let m = 0; m < 60; m += 30) {
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    TIME_SLOTS.push({
      value: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      label: `${hour}:${String(m).padStart(2, '0')} ${ampm}`,
    })
  }
}

export function InlineTaskEditor({ visible, initialDate, event, onClose }: InlineTaskEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState(event?.title ?? '')
  const [category, setCategory] = useState<string>(event?.type ?? suggestCategory(event?.title ?? ''))
  const defDate = event ? format(new Date(event.startTime), 'yyyy-MM-dd') : format(initialDate, 'yyyy-MM-dd')
  const [dateStr, setDateStr] = useState(defDate)
  const [timeStr, setTimeStr] = useState(event ? format(new Date(event.startTime), 'HH:mm') : '')
  const [durationMin, setDurationMin] = useState<number>(event ? durationFromEvent(event) : 0)
  const [completed, setCompleted] = useState<boolean>(event?.completed ?? false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (visible && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [visible])

  useEffect(() => {
    if (!event && title) {
      const suggested = suggestCategory(title)
      if (suggested !== category) setCategory(suggested)
    }
  }, [title, event, category])

  function stepDuration(delta: number) {
    setDurationMin(d => Math.min(480, Math.max(15, d + delta)))
  }

  const handleSave = useCallback(() => {
    if (!title.trim() || !timeStr || durationMin < 15) return
    setSaving(true)
    try {
      const [h, m] = timeStr.split(':').map(Number)
      const startTime = dateSet(new Date(dateStr + 'T12:00:00'), { hours: h, minutes: m, seconds: 0, milliseconds: 0 })
      const endTime = addMinutes(startTime, durationMin)

      const typeMap: Record<string, StudyEvent['type']> = { study: 'study', exam: 'exam', revision: 'revision', assignment: 'study', personal: 'study' }
      const base = event ?? ({} as Partial<StudyEvent>)
      const store = useStore.getState()
      const payload: Omit<StudyEvent, 'id'> = {
        title: title.trim(),
        subject: category === 'study' ? undefined : category,
        startTime,
        endTime,
        type: typeMap[category] ?? 'study',
        priority: 'medium' as StudyEvent['priority'],
        difficulty: base.difficulty ?? 3,
        energyLevel: base.energyLevel ?? 3,
        reminder: { enabled: false, minutesBefore: 30 },
        estimatedDuration: durationMin,
        completed,
        focusMinutes: base.focusMinutes ?? 0,
        focusSessionIds: base.focusSessionIds ?? [],
        history: base.history ?? [],
      } as Omit<StudyEvent, 'id'>

      if (event) {
        store.updateEvent(event.id, payload)
      } else {
        store.addEvent(payload)
      }
      setSaving(false)
      onClose()
    } catch (e) {
      console.error('Save failed:', e)
      setSaving(false)
    }
  }, [title, category, timeStr, durationMin, dateStr, event, completed, onClose])

  const toggleCompleted = useCallback(() => {
    if (!event) return
    const next = !completed
    setCompleted(next)
    useStore.getState().markEventComplete(event.id, next)
  }, [event, completed])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') onClose()
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-sm bg-card rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl safe-bottom"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-foreground">
                {event ? 'Edit Task' : 'New Task'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Task <span className="text-destructive">*</span></label>
                <Input
                  ref={inputRef}
                  id="task-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder='e.g. "Math Homework"'
                  className="text-base"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategory(c.value)}
                      className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors min-h-[36px] ${
                        category === c.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Date</label>
                <div className="flex items-center gap-2">
                  <input
                    id="task-date"
                    type="date"
                    value={dateStr}
                    onChange={(e) => e.target.value && setDateStr(e.target.value)}
                    className="h-11 w-full rounded-2xl border-2 border-border/60 bg-surface-container-low px-4 text-base font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-ring/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Start Time <span className="text-destructive">*</span></label>
                <select
                  id="task-time"
                  value={timeStr}
                  onChange={(e) => setTimeStr(e.target.value)}
                  className={`h-11 w-full rounded-2xl border-2 bg-surface-container-low px-4 text-base font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-ring/30 ${
                    timeStr ? 'border-border/60' : 'border-destructive/40'
                  }`}
                >
                  <option value="">Select start time</option>
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot.value} value={slot.value}>{slot.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Duration <span className="text-destructive">*</span></label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => stepDuration(-15)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors font-mono text-lg font-semibold"
                    aria-label="Decrease duration by 15 min"
                  >−</button>
                  <div className="flex-1 text-center">
                    {durationMin > 0 ? (
                      <>
                        <span className="text-xl font-semibold text-foreground font-mono tabular-nums">{durationMin}</span>
                        <span className="text-sm text-muted-foreground ml-1">min</span>
                      </>
                    ) : (
                      <span className="text-base text-muted-foreground">Select duration</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => stepDuration(15)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors font-mono text-lg font-semibold"
                    aria-label="Increase duration by 15 min"
                  >+</button>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground/50 uppercase tracking-wider text-center">or</p>
                <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                  {DURATION_PRESETS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDurationMin(d)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors min-h-[36px] ${
                        durationMin === d
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {d < 60 ? `${d}m` : `${d / 60}h`}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setDurationMin(15)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors min-h-[36px] ${
                      !DURATION_PRESETS.includes(durationMin as any)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {event && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
                  <button
                    type="button"
                    onClick={toggleCompleted}
                    aria-pressed={completed}
                    className={`w-full min-h-[44px] rounded-2xl border-2 px-4 text-sm font-semibold transition-colors ${
                      completed
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-border/60 bg-surface-container-low text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {completed ? '✓ Completed — tap to undo' : 'Mark complete'}
                  </button>
                </div>
              )}


            </div>

            <Button
              type="button"
              onClick={handleSave}
              disabled={!title.trim() || !timeStr || durationMin < 15 || saving}
              className="w-full mt-6 h-12 text-base font-semibold rounded-xl"
            >
              {saving ? 'Saving...' : event ? 'Save Changes' : 'Add Task'}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
