import { sanitizeString, sanitizeNumber } from '../helpers'
import { MAX_TASKS, MAX_XP } from '../constants'
import { generateId } from '../../utils'
import { calculateLevel } from '../helpers'
import type { Task } from '../types'

export interface TaskSlice {
  tasks: Task[]
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  completeTask: (id: string) => void
}

export const createTaskSlice = (set: any, get: any, _api?: any): TaskSlice => ({
  tasks: (() => {
    const now = Date.now()
    return [
      { id: '1', title: 'Complete Physics Chapter 5', description: 'Review electromagnetic waves and solve practice problems', subject: 'Physics', priority: 'high', status: 'in-progress', dueDate: new Date(now + 2 * 24 * 60 * 60 * 1000), tags: ['exam-prep', 'important'], createdAt: new Date(now) },
      { id: '2', title: 'Math Assignment - Integration', subject: 'Mathematics', priority: 'medium', status: 'todo', dueDate: new Date(now + 3 * 24 * 60 * 60 * 1000), tags: ['homework'], createdAt: new Date(now) },
      { id: '3', title: 'Chemistry Lab Report', subject: 'Chemistry', priority: 'high', status: 'todo', dueDate: new Date(now + 1 * 24 * 60 * 60 * 1000), createdAt: new Date(now) },
    ]
  })(),
  addTask: (task) => set((state: any) => {
    if (state.tasks.length >= MAX_TASKS) return state
    return { tasks: [...state.tasks, { ...task, id: generateId(), title: sanitizeString(task.title, 'Untitled', 500), description: task.description ? sanitizeString(task.description, '', 2000) : undefined, priority: ['low', 'medium', 'high'].includes(task.priority) ? task.priority : 'medium', status: ['todo', 'in-progress', 'done'].includes(task.status) ? task.status : 'todo', createdAt: new Date() }] }
  }),
  updateTask: (id, updates) => set((state: any) => ({
    tasks: state.tasks.map((t: Task) => t.id === id ? { ...t, ...updates, title: updates.title ? sanitizeString(updates.title, t.title, 500) : t.title, priority: updates.priority ? (['low', 'medium', 'high'].includes(updates.priority) ? updates.priority : t.priority) : t.priority, status: updates.status ? (['todo', 'in-progress', 'done'].includes(updates.status) ? updates.status : t.status) : t.status } : t),
  })),
  deleteTask: (id) => set((state: any) => ({ tasks: state.tasks.filter((t: Task) => t.id !== id) })),
  completeTask: (id) => {
    set((state: any) => {
      const task = state.tasks.find((t: Task) => t.id === id)
      if (!task || task.status === 'done') return state
      const xpAmount = task.priority === 'high' ? 50 : task.priority === 'medium' ? 30 : 15
      const newXP = Math.min(state.progress.xp + xpAmount, MAX_XP)
      return {
        tasks: state.tasks.map((t: Task) => t.id === id ? { ...t, status: 'done', completedAt: new Date() } : t),
        progress: { ...state.progress, totalTasksCompleted: state.progress.totalTasksCompleted + 1, xp: newXP, level: calculateLevel(newXP) },
      }
    })
    try { get().checkAchievements() } catch {}
  },
})
