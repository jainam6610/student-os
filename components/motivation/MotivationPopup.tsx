import { motion, AnimatePresence } from 'framer-motion'
import { X, Play } from 'lucide-react'
import { useStore } from '@/lib/store'
import { getPrimaryExam, getCountdown, URGENCY_COLORS } from '@/lib/exam-countdown'
import type { MotivationMessage, MotivationCategory } from '@/lib/motivation/messages'
import { cn } from '@/lib/utils'

interface MotivationPopupProps {
  message: MotivationMessage | null
  onDismiss: () => void
  onStartFocus?: () => void
}

// Category → design-system CSS class for accent coloring
const CATEGORY_CLASSES: Record<MotivationCategory, string> = {
  start: 'text-primary',
  grind: 'text-primary',
  streak: 'text-chart-5',
  comeback: 'text-primary',
  exam: 'text-destructive',
  late_night: 'text-info',
  rest: 'text-success',
  win: 'text-warning',
}

// ponytail: fast fade only — no spring, no scale, no radial glow.
// 100ms in, 100ms out. Lightweight on GPU.

export function MotivationPopup({ message, onDismiss, onStartFocus }: MotivationPopupProps) {
  const currentStreak = useStore(s => s.progress?.currentStreak ?? 0)
  const exams = useStore(s => s.exams ?? [])
  const primaryExam = getPrimaryExam(exams)
  const countdown = primaryExam ? getCountdown(primaryExam.date) : null

  const accentClass = message ? CATEGORY_CLASSES[message.category] : ''
  const showExamBlock = primaryExam && countdown && !countdown.isPast && countdown.totalDays <= 30
  const urgencyColor = countdown ? URGENCY_COLORS[countdown.urgency] : null

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          onClick={onDismiss}
          className="fixed inset-0 z-[90] flex items-center justify-center p-5 cursor-pointer select-none bg-background/95 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            onClick={e => e.stopPropagation()}
            className="glass-elevated relative w-full max-w-[430px] max-h-[78vh] overflow-y-auto text-center"
            style={{ padding: '44px 30px 34px', cursor: 'default' }}
          >
            {/* Dismiss X */}
            <button
              onClick={onDismiss}
              aria-label="Dismiss motivation message"
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer bg-secondary text-muted-foreground hover:bg-secondary/80 transition-colors"
            >
              <X size={16} />
            </button>

            {/* Emoji */}
            <div className="text-[64px] leading-none mb-5">
              {message.emoji}
            </div>

            {/* Streak badge */}
            {message.category === 'streak' && currentStreak > 0 && (
              <span className={cn('inline-flex items-center gap-1 text-xs font-bold rounded-full px-3 py-1 mb-3.5 bg-chart-5/15 border border-chart-5/35', 'text-chart-5')}>
                🔥 {currentStreak} day streak
              </span>
            )}

            {/* Exam countdown — promoted to headline when ≤30 days */}
            {showExamBlock && urgencyColor && (
              <div className="mb-4">
                <p className={cn('text-3xl font-bold tabular-nums', urgencyColor.text)}>
                  {countdown.days}
                  <span className="text-sm font-medium ml-1">day{countdown.days !== 1 ? 's' : ''}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  until {primaryExam.title}
                </p>
              </div>
            )}

            {/* Title */}
            <p className="text-2xl font-bold text-foreground leading-tight tracking-tight">
              {message.title}
            </p>
            <p className="text-base text-muted-foreground leading-relaxed mt-3.5 max-w-[330px] mx-auto">
              {message.body}
            </p>

            {/* Actions */}
            {onStartFocus && (
              <button
                onClick={onStartFocus}
                className="min-h-[52px] mt-8 w-full inline-flex items-center justify-center gap-2 rounded-2xl text-base font-bold border-none cursor-pointer transition-opacity hover:opacity-85 bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              >
                <Play size={16} />
                {showExamBlock && countdown.totalDays <= 7
                  ? `Focus → ${countdown.days} day${countdown.days !== 1 ? 's' : ''} left`
                  : 'Start focus'}
              </button>
            )}
            <button
              onClick={onDismiss}
              className="min-h-[48px] mt-2 w-full text-sm font-medium bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
            >
              Dismiss
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
