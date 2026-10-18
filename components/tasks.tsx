'use client'

import { useState, useMemo, memo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, type Task } from '@/lib/store'
import { staggerContainer, staggerItem, spring, listItemPop } from './motion'
import { Card } from './ui/glass-card'
import { Modal } from './modal'
import { useToast } from './ui/toast'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input, Textarea, Select } from './ui/input'
import { format, isToday, isTomorrow, isPast } from 'date-fns'
import {
  Plus, Search, Calendar, CheckCircle2, Circle, Trash2, ChevronDown, Clock, Sparkles, ListChecks,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const PRIORITY_VARIANTS = { high: 'high' as const, medium: 'medium' as const, low: 'low' as const }
const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do', icon: Circle },
  { value: 'in-progress', label: 'In Progress', icon: Clock },
  { value: 'done', label: 'Done', icon: CheckCircle2 },
] as const
const SUBJECTS = ['Physics', 'Mathematics', 'Chemistry', 'Biology', 'English', 'History', 'Computer Science', 'Other']

export function TaskManagement() {
  const tasks = useStore((s) => s.tasks)
  const addTask = useStore((s) => s.addTask)
  const completeTask = useStore((s) => s.completeTask)
  const deleteTask = useStore((s) => s.deleteTask)
  const updateTask = useStore((s) => s.updateTask)
  const { showToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | Task['status']>('all')
  const [filterPriority, setFilterPriority] = useState<'all' | Task['priority']>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority
    return matchesSearch && matchesStatus && matchesPriority
  }), [tasks, searchQuery, filterStatus, filterPriority])

  const tasksByStatus = useMemo(() => ({
    todo: filteredTasks.filter((t) => t.status === 'todo'),
    'in-progress': filteredTasks.filter((t) => t.status === 'in-progress'),
    done: filteredTasks.filter((t) => t.status === 'done'),
  }), [filteredTasks])

  const handleComplete = useCallback((task: Task) => {
    if (task.status === 'done') return
    completeTask(task.id)
    const xpGain = task.priority === 'high' ? 50 : task.priority === 'medium' ? 30 : 15
    showToast({ type: 'xp', title: `+${xpGain} XP`, description: `Completed "${task.title}"` })
  }, [completeTask, showToast])

  const handleAddTask = useCallback((task: Omit<Task, 'id' | 'createdAt'>) => {
    addTask(task)
    setShowAddModal(false)
  }, [addTask])

  const remaining = useMemo(() => tasks.filter((t) => t.status !== 'done').length, [tasks])

  // ponytail: hard cap on rendered rows — swap for real pagination only if
  // tasks ever exceed localStorage-scale data.
  const VISIBLE_LIMIT = 100
  const [visibleLimit, setVisibleLimit] = useState(VISIBLE_LIMIT)

  const visibleTasks = useMemo(() => filteredTasks.slice(0, visibleLimit), [filteredTasks, visibleLimit])
  const visibleByStatus = useMemo(() => ({
    todo: tasksByStatus.todo.slice(0, visibleLimit),
    'in-progress': tasksByStatus['in-progress'].slice(0, visibleLimit),
    done: tasksByStatus.done.slice(0, visibleLimit),
  }), [tasksByStatus, visibleLimit])

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4 sm:space-y-5 max-w-full">
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight text-foreground">Tasks</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{remaining} remaining</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" /> Add task
        </Button>
      </motion.div>

      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} aria-label="Search tasks"
            className="w-full pl-10 pr-4 h-11 rounded-2xl border-2 border-border/60 bg-surface-container-low text-base font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground/40" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-2 flex-1 sm:flex-none">
            <Select value={filterStatus} onChange={(e) => setFilterStatus(e.currentTarget.value as 'all' | Task['status'])}
              options={[{ value: 'all', label: 'All status' }, { value: 'todo', label: 'To Do' }, { value: 'in-progress', label: 'In Progress' }, { value: 'done', label: 'Done' }]} />
            <Select value={filterPriority} onChange={(e) => setFilterPriority(e.currentTarget.value as 'all' | Task['priority'])}
              options={[{ value: 'all', label: 'All priority' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
          </div>
          <div className="flex rounded-xl bg-secondary p-0.5">
            {(['list', 'kanban'] as const).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={cn('px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors touch-target-sm', viewMode === mode ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground')}>
                {mode === 'list' ? 'List' : 'Board'}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {viewMode === 'list' ? (
        <motion.div variants={staggerItem} className="space-y-1">
          <AnimatePresence mode="popLayout">
            {visibleTasks.map((task) => (
              <TaskListItem key={task.id} task={task}
                onComplete={() => handleComplete(task)} onDelete={() => deleteTask(task.id)}
                onUpdate={(updates) => updateTask(task.id, updates)} />
            ))}
          </AnimatePresence>
          {visibleTasks.length === 0 && (
            <EmptyState title="No tasks found" action="Create your first task" onAction={() => setShowAddModal(true)} />
          )}
          {filteredTasks.length > visibleTasks.length && (
            <button
              onClick={() => setVisibleLimit((v) => v + VISIBLE_LIMIT)}
              className="mt-2 text-xs font-medium text-primary hover:underline touch-target"
            >
              Load more ({filteredTasks.length - visibleTasks.length} remaining)
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {STATUS_OPTIONS.map((status) => (
            <div key={status.value} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <status.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{status.label}</span>
                <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                  {tasksByStatus[status.value].length}
                </span>
              </div>
              <div className="space-y-1.5 min-h-[120px] p-2 rounded-xl bg-secondary/30">
                <AnimatePresence mode="popLayout">
                  {visibleByStatus[status.value].map((task) => (
                    <TaskKanbanCard key={task.id} task={task}
                      onComplete={() => handleComplete(task)} onDelete={() => deleteTask(task.id)} />
                  ))}
                </AnimatePresence>
                {tasksByStatus[status.value].length > visibleByStatus[status.value].length && (
                  <button
                    onClick={() => setVisibleLimit((v) => v + VISIBLE_LIMIT)}
                    className="mt-2 text-xs font-medium text-primary hover:underline touch-target"
                  >
                    Load more
                  </button>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {showAddModal && (
          <AddTaskModal onClose={() => setShowAddModal(false)} onAdd={handleAddTask} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function EmptyState({ title, action, onAction }: { title: string; action: string; onAction: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-14 text-center"
    >
      <ListChecks className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
      <p className="text-sm text-foreground/70 font-medium">{title}</p>
      <p className="text-xs text-muted-foreground/60 mt-1 max-w-[220px] mx-auto">One task beats zero. Start here.</p>
      <button onClick={onAction} className="mt-3 px-5 py-2.5 min-h-[44px] rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">{action}</button>
    </motion.div>
  )
}

const TaskListItem = memo(function TaskListItem({ task, onComplete, onDelete, onUpdate }: {
  task: Task; onComplete: () => void; onDelete: () => void; onUpdate: (u: Partial<Task>) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const getDueText = () => {
    if (!task.dueDate) return null
    const date = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate)
    if (Number.isNaN(date.getTime())) return null
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    if (isPast(date)) return 'Overdue'
    return format(date, 'MMM d')
  }
  const dueText = getDueText()
  const getValidDueDate = () => {
    if (!task.dueDate) return null
    const date = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate)
    if (Number.isNaN(date.getTime())) return null
    return date
  }
  const dueDate = getValidDueDate()
  const isOverdue = dueDate && isPast(dueDate) && task.status !== 'done'

  return (
    <motion.div
      variants={listItemPop}
      layout
      className={cn('group', task.status === 'done' && 'opacity-50')}
    >
      <Card className={cn('p-0')}>
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <motion.button
              onClick={onComplete}
              whileTap={{ scale: 0.9 }}
              className="shrink-0 flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full"
              aria-label={`Mark "${task.title}" as complete`}>
              <span className={cn('w-5 h-5 rounded-full border-2 transition-colors', task.status === 'done' ? 'bg-success border-success' : 'border-muted-foreground/30 hover:border-primary')} />
            </motion.button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={cn('text-sm text-foreground truncate', task.status === 'done' && 'line-through text-muted-foreground')}>{task.title}</p>
                <Badge variant={PRIORITY_VARIANTS[task.priority]}>{task.priority}</Badge>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {task.subject && <span className="text-xs text-muted-foreground">{task.subject}</span>}
                {dueText && <span className={cn('text-xs', isOverdue ? 'text-destructive' : 'text-muted-foreground')}>{dueText}</span>}
              </div>
            </div>
            <div className="flex items-center gap-0.5 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
              <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 rounded hover:bg-secondary touch-target-sm" aria-label={isExpanded ? 'Collapse' : 'Expand'}><ChevronDown className={cn('w-3.5 h-3.5 transition-transform', isExpanded && 'rotate-180')} /></button>
              <button onClick={onDelete} className="p-2 rounded hover:bg-destructive/10 text-destructive touch-target-sm" aria-label={`Delete "${task.title}"`}><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-border">
                  {task.description && <p className="text-sm text-muted-foreground mb-2">{task.description}</p>}
                  <div className="flex flex-wrap gap-1">
                    {task.tags?.map((tag) => <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary">#{tag}</span>)}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  )
})

const TaskKanbanCard = memo(function TaskKanbanCard({ task, onComplete, onDelete }: {
  task: Task; onComplete: () => void; onDelete: () => void
}) {
  const getValidDueDate = () => {
    if (!task.dueDate) return null
    const date = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate)
    if (Number.isNaN(date.getTime())) return null
    return date
  }
  const dueDate = getValidDueDate()
  return (
    <motion.div
      variants={listItemPop}
      layout
      className="p-3 rounded-xl bg-card border border-border/60 group"
      whileHover={{ y: -1 }}
      transition={spring.snappy}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-foreground">{task.title}</p>
        <Badge variant={PRIORITY_VARIANTS[task.priority]}>
          {task.priority}
        </Badge>
      </div>
      {task.subject && <p className="text-xs text-muted-foreground mt-1">{task.subject}</p>}
      {dueDate && (
        <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          {format(dueDate, 'MMM d')}
        </div>
      )}
      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/40 opacity-0 group-hover:opacity-100 transition-opacity">
        {task.status !== 'done' && (
          <button onClick={onComplete} className="text-[10px] text-success hover:text-success/80 font-medium">Complete</button>
        )}
        <button onClick={onDelete} className="text-[10px] text-destructive hover:text-destructive/80 font-medium ml-auto">Delete</button>
      </div>
    </motion.div>
  )
})

function AddTaskModal({ onClose, onAdd }: { onClose: () => void; onAdd: (task: Omit<Task, 'id' | 'createdAt'>) => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState('')
  const [priority, setPriority] = useState<Task['priority']>('medium')
  const [dueDate, setDueDate] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({ title: title.trim(), description, subject, priority, status: 'todo', dueDate: dueDate ? new Date(dueDate) : undefined })
  }

  return (
    <Modal open onClose={onClose} title="Add task">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="task-title" label="Title" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?" autoFocus maxLength={200} />
        <Textarea id="task-desc" label="Description" value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="Add more details..." rows={3} maxLength={1000} />
        <div className="grid grid-cols-2 gap-3">
          <Select id="task-subject" label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)}
            options={[{ value: '', label: 'Select' }, ...SUBJECTS.map((s) => ({ value: s, label: s }))]} />
          <Select id="task-priority" label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as Task['priority'])}
            options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />
        </div>
        <Input id="task-due" label="Due date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" disabled={!title.trim()} className="flex-1">Add task</Button>
        </div>
      </form>
    </Modal>
  )
}
