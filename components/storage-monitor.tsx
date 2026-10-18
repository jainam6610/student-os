'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Download, X, HardDrive } from 'lucide-react'
import { getStorageStats, cleanupOldData, formatBytes, type StorageStats } from '@/lib/storage-quota'
import { exportBackup } from '@/lib/store'
import { cn } from '@/lib/utils'

export function StorageMonitor() {
   const [stats, setStats] = useState<StorageStats | null>(null)
   const [showWarning, setShowWarning] = useState(false)
   const [showCritical, setShowCritical] = useState(false)
   const [isCleaningUp, setIsCleaningUp] = useState(false)
   const cleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
   const showWarningRef = useRef(showWarning)
   const showCriticalRef = useRef(showCritical)
   showWarningRef.current = showWarning
   showCriticalRef.current = showCritical

   useEffect(() => {
     const initialStats = getStorageStats()
     setStats(initialStats)
     if (initialStats.isCritical) {
       setShowCritical(true)
     } else if (initialStats.isNearQuota) {
       setShowWarning(true)
     }

     const handleQuotaWarning = (e: Event) => {
       const customEvent = e as CustomEvent<{ stats: StorageStats }>
       setStats(customEvent.detail.stats)
       if (customEvent.detail.stats.isCritical) {
         setShowCritical(true)
       } else if (customEvent.detail.stats.isNearQuota) {
         setShowWarning(true)
       }
     }

     const handleQuotaExceeded = (e: Event) => {
       const customEvent = e as CustomEvent<{ error: string; compacted?: boolean }>
       setShowCritical(true)
       if (customEvent.detail.compacted) {
         cleanupTimeoutRef.current = setTimeout(() => {
           setStats(getStorageStats())
         }, 1000)
       }
     }

     window.addEventListener('storage-quota-warning', handleQuotaWarning)
     window.addEventListener('storage-quota-exceeded', handleQuotaExceeded)

     const interval = setInterval(() => {
       const currentStats = getStorageStats()
       setStats(currentStats)
       if (currentStats.isCritical && !showCriticalRef.current) {
         setShowCritical(true)
         const result = cleanupOldData()
         if (result.totalSaved > 0) {
           const newStats = getStorageStats()
           setStats(newStats)
           if (!newStats.isCritical && !newStats.isNearQuota) {
             setShowCritical(false)
             setShowWarning(false)
           }
         }
       } else if (currentStats.isNearQuota && !showWarningRef.current && !showCriticalRef.current) {
         setShowWarning(true)
       }
     }, 5 * 60 * 1000)

     return () => {
       window.removeEventListener('storage-quota-warning', handleQuotaWarning)
       window.removeEventListener('storage-quota-exceeded', handleQuotaExceeded)
       clearInterval(interval)
       if (cleanupTimeoutRef.current) clearTimeout(cleanupTimeoutRef.current)
     }
   }, [])

  const handleCleanup = async () => {
    setIsCleaningUp(true)
    try {
      const result = cleanupOldData()
      const t = setTimeout(() => {
        const newStats = getStorageStats()
        setStats(newStats)
        setIsCleaningUp(false)
        if (!newStats.isCritical) {
          setShowCritical(false)
        }
        if (!newStats.isNearQuota) {
          setShowWarning(false)
        }
      }, 500)
      cleanupTimeoutRef.current = t
    } catch {
      setIsCleaningUp(false)
    }
  }

  const handleExport = () => {
    try {
      const backup = exportBackup()
      if (!backup) return

      const blob = new Blob([backup], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `student-os-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch { /* silent */ }
  }

  const handleDismiss = () => {
    setShowWarning(false)
    setShowCritical(false)
  }

  if (!stats) return null

  return (
    <AnimatePresence>
      {(showWarning || showCritical) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            'fixed top-4 left-1/2 -translate-x-1/2 z-install-prompt w-[calc(100%-2rem)] max-w-md',
            'glass-panel border shadow-2xl'
          )}
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'p-2 rounded-lg shrink-0',
                  showCritical
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500'
                )}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  {showCritical ? 'Storage Critical' : 'Storage Warning'}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {showCritical
                    ? `Your storage is ${Math.round(stats.percentage * 100)}% full (${formatBytes(stats.used)} / ${formatBytes(stats.estimated)}). Please export your data and clean up old items.`
                    : `Your storage is ${Math.round(stats.percentage * 100)}% full. Consider cleaning up old data to prevent issues.`}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCleanup}
                    disabled={isCleaningUp}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-lg',
                      'bg-primary/10 text-primary hover:bg-primary/20',
                      'transition-colors duration-200',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {isCleaningUp ? 'Cleaning...' : 'Clean Up'}
                  </button>
                  <button
                    onClick={handleExport}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-lg',
                      'bg-foreground/5 text-foreground hover:bg-foreground/10',
                      'transition-colors duration-200',
                      'flex items-center gap-1.5'
                    )}
                  >
                    <Download className="w-3 h-3" />
                    Export
                  </button>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
