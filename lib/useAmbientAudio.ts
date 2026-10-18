'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useStore } from '@/lib/store'
import { ambientAudio, type AmbientAudioState } from '@/lib/AmbientAudioService'

/**
 * React hook bridging AmbientAudioService to component state.
 *
 * - Loads tracks from IndexedDB on mount.
 * - Subscribes to service state changes.
 * - Stops playback when `ambientSoundEnabled` becomes false.
 * - Cleans up subscriptions on unmount.
 */
export function useAmbientAudio() {
  const [state, setState] = useState<AmbientAudioState>(() => ambientAudio.getState())
  const soundEnabled = useStore((s) => s.ambientSoundEnabled)
  const ambientVolume = useStore((s) => s.ambientVolume)
  const mountedRef = useRef(true)

  // Load tracks and subscribe on mount
  useEffect(() => {
    mountedRef.current = true

    ambientAudio.loadTracks().then(() => {
      if (mountedRef.current) {
        setState(ambientAudio.getState())
      }
    })

    const unsub = ambientAudio.subscribe(() => {
      if (mountedRef.current) {
        setState(ambientAudio.getState())
      }
    })

    return () => {
      mountedRef.current = false
      unsub()
    }
  }, [])

  // Sync volume from store to service
  useEffect(() => {
    ambientAudio.setVolume(ambientVolume)
  }, [ambientVolume])

  // Stop audio when user disables ambient sound
  useEffect(() => {
    if (!soundEnabled) {
      ambientAudio.stop()
    }
  }, [soundEnabled])

  const toggle = useCallback(() => {
    if (!soundEnabled) return
    if (state.isPlaying) {
      ambientAudio.pause()
    } else {
      void ambientAudio.play()
    }
  }, [state.isPlaying, soundEnabled])

  const next = useCallback(() => {
    ambientAudio.next()
  }, [])

  const play = useCallback(() => {
    if (!soundEnabled) return
    void ambientAudio.play()
  }, [soundEnabled])

  const pause = useCallback(() => {
    ambientAudio.pause()
  }, [])

  const stop = useCallback(() => {
    ambientAudio.stop()
  }, [])

  const setVolume = useCallback((v: number) => {
    ambientAudio.setVolume(v)
  }, [])

  /** Reload tracks from DB (call after import/delete/rename). */
  const reloadTracks = useCallback(async () => {
    await ambientAudio.loadTracks()
    if (mountedRef.current) {
      setState(ambientAudio.getState())
    }
  }, [])

  return {
    ...state,
    soundEnabled,
    toggle,
    next,
    play,
    pause,
    stop,
    setVolume,
    reloadTracks,
  }
}
