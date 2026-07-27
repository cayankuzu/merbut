import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type { SoundEffect } from './gameAudio'

interface AudioState {
  sfxVolume: number
  musicVolume: number
  musicPlaying: boolean
  musicLooping: boolean
  panelOpen: boolean
  lastEffect: SoundEffect | null
  effectCount: number
  setSfxVolume: (volume: number) => void
  setMusicVolume: (volume: number) => void
  setMusicPlaying: (playing: boolean) => void
  setMusicLooping: (looping: boolean) => void
  openPanel: () => void
  togglePanel: () => void
  closePanel: () => void
  noteEffect: (effect: SoundEffect) => void
}

const clampVolume = (volume: number) => Math.max(0, Math.min(1, volume))

const memoryValues = new Map<string, string>()
const memoryStorage: StateStorage = {
  getItem: (name) => memoryValues.get(name) ?? null,
  setItem: (name, value) => memoryValues.set(name, value),
  removeItem: (name) => memoryValues.delete(name),
}

const getAudioStorage = (): StateStorage => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage
    }
  } catch {
    // Sandboxed browsers and the test runner can reject localStorage access.
  }

  return memoryStorage
}

export const useAudioStore = create<AudioState>()(persist((set) => ({
  sfxVolume: 0.78,
  musicVolume: 0.48,
  musicPlaying: true,
  musicLooping: true,
  panelOpen: false,
  lastEffect: null,
  effectCount: 0,
  setSfxVolume: (sfxVolume) => set({ sfxVolume: clampVolume(sfxVolume) }),
  setMusicVolume: (musicVolume) => set({ musicVolume: clampVolume(musicVolume) }),
  setMusicPlaying: (musicPlaying) => set({ musicPlaying }),
  setMusicLooping: (musicLooping) => set({ musicLooping }),
  openPanel: () => set({ panelOpen: true }),
  togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),
  closePanel: () => set({ panelOpen: false }),
  noteEffect: (lastEffect) => set((state) => ({ lastEffect, effectCount: state.effectCount + 1 })),
}), {
  name: 'merbut-audio-settings',
  storage: createJSONStorage(getAudioStorage),
  partialize: (state) => ({
    sfxVolume: state.sfxVolume,
    musicVolume: state.musicVolume,
    musicPlaying: state.musicPlaying,
    musicLooping: state.musicLooping,
  }),
}))
