'use client'

import type { ReactNode } from 'react'

import { Modal } from '@/components/modal'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} className="sm:max-w-2xl">
      {children}
    </Modal>
  )
}
