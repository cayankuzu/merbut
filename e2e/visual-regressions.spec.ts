import { expect, test } from '@playwright/test'
import { openMainMenu, startGame } from './helpers'

test('Aku gölgesinin kılıcı galeride ve oyun modelinde görünür', async ({ page }) => {
  await page.setViewportSize({ width: 1500, height: 920 })
  await openMainMenu(page)
  await page.getByRole('button', { name: 'KARAKTERLER' }).click()
  await page.locator('.character-gallery__strip button').filter({ hasText: 'Aku’nun Gölgesi' }).click()
  await expect(page.getByRole('heading', { name: 'Aku’nun Gölgesi' })).toBeVisible()
  await page.waitForTimeout(1_000)
  await page.screenshot({ path: 'e2e-artifacts/shadow-sword-gallery.png' })

  await page.getByRole('button', { name: 'Karakter arşivini kapat' }).click()
  await page.evaluate(() => {
    const api = window.__MERBUT__!
    api.getSessionState().setPhase('playing')
    api.setSessionState({
      activeBossId: 'visual-shadow-sword',
      bossPhase: 'fight',
      enemies: [{
        id: 'visual-shadow-sword', biome: 3, kind: 3, title: 'Aku’nun Gölgesi', x: 0,
        health: 900, maxHealth: 900, damage: 18, speed: 4.8, attackRange: 3.7,
        attackCooldown: 1, score: 5_000, scale: 2.8, accent: '#ff285f', direction: -1,
        animation: 'idle', attackUntil: 0, nextAttackAt: window.__MERBUT__!.now() + 60_000, deadAt: 0, lastHitBy: null,
        boss: true, finalBoss: false, bossType: 'shadow', bossForm: 'normal', mimicKind: null,
        special: 'none', specialStartedAt: 0, specialUntil: 0, nextSpecialAt: window.__MERBUT__!.now() + 60_000,
        specialHitMask: 0, nextAuraAt: window.__MERBUT__!.now() + 60_000,
        variant: 'normal', z: 0, vx: 0, stunUntil: 0, windupUntil: 0, spawnedAt: 0,
      }],
    })
    api.getState().teleportPlayer('ali', -8)
    api.getState().teleportPlayer('jack', 8)
  })
  await page.waitForTimeout(1_000)
  await page.screenshot({ path: 'e2e-artifacts/shadow-sword-game.png' })
})

test('normal düşmanların dünya can barları accent renklerini korur', async ({ page }) => {
  await page.setViewportSize({ width: 1500, height: 920 })
  await startGame(page)
  await expect.poll(() => page.evaluate(() => window.__MERBUT__?.getSessionState().enemies.length), { timeout: 10_000 }).toBeGreaterThan(0)
  await page.evaluate(() => {
    const api = window.__MERBUT__!
    const session = api.getSessionState()
    const source = session.enemies.find((enemy) => !enemy.boss)!
    api.setSessionState({
      enemies: [
        { ...source, id: 'health-red', x: -3, health: source.maxHealth, accent: '#ff321f', animation: 'idle' },
        { ...source, id: 'health-green', x: 0, health: source.maxHealth * 0.66, accent: '#26ff76', animation: 'idle' },
        { ...source, id: 'health-blue', x: 3, health: source.maxHealth * 0.33, accent: '#28a8ff', animation: 'idle' },
      ],
    })
    api.getState().teleportPlayer('ali', -7)
    api.getState().teleportPlayer('jack', 7)
  })
  await page.waitForTimeout(1_000)
  await page.screenshot({ path: 'e2e-artifacts/enemy-health-colors.png' })
})
