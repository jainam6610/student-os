'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { type Habit, type HabitCreateInput } from '@/lib/habits/types'
import { getTodayStr, getDueHabits, getCompletedToday, getRemainingToday, shouldHabitBeDoneToday } from '@/lib/habits/utils'
import { computeHabitAnalytics, generateHabitPatterns } from '@/lib/habits/analytics'
import { HabitCard } from './HabitCard'
import { HabitModal } from './HabitModal'
import { HabitStats } from './HabitStats'
import { HabitMatrix } from './HabitMatrix'
import { staggerContainer, staggerItem, spring } from '@/components/motion'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { subMonths, addMonths } from 'date-fns'
import { Activity, Plus, PlusCircle, ChevronRight, CalendarDays, BarChart3, AlertTriangle, Brain, Calendar, List } from 'lucide-react'
import Alarm, { type AlarmEventData } from '@/lib/plugins/alarm-plugin'

export function HabitView() {
  const habits = useStore((s) => s.habits)
  const addHabit = useStore((s) => s.addHabit)
  const updateHabit = useStore((s) => s.updateHabit)
  const deleteHabit = useStore((s) => s.deleteHabit)
  const completeHabit = useStore((s) => s.completeHabit)
  const undoCompleteHabit = useStore((s) => s.undoCompleteHabit)
  const skipHabit = useStore((s) => s.skipHabit)
  const archiveHabit = useStore((s) => s.archiveHabit)
  const restoreHabit = useStore((s) => s.restoreHabit)
  const duplicateHabit = useStore((s) => s.duplicateHabit)
  const toggleHabitDay = useStore((s) => s.toggleHabitDay)
  const { showToast } = useToast()

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('list')
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [ringingAlarmHabitId, setRingingAlarmHabitId] = useState<string | null>(null)

  const today = getTodayStr()

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits])
  const archivedHabits = useMemo(() => habits.filter((h) => h.archived), [habits])

  const analytics = useMemo(() => computeHabitAnalytics(habits), [habits])
  const insights = useMemo(() => generateHabitPatterns(habits), [habits])

  const dueToday = useMemo(() => getDueHabits(habits), [habits])
  const completedToday = useMemo(() => getCompletedToday(habits), [habits])
  const remainingToday = useMemo(() => getRemainingToday(habits), [habits])

  const categories = useMemo(() => {
    const cats = new Set<string>()
    for (const h of activeHabits) {
      if (h.category) cats.add(h.category)
    }
    return ['all', ...Array.from(cats)]
  }, [activeHabits])

  const filteredHabits = useMemo(() => {
    const source = showArchived ? archivedHabits : activeHabits
    if (!selectedCategory || selectedCategory === 'all') return source
    return source.filter((h) => h.category === selectedCategory)
  }, [activeHabits, archivedHabits, showArchived, selectedCategory])

  const handleToggle = useCallback((id: string) => {
    const habit = habits.find((h) => h.id === id)
    if (!habit) return

    if (habit.completedDates.includes(today)) {
      undoCompleteHabit(id, today)
      showToast({ type: 'info', title: 'Habit undone', description: `"${habit.name}" marked as incomplete` })
    } else {
      const curStreak = habit.currentStreak ?? habit.streak ?? 0
      completeHabit(id, today)
      showToast({ type: 'streak', title: `${curStreak + 1} day streak!`, description: `"${habit.name}" completed` })
    }
  }, [habits, today, completeHabit, undoCompleteHabit, showToast])

  const handleToggleDay = useCallback((habitId: string, date: string) => {
    toggleHabitDay(habitId, date)
  }, [toggleHabitDay])

  useEffect(() => {
    let removeListener: (() => void) | undefined
    Alarm.addListener('alarmFired', (data: AlarmEventData) => {
      if (data.habitId) setRingingAlarmHabitId(data.habitId)
    }).then((handle: any) => {
      removeListener = handle.remove ?? handle.removeListener
    }).catch(() => {})
    return () => { removeListener?.() }
  }, [])

  const handleDismissAlarm = useCallback(() => {
    setRingingAlarmHabitId(null)
    Alarm.dismissAlarm().catch(() => {})
  }, [])

  const handleSave = useCallback((input: HabitCreateInput) => {
    if (editingHabit) {
      updateHabit(editingHabit.id, input as any)
      setEditingHabit(null)
      showToast({ type: 'success', title: 'Habit updated', description: `"${input.name}" saved` })
    } else {
      addHabit(input as any)
      setShowAddModal(false)
      showToast({ type: 'success', title: 'Habit created', description: `"${input.name}" added` })
    }
  }, [editingHabit, updateHabit, addHabit, showToast])

  const handleEdit = useCallback((habit: Habit) => {
    setEditingHabit(habit)
  }, [])

  const handleDelete = useCallback((id: string) => {
    setConfirmDeleteId(id)
  }, [])

  const handleArchive = useCallback((id: string) => {
    archiveHabit(id)
    showToast({ type: 'info', title: 'Habit archived', description: 'You can restore it from the archive view.' })
  }, [archiveHabit, showToast])

  const confirmDelete = useCallback(() => {
    if (confirmDeleteId) {
      deleteHabit(confirmDeleteId)
      setConfirmDeleteId(null)
      showToast({ type: 'success', title: 'Habit deleted', description: 'Habit permanently removed.' })
    }
  }, [confirmDeleteId, deleteHabit, showToast])

  const handleDuplicate = useCallback((id: string) => {
    duplicateHabit(id)
    showToast({ type: 'success', title: 'Habit duplicated', description: 'A copy has been created.' })
  }, [duplicateHabit, showToast])

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6 pb-32 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div variants={staggerItem} className="flex justify-between items-end">
        <div>
          <p className="text-primary font-medium tracking-widest text-xs uppercase mb-1">
            {viewMode === 'list' ? 'Management' : 'Monthly View'}
          </p>
          <h2 className="text-2xl font-bold text-on-surface tracking-tight">
            {viewMode === 'list' ? 'Your Habits' : 'Habit Matrix'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'matrix' : 'list')}
            className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 flex items-center gap-1"
            aria-label="Toggle view mode"
          >
            <span className="text-sm" aria-hidden="true">
              {viewMode === 'list' ? <Calendar className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </span>
            {viewMode === 'list' ? 'Monthly' : 'List'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add Habit
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <HabitStats
        currentStreak={analytics.overall.currentStreak}
        longestStreak={analytics.overall.bestStreak}
        completionRate={analytics.overall.completionRate}
        totalHabits={activeHabits.length}
        completedToday={completedToday.length}
        remainingToday={remainingToday.length}
      />

      {/* Patterns */}
      {insights.length > 0 && (
        <motion.div variants={staggerItem} className="glass-panel rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Patterns</span>
          </div>
          <div className="space-y-1.5">
            {insights.slice(0, 3).map((insight, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-on-surface/80">
                <span className="shrink-0">{insight.icon}</span>
                <span>{insight.message}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Category Pills + View Toggle */}
      <motion.div variants={staggerItem} className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat === 'all' ? null : cat)}
            className={cn(
              'whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-all shrink-0',
              (cat === 'all' && !selectedCategory) || selectedCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'glass-panel text-on-surface-variant hover:text-on-surface'
            )}
          >
            {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </motion.div>

      {/* View Content */}
      {viewMode === 'list' ? (
        <>
          {/* Daily Rituals / Active Habits */}
          <motion.div variants={staggerItem} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-on-surface-variant text-xs font-bold uppercase tracking-widest px-1">
                {showArchived ? 'Archived Habits' : 'Daily Rituals'}
              </h3>
              {archivedHabits.length > 0 && (
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className="text-[10px] text-on-surface-variant hover:text-primary transition-colors uppercase tracking-wider"
                >
                  {showArchived ? 'Show Active' : `Show Archived (${archivedHabits.length})`}
                </button>
              )}
            </div>

            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {filteredHabits.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-12 text-center"
                  >
                    <Brain className="w-10 h-10 text-on-surface-variant/30" />
                    <p className="text-sm text-on-surface-variant/70 mt-2">
                      {showArchived ? 'No archived habits' : 'No habits yet — create your first one!'}
                    </p>
                  </motion.div>
                ) : (
                  filteredHabits.map((habit, i) => (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      onToggle={handleToggle}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onArchive={handleArchive}
                      ringingAlarmHabitId={ringingAlarmHabitId}
                      onDismissAlarm={handleDismissAlarm}
                      index={i}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Global Preferences / Settings Card */}
          <motion.div variants={staggerItem} className="space-y-3">
            <h3 className="text-on-surface-variant text-xs font-bold uppercase tracking-widest px-1">Quick Actions</h3>
            <div className="glass-panel rounded-2xl overflow-hidden border border-primary/10">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center justify-between w-full p-4 hover:bg-white/5 cursor-pointer transition-colors border-b border-primary/5"
              >
                <div className="flex items-center gap-4">
                  <PlusCircle className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <p className="font-medium text-on-surface text-sm">Create New Habit</p>
                    <p className="text-xs text-on-surface-variant">Add a new daily ritual to track</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-on-surface-variant" />
              </button>
              <button
                onClick={() => setViewMode('matrix')}
                className="flex items-center justify-between w-full p-4 hover:bg-white/5 cursor-pointer transition-colors border-b border-primary/5"
              >
                <div className="flex items-center gap-4">
                  <CalendarDays className="w-5 h-5 text-tertiary" />
                  <div className="text-left">
                    <p className="font-medium text-on-surface text-sm">Monthly Overview</p>
                    <p className="text-xs text-on-surface-variant">View your habit matrix calendar</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-on-surface-variant" />
              </button>
              <button
                onClick={() => useStore.getState().setActiveView('analytics')}
                className="flex items-center justify-between w-full p-4 hover:bg-white/5 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  <BarChart3 className="w-5 h-5 text-on-surface-variant" />
                  <div className="text-left">
                    <p className="font-medium text-on-surface text-sm">View Analytics</p>
                    <p className="text-xs text-on-surface-variant">Track your habit patterns and progress</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>
          </motion.div>
        </>
      ) : (
        /* Matrix View */
        <HabitMatrix
          habits={activeHabits}
          currentMonth={currentMonth}
          onPrevMonth={() => setCurrentMonth((m) => subMonths(m, 1))}
          onNextMonth={() => setCurrentMonth((m) => addMonths(m, 1))}
          onToggleDay={handleToggleDay}
        />
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <HabitModal
            open={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSave={handleSave}
          />
        )}
        {editingHabit && (
          <HabitModal
            open={!!editingHabit}
            onClose={() => setEditingHabit(null)}
            onSave={handleSave}
            editingHabit={editingHabit}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-modal-backdrop flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setConfirmDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel rounded-xl p-6 max-w-sm w-full space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-error" />
                <h3 className="text-lg font-semibold text-on-surface">Delete Habit</h3>
              </div>
              <p className="text-sm text-on-surface-variant">
                Are you sure you want to delete this habit? This action cannot be undone.
                Consider archiving instead.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-2.5 rounded-xl bg-surface-variant/50 text-on-surface text-sm font-medium hover:bg-surface-variant transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirmDeleteId) archiveHabit(confirmDeleteId)
                    setConfirmDeleteId(null)
                    showToast({ type: 'info', title: 'Habit archived', description: 'Instead of deleting, habit was archived.' })
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-tertiary/20 text-tertiary text-sm font-medium hover:bg-tertiary/30 transition-colors"
                >
                  Archive Instead
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-error/20 text-error text-sm font-medium hover:bg-error/30 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
