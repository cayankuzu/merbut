import { expect, test } from '@playwright/test'
import { openMainMenu, startGame } from './helpers'

test('prolog, diyar başlık kartı ve ilk diyalog oyunu açar', async ({ page }) => {
  test.setTimeout(90_000)
  await openMainMenu(page)
  await page.getByRole('button', { name: 'YENİ OYUN' }).click()
  await page.getByRole('button', { name: 'SAVAŞA BAŞLA' }).click()
  await expect(page.locator('.prologue')).toBeVisible()
  await expect(page.locator('.prologue footer')).toContainText('1 / 6')
  await page.keyboard.press('Enter')
  await expect(page.locator('.prologue footer')).toContainText('2 / 6')
  await page.keyboard.press('Escape')
  await expect(page.locator('.title-card')).toContainText('Aku Metropolü')
  await expect(page.locator('.title-card')).toContainText('Neon tabelaları kır')
  await expect.poll(() => page.evaluate(() => window.__MERBUT__!.getSessionState().phase), { timeout: 8_000 }).toBe('playing')
  await expect(page.locator('.dialogue')).toBeVisible({ timeout: 5_000 })
  await expect(page.locator('.dialogue strong')).toContainText(/SAMURAY JACK|HZ\. ALİ|AKU/i)
  const progress = await page.evaluate(() => window.__MERBUT__!.getProgressState())
  expect(progress.prologueSeen).toBe(true)
  expect(progress.checkpoint).toMatchObject({ biome: 0 })
})

test('ilk yenilen düşman başarımı açar ve bildirim gösterir', async ({ page }) => {
  await startGame(page)
  await expect.poll(() => page.evaluate(() => window.__MERBUT__!.getSessionState().enemies.length), { timeout: 15_000 }).toBeGreaterThan(0)
  await page.evaluate(() => {
    const api = window.__MERBUT__!
    const enemy = api.getSessionState().enemies[0]!
    api.getSessionState().damageEnemy(enemy.id, 9_999, 'jack', api.now())
  })
  await expect(page.locator('.achievement-toast')).toContainText('İlk Kan')
  expect(await page.evaluate(() => Boolean(window.__MERBUT__!.getProgressState().achievements['first-blood']))).toBe(true)
})

test('kayıt noktasından devam et ve bölüm seçimi ilgili diyardan başlatır', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('merbut-progress', JSON.stringify({ state: { furthestBiome: 4, checkpoint: { biome: 4, difficulty: 'hard' }, bestTimes: {}, bestRanks: {}, achievements: {}, stats: { runs: 0, victories: 0, kills: 0, falls: 0, perfectDodges: 0, bestCombo: 0, playSeconds: 0 }, prologueSeen: true }, version: 1 })))
  await openMainMenu(page)
  await expect(page.getByRole('button', { name: 'DEVAM ET' })).toBeVisible()
  await expect(page.locator('.main-menu__hint')).toContainText('Yeşim Harabeleri')
  await page.getByRole('button', { name: 'DEVAM ET' }).click()
  await expect(page.locator('.controls-screen header small')).toContainText('YEŞİM HARABELERİ')
  await expect(page.getByRole('button', { name: /Zor/ })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'SAVAŞA BAŞLA' }).click()
  await expect.poll(() => page.evaluate(() => window.__MERBUT__!.getSessionState().phase), { timeout: 8_000 }).toBe('playing')
  const state = await page.evaluate(() => {
    const api = window.__MERBUT__!
    return { biome: api.getSessionState().currentBiome, x: api.getState().positions.ali[0] }
  })
  // A v1 save pointed at the old fifth realm; v3 migrates it to Yeşim Harabeleri (index 6).
  expect(state.biome).toBe(6)
  expect(state.x).toBeGreaterThan(-9 + 6 * 36)

  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'ANA MENÜYE DÖN' }).click()
  await page.getByRole('button', { name: 'BÖLÜM SEÇ' }).click()
  await expect(page.locator('.album__tracks button:not([disabled])')).toHaveCount(7)
  await expect(page.locator('.album__tracks button[disabled]')).toHaveCount(3)
})
