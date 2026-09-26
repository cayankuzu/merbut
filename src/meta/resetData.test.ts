import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAudioStore } from '../audio/audioStore'
import { useSettingsStore } from '../store/settingsStore'
import { useTutorialStore } from '../store/tutorialStore'
import { useProgressStore } from './progressStore'
import { resetEverything, resetProgress } from './resetData'

/** Node's own experimental localStorage hides jsdom's, so the test brings one. */
class MemoryStorage implements Storage {
  private values = new Map<string, string>()
  get length() { return this.values.size }
  clear() { this.values.clear() }
  getItem(key: string) { return this.values.get(key) ?? null }
  key(index: number) { return [...this.values.keys()][index] ?? null }
  removeItem(key: string) { this.values.delete(key) }
  setItem(key: string, value: string) { this.values.set(key, String(value)) }
}
const storage = new MemoryStorage()

function playSomeGame() {
  const progress = useProgressStore.getState()
  progress.reachBiome(6, 'hard')
  progress.unlock('first-blood')
  progress.addStats({ runs: 3, kills: 120, victories: 1 })
  progress.markPrologueSeen()
  useTutorialStore.getState().markLearned('ali', 'attack')
  useSettingsStore.getState().update({ screenShake: 0.2, reduceFlashes: true })
  useSettingsStore.getState().setBinding('ali', 'attack', 'KeyZ')
  useAudioStore.getState().setVolume('musicVolume', 0.1)
}

describe('save data reset', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', storage)
    storage.clear()
    resetEverything(() => {})
  })

  afterAll(() => vi.unstubAllGlobals())

  it('wipes the journey but keeps every preference', () => {
    playSomeGame()
    resetProgress()
    expect(useProgressStore.getState()).toMatchObject({
      furthestBiome: 0, checkpoint: null, achievements: {}, bestTimes: {}, prologueSeen: false,
      stats: { runs: 0, kills: 0, victories: 0 },
    })
    expect(useTutorialStore.getState().learned).toEqual({ ali: [], jack: [] })
    expect(useSettingsStore.getState()).toMatchObject({ screenShake: 0.2, reduceFlashes: true })
    expect(useSettingsStore.getState().bindings.ali.attack).toBe('KeyZ')
    expect(useAudioStore.getState().musicVolume).toBe(0.1)
  })

  it('factory reset restores defaults, clears stored keys and restarts', () => {
    playSomeGame()
    storage.setItem('merbut-camera-distance', '19')
    storage.setItem('merbut-progress', '{}')
    storage.setItem('someone-else', 'keep')
    const reload = vi.fn()
    resetEverything(reload)
    expect(reload).toHaveBeenCalledOnce()
    expect(useSettingsStore.getState()).toMatchObject({ screenShake: 1, reduceFlashes: false })
    expect(useSettingsStore.getState().bindings.ali.attack).not.toBe('KeyZ')
    expect(useAudioStore.getState().musicVolume).toBe(0.55)
    expect(useProgressStore.getState().achievements).toEqual({})
    expect(storage.length).toBe(1)
    expect(storage.getItem('someone-else')).toBe('keep')
  })
})
