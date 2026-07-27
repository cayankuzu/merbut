import { describe, expect, it } from 'vitest'
import type { EnemyState } from '../types/session'
import { isActiveAkuFight } from './akuCombat'
import { getMiniAkuMotion, MINI_AKU_ATTACK_TIMES, MINI_AKU_COUNT } from './akuMiniSwarm'

const aku = {
  id: 'aku-final', finalBoss: true, bossType: 'aku', animation: 'attack',
} as EnemyState

describe('Aku encounter guards', () => {
  it('allows combat portals only during the active final Aku fight', () => {
    expect(isActiveAkuFight({ phase: 'playing', bossPhase: 'fight', activeBossId: aku.id }, aku)).toBe(true)
    expect(isActiveAkuFight({ phase: 'playing', bossPhase: 'fight', activeBossId: 'another-boss' }, aku)).toBe(false)
    expect(isActiveAkuFight({ phase: 'playing', bossPhase: 'none', activeBossId: aku.id }, aku)).toBe(false)
    expect(isActiveAkuFight({ phase: 'ending', bossPhase: 'portal', activeBossId: aku.id }, aku)).toBe(false)
  })

  it('drives six mini Akus through separate attack windows', () => {
    expect(MINI_AKU_COUNT).toBe(6)
    expect(new Set(MINI_AKU_ATTACK_TIMES).size).toBe(6)
    MINI_AKU_ATTACK_TIMES.forEach((attackAt, index) => {
      const motion = getMiniAkuMotion(index, attackAt + 100, 20, 25)
      expect(motion.attacking).toBe(true)
      expect(Math.abs(motion.x - 25)).toBeLessThan(1.2)
    })
  })
})

