'use client'

import { Component, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  sectionName?: string
}

interface State {
  hasError: boolean
  error?: Error
}

export class ViewErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  handleRefresh = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center" role="alert">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold mb-1 text-foreground">
            {this.props.sectionName 
              ? `${this.props.sectionName} couldn't load`
              : 'Something went wrong'}
          </h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs">
            {this.state.error?.message ?? 'An unexpected error occurred'}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Retry
            </button>
            <button
              type="button"
              onClick={this.handleRefresh}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh app
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export class RootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  handleRefresh = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">Student OS encountered an error</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            The app experienced an unexpected problem. Refreshing should restore your session.
          </p>
          <div className="text-xs text-muted-foreground/60 mb-6 p-3 bg-secondary rounded-lg font-mono overflow-auto max-w-xs">
            {this.state.error?.message ?? 'Unknown error'}
          </div>
          <button
            type="button"
            onClick={this.handleRefresh}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Application
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
