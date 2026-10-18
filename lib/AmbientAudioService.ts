'use client'

import { getTracksMeta, getTrackBlob, type AmbientTrack } from './ambient-db'

// ─── Types ──────────────────────────────────────────────────

type TrackMeta = Omit<AmbientTrack, 'blob'>

export interface AmbientAudioState {
  isPlaying: boolean
  currentIndex: number
  currentTrackName: string
  trackCount: number
  volume: number
  hasTracks: boolean
}

// ─── Service ────────────────────────────────────────────────

class AmbientAudioService {
  private audio: HTMLAudioElement | null = null
  private objectUrl: string | null = null
  private tracks: TrackMeta[] = []
  private currentIndex = 0
  private _isPlaying = false
  private _volume = 0.6
  private listeners = new Set<() => void>()

  // Fade state
  private fadeRafId: number | null = null
  private fadeCancelled = false

  // Tracks which track id is loaded into the audio element,
  // so fast-resume only unpauses the correct track.
  private srcTrackId: number | null = null

  // ─── Track loading ──────────────────────────────────────

  /** Load track metadata from DB. Call after import/delete/rename. */
  async loadTracks(): Promise<void> {
    try {
      this.tracks = await getTracksMeta()
    } catch {
      this.tracks = []
    }

    // If current index is out of bounds, clamp
    if (this.currentIndex >= this.tracks.length) {
      this.currentIndex = 0
    }
    this.notify()

    // Preload current track blob so play() can call audio.play() without
    // async fetch — required for user-gesture autoplay on Android WebView.
    void this.preloadCurrentTrack()
  }

  /** Preload current track blob into the audio element (no play). */
  private async preloadCurrentTrack(): Promise<void> {
    if (this.tracks.length === 0) return
    const track = this.tracks[this.currentIndex]
    if (!track || track.id == null) return
    try {
      const blob = await getTrackBlob(track.id)
      if (!blob) return
      this.revokeObjectUrl()
      this.objectUrl = URL.createObjectURL(blob)
      if (!this.audio) {
        this.audio = new Audio()
        this.audio.style.display = 'none'
        document.body.appendChild(this.audio)
      }
      this.audio.src = this.objectUrl
      this.audio.volume = 0
      this.audio.loop = false
      this.srcTrackId = track.id
    } catch { /* non-fatal */ }
  }

  // ─── Playback ───────────────────────────────────────────

  async play(): Promise<void> {
    // ponytail: fast resume — if audio is paused with valid src, unpause
    // directly. Re-fetching blob breaks the user-gesture chain on mobile,
    // causing browser autoplay rejection.
    // srcTrackId guard: only fast-resume if the loaded track matches the current one.
    if (this.audio && !this._isPlaying && this.audio.src && !this.audio.ended
        && this.srcTrackId === this.tracks[this.currentIndex]?.id) {
      try {
        await this.audio.play()
        this._isPlaying = true
        this.fadeVolume(0, this._volume, 1500)
        this.notify()
        return
      } catch {
        /* fall through to full reload */
      }
    }

    if (this.tracks.length === 0) return

    const track = this.tracks[this.currentIndex]
    if (!track || track.id == null) return

    try {
      const blob = await getTrackBlob(track.id)
      if (!blob) {
        // Track was deleted from DB — refresh and bail
        await this.loadTracks()
        return
      }

      // ponytail: debug log removed

      // Revoke previous object URL
      this.revokeObjectUrl()

      // Create new object URL
      this.objectUrl = URL.createObjectURL(blob)

      // Create or reuse audio element
      if (!this.audio) {
        this.audio = new Audio()
        this.audio.style.display = 'none'
        document.body.appendChild(this.audio)
      }

      this.audio.src = this.objectUrl
      this.audio.volume = 0 // start at 0 for fade-in
      this.audio.loop = false
      this.srcTrackId = track.id

      // Wire ended event to auto-advance
      this.audio.onended = () => {
        if (this.tracks.length > 1) {
          this.next()
        } else {
          // Single track: stop instead of looping
          this._isPlaying = false
          this.notify()
        }
      }

      // Wire error handler
      this.audio.onerror = () => {
        const code = this.audio?.error?.code ?? 'none'
        const msg = this.audio?.error?.message ?? ''
        console.warn('[AmbientAudio] Playback error for track:', track.name, 'code:', code, 'msg:', msg)
        this._isPlaying = false
        this.notify()
      }

      try {
        await this.audio.play()
      } catch (e) {
        console.warn('[AmbientAudio] play() rejected:', e instanceof Error ? e.message : String(e))
        this._isPlaying = false
        this.notify()
        return
      }

      this._isPlaying = true
      this.notify()

      // Fade in
      this.fadeVolume(0, this._volume, 1500)
    } catch {
      // If anything fails, mark as not playing — never crash Focus
      this._isPlaying = false
      this.notify()
    }
  }

  pause(): void {
    if (!this.audio || !this._isPlaying) return

    this.cancelFade()
    const startVol = this.audio.volume

    // Fade out then pause
    this.fadeVolume(startVol, 0, 800, () => {
      this.audio?.pause()
      this._isPlaying = false
      this.notify()
    })
  }

  next(): void {
    if (this.tracks.length === 0) return

    const wasPlaying = this._isPlaying

    // Advance index (wraps around)
    this.currentIndex = (this.currentIndex + 1) % this.tracks.length
    this.notify()

    if (wasPlaying) {
      // Stop current, play next
      this.cancelFade()
      if (this.audio) {
        this.audio.pause()
        this.audio.onended = null
        this.audio.onerror = null
      }
      this.revokeObjectUrl()
      this._isPlaying = false
      void this.play()
    }
  }

  stop(): void {
    this.cancelFade()

    if (this.audio) {
      this.audio.pause()
      this.audio.onended = null
      this.audio.onerror = null
      this.audio.src = ''
      // Don't set audio = null; reuse element
    }

    this.revokeObjectUrl()
    this._isPlaying = false
    this.notify()
  }

  setVolume(v: number): void {
    this._volume = Math.max(0, Math.min(1, v))
    if (this.audio && this._isPlaying) {
      this.audio.volume = this._volume
    }
    this.notify()
  }

  // ─── State access ───────────────────────────────────────

  getState(): AmbientAudioState {
    return {
      isPlaying: this._isPlaying,
      currentIndex: this.currentIndex,
      currentTrackName: this.tracks[this.currentIndex]?.name ?? '',
      trackCount: this.tracks.length,
      volume: this._volume,
      hasTracks: this.tracks.length > 0,
    }
  }

  // ─── Subscriber pattern ─────────────────────────────────

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }

  private notify(): void {
    this.listeners.forEach((fn) => {
      try {
        fn()
      } catch { /* listener error — non-fatal */ }
    })
  }

  // ─── Helpers ────────────────────────────────────────────

  private revokeObjectUrl(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl)
      this.objectUrl = null
      this.srcTrackId = null
    }
  }

  /**
   * Animate audio volume from `from` to `to` over `durationMs`.
   * Uses requestAnimationFrame for smooth interpolation.
   * Calls `onComplete` when done (if provided).
   */
  private fadeVolume(
    from: number,
    to: number,
    durationMs: number,
    onComplete?: () => void,
  ): void {
    this.cancelFade()
    this.fadeCancelled = false

    const startTime = performance.now()
    const audio = this.audio

    if (!audio) {
      onComplete?.()
      return
    }

    const step = (now: number) => {
      if (this.fadeCancelled || !this.audio) {
        onComplete?.()
        return
      }

      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / durationMs)

      this.audio.volume = from + (to - from) * progress

      if (progress < 1) {
        this.fadeRafId = requestAnimationFrame(step)
      } else {
        this.fadeRafId = null
        onComplete?.()
      }
    }

    this.fadeRafId = requestAnimationFrame(step)
  }

  private cancelFade(): void {
    this.fadeCancelled = true
    if (this.fadeRafId !== null) {
      cancelAnimationFrame(this.fadeRafId)
      this.fadeRafId = null
    }
  }
}

export const ambientAudio = new AmbientAudioService()
