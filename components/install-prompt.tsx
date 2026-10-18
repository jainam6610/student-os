'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Sparkles } from 'lucide-react'

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('install-dismissed') === 'true')

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      if (!dismissed) {
        setShowPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [dismissed])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    try {
      const promptEvent = deferredPrompt as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
      promptEvent.prompt()
      const { outcome } = await promptEvent.userChoice
      if (outcome === 'accepted') {
        setShowPrompt(false)
        setDeferredPrompt(null)
      }
    } catch {
      // Install prompt cancelled or failed — no action needed
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
    localStorage.setItem('install-dismissed', 'true')
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-[calc(56px+max(env(safe-area-inset-bottom,0px),8px))] lg:bottom-6 left-4 right-4 z-install-prompt mx-auto max-w-sm"
        >
          <div className="glass-panel p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Install Student OS</p>
              <p className="text-xs text-muted-foreground mt-0.5">Add to home screen for the best experience</p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleInstall}
                  className="px-4 py-2.5 min-h-[44px] bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Install
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-4 py-2.5 min-h-[44px] rounded-lg text-xs text-muted-foreground hover:bg-secondary transition-colors"
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-secondary transition-colors shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
