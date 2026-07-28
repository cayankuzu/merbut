import { expect, test, type Page } from '@playwright/test'

async function startCombat(page: Page, difficultyIndex = 1) {
  await page.goto('/')
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 60_000 })
  await page.getByRole('button', { name: 'OYUNA BAŞLA' }).click()
  await page.locator('.difficulty-select button').nth(difficultyIndex).click()
  await page.getByRole('button', { name: 'SAVAŞA BAŞLA' }).click()
  await expect.poll(() => page.evaluate(() => window.__MERBUT__?.getSessionState().phase), { timeout: 10_000 }).toBe('playing')
  await expect.poll(() => page.evaluate(() => window.__MERBUT__?.getSessionState().enemies.length)).toBeGreaterThan(0)
}

test('Ali dört saniyelik pencerede en fazla dokuz alev topu atar', async ({ page }) => {
  await startCombat(page)
  const result = await page.evaluate(() => {
    const session = window.__MERBUT__!.getSessionState()
    const target = session.enemies.find((enemy) => !enemy.boss)!
    session.grantAbilityCharge('ali', 100)
    const startedAt = performance.now()
    const attempts = Array.from({ length: 12 }, (_, index) => session.launchFireball(startedAt + index * 280, 0, 0, 0))
    for (let hit = 0; hit < 12; hit += 1) {
      session.damageEnemy(target.id, 1, 'ali', startedAt + 100 + hit * 200, 'fireball')
    }
    return {
      attempts,
      chargeAfterHits: window.__MERBUT__!.getSessionState().players.ali.abilityCharge,
      reopenedAfterWindow: window.__MERBUT__!.getSessionState().launchFireball(startedAt + 4_001, 0, 0, 0),
    }
  })

  expect(result.attempts.slice(0, 9).every(Boolean)).toBe(true)
  expect(result.attempts.slice(9).every((accepted) => !accepted)).toBe(true)
  expect(result.chargeAfterHits).toBe(0)
  expect(result.reopenedAfterWindow).toBe(false)
  await expect(page.locator('.player-hud--ali .player-hud__ability span')).toContainText('0/9 ATIŞ')
})

test('Jack kalkanı aktifken kendini yeniden şarj edip zincirlenemez', async ({ page }) => {
  await startCombat(page)
  const result = await page.evaluate(() => {
    const session = window.__MERBUT__!.getSessionState()
    const target = session.enemies.find((enemy) => !enemy.boss)!
    const startedAt = performance.now()
    session.grantAbilityCharge('jack', 100, startedAt)
    const activated = session.activateShield(startedAt)
    for (let hit = 0; hit < 6; hit += 1) {
      session.damageEnemy(target.id, 1, 'jack', startedAt + 100 + hit * 300, 'melee')
    }
    session.grantAbilityCharge('jack', 100, startedAt + 2_000)
    return {
      activated,
      chargeDuringShield: window.__MERBUT__!.getSessionState().players.jack.abilityCharge,
      chainedDuringShield: window.__MERBUT__!.getSessionState().activateShield(startedAt + 2_100),
      reopenedAfterShield: window.__MERBUT__!.getSessionState().activateShield(startedAt + 4_001),
    }
  })

  expect(result).toEqual({ activated: true, chargeDuringShield: 0, chainedDuringShield: false, reopenedAfterShield: false })
  await expect(page.locator('.player-hud--jack .player-hud__ability span')).toContainText(/\d\.\d SN/)
})

test('Aku ateş yağmurunda çevresindeki diken alanı oyuncuya hasar verir', async ({ page }) => {
  await startCombat(page)
  const initialHealth = await page.evaluate(() => {
    const session = window.__MERBUT__!.getSessionState()
    const game = window.__MERBUT__!.getState()
    const template = session.enemies.find((enemy) => !enemy.boss)!
    const akuX = (game.positions.ali[0] + game.positions.jack[0]) / 2
    const now = performance.now()
    const aku = {
      ...template,
      id: 'aku-fire-rain-e2e',
      biome: 6,
      kind: 5 as const,
      title: 'Aku, Zamanın Efendisi',
      x: akuX,
      health: 1_450,
      maxHealth: 1_450,
      damage: 38,
      speed: 3,
      attackRange: 4.25,
      score: 5_000,
      scale: 3.83,
      direction: -1 as const,
      animation: 'attack' as const,
      boss: true,
      finalBoss: true,
      bossType: 'aku' as const,
      bossForm: 'normal' as const,
      special: 'aku-fire-rain' as const,
      specialStartedAt: now,
      specialUntil: now + 5_300,
      nextSpecialAt: now + 9_000,
      nextAuraAt: now,
    }
    window.__MERBUT__!.setSessionState({
      phase: 'playing',
      bossPhase: 'fight',
      activeBossId: aku.id,
      enemies: [aku],
      meteors: [{ id: 'aku-fire-rain-e2e-meteor', x: akuX, createdAt: now, impactAt: now + 4_000, landedAt: 0, damage: 0, kind: 'fire' }],
      players: {
        ali: { ...session.players.ali, health: session.players.ali.maxHealth, invulnerableUntil: 0 },
        jack: { ...session.players.jack, health: session.players.jack.maxHealth, invulnerableUntil: 0 },
      },
    })
    game.teleportPlayer('ali', akuX)
    game.teleportPlayer('jack', akuX + 7)
    return session.players.ali.maxHealth
  })

  await expect.poll(() => page.evaluate(() => window.__MERBUT__!.getSessionState().players.ali.health)).toBeLessThan(initialHealth)
  await page.waitForTimeout(600)
  await page.screenshot({ path: 'e2e-artifacts/aku-fire-rain-spike-field.png' })
})

test('Aku zaman portalı Zor modda hedef biyoma beş rastgele düşman yollar', async ({ page }) => {
  await startCombat(page, 2)
  await page.evaluate(() => {
    const session = window.__MERBUT__!.getSessionState()
    const game = window.__MERBUT__!.getState()
    const template = session.enemies.find((enemy) => !enemy.boss)!
    const now = performance.now()
    const playerX = game.positions.ali[0]
    const aku = {
      ...template,
      id: 'aku-time-portal-e2e',
      biome: 6,
      kind: 5 as const,
      title: 'Aku, Zamanın Efendisi',
      x: playerX + 7,
      health: 1_450,
      maxHealth: 1_450,
      damage: 38,
      speed: 3,
      attackRange: 4.25,
      score: 5_000,
      scale: 3.83,
      direction: -1 as const,
      animation: 'attack' as const,
      boss: true,
      finalBoss: true,
      bossType: 'aku' as const,
      bossForm: 'normal' as const,
      special: 'aku-time-portal' as const,
      specialStartedAt: now,
      specialUntil: now + 3_200,
      nextSpecialAt: now + 9_000,
    }
    window.__MERBUT__!.setSessionState({
      phase: 'playing',
      bossPhase: 'fight',
      activeBossId: aku.id,
      enemies: [aku],
      enemyProjectiles: [{
        id: 'time-portal-e2e-projectile',
        kind: 'time-portal',
        sourceId: aku.id,
        x: playerX - 0.05,
        y: 1.6,
        targetX: playerX,
        damage: 1,
        travelled: 0,
      }],
    })
    game.teleportPlayer('ali', playerX)
    game.teleportPlayer('jack', playerX + 2.1)
  })

  await expect.poll(() => page.evaluate(() => window.__MERBUT__!.getSessionState().enemies.filter((enemy) => enemy.id.startsWith('portal-enemy-')).length)).toBe(5)
  const ambush = await page.evaluate(() => {
    const session = window.__MERBUT__!.getSessionState()
    const enemies = session.enemies.filter((enemy) => enemy.id.startsWith('portal-enemy-'))
    return {
      count: enemies.length,
      kinds: enemies.map((enemy) => enemy.kind),
      allRegular: enemies.every((enemy) => !enemy.boss),
      alert: session.portalAlert?.detail ?? '',
    }
  })
  expect(ambush.count).toBe(5)
  expect(new Set(ambush.kinds).size).toBe(5)
  expect(ambush.allRegular).toBe(true)
  expect(ambush.alert).toContain('5 düşman')
  await page.waitForTimeout(600)
  await page.screenshot({ path: 'e2e-artifacts/aku-time-portal-ambush.png' })
})
