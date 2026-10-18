'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { Sparkles } from 'lucide-react'

interface LaunchIntroProps {
  onComplete: () => void
}

const INTRO_DURATION = 2000 // 2 seconds
const SKIP_DELAY = 800 // Allow skip after 800ms

export function LaunchIntro({ onComplete }: LaunchIntroProps) {
  const academicGoal = useStore((s) => s.academicGoal)
  const userName = useStore((s) => s.userName)
  const reducedMotion = useStore((s) => s.reducedMotion)

  const [phase, setPhase] = useState<'enter' | 'visible' | 'exit'>('enter')
  const [progress, setProgress] = useState(0)
  const [showSkip, setShowSkip] = useState(false)
  const [canSkip, setCanSkip] = useState(false)

  // Shorten duration if reduced motion
  const duration = reducedMotion ? 1000 : INTRO_DURATION

  const handleSkip = useCallback(() => {
    if (!canSkip) return
    setPhase('exit')
    setTimeout(onComplete, 300)
  }, [canSkip, onComplete])

  useEffect(() => {
    // Phase progression
    const enterTimer = setTimeout(() => setPhase('visible'), 50)
    const skipTimer = setTimeout(() => {
      setShowSkip(true)
      setCanSkip(true)
    }, SKIP_DELAY)
    const exitTimer = setTimeout(() => setPhase('exit'), duration - 400)
    const completeTimer = setTimeout(onComplete, duration)

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (100 / (duration / 50))
        return next >= 100 ? 100 : next
      })
    }, 50)

    return () => {
      clearTimeout(enterTimer)
      clearTimeout(skipTimer)
      clearTimeout(exitTimer)
      clearTimeout(completeTimer)
      clearInterval(progressInterval)
    }
  }, [duration, onComplete])

  // Keyboard skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        handleSkip()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSkip])

  const getMotivationalLine = () => {
    if (!academicGoal) return 'Your future is built daily.'
    const lines = [
      'One session at a time.',
      'Consistency creates results.',
      'Your future is built daily.',
      'Every day counts.',
      'Progress over perfection.',
      'Building your tomorrow, today.',
    ]
    // Deterministic selection based on goal
    const index = academicGoal.length % lines.length
    return lines[index]
  }

  const getGoalDisplay = () => {
    if (!academicGoal || academicGoal.trim() === '') {
      return `Building ${userName}'s Future`
    }
    // Format goal for display
    const goal = academicGoal.trim()
    if (goal.length < 20) {
      return goal
    }
    return goal.slice(0, 20) + '...'
  }

  return (
    <AnimatePresence>
      {phase !== 'exit' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-background"
          onClick={handleSkip}
        >
          {/* Ambient background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.15, scale: 1 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/30 to-transparent blur-[120px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.12, scale: 1 }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-blue-500/20 to-transparent blur-[100px]"
            />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center px-6 max-w-md mx-auto text-center">
            {/* Logo/Title */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.6,
                delay: 0.3,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mb-8"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <motion.div
                  initial={{ rotate: -180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.4,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <Sparkles className="w-6 h-6 text-primary" />
                </motion.div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Student OS
                </h1>
              </div>
            </motion.div>

            {/* Academic Goal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.7,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mb-8"
            >
              <div className="inline-block px-6 py-3 rounded-2xl bg-primary/10 border border-primary/20 backdrop-blur-sm">
                <p className="text-lg font-semibold text-foreground">
                  {getGoalDisplay()}
                </p>
              </div>
            </motion.div>

            {/* Progress Ring */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.6,
                delay: 1.0,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mb-8"
            >
              <div className="relative w-32 h-32">
                {/* Background ring */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-muted-foreground/20"
                  />
                  {/* Progress ring */}
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="text-primary"
                    initial={{ strokeDashoffset: 283 }}
                    animate={{ strokeDashoffset: 283 - (283 * progress) / 100 }}
                    transition={{ duration: 0.1, ease: 'linear' }}
                    style={{
                      strokeDasharray: 283,
                    }}
                  />
                </svg>
                {/* Center glow */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 0.6, scale: 1 }}
                  transition={{
                    duration: 0.8,
                    delay: 1.2,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/20 blur-xl" />
                </motion.div>
              </div>
            </motion.div>

            {/* Motivational Line */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 1.4,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <p className="text-sm text-muted-foreground font-medium">
                {getMotivationalLine()}
              </p>
            </motion.div>
          </div>

          {/* Skip hint */}
          <AnimatePresence>
            {showSkip && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
              >
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Tap to skip
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
