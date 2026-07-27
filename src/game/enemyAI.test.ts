import { describe, expect, it } from 'vitest'
import { enemyCatchUpMultiplier, getEffectiveAttackRange, shouldEnemyApproach } from './enemyAI'

describe('enemy engagement AI', () => {
  it('attacks instead of running when a melee target is visually in reach', () => {
    expect(getEffectiveAttackRange(1.5, 1.5, false)).toBeCloseTo(2.175)
    expect(shouldEnemyApproach(2, 1.5, 1.5, false)).toBe(false)
  })

  it('lets ranged enemies attack at point blank instead of retreat-running', () => {
    expect(shouldEnemyApproach(0.7, 6.4, 1.5, true)).toBe(false)
  })

  it('accelerates distant enemies and keeps bosses faster than players when chasing', () => {
    expect(enemyCatchUpMultiplier(12, false)).toBeGreaterThan(4)
    expect(4.8 * enemyCatchUpMultiplier(5, true)).toBeGreaterThan(4.25)
  })
})
