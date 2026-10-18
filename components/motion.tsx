'use client'

import { type Variants } from 'framer-motion'

// ─── Spring Physics Presets ───────────────────────────────────────────
// Tuned for premium feel: fluid, intentional, no jitter
export const spring = {
  snappy:     { type: 'spring' as const, stiffness: 380, damping: 32, mass: 0.8 },
  smooth:     { type: 'spring' as const, stiffness: 280, damping: 28, mass: 1 },
  gentle:     { type: 'spring' as const, stiffness: 180, damping: 24, mass: 1 },
  bouncy:     { type: 'spring' as const, stiffness: 320, damping: 20, mass: 0.85 },
  expressive: { type: 'spring' as const, stiffness: 260, damping: 16, mass: 0.85 },
  heavy:      { type: 'spring' as const, stiffness: 500, damping: 40, mass: 1.1 },
}

// ─── Easing Presets (custom cubic-bezier) ─────────────────────────────
// [0.16, 1, 0.3, 1] = ease-out-expo variant — smooth deceleration
export const easing = {
  standard:   { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const },
  quick:      { duration: 0.12, ease: [0.16, 1, 0.3, 1] as const },
  slow:       { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  expressive: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
}

// ─── Page Transitions ─────────────────────────────────────────────────
export const pageTransition: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] },
  },
}

export const pageSlideRight: Variants = {
  initial: { opacity: 0, x: 28 },
  animate: {
    opacity: 1, x: 0,
    transition: spring.smooth,
  },
  exit: {
    opacity: 0, x: -28,
    transition: { ...spring.snappy, duration: 0.15 },
  },
}

// ─── Staggered Container & Items ──────────────────────────────────────
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.04,
    },
  },
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1, y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
}

export const staggerItemFast: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1, y: 0,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  },
}

// ─── Microinteractions ────────────────────────────────────────────────
export const tapScale = {
  whileTap: { scale: 0.96, transition: spring.snappy },
}

export const hoverLift = {
  whileHover: { y: -2, transition: spring.snappy },
  whileTap: { y: 0, scale: 0.98, transition: spring.snappy },
}

export const hoverGlow = {
  whileHover: { scale: 1.02, transition: spring.snappy },
  whileTap: { scale: 0.98, transition: spring.snappy },
}

export const pressSpring = {
  whileTap: { scale: 0.94 },
  transition: spring.snappy,
}

// ─── Button Press (tactile) ───────────────────────────────────────────
export const buttonTap = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.96 },
  transition: spring.snappy,
}

// ─── Card / Tile Animations ───────────────────────────────────────────
export const cardEntrance: Variants = {
  initial: { opacity: 0, y: 16, scale: 0.97 },
  animate: {
    opacity: 1, y: 0, scale: 1,
    transition: spring.gentle,
  },
}

export const cardHover = {
  whileHover: { y: -3 },
  transition: spring.snappy,
}

// ─── Modal / Sheet ────────────────────────────────────────────────────
export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
}

export const modalContent: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.95 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: spring.bouncy,
  },
  exit: {
    opacity: 0, y: 20, scale: 0.97,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
}

// ─── List Items ───────────────────────────────────────────────────────
export const listItem: Variants = {
  initial: { opacity: 0, x: -10 },
  animate: {
    opacity: 1, x: 0,
    transition: spring.snappy,
  },
  exit: {
    opacity: 0, x: 10,
    transition: { duration: 0.12 },
  },
}

export const listItemPop: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 8 },
  animate: {
    opacity: 1, scale: 1, y: 0,
    transition: spring.gentle,
  },
  exit: {
    opacity: 0, scale: 0.95, y: -4,
    transition: { duration: 0.12 },
  },
}

// ─── Command Palette ──────────────────────────────────────────────────
export const commandPanel: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: spring.bouncy,
  },
  exit: {
    opacity: 0, y: 14, scale: 0.97,
    transition: { duration: 0.1 },
  },
}

// ─── Toast / Notification ─────────────────────────────────────────────
export const toastEntrance = {
  initial: { opacity: 0, x: 80, scale: 0.9 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: 80, scale: 0.9 },
  transition: spring.bouncy,
}

// ─── Badge / Dot ──────────────────────────────────────────────────────
export const badgePulse = {
  animate: {
    scale: [1, 1.12, 1],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
}

// ─── Breathing / Ambient ──────────────────────────────────────────────
export const breathe = {
  animate: {
    scale: [1, 1.008, 1],
    opacity: [0.85, 1, 0.85],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
  },
}

// ─── Focus Timer Ring ──────────────────────────────────────────────────
export const timerRingProgress = {
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
}
