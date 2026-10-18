import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function safeDate(date: unknown): Date | null {
  if (date instanceof Date) {
    return Number.isNaN(date.getTime()) ? null : date
  }
  if (typeof date === 'string' || typeof date === 'number') {
    const parsed = new Date(date)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return null
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function safeParseInt(value: unknown, fallback: number, min?: number, max?: number): number {
  const parsed = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10)
  const clamped = Number.isFinite(parsed) ? parsed : fallback
  if (min !== undefined && clamped < min) return min
  if (max !== undefined && clamped > max) return max
  return clamped
}

export function safeParseFloat(value: unknown, fallback: number, min?: number, max?: number): number {
  const parsed = typeof value === 'number' ? value : parseFloat(String(value ?? ''))
  const clamped = Number.isFinite(parsed) ? parsed : fallback
  if (min !== undefined && clamped < min) return min
  if (max !== undefined && clamped > max) return max
  return clamped
}

export function formatMinutes(minutes: number): string {
  const m = Math.round(minutes)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const remainder = m % 60
  return remainder > 0 ? `${h}h ${remainder}m` : `${h}h`
}

export function safeString(val: unknown, fallback = '', maxLength = 1000): string {
  if (typeof val === 'string') return val.slice(0, maxLength)
  return fallback
}
