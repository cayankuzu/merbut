import { beforeEach, describe, expect, it } from 'vitest'
import { useAudioStore } from './audioStore'

describe('audio settings', () => {
  beforeEach(() => {
    useAudioStore.setState({ masterVolume: 0.9, sfxVolume: 0.8, musicVolume: 0.55, ambienceVolume: 0.6, voiceVolume: 0.7, musicPlaying: true, panelOpen: false, lastEffect: null, effectCount: 0 })
  })

  it('keeps every channel in the safe 0-100% range', () => {
    useAudioStore.getState().setSfxVolume(3)
    useAudioStore.getState().setMusicVolume(-2)
    useAudioStore.getState().setVolume('ambienceVolume', 7)
    expect(useAudioStore.getState()).toMatchObject({ sfxVolume: 1, musicVolume: 0, ambienceVolume: 1 })
  })

  it('tracks effect dispatches for runtime verification', () => {
    useAudioStore.getState().noteEffect('aku-roar')
    expect(useAudioStore.getState()).toMatchObject({ lastEffect: 'aku-roar', effectCount: 1 })
  })

  it('starts with the original score switched on', () => {
    expect(useAudioStore.getState().musicPlaying).toBe(true)
    useAudioStore.getState().setMusicPlaying(false)
    expect(useAudioStore.getState().musicPlaying).toBe(false)
  })
})
