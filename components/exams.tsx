'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, type Exam } from '@/lib/store'
import { staggerContainer, staggerItem, spring, listItemPop } from './motion'
import { Card } from './ui/glass-card'
import { Modal } from './modal'
import { Button } from './ui/button'
import { Input, Textarea, Select } from './ui/input'
import { useToast } from './ui/toast'
import { format, isToday, isPast, isFuture, differenceInDays, parseISO } from 'date-fns'
import { FileSpreadsheet, Plus, Trash2, Edit3, Pin, Clock, MapPin, AlertTriangle, CheckCircle2, XCircle, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

const PREP_BADGES: Record<Exam['preparationStatus'], { label: string; className: string }> = {
  'not-started': { label: 'Not started', className: 'bg-chart-5/15 text-chart-5' },
  'in-progress': { label: 'In progress', className: 'bg-primary/15 text-primary' },
  'revised': { label: 'Revised', className: 'bg-chart-4/15 text-chart-4' },
  'ready': { label: 'Ready', className: 'bg-success/15 text-success' },
}

const DIFFICULTY_BADGES: Record<Exam['difficulty'], { label: string; className: string }> = {
  'easy': { label: 'Easy', className: 'bg-success/10 text-success' },
  'medium': { label: 'Medium', className: 'bg-chart-5/10 text-chart-5' },
  'hard': { label: 'Hard', className: 'bg-destructive/10 text-destructive' },
}

function getCountdownInfo(examDate: Date): { text: string; className: string } {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const eDate = new Date(examDate)
  eDate.setHours(0, 0, 0, 0)
  const diff = differenceInDays(eDate, now)

  if (isToday(examDate)) return { text: 'Today!', className: 'text-success font-semibold' }
  if (diff < 0) return { text: 'Overdue', className: 'text-destructive font-semibold' }
  if (diff === 0) return { text: 'Today!', className: 'text-success font-semibold' }
  if (diff === 1) return { text: 'Tomorrow', className: 'text-chart-5 font-semibold' }
  return { text: `${diff} days left`, className: 'text-muted-foreground' }
}

function formatExamDate(date: Date, time: string): string {
  const d = format(date, 'MMM d, yyyy')
  if (!time || time === '00:00') return d
  return `${d} at ${time}`
}

export default function ExamsPage() {
  const exams = useStore((s) => s.exams)
  const addExam = useStore((s) => s.addExam)
  const updateExam = useStore((s) => s.updateExam)
  const deleteExam = useStore((s) => s.deleteExam)
  const pinExam = useStore((s) => s.pinExam)
  const { showToast } = useToast()

  const [showModal, setShowModal] = useState(false)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [markingResult, setMarkingResult] = useState<string | null>(null)
  const [resultMarks, setResultMarks] = useState('')

  const subjectColorMap = useMemo(() => {
    return new Map<string, string>()
  }, [])

  const subjectList = useMemo(() => {
    const names = new Set<string>()
    for (const e of exams) if (e.subject) names.add(e.subject)
    return [...names].sort()
  }, [exams])

  const filtered = useMemo(() => {
    let result = exams
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((e) => e.title.toLowerCase().includes(q))
    }
    if (subjectFilter !== 'all') {
      result = result.filter((e) => e.subject === subjectFilter)
    }
    return result
  }, [exams, searchQuery, subjectFilter])

  const { upcoming, todayExams, completed, missed } = useMemo(() => {
    const up: Exam[] = []
    const td: Exam[] = []
    const co: Exam[] = []
    const mi: Exam[] = []

    for (const exam of filtered) {
      if (exam.obtainedMarks !== undefined) {
        co.push(exam)
      } else if (isToday(exam.date)) {
        td.push(exam)
      } else if (isPast(exam.date)) {
        mi.push(exam)
      } else {
        up.push(exam)
      }
    }

    up.sort((a, b) => a.date.getTime() - b.date.getTime())
    td.sort((a, b) => a.time.localeCompare(b.time))
    co.sort((a, b) => b.date.getTime() - a.date.getTime())
    mi.sort((a, b) => b.date.getTime() - a.date.getTime())

    return { upcoming: up, todayExams: td, completed: co, missed: mi }
  }, [filtered])

  const stats = useMemo(() => {
    const total = exams.length
    const completedCount = exams.filter((e) => e.obtainedMarks !== undefined).length
    const withMarks = exams.filter((e) => e.obtainedMarks !== undefined && e.maxMarks > 0)
    const avgScore = withMarks.length > 0
      ? Math.round(withMarks.reduce((sum, e) => sum + (e.obtainedMarks! / e.maxMarks) * 100, 0) / withMarks.length)
      : 0
    return { total, completedCount, avgScore, upcomingCount: upcoming.length + todayExams.length }
  }, [exams, upcoming, todayExams])

  const handleAdd = useCallback((data: Omit<Exam, 'id' | 'createdAt'>) => {
    addExam(data)
    setShowModal(false)
    showToast({ type: 'success', title: 'Exam added', description: data.title })
  }, [addExam, showToast])

  const handleUpdate = useCallback((id: string, data: Partial<Exam>) => {
    updateExam(id, data)
    setEditingExam(null)
    showToast({ type: 'success', title: 'Exam updated' })
  }, [updateExam, showToast])

  const handleDelete = useCallback((id: string) => {
    deleteExam(id)
    setDeleteConfirm(null)
    showToast({ type: 'info', title: 'Exam deleted' })
  }, [deleteExam, showToast])

  const handleMarkResult = useCallback((id: string, obtainedMarks: number) => {
    updateExam(id, { obtainedMarks })
    setMarkingResult(null)
    setResultMarks('')
    showToast({ type: 'success', title: 'Result recorded' })
  }, [updateExam, showToast])

  const openEdit = useCallback((exam: Exam) => {
    setEditingExam(exam)
    setShowModal(true)
  }, [])

  const openAdd = useCallback(() => {
    setEditingExam(null)
    setShowModal(true)
  }, [])

  const getSubjectColor = useCallback((subject: string) => {
    return subjectColorMap.get(subject.toLowerCase()) || 'var(--primary)'
  }, [subjectColorMap])

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4 sm:space-y-5 max-w-full">
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight text-foreground">Exams</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Track your exams and results</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4" /> Add exam
        </Button>
      </motion.div>

      <motion.div variants={staggerItem} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatMini icon={<FileSpreadsheet className="w-4 h-4" />} value={String(stats.total)} label="Total exams" color="primary" />
        <StatMini icon={<Target className="w-4 h-4" />} value={String(stats.upcomingCount)} label="Upcoming" color="warning" />
        <StatMini icon={<CheckCircle2 className="w-4 h-4" />} value={String(stats.completedCount)} label="Completed" color="success" />
        <StatMini icon={<AlertTriangle className="w-4 h-4" />} value={stats.completedCount > 0 ? `${stats.avgScore}%` : '—'} label="Avg score" color="accent" />
      </motion.div>

      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search exams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="sm:w-48">
          <Select
            value={subjectFilter}
            onChange={(e: { target: { value: string } }) => setSubjectFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All subjects' },
              ...subjectList.map((s) => ({ value: s, label: s }))
            ]}
          />
        </div>
      </motion.div>

      <motion.div variants={staggerItem} className="space-y-2">
        <AnimatePresence mode="popLayout">
          {todayExams.length > 0 && (
            <SectionLabel icon={<Clock className="w-3.5 h-3.5 text-success" />} title="Today" count={todayExams.length} />
          )}
          {todayExams.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              subjectColor={getSubjectColor(exam.subject)}
              onEdit={() => openEdit(exam)}
              onDelete={() => setDeleteConfirm(exam.id)}
              markingResult={markingResult === exam.id}
              resultMarks={resultMarks}
              onStartMark={() => { setMarkingResult(exam.id); setResultMarks(String(exam.obtainedMarks ?? '')) }}
              onResultMarksChange={setResultMarks}
              onSaveResult={() => {
                const val = parseInt(resultMarks, 10)
                if (!isNaN(val) && val >= 0) handleMarkResult(exam.id, val)
              }}
              onCancelMark={() => { setMarkingResult(null); setResultMarks('') }}
              pinExam={pinExam}
            />
          ))}

          {upcoming.length > 0 && (
            <SectionLabel icon={<Target className="w-3.5 h-3.5 text-primary" />} title="Upcoming" count={upcoming.length} />
          )}
          {upcoming.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              subjectColor={getSubjectColor(exam.subject)}
              onEdit={() => openEdit(exam)}
              onDelete={() => setDeleteConfirm(exam.id)}
              markingResult={false}
              resultMarks=""
              onStartMark={() => { }}
              onResultMarksChange={() => { }}
              onSaveResult={() => { }}
              onCancelMark={() => { }}
              pinExam={pinExam}
            />
          ))}

          {completed.length > 0 && (
            <SectionLabel icon={<CheckCircle2 className="w-3.5 h-3.5 text-success" />} title="Completed" count={completed.length} />
          )}
          {completed.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              subjectColor={getSubjectColor(exam.subject)}
              onEdit={() => openEdit(exam)}
              onDelete={() => setDeleteConfirm(exam.id)}
              markingResult={false}
              resultMarks=""
              onStartMark={() => { }}
              onResultMarksChange={() => { }}
              onSaveResult={() => { }}
              onCancelMark={() => { }}
              pinExam={pinExam}
            />
          ))}

          {missed.length > 0 && (
            <SectionLabel icon={<XCircle className="w-3.5 h-3.5 text-destructive" />} title="Missed" count={missed.length} />
          )}
          {missed.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              subjectColor={getSubjectColor(exam.subject)}
              onEdit={() => openEdit(exam)}
              onDelete={() => setDeleteConfirm(exam.id)}
              markingResult={markingResult === exam.id}
              resultMarks={resultMarks}
              onStartMark={() => { setMarkingResult(exam.id); setResultMarks(String(exam.obtainedMarks ?? '')) }}
              onResultMarksChange={setResultMarks}
              onSaveResult={() => {
                const val = parseInt(resultMarks, 10)
                if (!isNaN(val) && val >= 0) handleMarkResult(exam.id, val)
              }}
              onCancelMark={() => { setMarkingResult(null); setResultMarks('') }}
              pinExam={pinExam}
            />
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <EmptyExams onAdd={openAdd} hasFilters={searchQuery !== '' || subjectFilter !== 'all'} />
        )}
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <AddExamModal
            subjects={subjectList}
            exam={editingExam}
            onClose={() => { setShowModal(false); setEditingExam(null) }}
            onSave={(data) => {
              if (editingExam) {
                handleUpdate(editingExam.id, data)
              } else {
                handleAdd(data as Omit<Exam, 'id' | 'createdAt'>)
              }
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirm && (
          <DeleteConfirmModal
            examTitle={exams.find((e) => e.id === deleteConfirm)?.title ?? ''}
            onClose={() => setDeleteConfirm(null)}
            onConfirm={() => handleDelete(deleteConfirm)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function SectionLabel({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) {
  return (
    <motion.div
      variants={listItemPop}
      className="flex items-center gap-2 pt-3 pb-1"
    >
      {icon}
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">{title}</span>
      <span className="text-xs text-muted-foreground/40">· {count}</span>
    </motion.div>
  )
}

const ExamCard = function ExamCard({
  exam, subjectColor, onEdit, onDelete, pinExam, markingResult, resultMarks,
  onStartMark, onResultMarksChange, onSaveResult, onCancelMark,
}: {
  exam: Exam
  subjectColor: string
  onEdit: () => void
  onDelete: () => void
  pinExam: (id: string) => void
  markingResult: boolean
  resultMarks: string
  onStartMark: () => void
  onResultMarksChange: (v: string) => void
  onSaveResult: () => void
  onCancelMark: () => void
}) {
  const countdown = getCountdownInfo(exam.date)
  const prepBadge = PREP_BADGES[exam.preparationStatus]
  const diffBadge = DIFFICULTY_BADGES[exam.difficulty]
  const isCompleted = exam.obtainedMarks !== undefined
  const scorePct = isCompleted && exam.maxMarks > 0
    ? Math.round((exam.obtainedMarks! / exam.maxMarks) * 100)
    : null

  return (
    <motion.div variants={listItemPop} layout>
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="w-1 self-stretch rounded-full shrink-0 mt-1"
            style={{ backgroundColor: subjectColor }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{exam.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5" style={{ color: subjectColor }}>{exam.subject}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!isCompleted && (
                  <motion.button
                    onClick={() => pinExam(exam.id)}
                    whileTap={{ scale: 0.9 }}
                    className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                    aria-label={`Pin "${exam.title}"`}
                  >
                    <Pin className={cn('w-3.5 h-3.5', exam.isPinned ? 'text-primary fill-primary' : 'text-muted-foreground')} />
                  </motion.button>
                )}
                <motion.button
                  onClick={onEdit}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                  aria-label={`Edit "${exam.title}"`}
                >
                  <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                </motion.button>
                <motion.button
                  onClick={onDelete}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                  aria-label={`Delete "${exam.title}"`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={cn('text-xs px-2 py-0.5 rounded-md font-medium', countdown.className)}>
                {countdown.text}
              </span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{formatExamDate(exam.date, exam.time)}</span>
              </div>
              {exam.location && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{exam.location}</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className={cn('text-[11px] px-2 py-0.5 rounded-md font-medium', prepBadge.className)}>
                {prepBadge.label}
              </span>
              <span className={cn('text-[11px] px-2 py-0.5 rounded-md font-medium', diffBadge.className)}>
                {diffBadge.label}
              </span>
              <span className="text-[11px] text-muted-foreground/60">
                Max: {exam.maxMarks}
              </span>
              {isCompleted && (
                <span className={cn(
                  'text-[11px] px-2 py-0.5 rounded-md font-medium',
                  (scorePct ?? 0) >= 80 ? 'bg-success/15 text-success' :
                    (scorePct ?? 0) >= 40 ? 'bg-chart-5/15 text-chart-5' :
                      'bg-destructive/15 text-destructive'
                )}>
                  Score: {exam.obtainedMarks}/{exam.maxMarks} ({scorePct}%)
                </span>
              )}
            </div>
            {exam.notes && (
              <p className="text-xs text-muted-foreground/70 mt-2 line-clamp-2">{exam.notes}</p>
            )}
            {markingResult && (
              <div className="flex items-center gap-2 mt-3">
                <Input
                  type="number"
                  min={0}
                  max={exam.maxMarks}
                  value={resultMarks}
                  onChange={(e) => onResultMarksChange(e.target.value)}
                  placeholder={`Marks (0-${exam.maxMarks})`}
                  className="w-32"
                  autoFocus
                />
                <Button size="sm" onClick={onSaveResult} disabled={resultMarks === ''}>Save</Button>
                <Button size="sm" variant="secondary" onClick={onCancelMark}>Cancel</Button>
              </div>
            )}
            {!isCompleted && !markingResult && (isToday(exam.date) || isPast(exam.date)) && (
              <div className="mt-2">
                <Button size="sm" variant="ghost" onClick={onStartMark}>
                  <CheckCircle2 className="w-3 h-3" /> Mark result
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

function StatMini({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <Card className="p-4">
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center mb-2',
        color === 'success' && 'bg-success/10',
        color === 'warning' && 'bg-chart-5/10',
        color === 'primary' && 'bg-primary/10',
        color === 'accent' && 'bg-chart-4/10',
      )}>
        <span className={cn(
          color === 'success' && 'text-success',
          color === 'warning' && 'text-chart-5',
          color === 'primary' && 'text-primary',
          color === 'accent' && 'text-chart-4',
        )}>{icon}</span>
      </div>
      <p className="text-xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  )
}

function EmptyExams({ onAdd, hasFilters }: { onAdd: () => void; hasFilters: boolean }) {
  if (hasFilters) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-14 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-3">
          <FileSpreadsheet className="w-5 h-5 text-primary/30" />
        </div>
        <p className="text-sm text-foreground/70 font-medium">No exams match your search.</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting the filters.</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-14 text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-3">
        <FileSpreadsheet className="w-5 h-5 text-primary/30" />
      </div>
      <p className="text-sm text-foreground/70 font-medium">No exams yet.</p>
      <p className="text-xs text-muted-foreground/60 mt-1">Start tracking your exams to stay prepared.</p>
      <button onClick={onAdd} className="mt-3 px-4 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">Add your first exam</button>
    </motion.div>
  )
}

function DeleteConfirmModal({ examTitle, onClose, onConfirm }: { examTitle: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <Modal open onClose={onClose} title="Delete exam">
      <p className="text-sm text-muted-foreground">
        Are you sure you want to delete <span className="font-medium text-foreground">&ldquo;{examTitle}&rdquo;</span>? This action cannot be undone.
      </p>
      <div className="flex gap-3 pt-4 border-t border-border">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="button" variant="destructive" onClick={onConfirm} className="flex-1">Delete</Button>
      </div>
    </Modal>
  )
}

function AddExamModal({
  subjects, exam, onClose, onSave,
}: {
  subjects: string[]
  exam: Exam | null
  onClose: () => void
  onSave: (data: Partial<Exam> | Omit<Exam, 'id' | 'createdAt'>) => void
}) {
  const isEditing = exam !== null
  const [title, setTitle] = useState(exam?.title ?? '')
  const [subject, setSubject] = useState(exam?.subject ?? (subjects[0] ?? ''))
  const [customSubject, setCustomSubject] = useState('')
  const [useCustomSubject, setUseCustomSubject] = useState(!subjects.includes(exam?.subject ?? ''))
  const [date, setDate] = useState(exam ? format(exam.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))
  const [time, setTime] = useState(exam?.time ?? '')
  const [location, setLocation] = useState(exam?.location ?? '')
  const [maxMarks, setMaxMarks] = useState(String(exam?.maxMarks ?? 100))
  const [preparationStatus, setPreparationStatus] = useState<Exam['preparationStatus']>(exam?.preparationStatus ?? 'not-started')
  const [difficulty, setDifficulty] = useState<Exam['difficulty']>(exam?.difficulty ?? 'medium')
  const [notes, setNotes] = useState(exam?.notes ?? '')
  const [reminder, setReminder] = useState(exam?.reminder ?? false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const finalSubject = useCustomSubject ? customSubject.trim() : subject
    if (!finalSubject) return

    const base = {
      title: title.trim(),
      subject: finalSubject,
      date: parseISO(date),
      time,
      location: location.trim() || undefined,
      maxMarks: parseInt(maxMarks, 10) || 100,
      preparationStatus,
      difficulty,
      notes: notes.trim() || undefined,
      reminder,
    }

    if (isEditing) {
      onSave(base)
    } else {
      onSave(base)
    }
  }

  const subjectOptions = subjects.map((s) => ({ value: s, label: s }))

  return (
    <Modal open onClose={onClose} title={isEditing ? 'Edit exam' : 'New exam'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="exam-title" label="Title" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Midterm Physics Exam" autoFocus maxLength={200} required />

        <div>
          <label className="text-sm font-medium mb-1.5 block">Subject</label>
          <div className="flex items-center gap-2 mb-1.5">
            <button type="button" onClick={() => setUseCustomSubject(false)}
              className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-colors', !useCustomSubject ? 'bg-primary text-primary-foreground' : 'bg-secondary')}>
              Select
            </button>
            <button type="button" onClick={() => setUseCustomSubject(true)}
              className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-colors', useCustomSubject ? 'bg-primary text-primary-foreground' : 'bg-secondary')}>
              Custom
            </button>
          </div>
          {useCustomSubject ? (
            <Input type="text" value={customSubject} onChange={(e) => setCustomSubject(e.target.value)}
              placeholder="Type subject name" />
          ) : (
            <Select
              value={subject}
              onChange={(e: { target: { value: string } }) => setSubject(e.target.value)}
              options={subjects.length === 0 ? [{ value: '', label: 'No subjects yet' }] : subjectOptions}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Input id="exam-date" label="Date" type="date" value={date} onChange={(e: { target: { value: string } }) => setDate(e.target.value)} required />
          </div>
          <div>
            <Input id="exam-time" label="Time" type="time" value={time} onChange={(e: { target: { value: string } }) => setTime(e.target.value)} />
          </div>
        </div>

        <Input id="exam-location" label="Location (optional)" type="text" value={location}
          onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Room 301" />

        <Input id="exam-marks" label="Max marks" type="number" min={1} max={1000} value={maxMarks}
          onChange={(e) => setMaxMarks(e.target.value)} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Select id="exam-preparation" label="Preparation" value={preparationStatus} onChange={(e: { target: { value: string } }) => setPreparationStatus(e.target.value as Exam['preparationStatus'])}
              options={[
                { value: 'not-started', label: 'Not started' },
                { value: 'in-progress', label: 'In progress' },
                { value: 'revised', label: 'Revised' },
                { value: 'ready', label: 'Ready' }
              ]}
            />
          </div>
          <div>
            <Select id="exam-difficulty" label="Difficulty" value={difficulty} onChange={(e: { target: { value: string } }) => setDifficulty(e.target.value as Exam['difficulty'])}
              options={[
                { value: 'easy', label: 'Easy' },
                { value: 'medium', label: 'Medium' },
                { value: 'hard', label: 'Hard' }
              ]}
            />
          </div>
        </div>

        {isEditing && (
          <Input id="exam-obtained" label={`Obtained marks (0-${parseInt(maxMarks, 10) || 100})`} type="number"
            min={0} max={parseInt(maxMarks, 10) || 100}
            value={exam?.obtainedMarks !== undefined ? String(exam.obtainedMarks) : ''}
            onChange={(e) => {
              const val = e.target.value
              onSave({ obtainedMarks: val ? parseInt(val, 10) : undefined })
            }} />
        )}

        <div>
          <label className="text-sm font-medium mb-1.5 block">Notes (optional)</label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Topics to review, formulas, etc." rows={3} />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={reminder} onChange={(e) => setReminder(e.target.checked)}
            className="rounded bg-secondary border-0 text-primary focus:ring-primary" />
          <span className="text-sm text-foreground">Set reminder</span>
        </label>

        <div className="flex gap-3 pt-4 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" disabled={!title.trim() || (!useCustomSubject && subjects.length === 0) || (useCustomSubject && !customSubject.trim())} className="flex-1">
            {isEditing ? 'Save changes' : 'Add exam'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
