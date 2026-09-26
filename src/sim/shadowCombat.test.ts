import { describe, expect, it } from 'vitest'
import { chooseShadowAttack, getShadowStrikeThresholds } from './shadowCombat'

describe('Aku\'nun Gölgesi sword combat', () => {
  it('chooses a dedicated sword slash while a player is in melee range', () => {
    expect(chooseShadowAttack(0.4, 2.1, 3.7)).toBe('slash')
    expect(getShadowStrikeThresholds('shadow-slash')).toEqual([480])
  })

  it('approaches a distant player instead of swinging out of range', () => {
    expect(chooseShadowAttack(0.6, 7, 3.7)).toBe('approach')
  })
})
