'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight, CheckCircle2, Circle, Plus, Trash2, GraduationCap, Sparkles, BookOpen } from 'lucide-react'
import { useStore } from '@/lib/store'
import { getPresetSyllabus, PRESET_TYPES } from '@/data/syllabus-presets'
import type { SyllabusSubject, SyllabusChapter } from '@/lib/store/types'

function ChapterSection({ chapter, subjectId }: { chapter: SyllabusChapter; subjectId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const toggleTopic = useStore(s => s.toggleSyllabusTopic)
  const removeTopic = useStore(s => s.removeSyllabusTopic)
  const addTopic = useStore(s => s.addSyllabusTopic)
  const toggleChapter = useStore(s => s.toggleSyllabusChapter)
  const removeChapter = useStore(s => s.removeSyllabusChapter)
  const [showAdd, setShowAdd] = useState(false)
  const [newTopic, setNewTopic] = useState('')

  const completedCount = useMemo(() => chapter.topics.filter(t => t.completed).length, [chapter.topics])
  const allDone = chapter.topics.length > 0 && completedCount === chapter.topics.length

  const handleAdd = useCallback(() => {
    if (newTopic.trim()) {
      addTopic(subjectId, chapter.id, newTopic.trim())
      setNewTopic('')
      setShowAdd(false)
    }
  }, [newTopic, subjectId, chapter.id, addTopic])

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="ml-3 border-l-2 border-border/50 pl-3 mb-2"
    >
      <div className="flex items-center gap-2 group">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 flex-1 py-1.5 text-left min-h-[36px]"
        >
          {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
          <span className="text-xs font-medium text-foreground truncate">{chapter.name}</span>
          <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
            {completedCount}/{chapter.topics.length}
          </span>
        </button>
        <button
          onClick={() => toggleChapter(subjectId, chapter.id)}
          className="p-1 rounded-md hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100 shrink-0"
          title={allDone ? 'Unmark all' : 'Mark all'}
        >
          {allDone ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Circle className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </button>
        <button
          onClick={() => removeChapter(subjectId, chapter.id)}
          className="p-1 rounded-md hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
        </button>
      </div>

      {chapter.topics.length > 0 && (
        <div className="h-1 rounded-full bg-secondary overflow-hidden mb-1">
          <div className="h-full rounded-full bg-green-500 transition-all duration-300" style={{ width: `${chapter.topics.length > 0 ? (completedCount / chapter.topics.length) * 100 : 0}%` }} />
        </div>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {chapter.topics.map(topic => (
              <div key={topic.id} className="flex items-center gap-2 group/topic py-0.5">
                <button
                  onClick={() => toggleTopic(subjectId, chapter.id, topic.id)}
                  className="flex items-center gap-2 flex-1 py-1.5 text-left min-h-[32px]"
                >
                  {topic.completed ? (
                    <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="w-3 h-3 text-muted-foreground shrink-0" />
                  )}
                  <span className={`text-[11px] ${topic.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {topic.name}
                  </span>
                </button>
                <button
                  onClick={() => removeTopic(subjectId, chapter.id, topic.id)}
                  className="p-0.5 rounded-md hover:bg-destructive/10 transition-colors opacity-0 group-hover/topic:opacity-100 shrink-0"
                >
                  <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}

            {showAdd ? (
              <div className="flex gap-1 mt-1">
                <input
                  autoFocus
                  value={newTopic}
                  onChange={e => setNewTopic(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAdd(false) }}
                  placeholder="Topic name..."
                  className="flex-1 px-2 py-1 text-[11px] rounded-md bg-secondary border border-border focus:outline-none focus:ring-1 focus:ring-primary/50 min-h-[28px]"
                />
                <button onClick={handleAdd} className="px-2 py-1 text-[11px] bg-primary text-primary-foreground rounded-md min-h-[28px]">Add</button>
                <button onClick={() => setShowAdd(false)} className="px-2 py-1 text-[11px] text-muted-foreground rounded-md hover:bg-secondary min-h-[28px]">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 py-1 min-h-[28px]">
                <Plus className="w-3 h-3" /> Add topic
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function SubjectCard({ subject }: { subject: SyllabusSubject }) {
  const [isOpen, setIsOpen] = useState(false)
  const removeSubject = useStore(s => s.removeSyllabusSubject)
  const addChapter = useStore(s => s.addSyllabusChapter)
  const [showAdd, setShowAdd] = useState(false)
  const [newChapter, setNewChapter] = useState('')

  const totalTopics = useMemo(() => subject.chapters.reduce((sum, c) => sum + c.topics.length, 0), [subject.chapters])
  const completedTopics = useMemo(() => subject.chapters.reduce((sum, c) => sum + c.topics.filter(t => t.completed).length, 0), [subject.chapters])
  const completedChapters = useMemo(() => subject.chapters.filter(c => c.topics.length > 0 && c.topics.every(t => t.completed)).length, [subject.chapters])

  const handleAdd = useCallback(() => {
    if (newChapter.trim()) {
      addChapter(subject.id, newChapter.trim())
      setNewChapter('')
      setShowAdd(false)
    }
  }, [newChapter, subject.id, addChapter])

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border rounded-xl bg-card p-3"
    >
      <div className="flex items-center gap-2 group">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 flex-1 text-left min-h-[40px]"
        >
          {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground truncate">{subject.name}</span>
              {totalTopics > 0 && completedTopics === totalTopics && (
                <Sparkles className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {completedChapters}/{subject.chapters.length} chapters &middot; {completedTopics}/{totalTopics} topics
            </span>
          </div>
          {totalTopics > 0 && (
            <span className="text-xs font-semibold text-primary shrink-0">
              {Math.round((completedTopics / totalTopics) * 100)}%
            </span>
          )}
        </button>
        <button
          onClick={() => removeSubject(subject.id)}
          className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
        </button>
      </div>

      {totalTopics > 0 && (
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden mt-2">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(completedTopics / totalTopics) * 100}%` }} />
        </div>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-1">
              {subject.chapters.map(chapter => (
                <ChapterSection key={chapter.id} chapter={chapter} subjectId={subject.id} />
              ))}
            </div>

            {showAdd ? (
              <div className="flex gap-1 mt-2 ml-6">
                <input
                  autoFocus
                  value={newChapter}
                  onChange={e => setNewChapter(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAdd(false) }}
                  placeholder="Chapter name..."
                  className="flex-1 px-2 py-1.5 text-xs rounded-md bg-secondary border border-border focus:outline-none focus:ring-1 focus:ring-primary/50 min-h-[36px]"
                />
                <button onClick={handleAdd} className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md min-h-[36px]">Add</button>
                <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-xs text-muted-foreground rounded-md hover:bg-secondary min-h-[36px]">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 mt-2 ml-6 min-h-[36px]">
                <Plus className="w-3.5 h-3.5" /> Add chapter
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function SyllabusView() {
  const syllabus = useStore(s => s.syllabus)
  const setSyllabus = useStore(s => s.setSyllabus)
  const addSubject = useStore(s => s.addSyllabusSubject)
  const getSyllabusCompletion = useStore(s => s.getSyllabusCompletion)
  const [showSetup, setShowSetup] = useState(false)
  const [customName, setCustomName] = useState('')
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')

  const completion = useMemo(() => syllabus ? getSyllabusCompletion() : null, [syllabus, getSyllabusCompletion])

  const handleSelectPreset = useCallback((type: string) => {
    const preset = getPresetSyllabus(type)
    if (preset) { setSyllabus(preset); setShowSetup(false) }
  }, [setSyllabus])

  const handleCustomSyllabus = useCallback(() => {
    if (!customName.trim()) return
    setSyllabus({ id: crypto.randomUUID(), name: customName.trim(), examType: 'custom', subjects: [], createdAt: new Date() })
    setCustomName('')
    setShowSetup(false)
  }, [customName, setSyllabus])

  const handleAddSubject = useCallback(() => {
    if (newSubjectName.trim()) { addSubject(newSubjectName.trim()); setNewSubjectName(''); setShowAddSubject(false) }
  }, [newSubjectName, addSubject])

  if (!syllabus) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Set Up Your Syllabus</h2>
            <p className="text-sm text-muted-foreground">Track your progress across subjects, chapters, and topics.</p>
          </div>

          {!showSetup ? (
            <div className="space-y-3">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowSetup(true)} className="w-full py-4 px-4 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center gap-3 min-h-[56px]">
                <BookOpen className="w-5 h-5" />
                Choose a Preset
              </motion.button>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <p className="text-xs text-muted-foreground mb-3">Select your exam:</p>
              {PRESET_TYPES.map(preset => (
                <motion.button key={preset.value} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleSelectPreset(preset.value)} className="w-full py-3 px-4 rounded-xl border border-border bg-card hover:bg-secondary text-foreground font-medium text-sm text-left min-h-[48px]">
                  {preset.label}
                </motion.button>
              ))}
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Or create custom:</p>
                <div className="flex gap-2">
                  <input value={customName} onChange={e => setCustomName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCustomSyllabus()} placeholder="Syllabus name..." className="flex-1 px-3 py-2 text-sm rounded-lg bg-secondary border border-border focus:outline-none focus:ring-1 focus:ring-primary/50 min-h-[40px]" autoFocus />
                  <motion.button whileTap={{ scale: 0.95 }} onClick={handleCustomSyllabus} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium min-h-[40px]">Create</motion.button>
                </div>
              </div>
              <button onClick={() => setShowSetup(false)} className="w-full py-2 text-xs text-muted-foreground hover:text-foreground min-h-[36px]">Back</button>
            </motion.div>
          )}
        </motion.div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">{syllabus.name}</h2>
          <p className="text-xs text-muted-foreground">
            {completion ? `${completion.totalSubjects} subjects &middot; ${completion.totalChapters} chapters &middot; ${completion.totalTopics} topics` : 'Loading...'}
          </p>
        </div>
        <div className="flex gap-1">
          {completion && completion.totalTopics > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
              {Math.round((completion.completedTopics / completion.totalTopics) * 100)}%
            </div>
          )}
        </div>
      </div>

      {completion && completion.totalTopics > 0 && (
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(completion.completedTopics / completion.totalTopics) * 100}%` }} />
        </div>
      )}

      <div className="space-y-3">
        {syllabus.subjects.map(subject => (
          <SubjectCard key={subject.id} subject={subject} />
        ))}
      </div>

      {showAddSubject ? (
        <div className="flex gap-2">
          <input autoFocus value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddSubject(); if (e.key === 'Escape') setShowAddSubject(false) }} placeholder="Subject name..." className="flex-1 px-3 py-2 text-sm rounded-lg bg-secondary border border-border focus:outline-none focus:ring-1 focus:ring-primary/50 min-h-[44px]" />
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleAddSubject} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium min-h-[44px]">Add</motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAddSubject(false)} className="px-4 py-2 text-sm text-muted-foreground rounded-lg hover:bg-secondary min-h-[44px]">Cancel</motion.button>
        </div>
      ) : (
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowAddSubject(true)} className="w-full py-3 rounded-xl border border-dashed border-border text-muted-foreground text-sm flex items-center justify-center gap-2 hover:bg-secondary/50 min-h-[48px]">
          <Plus className="w-4 h-4" /> Add Subject
        </motion.button>
      )}
    </div>
  )
}
