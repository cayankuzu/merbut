import { expect, test } from '@playwright/test'

const EXPECTED_PROFILES = [
  { preference: 'minimal', tier: 'minimal', dpr: '0.75' },
  { preference: 'performance', tier: 'performance', dpr: '1.00' },
  { preference: 'balanced', tier: 'balanced', dpr: '1.15' },
  { preference: 'high', tier: 'high', dpr: '1.60' },
] as const

test('manuel grafik profilleri gerçek render çözünürlüğünü değiştirir ve saklanır', async ({ page }) => {
  test.setTimeout(90_000)
  await page.goto('/')
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 60_000 })
  await page.getByRole('button', { name: 'AYARLAR', exact: true }).click()

  let previousBackingWidth = 0
  for (const profile of EXPECTED_PROFILES) {
    await page.locator(`input[name="graphics-quality"][value="${profile.preference}"]`).check({ force: true })

    const scene = page.locator('.game-canvas')
    await expect(scene).toHaveAttribute('data-graphics-tier', profile.tier)
    await expect(scene).toHaveAttribute('data-render-dpr', profile.dpr)
    await expect(scene).toHaveAttribute('data-quality-factor', '1.00')

    const backingWidth = await scene.locator('canvas').evaluate((canvas) => canvas.width)
    expect(backingWidth).toBeGreaterThan(previousBackingWidth)
    previousBackingWidth = backingWidth
  }

  await page.reload()
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 60_000 })
  await page.getByRole('button', { name: 'AYARLAR', exact: true }).click()
  await expect(page.locator('input[name="graphics-quality"][value="high"]')).toBeChecked()
  await expect(page.locator('.game-canvas')).toHaveAttribute('data-render-dpr', '1.60')

  await page.getByRole('button', { name: 'Ayarları kapat' }).click()
  await page.getByRole('button', { name: 'OYUNA BAŞLA' }).click()
  await page.getByRole('button', { name: 'SAVAŞA BAŞLA' }).click()
  await expect(page.locator('.player-hud')).toHaveCount(2, { timeout: 15_000 })
  await page.waitForTimeout(5_000)
  await expect(page.locator('.game-canvas')).toHaveAttribute('data-graphics-tier', 'high')
  await expect(page.locator('.game-canvas')).toHaveAttribute('data-render-dpr', '1.60')
  await expect(page.locator('.game-canvas')).toHaveAttribute('data-quality-factor', '1.00')
})
