'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { type Habit, type RepeatType, type HabitPriority, type HabitCreateInput, HABIT_ICONS, HABIT_CATEGORIES, CATEGORY_META, HABIT_COLORS, REPEAT_LABELS, habitIconEmoji } from '@/lib/habits/types'
import { Modal } from '@/components/modal'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { deepLockPlugin } from '@/lib/deep-lock/plugin'

interface HabitModalProps {
  open: boolean
  onClose: () => void
  onSave: (habit: HabitCreateInput) => void
  editingHabit?: Habit | null
}

const REPEAT_OPTIONS: RepeatType[] = ['daily', 'weekdays', 'weekends', 'weekly', 'monthly', 'custom']
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const PRIORITY_OPTIONS: { value: HabitPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-chart-2' },
  { value: 'medium', label: 'Medium', color: 'text-chart-3' },
  { value: 'high', label: 'High', color: 'text-chart-5' },
]

export function HabitModal({ open, onClose, onSave, editingHabit }: HabitModalProps) {
  const [name, setName] = useState(editingHabit?.name ?? '')
  const [description, setDescription] = useState(editingHabit?.description ?? '')
  const [icon, setIcon] = useState(editingHabit?.icon ?? HABIT_ICONS[0])
  const [color, setColor] = useState(editingHabit?.color ?? HABIT_COLORS[0])
  const [category, setCategory] = useState(editingHabit?.category ?? 'health')
  const [repeatType, setRepeatType] = useState<RepeatType>(
    (editingHabit?.repeatType as RepeatType) ??
    (editingHabit?.frequency === 'weekly' ? 'weekdays' : editingHabit?.frequency ?? 'daily')
  )
  const [repeatDays, setRepeatDays] = useState<number[]>(editingHabit?.repeatDays ?? [1, 2, 3, 4, 5])
  const [repeatInterval, setRepeatInterval] = useState(editingHabit?.repeatInterval ?? 2)
  const [priority, setPriority] = useState<HabitPriority>(editingHabit?.priority ?? 'medium')
  const [reminderEnabled, setReminderEnabled] = useState(
    editingHabit?.reminder?.enabled ?? editingHabit?.alarmEnabled ?? false
  )
  const [reminderTime, setReminderTime] = useState(
    editingHabit?.reminder?.times?.[0] ?? '09:00'
  )
  const [estimatedDuration, setEstimatedDuration] = useState(editingHabit?.estimatedDuration ?? 15)
  const [notes, setNotes] = useState(editingHabit?.notes ?? '')

  // Contextual notification consent: ask when the user first enables reminders,
  // so the OS dialog appears with clear intent rather than out of nowhere.
  const ensureNotificationPermission = useCallback(async () => {
    try {
      const native = await deepLockPlugin.requestNotificationPermission()
      if (native.granted) return
    } catch { /* native unavailable — fall through to web API */ }
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        await Notification.requestPermission()
      }
    } catch { /* noop */ }
  }, [])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    if (reminderEnabled) {
      void ensureNotificationPermission()
    }

    const targetDays = repeatType === 'weekdays'
      ? [1, 2, 3, 4, 5]
      : repeatType === 'weekends'
        ? [0, 6]
        : repeatType === 'weekly'
          ? repeatDays
          : undefined

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      icon,
      color,
      category: category || 'health',
      repeatType,
      // Preserve existing repeatDays on edit for repeat types that don't redefine
      // them (daily/monthly/custom) instead of clobbering them to undefined.
      repeatDays: targetDays ?? editingHabit?.repeatDays,
      repeatInterval: repeatType === 'custom' ? repeatInterval : editingHabit?.repeatInterval,
      priority,
      notificationEnabled: reminderEnabled,
      alarmEnabled: reminderEnabled,
      estimatedDuration: estimatedDuration > 0 ? estimatedDuration : undefined,
      notes: notes.trim() || undefined,
      reminder: {
        enabled: reminderEnabled,
        times: [reminderTime || '09:00'],
        repeat: false,
        sound: 'default',
        vibration: true,
        snoozed: false,
        weekdayOnly: false,
        weekendOnly: false,
      },
      timeOfDay: editingHabit?.timeOfDay ?? 'anytime',
    })
    onClose()
  }, [name, description, icon, color, category, repeatType, repeatDays, repeatInterval, priority, reminderEnabled, estimatedDuration, notes, reminderTime, editingHabit, onSave, onClose, ensureNotificationPermission])

  return (
    <Modal open={open} onClose={onClose} title={editingHabit ? 'Edit Habit' : 'New Habit'}>
      <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto px-1">
        <Input
          id="habit-name"
          label="Habit Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Morning Meditation"
          autoFocus
          maxLength={100}
        />

        <Input
          id="habit-description"
          label="Description (optional)"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description..."
          maxLength={300}
        />

        {/* Icon Picker */}
        <div>
          <label className="text-xs font-medium text-on-surface-variant mb-2 block uppercase tracking-wider">Icon</label>
          <div className="grid grid-cols-7 gap-1.5">
            {HABIT_ICONS.map((i) => (
              <motion.button
                key={i}
                type="button"
                onClick={() => setIcon(i)}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  'min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center text-base transition-all',
                  icon === i
                    ? 'bg-primary/20 text-primary ring-1 ring-primary/40'
                    : 'bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant/50'
                )}
                aria-label={`Select icon ${i}`}
              >
                <span className="text-[18px] leading-none">{habitIconEmoji(i)}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Color Picker */}
        <div>
          <label className="text-xs font-medium text-on-surface-variant mb-2 block uppercase tracking-wider">Color</label>
          <div className="flex gap-2 flex-wrap">
            {HABIT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  'w-7 h-7 rounded-full transition-all',
                  color === c ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110' : 'opacity-60 hover:opacity-100'
                )}
                style={{ backgroundColor: c }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="text-xs font-medium text-on-surface-variant mb-2 block uppercase tracking-wider">Category</label>
          <div className="flex gap-1.5 flex-wrap">
            {HABIT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize flex items-center gap-1',
                  category === cat
                    ? 'bg-primary/20 text-primary'
                    : 'bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant/50'
                )}
              >
                <span className="text-[14px] leading-none">{CATEGORY_META[cat]?.emoji}</span>
                {CATEGORY_META[cat]?.label || cat}
              </button>
            ))}
          </div>
        </div>

        {/* Repeat Type */}
        <div>
          <label className="text-xs font-medium text-on-surface-variant mb-2 block uppercase tracking-wider">Repeat</label>
          <div className="flex gap-1.5 flex-wrap">
            {REPEAT_OPTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRepeatType(r)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  repeatType === r
                    ? 'bg-primary/20 text-primary'
                    : 'bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant/50'
                )}
              >
                {REPEAT_LABELS[r]}
              </button>
            ))}
          </div>

          {repeatType === 'weekly' && (
            <div className="flex gap-1 mt-2">
              {DAY_LABELS.map((label, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRepeatDays((d) =>
                    d.includes(i) ? d.filter((n) => n !== i) : [...d, i]
                  )}
                  className={cn(
                    'w-8 h-8 rounded-lg text-xs font-medium transition-all',
                    repeatDays.includes(i)
                      ? 'bg-primary/20 text-primary'
                      : 'bg-surface-variant/30 text-on-surface-variant'
                  )}
                >
                  {label[0]}
                </button>
              ))}
            </div>
          )}

          {repeatType === 'custom' && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-on-surface-variant">Every</span>
              <input
                type="number"
                min={2}
                max={90}
                value={repeatInterval}
                onChange={(e) => setRepeatInterval(Math.max(2, parseInt(e.target.value) || 2))}
                className="w-16 px-2 py-1 rounded-lg bg-surface-variant/30 text-on-surface text-xs text-center border border-primary/10"
              />
              <span className="text-xs text-on-surface-variant">days</span>
            </div>
          )}
        </div>

        {/* Priority */}
        <div>
          <label className="text-xs font-medium text-on-surface-variant mb-2 block uppercase tracking-wider">Priority</label>
          <div className="flex gap-2">
            {PRIORITY_OPTIONS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                className={cn(
                  'flex-1 py-2 rounded-lg text-xs font-medium transition-all',
                  priority === p.value
                    ? 'bg-primary/20 text-primary'
                    : 'bg-surface-variant/30 text-on-surface-variant'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="text-xs font-medium text-on-surface-variant mb-2 block uppercase tracking-wider">Estimated Duration (min)</label>
          <input
            type="number"
            min={1}
            max={480}
            value={estimatedDuration}
            onChange={(e) => setEstimatedDuration(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-3 py-2 rounded-lg bg-surface-variant/30 text-on-surface text-sm border border-primary/10"
          />
        </div>

        {/* Daily Reminder */}
        <div className="rounded-xl border border-primary/10 bg-surface-variant/20 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-on-surface block">Daily Reminder</span>
              <span className="text-xs text-on-surface-variant">Get notified at a set time</span>
            </div>
            <button
              type="button"
              onClick={() => setReminderEnabled(!reminderEnabled)}
              className={cn(
                'w-10 h-6 rounded-full relative transition-all duration-200',
                reminderEnabled ? 'bg-primary' : 'bg-surface-variant'
              )}
              aria-label="Toggle daily reminder"
              aria-pressed={reminderEnabled}
            >
              <div className={cn(
                'w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-200 shadow-xs',
                reminderEnabled ? 'left-5' : 'left-1'
              )} />
            </button>
          </div>

          {reminderEnabled && (
            <div className="pt-2 border-t border-primary/10 flex items-center justify-between gap-3">
              <label htmlFor="habit-reminder-time" className="text-xs text-on-surface-variant font-medium">Reminder Time</label>
              <input
                id="habit-reminder-time"
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-surface-variant/50 text-on-surface text-sm font-mono border border-primary/10 focus:border-primary outline-none"
              />
            </div>
          )}
        </div>

        {/* Notes */}
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)..."
          maxLength={2000}
          rows={2}
        />

        <div className="flex gap-3 pt-4 border-t border-primary/10">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" disabled={!name.trim()} className="flex-1">
            {editingHabit ? 'Save Changes' : 'Create Habit'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
