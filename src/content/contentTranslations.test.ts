import { describe, expect, it } from 'vitest'
import { BOSS_DEFINITIONS, ENEMIES, ENEMY_VARIANTS, bossTitle, enemyDisplayName, enemyName, type EnemyKind, type EnemyVariant } from '../config/enemies'
import { DIFFICULTIES, DIFFICULTY_ORDER, difficultyText } from '../config/difficulty'
import { ACHIEVEMENTS, achievementText } from '../meta/achievements'
import { BIOME_CONTENT, biomeText } from './biomeContent'
import { CREDITS, creditsFor } from './credits'
import { PATCH_NOTES, patchNotesFor } from './patchNotes'

// Letters only the Turkish text uses: English containing them is an untranslated fallback.
const TURKISH_LETTERS = /[çğıİöşüÇĞÖŞÜâÂ]/

function expectEnglish(english: string, turkish: string) {
  expect(english.trim()).not.toBe('')
  expect(english).not.toMatch(TURKISH_LETTERS)
  expect(english).not.toBe(turkish)
}

describe('content translations', () => {
  it('names and describes every difficulty in English', () => {
    for (const id of DIFFICULTY_ORDER) {
      const english = difficultyText(id, 'en')
      expectEnglish(english.label, DIFFICULTIES[id].label)
      expectEnglish(english.description, DIFFICULTIES[id].description)
      expect(difficultyText(id, 'tr')).toEqual({ label: DIFFICULTIES[id].label, description: DIFFICULTIES[id].description })
    }
    expect(DIFFICULTY_ORDER.map((id) => difficultyText(id, 'en').label)).toEqual(['Easy', 'Normal', 'Hard', 'Merciless'])
  })

  it('gives every realm an English chapter card with the same numeral', () => {
    BIOME_CONTENT.forEach((content, index) => {
      const english = biomeText(index, 'en')
      expect(english.chapter).toBe(content.chapter.replace('DİYAR', 'REALM'))
      expectEnglish(english.tagline, content.tagline)
      expectEnglish(english.mechanicHint, content.mechanicHint)
      expect(biomeText(index, 'tr')).toEqual({ chapter: content.chapter, tagline: content.tagline, mechanicHint: content.mechanicHint })
    })
  })

  it('translates every achievement', () => {
    for (const achievement of ACHIEVEMENTS) {
      const english = achievementText(achievement.id, 'en')
      expectEnglish(english.title, achievement.title)
      expectEnglish(english.description, achievement.description)
      expect(achievementText(achievement.id, 'tr')).toEqual({ title: achievement.title, description: achievement.description })
    }
  })

  it('translates every variant prefix, drone name and boss title', () => {
    const kinds = Object.keys(ENEMIES).map(Number) as EnemyKind[]
    for (const variant of Object.keys(ENEMY_VARIANTS) as EnemyVariant[]) {
      for (const kind of kinds) {
        const english = enemyName(kind, variant, 'en')
        expect(enemyName(kind, variant, 'tr')).toBe(enemyDisplayName(kind, variant))
        if (variant === 'normal') expect(english).toBe(ENEMIES[kind].title)
        else expectEnglish(english, enemyDisplayName(kind, variant))
      }
    }
    for (const boss of Object.keys(BOSS_DEFINITIONS) as (keyof typeof BOSS_DEFINITIONS)[]) {
      expectEnglish(bossTitle(boss, 'en'), BOSS_DEFINITIONS[boss].title)
      expect(bossTitle(boss, 'tr')).toBe(BOSS_DEFINITIONS[boss].title)
    }
  })

  it('translates the credits block for block', () => {
    const english = creditsFor('en')
    expect(creditsFor('tr')).toBe(CREDITS)
    expect(english).toHaveLength(CREDITS.length)
    english.forEach((block, index) => {
      const turkish = CREDITS[index]!
      expectEnglish(block.role, turkish.role)
      expect(block.names).toHaveLength(turkish.names.length)
      for (const name of block.names) expect(name).not.toMatch(TURKISH_LETTERS)
    })
  })

  it('translates every patch note, release for release', () => {
    const english = patchNotesFor('en')
    expect(patchNotesFor('tr')).toBe(PATCH_NOTES)
    expect(english.map((release) => release.version)).toEqual(PATCH_NOTES.map((release) => release.version))
    english.forEach((release, index) => {
      const turkish = PATCH_NOTES[index]!
      expectEnglish(release.title, turkish.title)
      expect(release.notes).toHaveLength(turkish.notes.length)
      release.notes.forEach((note, noteIndex) => expectEnglish(note, turkish.notes[noteIndex]!))
    })
  })
})
