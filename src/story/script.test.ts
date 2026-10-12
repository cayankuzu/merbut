import { describe, expect, it } from 'vitest'
import { scriptFor, type Line } from './script'

const tr = scriptFor('tr')
const en = scriptFor('en')
const TURKISH_LETTERS = /[çÇğĞıİöÖşŞüÜâÂîÎûÛ]/

const shape = (table: Record<string, readonly Line[]>) =>
  Object.fromEntries(Object.entries(table).map(([key, lines]) => [key, lines.map((line) => line.speaker)]))

const englishLines = () => [
  ...en.prologue,
  ...Object.values(en.biomeScenes).flat(),
  ...Object.values(en.scenes).flat(),
  ...Object.values(en.barks).flat(),
]

describe('English script', () => {
  it('keeps every speaker’s voice and colour and gives each a name', () => {
    expect(Object.keys(en.speakers)).toEqual(Object.keys(tr.speakers))
    for (const [id, voice] of Object.entries(tr.speakers)) {
      const english = en.speakers[id as keyof typeof en.speakers]
      expect(english.color).toBe(voice.color)
      expect(english.pitch).toBe(voice.pitch)
      expect(english.name).not.toMatch(TURKISH_LETTERS)
    }
    expect(en.speakers.ali.name).toBe('Hazrat Ali')
    expect(en.speakers.jack.name).toBe('Samurai Jack')
  })

  it('tells the prologue beat for beat over the same images', () => {
    expect(en.prologue.map(({ image, speaker }) => [image, speaker])).toEqual(tr.prologue.map(({ image, speaker }) => [image, speaker]))
  })

  it('has the same scenes and barks, line for line, with the same speakers in the same order', () => {
    expect(shape(en.biomeScenes)).toEqual(shape(tr.biomeScenes))
    expect(shape(en.scenes)).toEqual(shape(tr.scenes))
    expect(shape(en.barks)).toEqual(shape(tr.barks))
  })

  it('translates every line', () => {
    const turkish = new Set([...tr.prologue, ...Object.values(tr.biomeScenes).flat(), ...Object.values(tr.scenes).flat(), ...Object.values(tr.barks).flat()].map((line) => line.text))
    for (const line of englishLines()) {
      expect(line.text.trim()).not.toBe('')
      expect(turkish.has(line.text), line.text).toBe(false)
      expect(line.text, line.text).not.toMatch(TURKISH_LETTERS)
    }
  })
})
