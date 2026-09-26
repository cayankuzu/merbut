import { beforeEach, describe, expect, it } from 'vitest'
import { useDialogueStore } from '../story/dialogueStore'
import { DEFAULT_BINDINGS, useSettingsStore } from './settingsStore'

describe('key rebinding', () => {
  beforeEach(() => useSettingsStore.getState().resetBindings())

  it('moves a key to its new action and frees it everywhere else', () => {
    useSettingsStore.getState().setBinding('jack', 'dash', DEFAULT_BINDINGS.ali.attack)
    const { bindings } = useSettingsStore.getState()
    expect(bindings.jack.dash).toBe(DEFAULT_BINDINGS.ali.attack)
    expect(bindings.ali.attack).toBe('')
  })

  it('restores the defaults', () => {
    useSettingsStore.getState().setBinding('ali', 'jump', 'KeyQ')
    useSettingsStore.getState().resetBindings()
    expect(useSettingsStore.getState().bindings.ali.jump).toBe(DEFAULT_BINDINGS.ali.jump)
  })
})

describe('dialogue queue', () => {
  beforeEach(() => useDialogueStore.getState().clear())

  it('lets a story scene interrupt a bark but never the other way round', () => {
    const dialogue = useDialogueStore.getState()
    dialogue.say([{ speaker: 'lejyon', text: 'Mesai bitmişti...' }], 'bark')
    dialogue.say([{ speaker: 'jack', text: 'Gölgem daha az konuşurdu.' }, { speaker: 'ali', text: 'Işığı büyütürsün.' }], 'scene')
    expect(useDialogueStore.getState().current?.speaker).toBe('jack')
    useDialogueStore.getState().say([{ speaker: 'aku', text: 'Hah!' }], 'bark')
    expect(useDialogueStore.getState().current?.speaker).toBe('jack')
    useDialogueStore.getState().next()
    expect(useDialogueStore.getState().current?.speaker).toBe('ali')
  })

  it('replaces the rest of an old scene when the story moves on', () => {
    const dialogue = useDialogueStore.getState()
    dialogue.say([{ speaker: 'jack', text: 'Bir.' }, { speaker: 'ali', text: 'İki.' }], 'scene')
    useDialogueStore.getState().say([{ speaker: 'aku', text: 'Yeni sahne!' }], 'scene')
    expect(useDialogueStore.getState().current?.speaker).toBe('aku')
    expect(useDialogueStore.getState().queue).toHaveLength(0)
  })
})
