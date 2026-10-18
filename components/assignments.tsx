'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, type Assignment } from '@/lib/store'
import { staggerContainer, staggerItem, spring } from './motion'
import { Card } from './ui/glass-card'
import { Modal } from './modal'
import { Button } from './ui/button'
import { Input, Textarea, Select } from './ui/input'
import { useToast } from './ui/toast'
import { format, isPast, isFuture, differenceInDays, parseISO } from 'date-fns'
import { ClipboardList, Plus, Trash2, Edit3, Clock, AlertTriangle, CheckCircle2, XCircle, FileText, Paperclip, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const PRIORITY_STYLES: Record<string, string> = {
  low: 'text-success bg-success/10 border-success/20',
  medium: 'text-warning bg-warning/10 border-warning/20',
  high: 'text-destructive bg-destructive/10 border-destructive/20',
}

const STATUS_STYLES: Record<string, string> = {
  todo: 'border-muted-foreground/30 text-muted-foreground',
  'in-progress': 'border-primary/30 text-primary bg-primary/5',
  submitted: 'border-chart-4/30 text-chart-4 bg-chart-4/5',
  graded: 'border-success/30 text-success bg-success/5',
}

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  submitted: 'Submitted',
  graded: 'Graded',
}

type SortKey = 'deadline' | 'priority' | 'status'

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }
const STATUS_ORDER = { todo: 0, 'in-progress': 1, submitted: 2, graded: 3 }

function getDeadlineLabel(deadline: Date): { text: string; urgent: boolean } {
  const now = new Date()
  const diff = differenceInDays(deadline, now)
  if (diff < 0) return { text: `Overdue by ${Math.abs(diff)}d`, urgent: true }
  if (diff === 0) return { text: 'Due today', urgent: true }
  if (diff === 1) return { text: 'Due tomorrow', urgent: false }
  return { text: `${diff}d left`, urgent: false }
}

function getInitialFormData(assignment?: Assignment | null): Omit<Assignment, 'id' | 'createdAt'> {
  const now = new Date()
  const future = new Date(now)
  future.setDate(future.getDate() + 7)
  if (assignment) {
    return {
      title: assignment.title,
      subject: assignment.subject,
      priority: assignment.priority,
      deadline: assignment.deadline,
      estimatedHours: assignment.estimatedHours,
      status: assignment.status,
      attachments: assignment.attachments.map((a) => ({ ...a })),
      description: assignment.description,
      obtainedMarks: assignment.obtainedMarks,
      maxMarks: assignment.maxMarks,
      completionDate: assignment.completionDate,
    }
  }
  return {
    title: '',
    subject: '',
    priority: 'medium',
    deadline: future,
    estimatedHours: 1,
    status: 'todo',
    attachments: [],
    description: '',
  }
}

export function AssignmentsPage() {
  const assignments = useStore((s) => s.assignments)
  const addAssignment = useStore((s) => s.addAssignment)
  const updateAssignment = useStore((s) => s.updateAssignment)
  const deleteAssignment = useStore((s) => s.deleteAssignment)
  const { showToast } = useToast()

  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | Assignment['status']>('all')
  const [sortKey, setSortKey] = useState<SortKey>('deadline')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [gradingId, setGradingId] = useState<string | null>(null)

  const stats = useMemo(() => {
    const todo = assignments.filter((a) => a.status === 'todo').length
    const inProgress = assignments.filter((a) => a.status === 'in-progress').length
    const submitted = assignments.filter((a) => a.status === 'submitted').length
    const graded = assignments.filter((a) => a.status === 'graded').length
    return { total: assignments.length, todo, inProgress, submitted, graded }
  }, [assignments])

  const filteredAndSorted = useMemo(() => {
    let result = assignments.filter((a) => {
      if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (filterStatus !== 'all' && a.status !== filterStatus) return false
      return true
    })
    return [...result].sort((a, b) => {
      if (sortKey === 'deadline') return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      if (sortKey === 'priority') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    })
  }, [assignments, searchQuery, filterStatus, sortKey])

  const handleAdd = useCallback((data: Omit<Assignment, 'id' | 'createdAt'>) => {
    addAssignment(data)
    setShowAddModal(false)
    showToast({ type: 'success', title: 'Assignment created', description: `"${data.title}" added` })
  }, [addAssignment, showToast])

  const handleEdit = useCallback((data: Omit<Assignment, 'id' | 'createdAt'>) => {
    if (!editingAssignment) return
    updateAssignment(editingAssignment.id, data)
    setEditingAssignment(null)
    showToast({ type: 'success', title: 'Assignment updated' })
  }, [editingAssignment, updateAssignment, showToast])

  const handleDelete = useCallback(() => {
    if (!deletingId) return
    deleteAssignment(deletingId)
    setDeletingId(null)
    showToast({ type: 'success', title: 'Assignment deleted' })
  }, [deletingId, deleteAssignment, showToast])

  const handleMarkSubmitted = useCallback((id: string) => {
    updateAssignment(id, { status: 'submitted', completionDate: new Date() })
    showToast({ type: 'success', title: 'Marked as submitted' })
  }, [updateAssignment, showToast])

  const handleMarkGraded = useCallback((id: string, obtainedMarks: number, maxMarks: number) => {
    updateAssignment(id, { status: 'graded', obtainedMarks, maxMarks })
    setGradingId(null)
    showToast({ type: 'success', title: 'Marked as graded' })
  }, [updateAssignment, showToast])

  const getSubjectColor = useCallback((_name: string): string => {
    return 'var(--primary)'
  }, [])

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4 sm:space-y-5 max-w-full">
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight text-foreground">Assignments</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{stats.total} assignment{stats.total !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" /> Add assignment
        </Button>
      </motion.div>

      <motion.div variants={staggerItem} className="stat-grid">
        <StatCard label="Total" value={stats.total} color="default" />
        <StatCard label="To Do" value={stats.todo} color="muted" />
        <StatCard label="In Progress" value={stats.inProgress} color="primary" />
        <StatCard label="Submitted" value={stats.submitted} color="chart4" />
        <StatCard label="Graded" value={stats.graded} color="success" />
      </motion.div>

      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <ClipboardList className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search assignments..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 h-11 rounded-2xl border-2 border-border/60 bg-surface-container-low text-base font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground/40 touch-target-sm" />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex rounded-xl bg-secondary p-0.5">
            {(['all', 'todo', 'in-progress', 'submitted', 'graded'] as const).map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={cn('px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors touch-target-sm whitespace-nowrap',
                  filterStatus === s ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                {s === 'all' ? 'All' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <select value={sortKey} onChange={(e) => setSortKey(e.currentTarget.value as SortKey)}
            className="px-3 py-2 rounded-xl bg-secondary border-0 focus:ring-1 focus:ring-ring outline-none text-sm text-foreground">
            <option value="deadline">By deadline</option>
            <option value="priority">By priority</option>
            <option value="status">By status</option>
          </select>
        </div>
      </motion.div>

      <motion.div variants={staggerItem} className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredAndSorted.map((a) => (
            <AssignmentCard key={a.id} assignment={a} subjectColor={getSubjectColor(a.subject)}
              onEdit={() => setEditingAssignment(a)}
              onDelete={() => setDeletingId(a.id)}
              onMarkSubmitted={() => handleMarkSubmitted(a.id)}
              onMarkGraded={() => setGradingId(a.id)} />
          ))}
        </AnimatePresence>
        {filteredAndSorted.length === 0 && (
          <EmptyAssignments onAdd={() => setShowAddModal(true)} />
        )}
      </motion.div>

      <AnimatePresence>
        {showAddModal && (
          <AddAssignmentModal
            subjectNames={[...new Set(assignments.map((a) => a.subject).filter(Boolean))] as string[]}
            onClose={() => setShowAddModal(false)}
            onSave={handleAdd} />
        )}
        {editingAssignment && (
          <AddAssignmentModal
            subjectNames={[...new Set(assignments.map((a) => a.subject).filter(Boolean))] as string[]}
            initial={editingAssignment}
            onClose={() => setEditingAssignment(null)}
            onSave={handleEdit} />
        )}
        {gradingId && (
          <GradeModal
            onClose={() => setGradingId(null)}
            onSave={(obtained, max) => handleMarkGraded(gradingId, obtained, max)} />
        )}
        {deletingId && (
          <ConfirmDelete
            onClose={() => setDeletingId(null)}
            onConfirm={handleDelete} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card className="p-4">
      <p className={cn(
        'text-xl font-semibold',
        color === 'primary' && 'text-primary',
        color === 'success' && 'text-success',
        color === 'chart4' && 'text-chart-4',
        color === 'muted' && 'text-muted-foreground',
        color === 'default' && 'text-foreground',
      )}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  )
}

function EmptyAssignments({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="py-14 text-center">
      <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-3">
        <ClipboardList className="w-5 h-5 text-primary/30" />
      </div>
      <p className="text-sm text-foreground/70 font-medium">Stay on top of your deadlines.</p>
      <p className="text-xs text-muted-foreground/60 mt-1">No assignments tracked yet.</p>
      <button onClick={onAdd} className="mt-3 px-4 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
        Create your first assignment
      </button>
    </motion.div>
  )
}

function ConfirmDelete({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  return (
    <Modal open onClose={onClose} title="Delete assignment?">
      <p className="text-sm text-muted-foreground">This action cannot be undone. The assignment and all its data will be permanently removed.</p>
      <div className="flex gap-3 pt-4">
        <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button variant="destructive" onClick={onConfirm} className="flex-1">Delete</Button>
      </div>
    </Modal>
  )
}

function GradeModal({ onClose, onSave }: { onClose: () => void; onSave: (obtained: number, max: number) => void }) {
  const [obtained, setObtained] = useState('')
  const [max, setMax] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const o = parseFloat(obtained)
    const m = parseFloat(max)
    if (isNaN(o) || isNaN(m) || m <= 0) return
    onSave(o, m)
  }

  return (
    <Modal open onClose={onClose} title="Mark as graded">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="obtained-marks" label="Obtained marks" type="number" step="0.1" min="0"
          value={obtained} onChange={(e) => setObtained(e.target.value)} placeholder="e.g., 85" autoFocus required />
        <Input id="max-marks" label="Maximum marks" type="number" step="0.1" min="0.1"
          value={max} onChange={(e) => setMax(e.target.value)} placeholder="e.g., 100" required />
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" disabled={!obtained || !max} className="flex-1">Save grade</Button>
        </div>
      </form>
    </Modal>
  )
}

function AddAssignmentModal({ subjectNames, initial, onClose, onSave }: {
  subjectNames: string[]
  initial?: Assignment | null
  onClose: () => void
  onSave: (data: Omit<Assignment, 'id' | 'createdAt'>) => void
}) {
  const isEditing = !!initial
  const [form, setForm] = useState(getInitialFormData(initial))
  const [customSubject, setCustomSubject] = useState(false)
  const [newAttachName, setNewAttachName] = useState('')
  const [newAttachPath, setNewAttachPath] = useState('')

  const canSubmit = form.title.trim()

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const addAttachment = () => {
    if (!newAttachName.trim() || !newAttachPath.trim()) return
    updateField('attachments', [...form.attachments, { name: newAttachName.trim(), path: newAttachPath.trim() }])
    setNewAttachName('')
    setNewAttachPath('')
  }

  const removeAttachment = (index: number) => {
    updateField('attachments', form.attachments.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    const submission = {
      ...form,
      subject: customSubject || subjectNames.includes(form.subject) ? form.subject : form.subject || 'Other',
    }
    onSave(submission)
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  return (
    <Modal open onClose={onClose} title={isEditing ? 'Edit assignment' : 'New assignment'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="assign-title" label="Title *" type="text" value={form.title}
          onChange={(e) => updateField('title', e.target.value)} placeholder="e.g., Physics Lab Report" autoFocus required />

        <div>
          {customSubject ? (
            <Input id="assign-subject-custom" label="Subject" type="text" value={form.subject}
              onChange={(e) => updateField('subject', e.target.value)} placeholder="Type a subject..." />
          ) : (
            <Select label="Subject" id="assign-subject" value={form.subject}
              onChange={(e) => updateField('subject', e.target.value)}
              options={[
                { value: '', label: 'Select a subject' },
                ...subjectNames.map((n) => ({ value: n, label: n })),
                { value: '__custom__', label: 'Other (type manually)' },
              ]} />
          )}
          <button type="button" onClick={() => { setCustomSubject(!customSubject); if (!customSubject) updateField('subject', '') }}
            className="mt-1 text-xs text-primary hover:underline">
            {customSubject ? 'Choose from list' : 'Type a custom subject'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select label="Priority" id="assign-priority" value={form.priority}
            onChange={(e) => updateField('priority', e.target.value as Assignment['priority'])}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]} />
          <Input id="assign-hours" label="Est. hours" type="number" min="0" step="0.5" value={form.estimatedHours}
            onChange={(e) => updateField('estimatedHours', parseFloat(e.target.value) || 0)} />
        </div>

        <Input id="assign-deadline" label="Deadline *" type="date" value={format(new Date(form.deadline), 'yyyy-MM-dd')}
          onChange={(e) => updateField('deadline', new Date(e.target.value + 'T23:59:00'))} min={todayStr} required />

        <Textarea id="assign-desc" label="Description" value={form.description || ''}
          onChange={(e) => updateField('description', e.target.value)} placeholder="Notes, requirements, links..." rows={3} />

        <div>
          <label className="text-sm font-medium mb-1.5 block">Attachments</label>
          <div className="space-y-2">
            {form.attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 text-xs">
                <Paperclip className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="flex-1 min-w-0 truncate text-foreground">{att.name}</span>
                <span className="text-muted-foreground truncate max-w-[160px]">{att.path}</span>
                <button type="button" onClick={() => removeAttachment(i)} className="p-0.5 rounded hover:bg-destructive/10 text-destructive shrink-0">
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input type="text" value={newAttachName} onChange={(e) => setNewAttachName(e.target.value)}
                placeholder="File name" className="flex-1 min-w-0" />
              <Input type="text" value={newAttachPath} onChange={(e) => setNewAttachPath(e.target.value)}
                placeholder="File path" className="flex-1 min-w-0" />
              <Button type="button" size="sm" variant="secondary" onClick={addAttachment}
                disabled={!newAttachName.trim() || !newAttachPath.trim()}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <Select label="Status" id="assign-status" value={form.status}
          onChange={(e) => updateField('status', e.target.value as Assignment['status'])}
          options={[
            { value: 'todo', label: 'To Do' },
            { value: 'in-progress', label: 'In Progress' },
            { value: 'submitted', label: 'Submitted' },
            { value: 'graded', label: 'Graded' },
          ]} />

        <div className="flex gap-3 pt-4 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" disabled={!canSubmit} className="flex-1">{isEditing ? 'Save changes' : 'Create assignment'}</Button>
        </div>
      </form>
    </Modal>
  )
}

function AssignmentCard({ assignment, subjectColor, onEdit, onDelete, onMarkSubmitted, onMarkGraded }: {
  assignment: Assignment
  subjectColor: string
  onEdit: () => void
  onDelete: () => void
  onMarkSubmitted: () => void
  onMarkGraded: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const deadlineInfo = getDeadlineLabel(assignment.deadline)
  const daysDiff = differenceInDays(new Date(assignment.deadline), new Date())
  const isOverdue = daysDiff < 0 && assignment.status !== 'submitted' && assignment.status !== 'graded'

  return (
    <motion.div layout>
      <Card className={cn('p-4', isOverdue && 'ring-1 ring-destructive/20')}>
        <div className="flex items-start gap-3">
          <div className="w-1 h-10 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: subjectColor }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-foreground truncate">{assignment.title}</span>
              {assignment.subject && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{
                  color: subjectColor,
                  backgroundColor: `${subjectColor}15`,
                }}>{assignment.subject}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded border', PRIORITY_STYLES[assignment.priority])}>
                {assignment.priority}
              </span>
              <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded border', STATUS_STYLES[assignment.status])}>
                {STATUS_LABELS[assignment.status]}
              </span>
              <span className={cn('text-[10px] flex items-center gap-0.5', deadlineInfo.urgent ? 'text-destructive' : 'text-muted-foreground')}>
                <Clock className="w-3 h-3" />
                {deadlineInfo.text}
              </span>
              {assignment.estimatedHours > 0 && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <AlertTriangle className="w-3 h-3" />
                  {assignment.estimatedHours}h
                </span>
              )}
              {assignment.attachments.length > 0 && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Paperclip className="w-3 h-3" />
                  {assignment.attachments.length}
                </span>
              )}
              {assignment.status === 'graded' && assignment.obtainedMarks !== undefined && assignment.maxMarks !== undefined && (
                <span className="text-[10px] font-medium text-success">
                  {assignment.obtainedMarks}/{assignment.maxMarks}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {assignment.status === 'in-progress' && (
              <button onClick={(e) => { e.stopPropagation(); onMarkSubmitted() }}
                className="p-1.5 rounded-lg hover:bg-chart-4/10 text-chart-4 transition-colors touch-target-sm"
                title="Mark as submitted">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            )}
            {assignment.status === 'submitted' && (
              <button onClick={(e) => { e.stopPropagation(); onMarkGraded() }}
                className="p-1.5 rounded-lg hover:bg-success/10 text-success transition-colors touch-target-sm"
                title="Mark as graded">
                <FileText className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); onEdit() }}
              className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors touch-target-sm">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors touch-target-sm">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors touch-target-sm">
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={spring.snappy}
              className="overflow-hidden"
            >
              <div className="pt-3 mt-3 border-t border-border/50 space-y-3">
                {assignment.description && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Description</p>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">{assignment.description}</p>
                  </div>
                )}

                {assignment.attachments.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Attachments ({assignment.attachments.length})</p>
                    <div className="space-y-1">
                      {assignment.attachments.map((att, i) => (
                        <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-secondary/40 text-xs">
                          <Paperclip className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="text-foreground">{att.name}</span>
                          <span className="text-muted-foreground truncate">{att.path}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {assignment.status === 'graded' && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-medium">Grade:</span>
                    <span className="text-sm font-semibold text-success">
                      {assignment.obtainedMarks} / {assignment.maxMarks}
                    </span>
                    {assignment.maxMarks && assignment.obtainedMarks !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        ({((assignment.obtainedMarks / assignment.maxMarks) * 100).toFixed(1)}%)
                      </span>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  {assignment.status !== 'submitted' && assignment.status !== 'graded' && (
                    <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onMarkSubmitted() }}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark submitted
                    </Button>
                  )}
                  {assignment.status === 'submitted' && (
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); onMarkGraded() }}>
                      <FileText className="w-3.5 h-3.5" /> Mark graded
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}
