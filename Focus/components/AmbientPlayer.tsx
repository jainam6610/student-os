'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, SkipForward, Music2 } from 'lucide-react'
import { useAmbientAudio } from '@/lib/useAmbientAudio'

/**
 * Compact ambient player strip shown in Focus view.
 *
 * Renders nothing when:
 * - ambientSoundEnabled is false
 * - there are zero imported tracks
 *
 * Shows: track name, play/pause, next (when >1 track).
 */
export const AmbientPlayer = memo(function AmbientPlayer() {
  const {
    isPlaying,
    currentTrackName,
    hasTracks,
    trackCount,
    toggle,
    next,
    soundEnabled,
  } = useAmbientAudio()

  if (!soundEnabled || !hasTracks) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25 }}
      className="flex items-center justify-center gap-2.5 py-2 px-4 mt-2 mb-1"
    >
      {/* Music icon */}
      <Music2
        size={13}
        className="text-muted-foreground/50 shrink-0"
        aria-hidden="true"
      />

      {/* Track name */}
      <span
        className="text-[11px] text-muted-foreground/70 truncate max-w-[140px] select-none"
        title={currentTrackName || 'Ambient'}
        aria-label={`Now playing: ${currentTrackName || 'Ambient'}`}
      >
        {currentTrackName || 'Ambient'}
      </span>

      {/* Play / Pause */}
      <button
        onClick={toggle}
        aria-label={isPlaying ? 'Pause ambient sound' : 'Play ambient sound'}
        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full
                   bg-white/5 border border-white/10
                   hover:bg-white/10 active:scale-95
                   transition-all duration-150"
      >
        {isPlaying ? (
          <Pause size={14} className="text-foreground/80" />
        ) : (
          <Play size={14} className="text-foreground/80 ml-0.5" />
        )}
      </button>

      {/* Next track — only when more than 1 track */}
      {trackCount > 1 && (
        <button
          onClick={next}
          aria-label="Next ambient track"
          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full
                     bg-white/5 border border-white/10
                     hover:bg-white/10 active:scale-95
                     transition-all duration-150"
        >
          <SkipForward size={14} className="text-foreground/80" />
        </button>
      )}
    </motion.div>
  )
})
