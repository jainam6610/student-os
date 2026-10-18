'use client'

import { useCallback, useMemo, useState } from 'react'

export type OnboardingStep =
  | 'welcome'
  | 'profile'
  | 'goals'
  | 'exam-setup'
  | 'motivation'
  | 'permissions'
  | 'finish'

export const ONBOARDING_STEPS: OnboardingStep[] = [
  'welcome',
  'profile',
  'goals',
  'exam-setup',
  'motivation',
  'permissions',
  'finish',
]

export const TOTAL_ONBOARDING_STEPS = ONBOARDING_STEPS.length

export function useOnboardingNavigation() {
  const [stepIndex, setStepIndex] = useState(0)
  const [direction, setDirection] = useState(1)

  const step = ONBOARDING_STEPS[stepIndex]
  const progress = ((stepIndex + 1) / TOTAL_ONBOARDING_STEPS) * 100
  const isFirst = stepIndex === 0
  const isLast = stepIndex === ONBOARDING_STEPS.length - 1

  const goToStep = useCallback((nextIndex: number) => {
    setDirection(nextIndex > stepIndex ? 1 : -1)
    setStepIndex(Math.max(0, Math.min(nextIndex, ONBOARDING_STEPS.length - 1)))
  }, [stepIndex])

  const goNext = useCallback(() => {
    if (!isLast) goToStep(stepIndex + 1)
  }, [goToStep, isLast, stepIndex])

  const goBack = useCallback(() => {
    if (!isFirst) goToStep(stepIndex - 1)
  }, [goToStep, isFirst, stepIndex])

  return useMemo(() => ({
    step,
    stepIndex,
    direction,
    progress,
    isFirst,
    isLast,
    goNext,
    goBack,
    goToStep,
  }), [step, stepIndex, direction, progress, isFirst, isLast, goNext, goBack, goToStep])
}
