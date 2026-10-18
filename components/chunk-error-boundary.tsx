'use client'

import { Component, type ReactNode } from 'react'
import { RotateCcw, AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  recoveryAttempted: boolean
}

const CHUNK_ERROR_PATTERNS = [
  'ChunkLoadError',
  'Loading chunk',
  'Failed to load chunk',
  'Loading CSS chunk',
  'dynamically imported module',
]

function isChunkError(error: Error): boolean {
  if (error.name === 'ChunkLoadError') return true
  const msg = error.message || ''
  return CHUNK_ERROR_PATTERNS.some((p) => msg.includes(p))
}

async function clearAllCaches(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    if (reg?.active) {
      reg.active.postMessage({ type: 'clear-caches' })
    }
  } catch {}
  if ('caches' in window) {
    try {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    } catch {}
  }
}

const RECOVERY_KEY = 'os-chunk-recovery'

export class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, recoveryAttempted: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      recoveryAttempted: false,
    }
  }

  componentDidCatch(error: Error): void {
    const alreadyAttempted = sessionStorage.getItem(RECOVERY_KEY)
    if (alreadyAttempted) {
      this.setState({ recoveryAttempted: true })
      return
    }

    sessionStorage.setItem(RECOVERY_KEY, 'true')

    if (isChunkError(error)) {
      clearAllCaches()
    }
  }

  handleRetry = async (): Promise<void> => {
    this.setState({ hasError: false, error: null, recoveryAttempted: false })
    try {
      await clearAllCaches()
    } catch {
      // Cache clearing failed — reload will still attempt recovery
    }
    sessionStorage.removeItem(RECOVERY_KEY)
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">
            {this.state.recoveryAttempted
              ? 'Update applied - reload required'
              : 'Something went wrong'}
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            {this.state.recoveryAttempted
              ? 'The app has been updated. Clear the cache and reload to continue.'
              : 'A file failed to load. This can happen after an update.'}
          </p>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Clear cache & reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
