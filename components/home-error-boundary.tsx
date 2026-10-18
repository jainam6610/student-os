'use client'

import { Component, Fragment, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  retryKey: number
}

export class HomeErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, retryKey: 0 }

  static getDerivedStateFromError(): Pick<State, 'hasError'> {
    return { hasError: true }
  }

  componentDidCatch(error: Error): void {
    if (process.env.NODE_ENV === 'development') {
      console.error('[HomeErrorBoundary] Home render failed.', error)
    }
  }

  handleRetry = (): void => {
    this.setState((state) => ({ hasError: false, retryKey: state.retryKey + 1 }))
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center" role="alert">
          <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your study data is safe. Try reopening Home.</p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      )
    }

    return <Fragment key={this.state.retryKey}>{this.props.children}</Fragment>
  }
}
