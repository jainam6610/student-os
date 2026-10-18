'use client'

import { Brain, Clock3, Flame, Timer } from 'lucide-react'

import type { PlannerDailyAnalytics, PlannerWeeklyAnalytics } from '@/lib/planner/analytics'
import { formatMinutes } from '@/lib/utils'
import { Card } from '@/components/ui/glass-card'

interface AnalyticsCardProps {
  daily: PlannerDailyAnalytics
  weekly: PlannerWeeklyAnalytics
}

export function AnalyticsCard({ daily, weekly }: AnalyticsCardProps) {
  return (
    <Card className="rounded-3xl p-4">
      <div className="mb-4 flex items-center gap-2">
        <Brain className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Planner Analytics</h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Metric icon={<Clock3 className="h-4 w-4" />} label="Planned" value={formatMinutes(daily.totalPlannedTime)} />
        <Metric icon={<Timer className="h-4 w-4" />} label="Focus Time" value={formatMinutes(daily.focusTime)} />
        <Metric icon={<Flame className="h-4 w-4" />} label="Consistency" value={`${weekly.consistency}%`} />
        <Metric icon={<Brain className="h-4 w-4" />} label="Top Subject" value={daily.mostStudiedSubject ?? '—'} />
      </div>

      <div className="mt-4 space-y-2">
        {weekly.recoverySuggestions.slice(0, 2).map((suggestion) => (
          <div key={suggestion} className="rounded-2xl bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
            {suggestion}
          </div>
        ))}
      </div>
    </Card>
  )
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary/60 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-base font-semibold text-foreground">{value}</div>
    </div>
  )
}
