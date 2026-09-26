import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { safeStorage } from '../utils/safeStorage'
import type { SoundEffect } from './gameAudio'

export type VolumeChannel = 'masterVolume' | 'musicVolume' | 'sfxVolume' | 'ambienceVolume' | 'voiceVolume'

interface AudioState {
  masterVolume: number
  musicVolume: number
  sfxVolume: number
  ambienceVolume: number
  voiceVolume: number
  musicPlaying: boolean
  /** The settings panel is shared by the menu and pause screen. */
  panelOpen: boolean
  lastEffect: SoundEffect | null
  effectCount: number
  setVolume: (channel: VolumeChannel, volume: number) => void
  setSfxVolume: (volume: number) => void
  setMusicVolume: (volume: number) => void
  setMusicPlaying: (playing: boolean) => void
  openPanel: () => void
  togglePanel: () => void
  closePanel: () => void
  noteEffect: (effect: SoundEffect) => void
}

const clampVolume = (volume: number) => Math.max(0, Math.min(1, volume))

export const useAudioStore = create<AudioState>()(persist((set) => ({
  masterVolume: 0.9,
  musicVolume: 0.55,
  sfxVolume: 0.8,
  ambienceVolume: 0.6,
  voiceVolume: 0.7,
  musicPlaying: true,
  panelOpen: false,
  lastEffect: null,
  effectCount: 0,
  setVolume: (channel, volume) => set({ [channel]: clampVolume(volume) } as Pick<AudioState, VolumeChannel>),
  setSfxVolume: (sfxVolume) => set({ sfxVolume: clampVolume(sfxVolume) }),
  setMusicVolume: (musicVolume) => set({ musicVolume: clampVolume(musicVolume) }),
  setMusicPlaying: (musicPlaying) => set({ musicPlaying }),
  openPanel: () => set({ panelOpen: true }),
  togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),
  closePanel: () => set({ panelOpen: false }),
  noteEffect: (lastEffect) => set((state) => ({ lastEffect, effectCount: state.effectCount + 1 })),
}), {
  name: 'merbut-audio-settings',
  version: 3,
  storage: createJSONStorage(safeStorage),
  migrate: (persisted) => {
    const state = (persisted ?? {}) as Partial<AudioState>
    return { ...state, musicPlaying: state.musicPlaying ?? true } as AudioState
  },
  partialize: ({ masterVolume, musicVolume, sfxVolume, ambienceVolume, voiceVolume, musicPlaying }) => ({ masterVolume, musicVolume, sfxVolume, ambienceVolume, voiceVolume, musicPlaying }),
}))
