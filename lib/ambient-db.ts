'use client'

import Dexie, { type Table } from 'dexie'

export interface AmbientTrack {
  id?: number
  name: string
  blob: Blob
  size: number
  addedAt: number
  mimeType: string
}

const MAX_TRACKS = 20
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

class AmbientDB extends Dexie {
  tracks!: Table<AmbientTrack>

  constructor() {
    super('student-os-ambient')
    this.version(1).stores({
      tracks: '++id, name, addedAt',
      // blob, size, mimeType are stored but not indexed
    })
  }
}

export const ambientDb = new AmbientDB()

// ─── Import helpers ─────────────────────────────────────────

export interface ImportResult {
  added: number
  skipped: number
  errors: string[]
}

/**
 * Import one or more audio files into IndexedDB.
 * Enforces 20-track limit, 50 MB per-file limit, audio MIME check,
 * and duplicate detection (same name + same size = skip).
 */
export async function importAudioFiles(files: FileList | File[]): Promise<ImportResult> {
  const result: ImportResult = { added: 0, skipped: 0, errors: [] }

  let existingCount = 0
  let existingTracks: AmbientTrack[] = []
  try {
    existingCount = await ambientDb.tracks.count()
    existingTracks = await ambientDb.tracks.toArray()
  } catch {
    result.errors.push('Could not access audio storage. Try again.')
    return result
  }

  let currentCount = existingCount

  for (const file of Array.from(files)) {
    // ── Track limit ──
    if (currentCount >= MAX_TRACKS) {
      result.errors.push(`You can store up to ${MAX_TRACKS} ambient tracks.`)
      break
    }

    // ── MIME check ──
    if (!file.type.startsWith('audio/')) {
      result.errors.push(`"${file.name}" is not an audio file.`)
      result.skipped++
      continue
    }

    // ── Size check ──
    if (file.size > MAX_FILE_SIZE) {
      result.errors.push(`"${file.name}" is too large (max 50 MB).`)
      result.skipped++
      continue
    }

    // ── Duplicate detection (same name + same size) ──
    const displayName = stripExtension(file.name)
    const isDuplicate = existingTracks.some(
      (t) => t.name === displayName && t.size === file.size
    )
    if (isDuplicate) {
      result.skipped++
      continue
    }

    // ── Store ──
    try {
      const blob = new Blob([await file.arrayBuffer()], { type: file.type })
      await ambientDb.tracks.add({
        name: displayName,
        blob,
        size: file.size,
        addedAt: Date.now(),
        mimeType: file.type,
      })
      currentCount++
      result.added++
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      if (msg.includes('QuotaExceededError') || msg.includes('quota')) {
        result.errors.push('Device storage is full. Remove some tracks first.')
        break
      }
      result.errors.push(`Failed to import "${file.name}": ${msg}`)
    }
  }

  return result
}

/**
 * Delete a track from IndexedDB by id.
 */
export async function deleteTrack(id: number): Promise<void> {
  await ambientDb.tracks.delete(id)
}

/**
 * Rename a track in IndexedDB.
 */
export async function renameTrack(id: number, newName: string): Promise<void> {
  const trimmed = newName.trim().slice(0, 100)
  if (!trimmed) return
  await ambientDb.tracks.update(id, { name: trimmed })
}

/**
 * Get all tracks (metadata only — excludes blob for efficiency).
 */
export async function getTracksMeta(): Promise<Omit<AmbientTrack, 'blob'>[]> {
  return ambientDb.tracks
    .orderBy('addedAt')
    .toArray()
    .then((tracks) =>
      tracks.map(({ blob: _blob, ...meta }) => meta)
    )
}

/**
 * Get a single track's blob for playback.
 */
export async function getTrackBlob(id: number): Promise<Blob | null> {
  const track = await ambientDb.tracks.get(id)
  return track?.blob ?? null
}

function stripExtension(filename: string): string {
  const dot = filename.lastIndexOf('.')
  return dot > 0 ? filename.slice(0, dot) : filename
}

export { MAX_TRACKS, MAX_FILE_SIZE }
