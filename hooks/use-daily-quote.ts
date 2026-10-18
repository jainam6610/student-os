'use client'

import { useState } from 'react'
import { quotes, type Quote } from '@/data/quotes'

const STORAGE_KEY = 'student-os-daily-quote'

interface StoredQuote {
  date: string
  index: number
}

function getTodayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function hashDate(dateKey: string): number {
  let hash = 0
  for (let i = 0; i < dateKey.length; i++) {
    hash = ((hash << 5) - hash) + dateKey.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash) >>> 0
}

function readStored(): StoredQuote | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as StoredQuote
  } catch {
    /* noop */
  }
  return null
}

function writeStored(stored: StoredQuote): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch {
    /* noop */
  }
}

export function useDailyQuote(): Quote {
  const [quote] = useState<Quote>(() => {
    const today = getTodayKey()
    const stored = readStored()
    if (stored && stored.date === today) {
      return quotes[stored.index]
    }
    const index = hashDate(today) % quotes.length
    writeStored({ date: today, index })
    return quotes[index]
  })

  return quote
}