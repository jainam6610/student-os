'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface AvatarMeta {
  id: string
  name: string
  gradient: string
  component: React.ComponentType<{ size?: number }>
}

// ─── Shared silhouette primitives ────────────────────────────────────
function Head(props: { color?: string }) {
  return <circle cx="40" cy="30" r="13" fill={props.color ?? 'currentColor'} fillOpacity="0.2" />
}
function Body(props: { color?: string }) {
  return <path d="M24 72Q24 48 40 44Q56 48 56 72" fill={props.color ?? 'currentColor'} fillOpacity="0.15" />
}
function HairBase(props: { d: string; color?: string }) {
  return <path d={props.d} fill={props.color ?? 'currentColor'} fillOpacity="0.25" />
}
function AccentCircle() {
  return <circle cx="40" cy="40" r="38" fill="currentColor" fillOpacity="0.06" />
}

// ─── Avatars ─────────────────────────────────────────────────────────
function FocusedLearner({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <AccentCircle />
      <Head />
      <Body />
      <HairBase d="M27 30Q27 17 40 15Q53 17 53 30Q53 20 40 18Q27 20 27 30Z" />
      <path d="M29 30a11 11 0 0 1 22 0" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.3" fill="none" />
      <circle cx="34" cy="30" r="2.5" fill="currentColor" fillOpacity="0.25" />
      <circle cx="46" cy="30" r="2.5" fill="currentColor" fillOpacity="0.25" />
      <path d="M36 30h8" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.2" />
      <rect x="32" y="46" width="16" height="12" rx="1.5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" fill="currentColor" fillOpacity="0.08" />
      <path d="M36 48h8v2h-8Z" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

function CreativeThinker({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <AccentCircle />
      <Head />
      <Body />
      <HairBase d="M27 26Q27 12 40 10Q53 12 53 26Q53 14 40 12Q27 14 27 26Z" />
      <path d="M40 44v4m-6-2a6 6 0 1 1 12 0" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.25" fill="none" />
      <path d="M37 54l3-4 3 4" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.2" fill="none" />
      <path d="M38 50l-2 6m4-6l2 6" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.15" fill="none" />
    </svg>
  )
}

function CalmScholar({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <AccentCircle />
      <Head />
      <Body />
      <HairBase d="M27 28Q27 16 40 14Q53 16 53 28Q53 22 40 20Q27 22 27 28Z" />
      <path d="M28 28l12-4 12 4v2l-12-3-12 3Z" fill="currentColor" fillOpacity="0.2" />
      <path d="M28 30v3l12 4 12-4v-3" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" fill="none" />
      <path d="M36 52h8v6h-8Z" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" fill="currentColor" fillOpacity="0.08" />
      <path d="M34 50l6-2 6 2" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.15" />
    </svg>
  )
}

function NightOwl({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <AccentCircle />
      <Head />
      <Body />
      <HairBase d="M25 28Q25 14 40 12Q55 14 55 28Q55 18 40 16Q25 18 25 28Z" />
      <circle cx="46" cy="22" r="5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" fill="currentColor" fillOpacity="0.08" />
      <circle cx="48" cy="20" r="1.5" fill="currentColor" fillOpacity="0.2" />
      <path d="M50 25a4 4 0 0 0 3-4" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.15" fill="none" />
    </svg>
  )
}

function Achiever({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <AccentCircle />
      <Head />
      <Body />
      <HairBase d="M27 28Q27 15 40 13Q53 15 53 28Q53 18 40 16Q27 18 27 28Z" />
      <path d="M35 42l2 4 4 1-3 3 1 5-4-2-4 2 1-5-3-3 4-1Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="0.6" strokeOpacity="0.2" />
      <path d="M38 34v4m-3-2a3 3 0 1 1 6 0" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.15" fill="none" />
    </svg>
  )
}

function Minimalist({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <AccentCircle />
      <Head />
      <Body />
      <circle cx="40" cy="40" r="6" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" />
      <circle cx="40" cy="40" r="2" fill="currentColor" fillOpacity="0.2" />
    </svg>
  )
}

function ScienceExplorer({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <AccentCircle />
      <Head />
      <Body />
      <HairBase d="M26 27Q26 13 40 11Q54 13 54 27Q54 15 40 13Q26 15 26 27Z" />
      <path d="M33 50l14-12m-7-4l8 8" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.2" fill="none" />
      <circle cx="40" cy="46" r="8" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" fill="currentColor" fillOpacity="0.06" />
      <path d="M37 46a3 3 0 1 1 6 0" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.15" fill="none" />
      <path d="M40 38v8" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.15" />
    </svg>
  )
}

function Artist({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <AccentCircle />
      <Head />
      <Body />
      <HairBase d="M28 28Q28 14 40 12Q52 14 52 28Q52 16 40 14Q28 16 28 28Z" />
      <circle cx="44" cy="44" r="7" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" fill="currentColor" fillOpacity="0.06" />
      <circle cx="42" cy="42" r="2" fill="currentColor" fillOpacity="0.2" />
      <circle cx="47" cy="47" r="1.5" fill="currentColor" fillOpacity="0.15" />
      <path d="M33 52l6-8" stroke="currentColor" strokeWidth="1" strokeOpacity="0.15" />
    </svg>
  )
}

function TechStudent({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <AccentCircle />
      <Head />
      <Body />
      <HairBase d="M26 26Q26 12 40 10Q54 12 54 26Q54 14 40 12Q26 14 26 26Z" />
      <rect x="30" y="44" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" fill="currentColor" fillOpacity="0.06" />
      <rect x="32" y="46" width="16" height="8" rx="1" fill="currentColor" fillOpacity="0.08" />
      <path d="M35 46h10" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.1" />
      <path d="M32 58h16" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.15" />
      <line x1="38" y1="44" x2="42" y2="44" stroke="currentColor" strokeWidth="0.6" strokeOpacity="0.1" />
    </svg>
  )
}

function CompetitivePrep({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <AccentCircle />
      <Head />
      <Body />
      <HairBase d="M27 28Q27 15 40 13Q53 15 53 28Q53 20 40 18Q27 20 27 28Z" />
      <circle cx="40" cy="46" r="8" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.2" fill="currentColor" fillOpacity="0.06" />
      <circle cx="40" cy="46" r="5" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.15" />
      <circle cx="40" cy="46" r="2" fill="currentColor" fillOpacity="0.2" />
      <path d="M32 38l4 4" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.15" />
      <path d="M48 38l-4 4" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.15" />
    </svg>
  )
}

// ─── Registry ────────────────────────────────────────────────────────
export const AVATAR_CATEGORIES: AvatarMeta[] = [
  { id: 'focused-learner', name: 'Focused Learner', gradient: 'from-violet-500 to-purple-700', component: FocusedLearner },
  { id: 'creative-thinker', name: 'Creative Thinker', gradient: 'from-blue-500 to-cyan-600', component: CreativeThinker },
  { id: 'calm-scholar', name: 'Calm Scholar', gradient: 'from-emerald-500 to-teal-600', component: CalmScholar },
  { id: 'night-owl', name: 'Night Owl', gradient: 'from-amber-500 to-orange-600', component: NightOwl },
  { id: 'achiever', name: 'Achiever', gradient: 'from-rose-500 to-pink-600', component: Achiever },
  { id: 'minimalist', name: 'Minimalist', gradient: 'from-indigo-500 to-violet-600', component: Minimalist },
  { id: 'science-explorer', name: 'Science Explorer', gradient: 'from-sky-500 to-indigo-600', component: ScienceExplorer },
  { id: 'artist', name: 'Artist', gradient: 'from-teal-500 to-emerald-600', component: Artist },
  { id: 'tech-student', name: 'Tech Student', gradient: 'from-fuchsia-500 to-pink-600', component: TechStudent },
  { id: 'competitive-prep', name: 'Competitive Prep', gradient: 'from-orange-500 to-red-500', component: CompetitivePrep },
]

export const AVATAR_MAP = Object.fromEntries(AVATAR_CATEGORIES.map((a) => [a.id, a])) as Record<string, AvatarMeta>

export function getAvatarById(id: string): AvatarMeta {
  return AVATAR_MAP[id] ?? AVATAR_CATEGORIES[0]
}
