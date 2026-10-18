'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { getPrimaryExam, getCountdown } from '@/lib/exam-countdown'

const GOAL_PREFIXES: [string, string][] = [
  ['iit', 'Future IITian'],
  ['iit bombay', 'Future IITian'],
  ['iit delhi', 'Future IITian'],
  ['iit madras', 'Future IITian'],
  ['iit kanpur', 'Future IITian'],
  ['iit kharagpur', 'Future IITian'],
  ['iit roorkee', 'Future IITian'],
  ['iit guwahati', 'Future IITian'],
  ['neet', 'Future Doctor'],
  ['mbbs', 'Future Doctor'],
  ['medical', 'Future Doctor'],
  ['jee', 'JEE Warrior'],
  ['jee advanced', 'JEE Warrior'],
  ['99%', '99% Incoming'],
  ['scientist', 'Future Scientist'],
  ['research', 'Future Scientist'],
  ['topper', 'Class Topper'],
  ['ai engineer', 'AI Engineer'],
  ['artificial intelligence', 'AI Engineer'],
  ['ca', 'Future CA'],
  ['chartered accountant', 'Future CA'],
  ['upsc', 'Future IAS'],
  ['ias', 'Future IAS'],
  ['civil services', 'Future IAS'],
  ['olympiad', 'Olympiad Medalist'],
  ['gate', 'GATE Topper'],
  ['cat', 'Future IIM'],
  ['mba', 'Future IIM'],
  ['nda', 'Future Officer'],
  ['defence', 'Future Officer'],
]

const MOTIVATIONAL_LINES = [
  'One session at a time.',
  'Consistency creates results.',
  'Your future is built daily.',
  'Small steps. Big outcomes.',
  'Show up. Every day.',
  'Progress over perfection.',
  'You are building something great.',
  'The work adds up.',
]

const RING_CIRCUMFERENCE = 188.5

function formatGoalText(goal: string): string {
  const lower = goal.toLowerCase().trim()
  for (const [keyword, label] of GOAL_PREFIXES) {
    if (lower.includes(keyword)) return label
  }
  return goal
}

export function CinematicIntro({ onComplete }: { onComplete: () => void }) {
  const academicGoal = useStore((s) => s.academicGoal)
  const userName = useStore((s) => s.userName)
  const reducedMotion = useStore((s) => s.reducedMotion)
  const exams = useStore((s) => s.exams ?? [])

  const primaryExam = getPrimaryExam(exams)
  const countdown = primaryExam ? getCountdown(primaryExam.date) : null

  const formattedGoal = academicGoal ? formatGoalText(academicGoal) : ''
  const motivationalLineRef = useRef('')
  const isReturning = useRef(false)

  if (!motivationalLineRef.current) {
    motivationalLineRef.current = MOTIVATIONAL_LINES[Math.floor(Math.random() * MOTIVATIONAL_LINES.length)]
  }
  if (!isReturning.current) {
    try { isReturning.current = sessionStorage.getItem('student-os-intro-seen') === 'true' } catch { }
  }

  const hasGoal = academicGoal.length > 0
  const totalDuration = reducedMotion ? 800 : isReturning.current && !hasGoal ? 1200 : 2000

  const [phase, setPhase] = useState<'enter' | 'visible' | 'exit' | 'done'>('enter')
  const [showSkip, setShowSkip] = useState(false)
  const [showGoal, setShowGoal] = useState(false)
  const [showLine, setShowLine] = useState(false)
  const [ringComplete, setRingComplete] = useState(false)

  const timeline = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const t = setTimeout(() => setPhase('visible'), 50)
    timeline.current.push(t)

    const skipT = setTimeout(() => setShowSkip(true), 600)
    timeline.current.push(skipT)

    if (reducedMotion) {
      const exitT = setTimeout(() => setPhase('exit'), 600)
      timeline.current.push(exitT)
      const doneT = setTimeout(() => setPhase('done'), 800)
      timeline.current.push(doneT)
      return () => timeline.current.forEach(clearTimeout)
    }

    const goalDelay = isReturning.current ? 250 : 450
    const goalT = setTimeout(() => setShowGoal(true), goalDelay)
    timeline.current.push(goalT)

    const lineDelay = isReturning.current && !hasGoal ? 800 : hasGoal ? 1200 : 1000
    const lineT = setTimeout(() => setShowLine(true), lineDelay)
    timeline.current.push(lineT)

    const ringT = setTimeout(() => setRingComplete(true), lineDelay + 400)
    timeline.current.push(ringT)

    const exitT = setTimeout(() => setPhase('exit'), totalDuration - 350)
    timeline.current.push(exitT)

    const doneT = setTimeout(() => setPhase('done'), totalDuration)
    timeline.current.push(doneT)

    try { sessionStorage.setItem('student-os-intro-seen', 'true') } catch { }

    return () => timeline.current.forEach(clearTimeout)
  }, [totalDuration, reducedMotion, hasGoal])

  useEffect(() => {
    if (phase === 'done') onComplete()
  }, [phase, onComplete])

  const skipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSkip = useCallback(() => {
    timeline.current.forEach(clearTimeout)
    setPhase('exit')
  }, [])

  useEffect(() => {
    if (phase === 'exit') {
      skipTimeoutRef.current = setTimeout(() => onComplete(), 300)
      return () => {
        if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current)
      }
    }
  }, [phase, onComplete])

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          key="cinematic-intro"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
          className="fixed inset-0 z-toast flex flex-col items-center justify-center bg-black"
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.10] dark:opacity-[0.15]"
              style={{
                background: 'radial-gradient(circle at center, oklch(0.55 0.25 290), transparent 70%)',
                filter: 'blur(120px)',
                animation: 'ambientDrift 20s ease-in-out infinite alternate',
              }}
            />
            <div
              className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] rounded-full opacity-[0.06] dark:opacity-[0.10]"
              style={{
                background: 'radial-gradient(circle at center, oklch(0.55 0.22 255), transparent 70%)',
                filter: 'blur(140px)',
                animation: 'ambientDrift 25s ease-in-out infinite alternate-reverse',
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: `
                  radial-gradient(ellipse 60% 30% at 50% 15%, oklch(0.45 0.18 270 / 0.08) 0%, transparent 60%),
                  radial-gradient(ellipse 50% 30% at 20% 80%, oklch(0.40 0.14 240 / 0.06) 0%, transparent 60%),
                  radial-gradient(ellipse 50% 30% at 80% 70%, oklch(0.35 0.12 200 / 0.05) 0%, transparent 60%)
                `,
              }}
            />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={phase === 'visible' ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: reducedMotion ? 0.05 : isReturning.current ? 0.15 : 0.25 }}
              className="flex flex-col items-center"
            >
              <motion.div
                className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center mb-4"
                animate={phase === 'visible' ? { scale: [1, 1.04, 1] } : { scale: 0.9 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </motion.div>

              <h1 className="text-base sm:text-lg font-semibold tracking-[0.15em] text-foreground/80">
                STUDENT OS
              </h1>
            </motion.div>

            {/* Goal display */}
            <AnimatePresence>
              {showGoal && hasGoal && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-10 flex flex-col items-center"
                >
                  <p className="text-[11px] text-muted-foreground/40 tracking-wider uppercase mb-2 font-light">
                    Working toward
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground text-center leading-snug">
                    {formattedGoal}
                  </h2>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showGoal && primaryExam && countdown && !countdown.isPast && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-3"
                >
                  <p className="text-muted-foreground/50 tracking-wide text-xs">
                    📅 {countdown.days} day{countdown.days !== 1 ? 's' : ''} until {primaryExam.title}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showGoal && !hasGoal && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-10"
                >
                  <p className="text-sm text-muted-foreground/60 tracking-wide">
                    Ready to learn.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress ring */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={phase === 'visible' ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.5, delay: reducedMotion ? 0 : isReturning.current ? 0.3 : 0.5 }}
              className="mt-12 relative"
            >
              <svg width={64} height={64} viewBox="0 0 64 64" className="rotate-[-90deg]">
                <circle
                  cx={32} cy={32} r={30}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="text-primary/10"
                />
                <motion.circle
                  cx={32} cy={32} r={30}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  className="text-primary/60"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  initial={{ strokeDashoffset: RING_CIRCUMFERENCE }}
                  animate={{ strokeDashoffset: ringComplete ? 0 : RING_CIRCUMFERENCE }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: reducedMotion ? 0 : 0.1 }}
                />
              </svg>
            </motion.div>

            {/* Motivational line */}
            <AnimatePresence>
              {showLine && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="text-xs sm:text-sm text-muted-foreground/40 mt-6 tracking-wide font-light"
                >
                  {motivationalLineRef.current}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Skip button */}
          <AnimatePresence>
            {showSkip && (
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                onClick={handleSkip}
                className="absolute bottom-12 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-lg text-[11px] text-muted-foreground/30 hover:text-muted-foreground/60 hover:bg-secondary/50 transition-all duration-200"
                aria-label="Skip intro"
              >
                Skip
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
