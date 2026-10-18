'use client'

import { motion } from 'framer-motion'
import { X, FileText, CheckCircle, AlertCircle, Shield, Eye, Bell, XCircle } from 'lucide-react'

export function TermsOfService({ onClose }: { onClose: () => void }) {
  const sections = [
    {
      icon: CheckCircle,
      title: 'Acceptance of Terms',
      content: 'By downloading, installing, or using Student OS, you agree to these Terms of Service. If you do not agree, do not use the App.',
    },
    {
      icon: Shield,
      title: 'Deep Lock Feature',
      content: 'Deep Lock uses the Android Accessibility Service exclusively to detect foreground apps during Focus Sessions. The service does not read passwords, messages, or personal content. It is only active during Focus Sessions with Deep Lock enabled. You can disable Deep Lock at any time. Deep Lock is a voluntary tool intended to help maintain focus \u2014 we cannot guarantee it will block all distracting apps in all situations.',
    },
    {
      icon: Bell,
      title: 'Do Not Disturb',
      content: 'The optional Auto Do Not Disturb feature requires Notification Policy Access. By enabling it, you authorize the App to enable DND during Focus Sessions and restore the previous state after the session ends.',
    },
    {
      icon: AlertCircle,
      title: 'Foreground Service',
      content: 'Deep Lock uses a Foreground Service to maintain functionality when the App is in the background. This shows a persistent notification during active Focus Sessions.',
    },
    {
      icon: XCircle,
      title: 'Disclaimer of Warranties',
      content: 'The App is provided "as is" and "as available" without any warranty of any kind. We do not warrant that the App will meet your specific productivity needs, be uninterrupted, error-free, or free of harmful components.',
    },
  ]

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
        className="w-full max-w-2xl bg-card rounded-2xl border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Terms of Service</h2>
              <p className="text-xs text-muted-foreground">Last updated: July 2026</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary/30 transition-colors" aria-label="Close">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="overflow-y-auto p-5 space-y-3">
          {sections.map((section, i) => (
            <div key={i} className="rounded-xl bg-surface-container-low border border-border/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <section.icon className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{section.content}</p>
            </div>
          ))}
          <div className="text-center pt-2">
            <p className="text-[10px] text-muted-foreground/60">Student OS &mdash; Built by Jainam Karnawat</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
