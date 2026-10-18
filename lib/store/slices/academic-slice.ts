import { format } from 'date-fns'
import { sanitizeString, sanitizeNumber, sanitizeBoolean, sanitizeDate } from '../helpers'
import { MAX_EXAMS, MAX_ASSIGNMENTS } from '../constants'
import { generateId } from '../../utils'
import type { Exam, Assignment } from '../types'

export interface AcademicSlice {
  exams: Exam[]
  addExam: (exam: Omit<Exam, 'id' | 'createdAt'>) => void
  updateExam: (id: string, updates: Partial<Exam>) => void
  deleteExam: (id: string) => void
  pinExam: (id: string) => void
  assignments: Assignment[]
  addAssignment: (assignment: Omit<Assignment, 'id' | 'createdAt'>) => void
  updateAssignment: (id: string, updates: Partial<Assignment>) => void
  deleteAssignment: (id: string) => void
}

export const createAcademicSlice = (set: any, _get?: any, _api?: any): AcademicSlice => ({
  exams: [],
  addExam: (exam) => set((state: any) => {
    if (state.exams.length >= MAX_EXAMS) return state
    const dup = state.exams.some((e: Exam) =>
      e.title.toLowerCase() === exam.title.toLowerCase() &&
      e.subject === exam.subject &&
      format(e.date, 'yyyy-MM-dd') === format(sanitizeDate(exam.date) ?? new Date(), 'yyyy-MM-dd')
    )
    if (dup) return state
    return {
      exams: [...state.exams, {
        ...exam, id: generateId(),
        title: sanitizeString(exam.title, 'Exam', 200),
        subject: sanitizeString(exam.subject, '', 100),
        date: sanitizeDate(exam.date) ?? new Date(),
        time: sanitizeString(exam.time, '00:00', 10),
        location: exam.location ? sanitizeString(exam.location, '', 200) : undefined,
        maxMarks: sanitizeNumber(exam.maxMarks, 100, 1, 1000),
        obtainedMarks: sanitizeNumber(exam.obtainedMarks, undefined as unknown as number, 0, exam.maxMarks) || undefined,
        preparationStatus: ['not-started', 'in-progress', 'revised', 'ready'].includes(exam.preparationStatus as string) ? exam.preparationStatus : 'not-started',
        difficulty: ['easy', 'medium', 'hard'].includes(exam.difficulty as string) ? exam.difficulty : 'medium',
        notes: exam.notes ? sanitizeString(exam.notes, '', 2000) : undefined,
        reminder: sanitizeBoolean(exam.reminder, false),
        createdAt: new Date(),
      }],
    }
  }),
  updateExam: (id, updates) => set((state: any) => ({
    exams: state.exams.map((e: Exam) => e.id === id ? { ...e, ...updates, date: updates.date ? sanitizeDate(updates.date) ?? e.date : e.date, title: updates.title ? sanitizeString(updates.title, e.title, 200) : e.title } : e),
  })),
  deleteExam: (id) => set((state: any) => ({ exams: state.exams.filter((e: Exam) => e.id !== id) })),
  pinExam: (id) => set((state: any) => ({
    exams: state.exams.map((e: Exam) => ({
      ...e,
      isPinned: e.id === id ? !e.isPinned : false
    }))
  })),

  assignments: [],
  addAssignment: (assignment) => set((state: any) => {
    if (state.assignments.length >= MAX_ASSIGNMENTS) return state
    return {
      assignments: [...state.assignments, {
        ...assignment, id: generateId(),
        title: sanitizeString(assignment.title, 'Assignment', 200),
        subject: sanitizeString(assignment.subject, '', 100),
        priority: ['low', 'medium', 'high'].includes(assignment.priority as string) ? assignment.priority : 'medium',
        deadline: sanitizeDate(assignment.deadline) ?? new Date(),
        estimatedHours: sanitizeNumber(assignment.estimatedHours, 1, 0.5, 200),
        status: ['todo', 'in-progress', 'submitted', 'graded'].includes(assignment.status as string) ? assignment.status : 'todo',
        attachments: Array.isArray(assignment.attachments) ? assignment.attachments : [],
        createdAt: new Date(),
      }],
    }
  }),
  updateAssignment: (id, updates) => set((state: any) => ({
    assignments: state.assignments.map((a: Assignment) => a.id === id ? { ...a, ...updates } : a),
  })),
  deleteAssignment: (id) => set((state: any) => ({ assignments: state.assignments.filter((a: Assignment) => a.id !== id) })),
})
