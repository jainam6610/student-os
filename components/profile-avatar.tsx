'use client'

import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { getAvatarById, AVATAR_CATEGORIES } from './ui/avatars'
import { spring } from './motion'

export const AVATAR_OPTIONS = AVATAR_CATEGORIES.map((a) => a.id)
export const AVATAR_MAP = Object.fromEntries(AVATAR_CATEGORIES.map((a) => [a.id, a]))

interface ProfileAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  avatar?: string
  name?: string
  showRing?: boolean
}

const sizeMap = {
  sm: 'w-7 h-7',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
}

const svgSizeMap = {
  sm: 28,
  md: 40,
  lg: 56,
  xl: 80,
}

const ringSizeMap = {
  sm: 'inset-[-2px]',
  md: 'inset-[-2.5px]',
  lg: 'inset-[-3px]',
  xl: 'inset-[-3.5px]',
}

export function ProfileAvatar({ size = 'md', className, avatar: overrideAvatar, name: overrideName, showRing = true }: ProfileAvatarProps) {
  const storeAvatar = useStore((s) => s.avatar)
  const userName = useStore((s) => s.userName)
  const avatarId = overrideAvatar ?? storeAvatar
  const displayName = overrideName ?? userName
  const meta = getAvatarById(avatarId)
  const SvgComponent = meta.component

  const initials = displayName
    .split(' ')
    .map((n) => n.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')

  return (
    <motion.div
      className={cn('relative shrink-0 group', sizeMap[size], className)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={spring.snappy}
    >
      {showRing && (
        <motion.div
          className={cn(
            'absolute rounded-xl',
            ringSizeMap[size],
            'bg-gradient-to-br from-primary/30 via-primary/10 to-transparent',
            'opacity-0 group-hover:opacity-100'
          )}
          initial={{ opacity: 0, scale: 0.92 }}
          whileHover={{ opacity: 1, scale: 1 }}
          transition={spring.smooth}
          aria-hidden="true"
        />
      )}
      <div
        role="img"
        aria-label={displayName ? `${displayName}'s avatar` : 'User avatar'}
        className={cn(
          'w-full h-full rounded-xl bg-gradient-to-br flex items-center justify-center overflow-hidden',
          meta.gradient
        )}
        style={{ color: 'rgba(255,255,255,0.85)' }}
      >
        <SvgComponent size={svgSizeMap[size]} />
      </div>
    </motion.div>
  )
}
