'use client'

import { motion } from 'framer-motion'
import { Instagram, Sparkles } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="hidden lg:flex items-center justify-between px-6 py-4 border-t border-border"
      role="contentinfo"
    >
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-primary" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Built with care by</span>
          <a
            href="https://instagram.com/thats.jainam"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-foreground hover:text-primary transition-colors"
            aria-label="Jainam Karnawat on Instagram"
          >
            Jainam Karnawat
          </a>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <a
          href="https://instagram.com/thats.jainam"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
          aria-label="Follow @thats.jainam on Instagram"
        >
          <Instagram className="w-3.5 h-3.5 group-hover:text-pink-500 transition-colors" />
          <span className="hidden sm:inline">@thats.jainam</span>
        </a>
        <span className="text-[11px] text-muted-foreground/60">
          &copy; {currentYear} Student OS. All rights reserved.
        </span>
      </div>
    </motion.footer>
  )
}
