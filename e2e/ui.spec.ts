import { expect, test } from '@playwright/test'

test.describe('Merbut arayüz doğrulaması', () => {
  test('ana menü, ses ayarları ve duraklatma akışı çalışır', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error' && !message.text().includes('youtube.com')) consoleErrors.push(message.text())
    })

    await page.goto('/')
    await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 60_000 })
    await expect(page.locator('.menu-screen h1')).toHaveText('MERBUT')
    await expect(page.locator('body')).not.toBeEmpty()
    await expect(page.locator('.vite-error-overlay')).toHaveCount(0)

    await expect(page.locator('.audio-settings__toggle')).toHaveCount(0)
    await page.getByRole('button', { name: 'AYARLAR' }).click()
    await expect(page.locator('.audio-settings')).toHaveClass(/is-open/)
    await expect(page.locator('.audio-settings input[type="range"]')).toHaveCount(3)
    const initialEffectCount = await page.evaluate(() => window.__MERBUT__?.getAudioState().effectCount ?? 0)
    await page.locator('.audio-settings__test').click()
    await expect.poll(() => page.evaluate(() => window.__MERBUT__?.getAudioState().effectCount ?? 0)).toBeGreaterThan(initialEffectCount)
    await page.getByRole('button', { name: 'DURAKLAT' }).click()
    await expect(page.getByRole('button', { name: 'ÇAL' })).toHaveAttribute('aria-pressed', 'false')
    await page.getByRole('button', { name: 'Ayarları kapat' }).click()
    await expect(page.locator('.audio-settings')).not.toHaveClass(/is-open/)

    await page.getByRole('button', { name: 'OYUNA BAŞLA' }).click()
    await expect(page.locator('.controls-screen')).toBeVisible()
    await page.locator('.difficulty-select button').nth(1).click()
    await page.getByRole('button', { name: 'SAVAŞA BAŞLA' }).click()
    await expect.poll(
      () => page.evaluate(() => window.__MERBUT__?.getSessionState().phase),
      { timeout: 15_000 },
    ).toBe('playing')
    await expect(page.locator('.player-hud')).toHaveCount(2)
    await expect(page.locator('.enemy-roster')).toHaveCount(1)
    await expect(page.locator('.combat-flow')).toBeVisible()
    await expect(page.locator('.world-health--player')).toHaveCount(2)

    await page.keyboard.press('Escape')
    await expect(page.locator('.pause-screen')).toBeVisible()
    await expect(page.locator('.pause-screen__actions button')).toHaveCount(5)
    await page.getByRole('button', { name: 'AYARLAR' }).click()
    await expect(page.getByLabel('Kamera uzaklığı')).toBeVisible()
    await page.getByRole('button', { name: 'GERİ' }).click()
    await page.screenshot({ path: 'e2e-artifacts/pause-menu.png' })
    await page.keyboard.press('Escape')
    await expect.poll(() => page.evaluate(() => window.__MERBUT__?.getSessionState().phase)).toBe('playing')
    expect(consoleErrors).toEqual([])
  })

  test('boss için yalnızca üst bar ve tüm sonuçlarda özet görünür', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 60_000 })
    await page.evaluate(() => {
      const session = window.__MERBUT__!.getSessionState()
      session.setPhase('playing')
      session.spawnEnemies([{
        id: 'visual-shadow', biome: 3, kind: 3, title: "Aku’nun Gölgesi", x: 0,
        health: 900, maxHealth: 900, damage: 18, speed: 4.8, attackRange: 3.7,
        attackCooldown: 1, score: 5_000, scale: 2.8, accent: '#ff285f', direction: -1,
        animation: 'idle', attackUntil: 0, nextAttackAt: 0, deadAt: 0, lastHitBy: null,
        boss: true, finalBoss: false, bossType: 'shadow', bossForm: 'normal', mimicKind: null,
        special: 'none', specialStartedAt: 0, specialUntil: 0, nextSpecialAt: 0,
        specialHitMask: 0, nextAuraAt: 0,
      }])
    })
    await expect(page.locator('.boss-hud')).toHaveCount(1)
    await expect(page.locator('.world-health--boss')).toHaveCount(0)
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'e2e-artifacts/boss-hud.png' })

    await page.evaluate(() => window.__MERBUT__!.getSessionState().setPhase('defeat'))
    await expect(page.locator('.result-screen.is-defeat .run-summary')).toBeVisible()
    await expect(page.locator('.run-summary__heroes article')).toHaveCount(2)
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'e2e-artifacts/defeat-summary.png' })

    await page.evaluate(() => window.__MERBUT__!.getSessionState().setPhase('victory'))
    await expect(page.locator('.result-screen:not(.is-defeat) .run-summary')).toBeVisible()
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'e2e-artifacts/victory-summary.png' })

    await page.evaluate(() => {
      const session = window.__MERBUT__!.getSessionState()
      const now = performance.now()
      session.setPhase('playing')
      session.startEnding('visual-shadow', now - 8_000)
      session.tick(0, now)
    })
    await expect(page.locator('.ending-overlay--continued .run-summary')).toBeVisible()
    await page.waitForTimeout(1_200)
    await page.screenshot({ path: 'e2e-artifacts/continued-summary.png' })
  })
})
