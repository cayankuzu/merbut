import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { BIOMES } from '../config/biomes'
import { gameEvents } from '../sim/events'
import { useSessionStore } from '../store/sessionStore'
import { useSettingsStore } from '../store/settingsStore'
import { useDialogueStore } from './dialogueStore'
import { scriptFor } from './script'
import { startStoryDirector } from './storyDirector'

const firstRealm = BIOMES[0]!.id
let stop: (() => void) | undefined

// Each test is a new run, so its scenes have not played yet.
beforeEach(() => useSessionStore.setState((state) => ({ sessionToken: state.sessionToken + 1 })))

afterEach(() => {
  stop?.()
  useDialogueStore.getState().clear()
  useSettingsStore.getState().update({ language: 'tr' })
})

describe('story director language', () => {
  it('speaks in the player’s language', () => {
    useSettingsStore.getState().update({ language: 'en' })
    stop = startStoryDirector()
    gameEvents.emit({ type: 'biome-enter', biome: 0 })
    expect(useDialogueStore.getState().current?.text).toBe(scriptFor('en').biomeScenes[firstRealm][0]!.text)
  })

  it('re-reads the line on screen and the queued ones when the language changes', () => {
    useSettingsStore.getState().update({ language: 'tr' })
    stop = startStoryDirector()
    gameEvents.emit({ type: 'biome-enter', biome: 0 })
    const turkish = scriptFor('tr').biomeScenes[firstRealm]
    expect(useDialogueStore.getState().current?.text).toBe(turkish[0]!.text)

    useSettingsStore.getState().update({ language: 'en' })
    const english = scriptFor('en').biomeScenes[firstRealm]
    const { current, queue } = useDialogueStore.getState()
    expect(current?.text).toBe(english[0]!.text)
    expect(current?.speaker).toBe(turkish[0]!.speaker)
    expect(queue.map((line) => line.text)).toEqual(english.slice(1).map((line) => line.text))
  })
})
