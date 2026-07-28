import { describe, expect, it } from 'vitest'
import type { EnemyState } from '../types/session'
import {
  AKU_FIRE_SPIKE_DAMAGE_COOLDOWN_MS,
  AKU_FIRE_SPIKE_DAMAGE_MULTIPLIER,
  AKU_FIRE_SPIKE_RADIUS,
  isActiveAkuFight,
  isInsideAkuFireSpikeField,
} from './akuCombat'
import { getMiniAkuMotion, MINI_AKU_ATTACK_TIMES, MINI_AKU_COUNT, MINI_AKU_LANE_Y, MINI_AKU_LANE_Z } from './akuMiniSwarm'

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
      expect(motion.y).toBe(MINI_AKU_LANE_Y)
      expect(motion.z).toBe(MINI_AKU_LANE_Z)
      expect(Math.abs(motion.x - 25)).toBeLessThan(1.2)
      expect(Math.abs(motion.x - 20)).toBeLessThan(6)
    })
  })

  it('covers Aku surroundings with a grounded fire-spike damage field', () => {
    expect(isInsideAkuFireSpikeField(20, 20 + AKU_FIRE_SPIKE_RADIUS, 0)).toBe(true)
    expect(isInsideAkuFireSpikeField(20, 20 - AKU_FIRE_SPIKE_RADIUS, 0.9)).toBe(true)
    expect(isInsideAkuFireSpikeField(20, 20 + AKU_FIRE_SPIKE_RADIUS + 0.01, 0)).toBe(false)
    expect(isInsideAkuFireSpikeField(20, 20, 0.91)).toBe(false)
    expect(AKU_FIRE_SPIKE_DAMAGE_COOLDOWN_MS).toBe(650)
    expect(AKU_FIRE_SPIKE_DAMAGE_MULTIPLIER).toBeGreaterThan(0)
  })
})
