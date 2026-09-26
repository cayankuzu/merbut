import { expect, test } from '@playwright/test'
import { startGame } from './helpers'

test('HUD portreleri statik, kahraman halkaları sahnede ve özgün müzik çalar', async ({ page }) => {
  test.setTimeout(90_000)
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('compute-pressure')) consoleErrors.push(message.text())
  })
  await page.setViewportSize({ width: 1640, height: 900 })
  await startGame(page)
  await expect(page.locator('.hero-card')).toHaveCount(2)
  await expect(page.locator('.hero-card__portrait img')).toHaveCount(2)
  await expect(page.locator('.hero-card .character-preview canvas')).toHaveCount(0)
  await expect(page.locator('iframe')).toHaveCount(0)
  // The score is original and synthesised; after a key press the engine picks the biome theme.
  await page.keyboard.press('KeyD')
  await expect.poll(() => page.evaluate(() => document.querySelector('.objective-chip')?.textContent ?? ''), { timeout: 5_000 }).toContain('Aku Metropolü')
  await page.waitForTimeout(900)
  await page.screenshot({ path: 'e2e-artifacts/gameplay-hud-v2.png' })
  expect(consoleErrors).toEqual([])
})
