'use client'

import { lazy, Suspense } from 'react'

const BrainCanvas = lazy(() =>
  import('@/components/focus/focus-brain-canvas').then((m: any) => ({ default: m.FocusBrainCanvas }))
)

export function FocusBrainCanvas() {
  return (
    <Suspense fallback={null}>
      <BrainCanvas />
    </Suspense>
  )
}
