'use client'

import { useState, useEffect, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { deepLockPlugin } from '@/lib/deep-lock/plugin'
import { ArrowLeft, BugPlay, RotateCcw } from 'lucide-react'

interface SessionSnap {
  sessionId?: string
  status?: string
  startTime?: number
  endTime?: number
  plannedDuration?: number
  totalPausedDuration?: number
  version?: number
  remainingMs?: number
  actualDurationMs?: number
  streak?: number
}

function fmt(ms: number): string {
  if (!ms || ms <= 0) return '0s'
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const r = s % 60
  return r > 0 ? `${m}m ${r}s` : `${m}m`
}

function Row({ label, value }: { label: string; value: string | number | undefined | null }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-border/20">
      <span className="text-xs text-muted-foreground/70">{label}</span>
      <span className="text-xs font-mono text-foreground/90">{value ?? '—'}</span>
    </div>
  )
}

export function DiagnosticScreen() {
  const setActiveView = useStore((s) => s.setActiveView)
  const [snap, setSnap] = useState<SessionSnap | null>(null)
  const [monoTime, setMonoTime] = useState<{ elapsedRealtime: number; currentTimeMillis: number } | null>(null)
  const [log, setLog] = useState<string[]>([])

  const addLog = useCallback((msg: string) => {
    setLog((prev) => [...prev.slice(-99), `${new Date().toLocaleTimeString()} ${msg}`])
  }, [])

  const refresh = useCallback(async () => {
    try {
      const state = await deepLockPlugin.getSessionState()
      if (state.hasActiveSession) {
        setSnap({
          sessionId: state.sessionId,
          status: state.status,
          startTime: state.startTime,
          endTime: state.endTime,
          plannedDuration: state.plannedDuration,
          totalPausedDuration: state.totalPausedDuration,
          version: state.version,
          remainingMs: state.remainingMs,
          actualDurationMs: state.actualDurationMs,
          streak: state.streak,
        })
      } else {
        setSnap(null)
      }
    } catch {}
    try { setMonoTime(await deepLockPlugin.getMonotonicClock()) } catch {}
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 2000)
    return () => clearInterval(interval)
  }, [refresh])

  return (
    <div className="min-h-dvh bg-background safe-bottom">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/10">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => setActiveView('settings')}
            className="min-h-[44px] min-w-[44px] flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Settings
          </button>
          <h1 className="text-sm font-semibold text-foreground">Session Debug</h1>
          <button
            onClick={refresh}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {snap ? (
          <div className="rounded-2xl border border-border/20 bg-card/50 p-4 space-y-0">
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full ${
                snap.status === 'running' ? 'bg-emerald-400 animate-pulse' :
                snap.status === 'paused' ? 'bg-amber-400' : 'bg-muted-foreground'
              }`} />
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80">{snap.status}</span>
              <span className="text-[10px] text-muted-foreground/50 ml-auto">v{snap.version}</span>
            </div>
            <Row label="Session ID" value={snap.sessionId?.slice(0, 8)} />
            <Row label="Start Time" value={snap.startTime ? new Date(snap.startTime).toLocaleTimeString() : undefined} />
            <Row label="End Time" value={snap.endTime ? new Date(snap.endTime).toLocaleTimeString() : undefined} />
            <Row label="Planned Duration" value={snap.plannedDuration ? fmt(snap.plannedDuration) : undefined} />
            <Row label="Remaining" value={snap.remainingMs !== undefined ? fmt(snap.remainingMs) : undefined} />
            <Row label="Paused Total" value={snap.totalPausedDuration ? fmt(snap.totalPausedDuration) : undefined} />
            <Row label="Actual Duration" value={snap.actualDurationMs ? fmt(snap.actualDurationMs) : undefined} />
            <Row label="Streak" value={snap.streak} />
          </div>
        ) : (
          <div className="rounded-2xl border border-border/10 bg-card/30 p-8 text-center">
            <BugPlay className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground/60">No active session</p>
          </div>
        )}

        {monoTime && (
          <div className="rounded-2xl border border-border/20 bg-card/50 p-4 space-y-0">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Clock</h3>
            <Row label="currentTimeMillis" value={monoTime.currentTimeMillis.toLocaleString()} />
            <Row label="elapsedRealtime" value={monoTime.elapsedRealtime.toLocaleString()} />
            <Row label="Drift" value={snap?.startTime && monoTime.currentTimeMillis ? (
              `${Math.round(((monoTime.currentTimeMillis - snap.startTime) - (monoTime.elapsedRealtime - 0)) / (monoTime.elapsedRealtime || 1) * 1000)}ms`
            ) : undefined} />
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={async () => {
              addLog('Force completing...')
              try { await deepLockPlugin.forceComplete(); addLog('Complete OK') } catch (e: any) { addLog(`Error: ${e.message}`) }
              refresh()
            }}
            className="flex-1 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-colors"
          >
            Force Complete
          </button>
          <button
            onClick={async () => {
              addLog('Force stopping...')
              try { await deepLockPlugin.forceStop(); addLog('Stop OK') } catch (e: any) { addLog(`Error: ${e.message}`) }
              refresh()
            }}
            className="flex-1 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-colors"
          >
            Force Stop
          </button>
          <button
            onClick={async () => {
              addLog('Refreshing...')
              await refresh()
              addLog('Refreshed')
            }}
            className="flex-1 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
          >
            Refresh
          </button>
        </div>

        <div className="rounded-2xl border border-border/10 bg-card/20 p-3">
          <h3 className="text-[10px] font-mono text-muted-foreground/50 mb-2">Event Log</h3>
          <div className="h-32 overflow-y-auto space-y-0.5">
            {log.length === 0 ? (
              <p className="text-[10px] text-muted-foreground/30 font-mono">No events yet</p>
            ) : (
              log.map((msg, i) => (
                <p key={i} className="text-[10px] text-muted-foreground/50 font-mono leading-relaxed">{msg}</p>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
