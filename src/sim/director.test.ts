import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../store/gameStore'
import { useSessionStore } from '../store/sessionStore'
import { resetMechanics } from './mechanics'
import { createEnemy } from './enemyFactory'
import { heroGap } from './enemyAI'
import { COMBAT_STEP, stepDirector } from './director'

function startRun(now: number) {
  useSessionStore.getState().returnToMenu()
  resetMechanics()
  const session = useSessionStore.getState()
  session.startCountdown()
  session.tick(4, now)
  useSessionStore.setState({ elapsedSeconds: 30, currentBiome: 1, spawnedWaves: ['sunset-harbor-entry', 'sunset-harbor-depth'], lockedLeft: 20, lockedRight: 60 })
  useGameStore.getState().setPlayerPosition('ali', [30, 0, 0])
  useGameStore.getState().setPlayerPosition('jack', [45, 0, 0])
}

describe('telegraphed enemy attacks', () => {
  beforeEach(() => startRun(10_000))

  it('winds up visibly before the strike lands', () => {
    useSessionStore.getState().spawnEnemies([{ ...createEnemy({ id: 'brute', biome: 1, kind: 2, x: 32.2, now: 10_000 }), nextAttackAt: 0 }])
    stepDirector(COMBAT_STEP, 10_100)
    const winding = useSessionStore.getState().enemies[0]!
    expect(winding.windupUntil).toBeGreaterThan(10_100)
    expect(useSessionStore.getState().players.ali.health).toBe(useSessionStore.getState().players.ali.maxHealth)
    stepDirector(COMBAT_STEP, winding.windupUntil + 1)
    expect(useSessionStore.getState().players.ali.health).toBeLessThan(useSessionStore.getState().players.ali.maxHealth)
  })

  it('lets at most two creatures wind up on the same hero', () => {
    useSessionStore.getState().spawnEnemies([30.9, 31.6, 29.1, 28.4].map((x, index) => ({ ...createEnemy({ id: `pack-${index}`, biome: 1, kind: 1, x, now: 10_000, lane: [0.62, -0.62, 0, 0.62][index] }), nextAttackAt: 0 })))
    stepDirector(COMBAT_STEP, 10_100)
    const winding = useSessionStore.getState().enemies.filter((enemy) => enemy.windupUntil > 10_100)
    expect(winding.length).toBeLessThanOrEqual(2)
  })

  it('never lets the crowd stand inside a hero', () => {
    useSessionStore.getState().spawnEnemies([{ ...createEnemy({ id: 'inside', biome: 1, kind: 1, x: 30.2, now: 10_000 }), nextAttackAt: 99_999 }])
    stepDirector(COMBAT_STEP, 10_100)
    const enemy = useSessionStore.getState().enemies[0]!
    expect(Math.abs(enemy.x - 30)).toBeGreaterThanOrEqual(heroGap(enemy.scale) - 0.001)
  })
})
