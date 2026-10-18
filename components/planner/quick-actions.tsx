'use client'

import { CalendarClock, Plus, WandSparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface QuickActionsProps {
  onAdd: () => void
  onSleepSettings: () => void
  onCarryForwardReview: () => void
}

export function QuickActions({ onAdd, onSleepSettings, onCarryForwardReview }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" onClick={onAdd}>
        <Plus className="h-4 w-4" />
        Plan My Day
      </Button>
      <Button type="button" variant="secondary" onClick={onSleepSettings}>
        <CalendarClock className="h-4 w-4" />
        Sleep Settings
      </Button>
      <Button type="button" variant="ghost" onClick={onCarryForwardReview}>
        <WandSparkles className="h-4 w-4" />
        Recovery Suggestions
      </Button>
    </div>
  )
}
