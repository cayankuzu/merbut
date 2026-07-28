import { expect, test } from '@playwright/test'

test('oyun HUD ön izlemeleri, dünya can barları ve müzik kontrolleri okunabilir', async ({ page }) => {
  test.setTimeout(90_000)
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('youtube.com') && !message.text().includes('compute-pressure')) consoleErrors.push(message.text())
  })

  await page.setViewportSize({ width: 1640, height: 900 })
  await page.goto('/')
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 60_000 })
  await page.getByRole('button', { name: 'OYUNA BAŞLA' }).click()
  await expect(page.locator('.controls-screen')).toBeVisible()
  await page.getByRole('button', { name: 'SAVAŞA BAŞLA' }).click()
  await expect.poll(() => page.evaluate(() => window.__MERBUT__?.getSessionState().phase), { timeout: 10_000 }).toBe('playing')

  await expect(page.locator('.player-hud')).toHaveCount(2)
  await expect(page.locator('.player-hud .character-preview img')).toHaveCount(2)
  await expect(page.locator('.player-hud .character-preview canvas')).toHaveCount(0)
  await expect(page.locator('.world-health--player')).toHaveCount(2)
  await expect(page.locator('.score-stack')).toBeVisible()
  await expect(page.locator('.score-stack > div')).toHaveCount(2)
  await expect(page.locator('.score-stack')).not.toContainText('KILL')
  await expect(page.locator('.combat-flow')).toBeVisible()
  await expect(page.locator('.enemy-roster')).toBeVisible()
  await page.waitForTimeout(900)
  await page.screenshot({ path: 'e2e-artifacts/gameplay-hud-expanded-v6.png' })

  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'AYARLAR' }).click()
  await expect(page.locator('.pause-settings__music-preview')).toBeVisible()
  await expect(page.getByRole('button', { name: 'BAŞA SAR' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'TEKRAR' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'BAŞA SAR' }).click()
  await page.screenshot({ path: 'e2e-artifacts/pause-music-controls-v6.png' })
  expect(consoleErrors).toEqual([])
})
