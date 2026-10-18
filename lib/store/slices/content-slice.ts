import { sanitizeString } from '../helpers'

export interface MusicSettings {
  autoPlay: boolean
  maxVolumeLimit: number
  crossfade: boolean
  backgroundPlayback: boolean
  pauseAfterSession: boolean
}

export interface ContentSlice {
  dashboardLayout: string[]
  setDashboardLayout: (layout: string[]) => void
  musicSettings: MusicSettings
  setMusicSettings: (updates: Partial<MusicSettings>) => void
  ambientSoundEnabled: boolean
  setAmbientSoundEnabled: (v: boolean) => void
  ambientVolume: number
  setAmbientVolume: (v: number) => void
}

export const createContentSlice = (set: any, _get?: any, _api?: any): ContentSlice => ({
  dashboardLayout: ['stats', 'focus', 'tasks', 'habits', 'academic', 'insights', 'recent'],
  setDashboardLayout: (layout) => set({ dashboardLayout: layout.filter(Boolean) }),
  musicSettings: {
    autoPlay: true,
    maxVolumeLimit: 0.8,
    crossfade: false,
    backgroundPlayback: true,
    pauseAfterSession: false,
  },
  setMusicSettings: (updates) => set((state: any) => ({
    musicSettings: { ...state.musicSettings, ...updates },
  })),
  ambientSoundEnabled: true,
  setAmbientSoundEnabled: (v: boolean) => set({ ambientSoundEnabled: v }),
  ambientVolume: 0.6,
  setAmbientVolume: (v: number) => set({ ambientVolume: Math.max(0, Math.min(1, v)) }),
})
