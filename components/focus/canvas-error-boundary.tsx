'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[CanvasErrorBoundary] decorative canvas failed:', error)
    }
  }

  render() {
    if (this.state.hasError) return null // degrade to no animation
    return this.props.children
  }
}
