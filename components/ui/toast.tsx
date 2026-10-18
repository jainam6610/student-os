'use client'

import { useState, useEffect, useCallback, useRef, createContext, useContext, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, CheckCircle2, Zap, Flame, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { toastEntrance } from '@/components/motion'
import { cn } from '@/lib/utils'

type ToastType = 'xp' | 'success' | 'streak' | 'levelup' | 'warning' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${++toastId}`
    setToasts((prev) => [...prev, { ...toast, id }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-[calc(56px+max(env(safe-area-inset-bottom,0px),8px))] lg:bottom-6 right-4 z-toast flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-label="Notifications"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

const ICONS: Record<ToastType, ReactNode> = {
  xp: <Zap className="w-5 h-5 text-primary" />,
  success: <CheckCircle2 className="w-5 h-5 text-success" />,
  streak: <Flame className="w-5 h-5 text-chart-5" fill="currentColor" />,
  levelup: <Sparkles className="w-5 h-5 text-chart-3" />,
  warning: <AlertTriangle className="w-5 h-5 text-chart-4" />,
  error: <AlertCircle className="w-5 h-5 text-destructive" />,
  info: <Info className="w-5 h-5 text-primary" />,
}

const BORDERS: Record<ToastType, string> = {
  xp: 'border-primary/30',
  success: 'border-success/30',
  streak: 'border-chart-5/30',
  levelup: 'border-chart-3/30',
  warning: 'border-chart-4/30',
  error: 'border-destructive/30',
  info: 'border-primary/30',
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [paused, setPaused] = useState(false)
  const onDismissRef = useRef(onDismiss)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  onDismissRef.current = onDismiss

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }, [])

  const startTimer = useCallback(() => {
    if (!paused) timerRef.current = setTimeout(() => onDismissRef.current(), 3500)
  }, [paused])

  useEffect(() => {
    startTimer()
    return clearTimer
  }, [startTimer, clearTimer])

  return (
    <motion.div
      layout
      role={toast.type === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => { setPaused(true); clearTimer() }}
      onMouseLeave={() => { setPaused(false); startTimer() }}
      {...toastEntrance}
      className={cn(
        'pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-card border shadow-2xl max-w-sm',
        BORDERS[toast.type]
      )}
    >
      <motion.div
        className="shrink-0 mt-0.5"
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        {ICONS[toast.type]}
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    </motion.div>
  )
}
