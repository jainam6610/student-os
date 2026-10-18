'use client'

import { RefreshCw, AlertTriangle } from 'lucide-react'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center p-8">
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>
      <h2 className="text-xl font-semibold mb-2 text-foreground">Something went wrong</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        Student OS encountered an unexpected error.
      </p>
      <div className="text-xs text-muted-foreground/60 mb-6 p-3 bg-secondary rounded-lg font-mono overflow-auto max-w-xs">
        {error.message}
      </div>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Try again
      </button>
    </div>
  )
}
