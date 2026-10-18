'use client'

import { motion } from 'framer-motion'
import { X, Sparkles, User, Instagram, Shield, CheckCircle } from 'lucide-react'

export function AboutInfo({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-modal-backdrop flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card rounded-2xl border shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">About Student OS</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary/30 transition-colors" aria-label="Close">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl font-bold text-primary">JK</span>
            </div>
            <h3 className="text-base font-semibold text-foreground">Student OS</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Version {process.env.NEXT_PUBLIC_APP_VERSION ?? '1.1.0'}</p>
          </div>

          <div className="rounded-xl bg-surface-container-low border border-border/50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Version</span>
              <span className="text-xs font-medium text-foreground">{process.env.NEXT_PUBLIC_APP_VERSION ?? '1.1.0'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Build number</span>
              <span className="text-xs font-medium text-foreground">13</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Target SDK</span>
              <span className="text-xs font-medium text-foreground">36 (Android 16)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Min SDK</span>
              <span className="text-xs font-medium text-foreground">24 (Android 7.0)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Architecture</span>
              <span className="text-xs font-medium text-foreground">Offline-first SPA</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Data storage</span>
              <span className="text-xs font-medium text-foreground">Local only</span>
            </div>
          </div>

          <div className="rounded-xl bg-surface-container-low border border-border/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Jainam Karnawat</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Designer &amp; Developer. Building tools that help students work with intention and clarity.
            </p>
            <a
              href="https://instagram.com/thats.jainam"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-xs text-muted-foreground hover:text-foreground"
            >
              <Instagram className="w-3.5 h-3.5" />
              @thats.jainam
            </a>
          </div>

          <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-green-500" />
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground">
              Your data stays on your device. No account needed.
            </p>
          </div>

          <div className="text-center">
            <p className="text-[10px] text-muted-foreground/60">
              Made with &hearts; by Jainam
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
