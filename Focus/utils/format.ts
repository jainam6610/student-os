export function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = Math.floor(totalSeconds % 60)
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export { formatMinutes } from '@/lib/utils'

export function getEstimatedEnd(remainingMs: number): string {
  const end = Date.now() + remainingMs
  return new Date(end).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}
