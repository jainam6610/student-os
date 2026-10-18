'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Coffee } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  selectedDuration: number
  onSelect: (durationSeconds: number) => void
  onClose: () => void
}

const PRESETS = [
  { label: '15 min', duration: 15 * 60 },
  { label: '25 min', duration: 25 * 60 },
  { label: '50 min', duration: 50 * 60 },
  { label: '90 min', duration: 90 * 60 },
  { label: '2 Hours', duration: 120 * 60 },
  { label: '3 Hours', duration: 180 * 60 },
  { label: 'Custom', duration: -1 },
]

export function FocusPresetSheet({ open, selectedDuration, onSelect, onClose }: Props) {
  const [showCustom, setShowCustom] = useState(false)
  const [customHours, setCustomHours] = useState(1)
  const [customMinutes, setCustomMinutes] = useState(0)

  const handlePreset = (duration: number) => {
    if (duration === -1) {
      const h = Math.floor(selectedDuration / 3600)
      const m = Math.floor((selectedDuration % 3600) / 60)
      setCustomHours(h || 1)
      setCustomMinutes(m || 0)
      setShowCustom(true)
      return
    }
    onSelect(duration)
    setShowCustom(false)
  }

  const handleCustomConfirm = () => {
    const total = Math.max(60, (customHours * 60 + customMinutes) * 60)
    onSelect(total)
    setShowCustom(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-modal-backdrop bg-black/40 backdrop-blur-sm"
          onClick={() => { onClose(); setShowCustom(false) }}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl border-t border-border shadow-2xl p-6 pb-10 safe-bottom"
          >
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-6" />

            {showCustom ? (
              <div>
                <button
                  onClick={() => setShowCustom(false)}
                  className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
                >
                  <span aria-hidden="true">&larr;</span> Back to presets
                </button>
                <h3 className="text-lg font-semibold text-foreground mb-1">Custom Duration</h3>
                <p className="text-sm text-muted-foreground mb-6">Set your focus time</p>

                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => setCustomHours((h) => Math.min(23, h + 1))}
                      className="w-16 min-h-[48px] rounded-xl bg-surface-container-high/50 border border-border/50 flex items-center justify-center text-foreground hover:bg-surface-container-high"
                      aria-label="Increase hours"
                    >
                      <span className="text-lg">+</span>
                    </button>
                    <div className="w-16 h-14 flex items-center justify-center text-2xl font-bold text-foreground tabular-nums">
                      {String(customHours).padStart(2, '0')}
                    </div>
                    <button
                      onClick={() => setCustomHours((h) => Math.max(0, h - 1))}
                      className="w-16 min-h-[48px] rounded-xl bg-surface-container-high/50 border border-border/50 flex items-center justify-center text-foreground hover:bg-surface-container-high"
                      aria-label="Decrease hours"
                    >
                      <span className="text-lg">-</span>
                    </button>
                    <span className="text-xs text-muted-foreground mt-1">Hours</span>
                  </div>

                  <span className="text-2xl text-muted-foreground font-bold mt-[-2rem]">:</span>

                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => setCustomMinutes((m) => Math.min(55, m + 5))}
                      className="w-16 min-h-[48px] rounded-xl bg-surface-container-high/50 border border-border/50 flex items-center justify-center text-foreground hover:bg-surface-container-high"
                      aria-label="Increase minutes"
                    >
                      <span className="text-lg">+</span>
                    </button>
                    <div className="w-16 h-14 flex items-center justify-center text-2xl font-bold text-foreground tabular-nums">
                      {String(customMinutes).padStart(2, '0')}
                    </div>
                    <button
                      onClick={() => setCustomMinutes((m) => Math.max(0, m - 5))}
                      className="w-16 min-h-[48px] rounded-xl bg-surface-container-high/50 border border-border/50 flex items-center justify-center text-foreground hover:bg-surface-container-high"
                      aria-label="Decrease minutes"
                    >
                      <span className="text-lg">-</span>
                    </button>
                    <span className="text-xs text-muted-foreground mt-1">Mins</span>
                  </div>
                </div>

                <motion.button
                  onClick={handleCustomConfirm}
                  whileTap={{ scale: 0.96 }}
                  className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm"
                >
                  Set Duration
                </motion.button>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Set duration</h3>
                <p className="text-sm text-muted-foreground mb-5">How long will you focus?</p>

                <div className="space-y-2 mb-4">
                  <button
                    onClick={() => handlePreset(15 * 60)}
                    className="w-full flex items-center gap-3 py-3.5 px-4 rounded-2xl font-medium text-sm transition-all border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary"
                  >
                    <Coffee className="w-5 h-5 text-primary shrink-0" />
                    <div className="flex-1 text-left">
                      <span className="font-semibold">Reset</span>
                      <span className="text-xs ml-2 opacity-60">15 min breather</span>
                    </div>
                    <span className="tabular-nums">15:00</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {PRESETS.map((preset) => {
                    const isActive = preset.duration === selectedDuration && preset.duration > 0
                    return (
                      <motion.button
                        key={preset.label}
                        onClick={() => handlePreset(preset.duration)}
                        whileTap={{ scale: 0.96 }}
                        className={cn(
                          'py-3.5 px-4 rounded-2xl font-medium text-sm transition-all border',
                          isActive
                            ? 'bg-primary/15 border-primary/40 text-primary'
                            : 'bg-surface-container-high/30 border-border/50 text-muted-foreground hover:text-foreground hover:bg-surface-container-high/50'
                        )}
                      >
                        {preset.label}
                        {isActive && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="block text-[10px] text-primary/60 mt-0.5"
                          >
                            Selected
                          </motion.span>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
