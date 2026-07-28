import { beforeEach, describe, expect, it } from 'vitest'
import { useAudioStore } from './audioStore'

describe('audio settings', () => {
  beforeEach(() => {
    useAudioStore.setState({ sfxVolume: 0.78, musicVolume: 0.48, musicPlaying: true, musicLooping: true, panelOpen: false, lastEffect: null, effectCount: 0 })
  })

  it('keeps music and effect levels in the safe 0-100% range', () => {
    useAudioStore.getState().setSfxVolume(3)
    useAudioStore.getState().setMusicVolume(-2)
    expect(useAudioStore.getState()).toMatchObject({ sfxVolume: 1, musicVolume: 0 })
  })

  it('tracks effect dispatches for runtime verification', () => {
    useAudioStore.getState().noteEffect('aku-roar')
    expect(useAudioStore.getState()).toMatchObject({ lastEffect: 'aku-roar', effectCount: 1 })
  })

  it('starts background music in repeat mode', () => {
    expect(useAudioStore.getState().musicPlaying).toBe(true)
    expect(useAudioStore.getState().musicLooping).toBe(true)
    useAudioStore.getState().setMusicLooping(false)
    expect(useAudioStore.getState().musicLooping).toBe(false)
  })
})
