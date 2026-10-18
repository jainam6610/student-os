'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { spring } from './motion'

interface OnboardingLayoutProps {
  title?: string
  subtitle?: string
  currentStep: number
  totalSteps: number
  onBack?: (() => void) | null
  onSkip?: (() => void) | null
  onContinue?: () => void
  canContinue?: boolean
  fullScreen?: boolean
  continueLabel?: string
  children: React.ReactNode
}

export function OnboardingLayout({
  title,
  subtitle,
  currentStep,
  totalSteps,
  onBack,
  onSkip,
  onContinue,
  canContinue = true,
  fullScreen = false,
  continueLabel = 'Continue',
  children,
}: OnboardingLayoutProps) {

  const [viewportHeight, setViewportHeight] = useState(0)

  useEffect(() => {
    setViewportHeight(window.innerHeight)
    const handler = () => {
      setViewportHeight(window.visualViewport?.height ?? window.innerHeight)
    }
    window.visualViewport?.addEventListener('resize', handler)
    return () => window.visualViewport?.removeEventListener('resize', handler)
  }, [])

  const containerStyle: React.CSSProperties = {
    height: viewportHeight > 0 ? viewportHeight : '100dvh',
  }

  const progressPercent = useMemo(() => {
    return ((currentStep + 1) / totalSteps) * 100
  }, [currentStep, totalSteps])

  return (
    <div className="fixed inset-0 z-modal-backdrop bg-background text-foreground flex flex-col" style={containerStyle}>
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative flex flex-col h-full">
        {/* ── Top Progress Bar ── */}
        {!fullScreen && (
          <div className="fixed top-0 left-0 w-full z-50 bg-surface/80 backdrop-blur-md">
            <div className="w-full h-1 bg-surface-container-highest">
              <motion.div
                className="h-full bg-primary shadow-[0_0_12px_rgba(208,188,255,0.3)]"
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            {/* Top App Bar */}
            <div className="flex items-center justify-between px-4 h-14 w-full border-b border-outline-variant/10">
              {onBack ? (
                <button
                  onClick={onBack}
                  className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 active:scale-95 hover:bg-surface-variant/50"
                  aria-label="Go back"
                >
                  <ChevronLeft className="h-5 w-5 text-primary" />
                </button>
              ) : (
                <div className="w-10" />
              )}
              <h1 className="text-lg font-semibold text-primary">Onboarding</h1>
              {onSkip ? (
                <button
                  onClick={onSkip}
                  className="flex items-center justify-center h-10 px-3 text-xs font-semibold tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Skip onboarding"
                >
                  Skip
                </button>
              ) : (
                <div className="w-10" />
              )}
            </div>
          </div>
        )}

        {/* ── Header area (progress dots + title) ── */}
        {!fullScreen && (
          <div className="pt-20 shrink-0">
            {/* Step indicator dots */}
            <div className="flex items-center justify-center gap-1.5 px-5 pb-4">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    width: i === currentStep ? 20 : 6,
                    opacity: i <= currentStep ? 1 : 0.2,
                  }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    'h-1.5 rounded-full',
                    i <= currentStep ? 'bg-primary' : 'bg-muted-foreground/15'
                  )}
                />
              ))}
            </div>

            {/* Title and subtitle */}
            {(title || subtitle) && (
              <div className="px-5 pb-4 text-center">
                {title && (
                  <h2 className="text-[28px] md:text-[32px] font-bold tracking-tight text-foreground leading-tight">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto leading-relaxed">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Content ── */}
        <div className={cn(
          'flex-1 min-h-0',
          fullScreen
            ? 'flex flex-col items-center px-5 overflow-y-auto overscroll-contain py-8'
            : 'overflow-y-auto px-5 overscroll-contain'
        )}>
          {fullScreen ? (
            children
          ) : (
            <div className="max-w-sm mx-auto pb-4">
              {children}
            </div>
          )}
        </div>

        {/* ── Bottom action bar ── */}
        {!fullScreen && (
          <div className="shrink-0 border-t border-outline-variant/10 bg-surface-container/80 backdrop-blur-xl px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))]">
            <div className="flex items-center gap-3 max-w-sm mx-auto">
              {onBack ? (
                <button
                  onClick={onBack}
                  className="flex items-center justify-center gap-1 h-14 px-5 rounded-2xl text-sm font-medium text-foreground bg-surface-container-high hover:bg-surface-variant transition-all active:scale-[0.98] border border-border/40"
                  aria-label="Go back"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              ) : null}

              {onContinue ? (
                <button
                  onClick={onContinue}
                  disabled={!canContinue}
                  className={cn(
                    'h-14 rounded-2xl font-semibold text-base transition-all flex items-center justify-center gap-2 active:scale-[0.98]',
                    'shadow-lg shadow-primary/20',
                    onBack ? 'flex-1' : 'w-full',
                    canContinue
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-surface-container-high text-muted-foreground/50 cursor-not-allowed'
                  )}
                  aria-label={continueLabel}
                >
                  {continueLabel}
                  <ChevronRight className="h-5 w-5" />
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
