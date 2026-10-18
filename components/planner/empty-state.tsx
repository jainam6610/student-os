'use client'

import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  onPlanDay: () => void
}

export function EmptyState({ onPlanDay }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-3xl mb-4">📅</span>

      <h2 className="text-xl font-semibold text-foreground">Nothing planned yet.</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">Add your first event to see your schedule.</p>

      <Button type="button" onClick={onPlanDay} className="mt-6">
        Add event
      </Button>
    </div>
  )
}
