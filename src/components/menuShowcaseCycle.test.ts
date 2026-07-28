import { describe, expect, it } from 'vitest'
import { advanceShowcaseMove, SHOWCASE_MOVES_PER_CHARACTER } from './menuShowcaseCycle'

describe('menu showcase move director', () => {
  it('keeps the current character after its first move', () => {
    expect(advanceShowcaseMove(0)).toEqual({ moveNumber: 1, characterComplete: false })
  })

  it('rotates the character only after exactly two moves', () => {
    expect(SHOWCASE_MOVES_PER_CHARACTER).toBe(2)
    expect(advanceShowcaseMove(1)).toEqual({ moveNumber: 2, characterComplete: true })
  })

  it('clamps stale completion counts at the two-move boundary', () => {
    expect(advanceShowcaseMove(8)).toEqual({ moveNumber: 2, characterComplete: true })
  })
})
