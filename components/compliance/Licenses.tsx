'use client'

import { motion } from 'framer-motion'
import { X, BookOpen, Code, Copyright } from 'lucide-react'

export function Licenses({ onClose }: { onClose: () => void }) {
  const libraries = [
    { name: 'Next.js', license: 'MIT', author: 'Vercel, Inc.', url: 'https://github.com/vercel/next.js' },
    { name: 'React', license: 'MIT', author: 'Meta Platforms, Inc.', url: 'https://github.com/facebook/react' },
    { name: 'TypeScript', license: 'Apache 2.0', author: 'Microsoft Corporation', url: 'https://github.com/microsoft/TypeScript' },
    { name: 'Tailwind CSS', license: 'MIT', author: 'Tailwind Labs, Inc.', url: 'https://github.com/tailwindlabs/tailwindcss' },
    { name: 'Framer Motion', license: 'MIT', author: 'Framer B.V.', url: 'https://github.com/framer/motion' },
    { name: 'Lucide React', license: 'ISC', author: 'Lucide Contributors', url: 'https://github.com/lucide-icons/lucide' },
    { name: 'Zustand', license: 'MIT', author: 'Paul Henschel', url: 'https://github.com/pmndrs/zustand' },
    { name: 'date-fns', license: 'MIT', author: 'Sasha Koss', url: 'https://github.com/date-fns/date-fns' },
    { name: 'Dexie.js', license: 'Apache 2.0', author: 'David Fahlander', url: 'https://github.com/dexie/Dexie.js' },
    { name: 'Recharts', license: 'MIT', author: 'Xiaoke Cheng', url: 'https://github.com/recharts/recharts' },
    { name: 'Geist Font', license: 'SIL OFL 1.1', author: 'Vercel, Inc.', url: 'https://github.com/vercel/geist-font' },
    { name: 'AndroidX', license: 'Apache 2.0', author: 'Google LLC / AOSP', url: 'https://developer.android.com/jetpack/androidx' },
    { name: 'Capacitor', license: 'MIT', author: 'Ionic Technologies', url: 'https://github.com/ionic-team/capacitor' },
    { name: 'Kotlin', license: 'Apache 2.0', author: 'JetBrains s.r.o.', url: 'https://github.com/JetBrains/kotlin' },
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
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Open Source Licenses</h2>
              <p className="text-xs text-muted-foreground">Third-party libraries used by Student OS</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary/30 transition-colors" aria-label="Close">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="overflow-y-auto p-5 space-y-2">
          {libraries.map((lib, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-surface-container-low border border-border/50 p-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Code className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{lib.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{lib.author}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
                  {lib.license}
                </span>
                <a
                  href={lib.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-primary hover:underline"
                >
                  Source
                </a>
              </div>
            </div>
          ))}
          <div className="rounded-xl bg-surface-container-low border border-border/50 p-4 text-center">
            <Copyright className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground/60">
              Each library is used in accordance with its license terms. See full license texts in the /docs/THIRD_PARTY_LICENSES.md file.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
