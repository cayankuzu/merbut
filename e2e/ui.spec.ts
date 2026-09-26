import { expect, test } from '@playwright/test'
import { openMainMenu, startGame, waitForAssets } from './helpers'

test.describe('Merbut arayüz doğrulaması', () => {
  test('ayarlar altı sekmeyi, beş ses kanalını ve tuş atamayı sunar', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
    await openMainMenu(page)
    await page.getByRole('button', { name: 'AYARLAR' }).click()
    const dialog = page.getByRole('dialog', { name: 'Ayarlar' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('tab')).toHaveCount(6)
    await dialog.getByRole('tab', { name: 'Ses' }).click()
    await expect(dialog.locator('input[type="range"]')).toHaveCount(5)
    const initialEffectCount = await page.evaluate(() => window.__MERBUT__?.getAudioState().effectCount ?? 0)
    await dialog.getByRole('button', { name: 'Efekti dinle' }).click()
    await expect.poll(() => page.evaluate(() => window.__MERBUT__?.getAudioState().effectCount ?? 0)).toBeGreaterThanOrEqual(initialEffectCount)
    await dialog.getByRole('tab', { name: 'Kontroller' }).click()
    await dialog.getByRole('button', { name: /Zıpla/ }).first().click()
    await page.keyboard.press('KeyQ')
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('merbut-settings') ?? '{}').state?.bindings?.ali?.jump)).toBe('KeyQ')
    await dialog.getByRole('button', { name: 'Varsayılan tuşlara dön' }).click()
    await dialog.getByRole('tab', { name: 'Erişilebilirlik' }).click()
    await expect(dialog.getByRole('switch', { name: /Parlama/ })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    expect(consoleErrors).toEqual([])
  })

  test('Kayıt sekmesi ilerlemeyi onayla sıfırlar, ayarları korur', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('merbut-progress', JSON.stringify({ state: { furthestBiome: 5, checkpoint: { biome: 5, difficulty: 'hard' }, bestTimes: { hard: 900 }, bestRanks: { hard: 'A' }, achievements: { 'first-blood': 1 }, stats: { runs: 4, victories: 1, kills: 210, falls: 3, perfectDodges: 9, bestCombo: 31, playSeconds: 3600 }, prologueSeen: true }, version: 2 }))
      localStorage.setItem('merbut-settings', JSON.stringify({ state: { screenShake: 0.3 }, version: 1 }))
    })
    await openMainMenu(page)
    await expect(page.getByRole('button', { name: 'DEVAM ET' })).toBeVisible()
    await page.getByRole('button', { name: 'AYARLAR' }).click()
    const dialog = page.getByRole('dialog', { name: 'Ayarlar' })
    await dialog.getByRole('tab', { name: 'Kayıt' }).click()
    await expect(dialog.getByLabel('Kayıt özeti')).toContainText('6 / 10')
    await expect(dialog.getByLabel('Kayıt özeti')).toContainText('1 / 4')

    // Backing out leaves everything in place.
    await dialog.getByRole('button', { name: /İlerlemeyi sıfırla/ }).click()
    await expect(dialog.getByRole('alertdialog')).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'VAZGEÇ' })).toBeFocused()
    await dialog.getByRole('button', { name: 'VAZGEÇ' }).click()
    expect(await page.evaluate(() => window.__MERBUT__!.getProgressState().furthestBiome)).toBe(5)

    await dialog.getByRole('button', { name: /İlerlemeyi sıfırla/ }).click()
    await dialog.getByRole('button', { name: 'EVET, İLERLEMEYİ SİL' }).click()
    await expect(dialog.getByRole('status')).toContainText('İlerleme sıfırlandı')
    await expect(dialog.getByLabel('Kayıt özeti')).toContainText('1 / 10')
    const progress = await page.evaluate(() => window.__MERBUT__!.getProgressState())
    expect(progress).toMatchObject({ furthestBiome: 0, checkpoint: null, achievements: {}, bestTimes: {}, prologueSeen: false })
    expect(progress.stats.kills).toBe(0)
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('merbut-settings') ?? '{}').state?.screenShake)).toBe(0.3)

    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', { name: 'DEVAM ET' })).toHaveCount(0)
    await page.getByRole('button', { name: 'BÖLÜM SEÇ' }).click()
    await expect(page.locator('.album__tracks button:not([disabled])')).toHaveCount(1)
  })

  test('fabrika ayarları her şeyi varsayılana döndürüp oyunu yeniden başlatır', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('merbut-settings', JSON.stringify({ state: { screenShake: 0.3, reduceFlashes: true }, version: 1 }))
      localStorage.setItem('merbut-camera-distance', '19')
    })
    await openMainMenu(page)
    await page.getByRole('button', { name: 'AYARLAR' }).click()
    const dialog = page.getByRole('dialog', { name: 'Ayarlar' })
    await dialog.getByRole('tab', { name: 'Kayıt' }).click()
    await dialog.getByRole('button', { name: /Fabrika ayarlarına dön/ }).click()
    await Promise.all([
      page.waitForEvent('load'),
      dialog.getByRole('button', { name: 'EVET, HER ŞEYİ SIFIRLA' }).click(),
    ])
    await waitForAssets(page)
    const settings = await page.evaluate(() => JSON.parse(localStorage.getItem('merbut-settings') ?? '{"state":{}}').state as { screenShake?: number; reduceFlashes?: boolean })
    expect(settings.screenShake ?? 1).toBe(1)
    expect(settings.reduceFlashes ?? false).toBe(false)
    expect(await page.evaluate(() => localStorage.getItem('merbut-camera-distance'))).toBeNull()
  })

  test('savaş HUD’u dört öğeyle sınırlı ve duraklatmada ayarlar açılır', async ({ page }) => {
    await startGame(page)
    await expect(page.locator('.hero-card')).toHaveCount(2)
    await expect(page.locator('.objective-chip')).toBeVisible()
    await expect(page.locator('.hero-card__portrait img')).toHaveCount(2)
    await expect(page.locator('.combat-hud canvas')).toHaveCount(0)
    for (const legacy of ['.score-stack', '.enemy-roster', '.combat-flow', '.player-hud']) await expect(page.locator(legacy)).toHaveCount(0)
    await page.keyboard.press('Escape')
    await expect(page.locator('.pause-screen')).toBeVisible()
    await expect(page.locator('.pause-screen__actions button')).toHaveCount(5)
    await page.getByRole('button', { name: 'AYARLAR' }).click()
    await expect(page.getByLabel('Kamera uzaklığı')).toBeVisible()
    await page.getByRole('dialog', { name: 'Ayarlar' }).getByRole('button', { name: 'GERİ' }).click()
    await page.screenshot({ path: 'e2e-artifacts/pause-menu.png' })
    await page.keyboard.press('Escape')
    await expect.poll(() => page.evaluate(() => window.__MERBUT__?.getSessionState().phase)).toBe('playing')
  })

  test('boss barı, yenilgi, zafer ve final ekranları özet gösterir', async ({ page }) => {
    await page.goto('/')
    await waitForAssets(page)
    await page.evaluate(() => {
      const session = window.__MERBUT__!.getSessionState()
      session.setPhase('playing')
      session.spawnEnemies([{
        id: 'visual-shadow', biome: 3, kind: 3, title: 'Aku’nun Gölgesi', x: 0,
        health: 900, maxHealth: 900, damage: 18, speed: 4.8, attackRange: 3.7,
        attackCooldown: 1, score: 5_000, scale: 2.8, accent: '#ff285f', direction: -1,
        animation: 'idle', attackUntil: 0, nextAttackAt: 0, deadAt: 0, lastHitBy: null,
        boss: true, finalBoss: false, bossType: 'shadow', bossForm: 'normal', mimicKind: null,
        special: 'none', specialStartedAt: 0, specialUntil: 0, nextSpecialAt: 0,
        specialHitMask: 0, nextAuraAt: 0, variant: 'normal', z: 0, vx: 0, stunUntil: 0, windupUntil: 0, spawnedAt: 0,
      }])
    })
    await expect(page.locator('.boss-bar')).toHaveCount(1)
    await expect(page.locator('.boss-bar__track b')).toHaveCount(1)
    await page.evaluate(() => window.__MERBUT__!.getSessionState().setPhase('defeat'))
    await expect(page.locator('.result-screen.is-defeat .run-summary')).toBeVisible()
    await expect(page.locator('.run-summary__heroes article')).toHaveCount(2)
    await page.evaluate(() => window.__MERBUT__!.getSessionState().setPhase('victory'))
    await expect(page.locator('.result-screen:not(.is-defeat) .run-summary')).toBeVisible()
    await page.evaluate(() => {
      const session = window.__MERBUT__!.getSessionState()
      const now = window.__MERBUT__!.now()
      session.setPhase('playing')
      session.startEnding('visual-shadow', now - 8_000)
      session.tick(0, now)
    })
    await expect(page.locator('.ending-overlay--continued .run-summary')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'HZ. ALİ’NİN ZAMANI' })).toBeVisible()
    await page.screenshot({ path: 'e2e-artifacts/continued-summary.png' })
  })
})
