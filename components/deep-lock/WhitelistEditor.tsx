'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { SYSTEM_APPS, COMMON_APPS } from '@/lib/deep-lock/default-whitelist'
import { deepLockPlugin } from '@/lib/deep-lock/plugin'
import { cn } from '@/lib/utils'
import { Shield, BookOpen, UserPlus, Check, X, Smartphone, Plus } from 'lucide-react'

type Category = 'essential' | 'study' | 'user'

const CATEGORIES: { key: Category; label: string; icon: React.ElementType }[] = [
  { key: 'essential', label: 'Always Allowed', icon: Shield },
  { key: 'study', label: 'Study Apps', icon: BookOpen },
  { key: 'user', label: 'Your Apps', icon: UserPlus },
]

export function WhitelistEditor() {
  const whitelistedApps = useStore((s) => s.whitelistedApps)
  const addWhitelistedApp = useStore((s) => s.addWhitelistedApp)
  const removeWhitelistedApp = useStore((s) => s.removeWhitelistedApp)
  const [activeCategory, setActiveCategory] = useState<Category>('study')
  const [customPackage, setCustomPackage] = useState('')
  const [customName, setCustomName] = useState('')

  const isSelected = useCallback(
    (packageName: string) => whitelistedApps.includes(packageName),
    [whitelistedApps]
  )

  const handleToggle = useCallback(
    (packageName: string) => {
      if (isSelected(packageName)) {
        removeWhitelistedApp(packageName)
      } else {
        addWhitelistedApp(packageName)
      }
      // ponytail: read fresh state via getState() — closure value is stale post-mutation (Zustand updates synchronously).
      // Always sync: native merges into its DB, harmless when no session is active.
      deepLockPlugin.updateWhitelist(useStore.getState().whitelistedApps)
    },
    [isSelected, addWhitelistedApp, removeWhitelistedApp]
  )

  const handleAddCustom = useCallback(() => {
    if (!customPackage.trim()) return
    if (!isSelected(customPackage.trim())) {
      addWhitelistedApp(customPackage.trim())
    }
    setCustomPackage('')
    setCustomName('')
    deepLockPlugin.updateWhitelist(useStore.getState().whitelistedApps)
  }, [customPackage, isSelected, addWhitelistedApp])

  return (
    <div className="space-y-4">
      {/* Category tabs */}
      <div className="flex gap-1 bg-secondary/30 rounded-xl p-1">
        {CATEGORIES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all',
              activeCategory === key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Essential apps (informational, not toggleable) */}
      {activeCategory === 'essential' && (
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider px-1">
            These system apps remain accessible during Deep Lock sessions
          </p>
          {SYSTEM_APPS.filter((a) => a.selected).map((app) => (
            <div
              key={app.packageName}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-green-500/5 border border-green-500/10"
            >
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{app.appName}</p>
                <p className="text-[10px] text-muted-foreground/50 truncate font-mono">{app.packageName}</p>
              </div>
              <span className="text-[10px] text-green-500/60 font-medium shrink-0">Always allowed</span>
            </div>
          ))}
        </div>
      )}

      {/* Study apps (toggleable) */}
      {activeCategory === 'study' && (
        <div className="space-y-1 max-h-64 overflow-y-auto no-scrollbar">
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider px-1">
            Toggle study tools and websites you need during sessions
          </p>
          {COMMON_APPS.map((app) => {
            const selected = isSelected(app.packageName)
            return (
              <motion.div
                key={app.packageName}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer',
                  selected
                    ? 'bg-primary/8 border border-primary/20'
                    : 'hover:bg-secondary/30 border border-transparent'
                )}
                onClick={() => handleToggle(app.packageName)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center border shrink-0',
                    selected
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-secondary/30 text-muted-foreground border-border/50'
                  )}>
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className={cn('text-sm font-medium truncate', selected ? 'text-primary' : 'text-foreground')}>
                      {app.appName}
                    </p>
                    <p className="text-[10px] text-muted-foreground/50 truncate font-mono">{app.packageName}</p>
                  </div>
                </div>
                <div className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all',
                  selected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                )}>
                  {selected && <Check className="w-3 h-3 text-white" />}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* User-added apps */}
      {activeCategory === 'user' && (
        <div className="space-y-3">
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider px-1">
            Add custom apps by package name
          </p>

          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="App name (optional)"
                className="w-full px-3 py-2 rounded-xl bg-secondary/30 text-sm text-foreground border border-border/50 placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                type="text"
                value={customPackage}
                onChange={(e) => setCustomPackage(e.target.value)}
                placeholder="com.example.app"
                className="w-full px-3 py-2 rounded-xl bg-secondary/30 text-sm text-foreground border border-border/50 placeholder:text-muted-foreground/40 font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              onClick={handleAddCustom}
              disabled={!customPackage.trim()}
              className="self-end px-4 py-2 rounded-xl bg-primary/20 text-primary text-sm font-medium hover:bg-primary/30 disabled:opacity-30 transition-all min-h-[44px] flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {/* List user-added apps */}
          <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar">
            {whitelistedApps
              .filter((p) => !SYSTEM_APPS.some((s) => s.packageName === p) && !COMMON_APPS.some((c) => c.packageName === p))
              .map((pkg) => (
                <div
                  key={pkg}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-secondary/20 border border-border/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <UserPlus className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{pkg}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle(pkg)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                    aria-label={`Remove ${pkg}`}
                  >
                    <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
            {whitelistedApps.filter((p) => !SYSTEM_APPS.some((s) => s.packageName === p) && !COMMON_APPS.some((c) => c.packageName === p)).length === 0 && (
              <p className="text-xs text-muted-foreground/50 text-center py-4">
                No custom apps added yet
              </p>
            )}
          </div>
        </div>
      )}

      {/* Footer summary */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground/60 pt-2 border-t border-border">
        <span>{whitelistedApps.length} app{whitelistedApps.length !== 1 ? 's' : ''} allowed</span>
        <span>{SYSTEM_APPS.filter((a) => a.selected).length} system essentials</span>
      </div>
    </div>
  )
}
