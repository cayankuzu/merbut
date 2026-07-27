import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DIFFICULTIES } from '../config/difficulty'
import type { EnemyState } from '../types/session'
import { useSessionStore } from './sessionStore'

const enemy = (): EnemyState => ({
  id: 'test-enemy', biome: 0, kind: 1, title: 'Myrkhan', x: 1, health: 70, maxHealth: 70,
  damage: 10, speed: 1, attackRange: 1.5, attackCooldown: 1, score: 120, scale: 1,
  accent: '#f00', direction: -1, animation: 'walk', attackUntil: 0, nextAttackAt: 0,
  deadAt: 0, lastHitBy: null, boss: false, finalBoss: false, bossType: null,
  bossForm: 'normal', mimicKind: null,
  special: 'none', specialStartedAt: 0, specialUntil: 0, nextSpecialAt: 0,
  specialHitMask: 0, nextAuraAt: 0,
})

const aku = (): EnemyState => ({
  ...enemy(), id: 'aku', title: 'Aku, Zamanın Efendisi', health: 1_000, maxHealth: 1_000,
  damage: 38, speed: 2, attackRange: 2.9, score: 5_000, scale: 1.85, accent: '#6f6',
  boss: true, finalBoss: true, bossType: 'aku', nextSpecialAt: 4_000,
})

describe('session store', () => {
  beforeEach(() => {
    useSessionStore.getState().returnToMenu()
    useSessionStore.getState().setDifficulty('normal')
  })

  it('charges abilities through combat and allows unlimited Ali shots during the active window', () => {
    const session = useSessionStore.getState()
    session.startCountdown()
    session.tick(4, 10_000)
    expect(useSessionStore.getState().launchFireball(10_000, 0, 0, 0)).toBe(false)
    session.grantAbilityCharge('ali', 100)
    for (let shot = 0; shot < 18; shot += 1) {
      expect(useSessionStore.getState().launchFireball(10_000 + shot * 280, 0, 0, 0)).toBe(true)
    }
    expect(useSessionStore.getState().launchFireball(15_100, 0, 0, 0)).toBe(true)
    expect(useSessionStore.getState().players.ali.abilityShots).toBe(19)
    expect(useSessionStore.getState().players.ali.abilityActiveUntil).toBe(16_000)
    expect(useSessionStore.getState().players.ali.abilityCharge).toBe(0)
    expect(useSessionStore.getState().launchFireball(16_100, 0, 0, 0)).toBe(false)
  })

  it('makes every difficulty materially change player survival resources', () => {
    useSessionStore.getState().setDifficulty('easy')
    expect(useSessionStore.getState().players.ali).toMatchObject({ health: 145, maxHealth: 145, lives: 5 })
    useSessionStore.getState().setDifficulty('soulslike')
    expect(useSessionStore.getState().players.jack).toMatchObject({ health: 120, maxHealth: 120, lives: 6 })
  })

  it('runs Zemzem as visible gradual healing instead of an instant full heal', () => {
    const rules = DIFFICULTIES.normal
    const session = useSessionStore.getState()
    session.startCountdown()
    session.tick(4, 10_000)
    session.damagePlayer('ali', 30, 10_100)
    session.addPickup({ id: 'zemzem-test', x: 2, type: 'zemzem' })
    session.collectPickup('zemzem-test', 'ali', 10_200)
    expect(useSessionStore.getState().players.ali.health).toBe(rules.playerHealth - 30)
    expect(useSessionStore.getState().players.ali.healOverTime).toBe(rules.healAmount)
    expect(useSessionStore.getState().impacts.at(-1)?.kind).toBe('holy')
    session.tick(1, 11_200)
    expect(useSessionStore.getState().players.ali.health).toBeGreaterThan(rules.playerHealth - 30)
  })

  it('shifts every world timer while paused, including falling meteors', () => {
    const now = vi.spyOn(performance, 'now')
    const session = useSessionStore.getState()
    session.startCountdown()
    session.tick(4, 10_000)
    session.addMeteors([{ id: 'pause-meteor', x: 0, createdAt: 12_000, impactAt: 14_000, landedAt: 0, damage: 20, kind: 'shadow' }])
    now.mockReturnValue(11_000)
    session.pause()
    now.mockReturnValue(16_000)
    session.resume()
    expect(useSessionStore.getState().meteors[0]).toMatchObject({ createdAt: 17_000, impactAt: 19_000 })
    now.mockRestore()
  })

  it('freezes a portal victim for exactly three gameplay seconds', () => {
    const now = vi.spyOn(performance, 'now')
    const session = useSessionStore.getState()
    session.startCountdown()
    session.tick(4, 10_000)
    session.freezePlayer('jack', 12_000)
    expect(useSessionStore.getState().players.jack.frozenUntil).toBe(15_000)
    now.mockReturnValue(12_500)
    session.pause()
    now.mockReturnValue(14_500)
    session.resume()
    expect(useSessionStore.getState().players.jack.frozenUntil).toBe(17_000)
    now.mockRestore()
  })

  it('shows portal travel information and clears it after the alert window', () => {
    const session = useSessionStore.getState()
    session.showPortalAlert('ZAMAN YARILDI', 'Yeşim Harabeleri biyomuna savruldunuz', 12_000)
    expect(useSessionStore.getState().portalAlert).toMatchObject({
      title: 'ZAMAN YARILDI',
      detail: 'Yeşim Harabeleri biyomuna savruldunuz',
      expiresAt: 16_200,
    })
    session.tick(0.1, 16_201)
    expect(useSessionStore.getState().portalAlert).toBeNull()
  })

  it('caps simultaneous combat impacts during chained attacks', () => {
    const session = useSessionStore.getState()
    for (let index = 0; index < 60; index += 1) {
      session.addImpact({ kind: 'ember', x: index, y: 1, createdAt: 10_000, duration: 2_000, lethal: false })
    }
    expect(useSessionStore.getState().impacts).toHaveLength(28)
    expect(useSessionStore.getState().impacts.at(-1)?.x).toBe(59)
  })

  it('applies final prayer lifesteal and time-based regeneration to both sides', () => {
    const session = useSessionStore.getState()
    session.spawnEnemies([aku()])
    session.startFinalEncounter('aku', 1_000)
    session.tick(0.1, 8_700)
    expect(useSessionStore.getState()).toMatchObject({ phase: 'playing', bossPhase: 'fight', lockedLeft: -4.8 })
    useSessionStore.getState().damagePlayer('ali', 30, 9_000)
    const beforeHit = useSessionStore.getState().players.ali.health
    useSessionStore.getState().damageEnemy('aku', 100, 'ali', 9_600)
    const afterHit = useSessionStore.getState().players.ali.health
    expect(afterHit).toBeGreaterThan(beforeHit)
    const bossAfterHit = useSessionStore.getState().enemies[0]!.health
    useSessionStore.getState().tick(1, 10_600)
    expect(useSessionStore.getState().players.ali.health).toBeGreaterThan(afterHit)
    expect(useSessionStore.getState().enemies[0]!.health).toBeGreaterThan(bossAfterHit)
  })

  it('awards score and charge for every hit, then adds kill score', () => {
    const session = useSessionStore.getState()
    session.spawnEnemies([enemy()])
    expect(session.damageEnemy('test-enemy', 20, 'jack', 1_000)).toBe(false)
    const afterHit = useSessionStore.getState().players.jack
    expect(afterHit.score).toBeGreaterThan(0)
    expect(afterHit.abilityCharge).toBeGreaterThan(0)
    expect(useSessionStore.getState().damageEnemy('test-enemy', 100, 'jack', 1_100)).toBe(true)
    const afterKill = useSessionStore.getState().players.jack
    expect(afterKill.score).toBeGreaterThan(afterHit.score + 100)
    expect(afterKill.kills).toBe(1)
  })

  it('uses the selected life count and revives after the configured delay', () => {
    const rules = DIFFICULTIES.normal
    const session = useSessionStore.getState()
    session.startCountdown()
    session.tick(4, 20_000)
    expect(useSessionStore.getState().damagePlayer('ali', rules.playerHealth, 20_100)).toBe('down')
    expect(useSessionStore.getState().players.ali.lives).toBe(rules.playerLives - 1)
    expect(useSessionStore.getState().players.ali.dead).toBe(true)
    useSessionStore.getState().tick(rules.respawnSeconds - 0.1, 20_100 + rules.respawnSeconds * 1_000 - 1)
    expect(useSessionStore.getState().players.ali.dead).toBe(true)
    useSessionStore.getState().tick(0.2, 20_100 + rules.respawnSeconds * 1_000 + 1)
    expect(useSessionStore.getState().players.ali.dead).toBe(false)
    expect(useSessionStore.getState().players.ali.health).toBe(rules.playerHealth)
  })

  it('runs the boss Zemzem intro and expands both health bars', () => {
    const session = useSessionStore.getState()
    session.startBossEncounter('shadow', 1_000)
    session.tick(0.1, 2_500)
    expect(useSessionStore.getState().bossPhase).toBe('drinking')
    expect(useSessionStore.getState().players.ali.maxHealth).toBe(DIFFICULTIES.normal.bossPlayerHealth)
    expect(useSessionStore.getState().players.jack.abilityCharge).toBe(100)
    session.tick(0.1, 9_700)
    expect(useSessionStore.getState().phase).toBe('playing')
    expect(useSessionStore.getState().bossPhase).toBe('fight')
  })

  it('uses boss Zemzem as a full difficulty-specific life checkpoint', () => {
    useSessionStore.getState().setDifficulty('hard')
    useSessionStore.getState().startCountdown()
    useSessionStore.getState().tick(4, 10_000)
    useSessionStore.getState().damagePlayer('ali', 10_000, 10_100)
    useSessionStore.getState().startBossEncounter('shadow-hard', 11_000)
    useSessionStore.getState().tick(0.1, 12_500)
    expect(useSessionStore.getState().players.ali).toMatchObject({ lives: DIFFICULTIES.hard.playerLives, dead: false })
  })

  it('restores the full survival checkpoint after the shadow boss', () => {
    const rules = DIFFICULTIES.normal
    const session = useSessionStore.getState()
    session.startCountdown()
    session.tick(4, 30_000)
    session.damagePlayer('ali', rules.playerHealth * 3, 30_100)
    expect(useSessionStore.getState().players.ali.lives).toBe(0)
    useSessionStore.getState().finishBossEncounter(30_200)
    expect(useSessionStore.getState().players.ali).toMatchObject({
      lives: rules.playerLives,
      dead: false,
      maxHealth: rules.playerHealth,
    })
    expect(useSessionStore.getState().players.ali.health).toBeGreaterThan(0)
  })

  it('grants a short recovery window when a cleared biome advances', () => {
    const session = useSessionStore.getState()
    session.startCountdown()
    session.tick(4, 40_000)
    session.damagePlayer('ali', 60, 40_100)
    const before = useSessionStore.getState().players.ali.health
    const livesBefore = useSessionStore.getState().players.ali.lives
    useSessionStore.getState().setCurrentBiome(1, 72, 41_000)
    expect(useSessionStore.getState().lockedLeft).toBe(28.25)
    const recovered = useSessionStore.getState().players.ali
    expect(recovered.health).toBeGreaterThan(before)
    expect(recovered.health).toBeLessThanOrEqual(recovered.maxHealth)
    expect(recovered.lives).toBe(Math.min(DIFFICULTIES.normal.playerLives, livesBefore + 1))
    expect(recovered.invulnerableUntil).toBe(42_000)
  })

  it('revives an eliminated partner with one life after the team clears a biome', () => {
    const rules = DIFFICULTIES.normal
    const session = useSessionStore.getState()
    session.startCountdown()
    session.tick(4, 45_000)
    session.damagePlayer('jack', rules.playerHealth * rules.playerLives, 45_100)
    expect(useSessionStore.getState().players.jack).toMatchObject({ lives: 0, dead: true })
    useSessionStore.getState().setCurrentBiome(1, 72, 46_000)
    expect(useSessionStore.getState().players.jack).toMatchObject({
      lives: 1,
      dead: false,
      respawnAt: 0,
      health: rules.playerHealth,
    })
  })

  it('awakens protected final-fight lives for a fallen hero when the final prayer begins', () => {
    const rules = DIFFICULTIES.normal
    const session = useSessionStore.getState()
    session.startCountdown()
    session.tick(4, 50_000)
    session.damagePlayer('jack', rules.playerHealth * 3, 50_100)
    expect(useSessionStore.getState().players.jack.lives).toBe(0)
    useSessionStore.getState().startFinalEncounter('aku', 50_200)
    expect(useSessionStore.getState().players.jack).toMatchObject({
      lives: rules.playerLives,
      dead: false,
      health: rules.bossPlayerHealth,
      maxHealth: rules.bossPlayerHealth,
    })
  })

  it('restores the selected difficulty life pool for the final prayer', () => {
    useSessionStore.getState().setDifficulty('hard')
    useSessionStore.getState().startCountdown()
    useSessionStore.getState().tick(4, 59_000)
    useSessionStore.getState().damagePlayer('ali', 10_000, 59_100)
    useSessionStore.getState().startFinalEncounter('aku-hard', 60_000)
    expect(useSessionStore.getState().players.ali.lives).toBe(DIFFICULTIES.hard.playerLives)

    useSessionStore.getState().returnToMenu()
    useSessionStore.getState().setDifficulty('soulslike')
    useSessionStore.getState().startCountdown()
    useSessionStore.getState().tick(4, 60_100)
    useSessionStore.getState().damagePlayer('ali', 10_000, 60_200)
    useSessionStore.getState().startFinalEncounter('aku-souls', 61_000)
    expect(useSessionStore.getState().players.ali.lives).toBe(DIFFICULTIES.soulslike.playerLives)
  })
})
