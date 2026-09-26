import { useAudioStore } from '../audio/audioStore'
import { useSettingsStore } from '../store/settingsStore'
import { useTutorialStore } from '../store/tutorialStore'
import { useProgressStore } from './progressStore'

/** Every key Merbut writes to browser storage starts with this. */
const STORAGE_PREFIX = 'merbut'

/**
 * Starts the journey over: unlocked chapters, checkpoint, best times and
 * ranks, achievements, lifetime stats, the prologue and tutorial hints.
 * Controls, audio and graphics preferences are kept.
 */
export function resetProgress() {
  useProgressStore.getState().resetAll()
  useTutorialStore.getState().reset()
}

function clearStoredKeys(storage: Storage) {
  const keys: string[] = []
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (key?.startsWith(STORAGE_PREFIX)) keys.push(key)
  }
  keys.forEach((key) => storage.removeItem(key))
}

/**
 * Factory reset. Stores go back to their defaults in memory first, so any
 * write that races the reload can only ever persist defaults; then every
 * Merbut key is removed and the page restarts clean.
 */
export function resetEverything(reload: () => void = () => window.location.reload()) {
  resetProgress()
  useSettingsStore.setState(useSettingsStore.getInitialState(), true)
  useAudioStore.setState(useAudioStore.getInitialState(), true)
  try {
    clearStoredKeys(window.localStorage)
  } catch {
    // Storage may be blocked; the in-memory reset above still applies.
  }
  reload()
}
