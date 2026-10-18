import type { Syllabus, SyllabusSubject, SyllabusTopic, SyllabusChapter } from '../types'
import { sanitizeString } from '../helpers'

export interface SyllabusSlice {
  syllabus: Syllabus | null
  setSyllabus: (syllabus: Syllabus | null) => void
  addSyllabusSubject: (name: string) => void
  removeSyllabusSubject: (subjectId: string) => void
  addSyllabusChapter: (subjectId: string, name: string) => void
  removeSyllabusChapter: (subjectId: string, chapterId: string) => void
  toggleSyllabusChapter: (subjectId: string, chapterId: string) => void
  addSyllabusTopic: (subjectId: string, chapterId: string, name: string) => void
  removeSyllabusTopic: (subjectId: string, chapterId: string, topicId: string) => void
  toggleSyllabusTopic: (subjectId: string, chapterId: string, topicId: string) => void
  updateSyllabusSubject: (subjectId: string, updates: Partial<Pick<SyllabusSubject, 'name'>>) => void
  getSyllabusCompletion: () => {
    totalSubjects: number
    completedSubjects: number
    totalChapters: number
    completedChapters: number
    totalTopics: number
    completedTopics: number
    bySubject: Record<string, { total: number; completed: number }>
  }
}

export const createSyllabusSlice = (set: any, get: any, _api?: any): SyllabusSlice => ({
  syllabus: null,

  setSyllabus: (syllabus) => set({ syllabus }),

  addSyllabusSubject: (name) => {
    const { syllabus } = get()
    if (!syllabus) return
    const sanitizedName = sanitizeString(name, 'New Subject', 100)
    if (!sanitizedName.trim()) return
    const newSubject: SyllabusSubject = { id: crypto.randomUUID(), name: sanitizedName, chapters: [] }
    set({ syllabus: { ...syllabus, subjects: [...syllabus.subjects, newSubject] } })
  },

  removeSyllabusSubject: (subjectId) => {
    const { syllabus } = get()
    if (!syllabus) return
    set({ syllabus: { ...syllabus, subjects: syllabus.subjects.filter((s: SyllabusSubject) => s.id !== subjectId) } })
  },

  addSyllabusChapter: (subjectId, name) => {
    const { syllabus } = get()
    if (!syllabus) return
    const sanitizedName = sanitizeString(name, 'New Chapter', 200)
    if (!sanitizedName.trim()) return
    const newChapter: SyllabusChapter = { id: crypto.randomUUID(), name: sanitizedName, topics: [] }
    set({
      syllabus: {
        ...syllabus,
        subjects: syllabus.subjects.map((s: SyllabusSubject) =>
          s.id === subjectId ? { ...s, chapters: [...s.chapters, newChapter] } : s
        ),
      },
    })
  },

  removeSyllabusChapter: (subjectId, chapterId) => {
    const { syllabus } = get()
    if (!syllabus) return
    set({
      syllabus: {
        ...syllabus,
        subjects: syllabus.subjects.map((s: SyllabusSubject) =>
          s.id === subjectId ? { ...s, chapters: s.chapters.filter((c: SyllabusChapter) => c.id !== chapterId) } : s
        ),
      },
    })
  },

  toggleSyllabusChapter: (subjectId, chapterId) => {
    const { syllabus } = get()
    if (!syllabus) return
    set({
      syllabus: {
        ...syllabus,
        subjects: syllabus.subjects.map((s: SyllabusSubject) =>
          s.id === subjectId
            ? {
                ...s,
                chapters: s.chapters.map((c: SyllabusChapter) =>
                  c.id === chapterId
                    ? { ...c, topics: c.topics.map((t: SyllabusTopic) => ({ ...t, completed: !t.completed })) }
                    : c
                ),
              }
            : s
        ),
      },
    })
  },

  addSyllabusTopic: (subjectId, chapterId, name) => {
    const { syllabus } = get()
    if (!syllabus) return
    const sanitizedName = sanitizeString(name, 'New Topic', 200)
    if (!sanitizedName.trim()) return
    const newTopic: SyllabusTopic = { id: crypto.randomUUID(), name: sanitizedName, completed: false }
    set({
      syllabus: {
        ...syllabus,
        subjects: syllabus.subjects.map((s: SyllabusSubject) =>
          s.id === subjectId
            ? { ...s, chapters: s.chapters.map((c: SyllabusChapter) => c.id === chapterId ? { ...c, topics: [...c.topics, newTopic] } : c) }
            : s
        ),
      },
    })
  },

  removeSyllabusTopic: (subjectId, chapterId, topicId) => {
    const { syllabus } = get()
    if (!syllabus) return
    set({
      syllabus: {
        ...syllabus,
        subjects: syllabus.subjects.map((s: SyllabusSubject) =>
          s.id === subjectId
            ? { ...s, chapters: s.chapters.map((c: SyllabusChapter) => c.id === chapterId ? { ...c, topics: c.topics.filter((t: SyllabusTopic) => t.id !== topicId) } : c) }
            : s
        ),
      },
    })
  },

  toggleSyllabusTopic: (subjectId, chapterId, topicId) => {
    const { syllabus } = get()
    if (!syllabus) return
    set({
      syllabus: {
        ...syllabus,
        subjects: syllabus.subjects.map((s: SyllabusSubject) =>
          s.id === subjectId
            ? {
                ...s,
                chapters: s.chapters.map((c: SyllabusChapter) =>
                  c.id === chapterId
                    ? { ...c, topics: c.topics.map((t: SyllabusTopic) => t.id === topicId ? { ...t, completed: !t.completed } : t) }
                    : c
                ),
              }
            : s
        ),
      },
    })
  },

  updateSyllabusSubject: (subjectId, updates) => {
    const { syllabus } = get()
    if (!syllabus) return
    set({
      syllabus: {
        ...syllabus,
        subjects: syllabus.subjects.map((s: SyllabusSubject) =>
          s.id === subjectId ? { ...s, ...updates } : s
        ),
      },
    })
  },

  getSyllabusCompletion: () => {
    const { syllabus } = get()
    if (!syllabus) return { totalSubjects: 0, completedSubjects: 0, totalChapters: 0, completedChapters: 0, totalTopics: 0, completedTopics: 0, bySubject: {} }
    let totalTopics = 0, completedTopics = 0, totalChapters = 0, completedChapters = 0
    const bySubject: Record<string, { total: number; completed: number }> = {}
    for (const subject of syllabus.subjects) {
      let subjectTotal = 0, subjectCompleted = 0
      for (const chapter of subject.chapters) {
        totalChapters++
        const chapterCompleted = chapter.topics.every((t: SyllabusTopic) => t.completed)
        if (chapterCompleted) completedChapters++
        for (const topic of chapter.topics) {
          totalTopics++
          subjectTotal++
          if (topic.completed) {
            completedTopics++
            subjectCompleted++
          }
        }
      }
      bySubject[subject.name] = { total: subjectTotal, completed: subjectCompleted }
    }
    return {
      totalSubjects: syllabus.subjects.length,
      completedSubjects: syllabus.subjects.filter((s: SyllabusSubject) => s.chapters.every((c: SyllabusChapter) => c.topics.length > 0 && c.topics.every((t: SyllabusTopic) => t.completed))).length,
      totalChapters,
      completedChapters,
      totalTopics,
      completedTopics,
      bySubject,
    }
  },
})
