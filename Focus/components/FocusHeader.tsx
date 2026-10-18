'use client'

import { Settings, ShieldAlert } from 'lucide-react'
import { ProfileAvatar } from '@/components/profile-avatar'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface Props {
  userName: string
  onOpenPresets: () => void
  isIdle?: boolean
}

export function FocusHeader({ userName, onOpenPresets, isIdle = true }: Props) {
  const strictFocus = useStore((s) => s.timerSettings?.strictFocus ?? false)
  const setTimerSettings = useStore((s) => s.setTimerSettings)

  const toggleStrict = () => {
    setTimerSettings({ strictFocus: !strictFocus })
  }

  return (
    <header className="flex items-center justify-between px-6 py-6">
      <div className="flex items-center gap-3">
        <ProfileAvatar size="sm" />
        <h1 className="text-[18px] font-medium tracking-tight opacity-80">Focus</h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleStrict}
          disabled={!isIdle}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all min-h-[44px] border',
            strictFocus
              ? 'bg-destructive/15 text-destructive border-destructive/30'
              : 'text-muted-foreground border-border/60',
            isIdle ? 'hover:text-foreground active:scale-95' : 'opacity-40 cursor-not-allowed'
          )}
          title={isIdle ? 'Strict mode: session cannot be resumed once paused' : 'Locked while a session is active'}
          aria-label={`Strict mode ${strictFocus ? 'enabled' : 'disabled'}`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Strict{strictFocus ? ' on' : ''}</span>
        </button>
        <button
          onClick={onOpenPresets}
          className="min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center opacity-80 hover:text-primary transition-colors"
          aria-label="Timer presets"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>
    </header>
  )
}
