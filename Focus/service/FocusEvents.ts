import type { FocusEvent, FocusEventType } from './FocusTypes'

class FocusEventBus {
  private listeners = new Map<FocusEventType, Set<(event: FocusEvent) => void>>()

  on(type: FocusEventType, listener: (event: FocusEvent) => void): () => void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set())
    this.listeners.get(type)!.add(listener)
    return () => this.listeners.get(type)?.delete(listener)
  }

  emit(event: FocusEvent): void {
    this.listeners.get(event.type)?.forEach(l => l(event))
  }

  removeAll(): void {
    this.listeners.clear()
  }
}

export const focusEventBus = new FocusEventBus()
