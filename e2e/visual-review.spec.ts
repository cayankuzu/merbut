import { expect, test } from '@playwright/test'

test('ana ekran, karakter arşivi, savaş HUD’u ve ayarlar görsel kaydı', async ({ page }) => {
  test.setTimeout(90_000)
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('/')
  await expect(page.locator('.loading-screen')).toBeVisible()
  await expect(page.locator('.loading-screen')).toHaveAttribute('aria-label', /yüzde 100 hazır/, { timeout: 60_000 })
  await page.screenshot({ path: 'e2e-artifacts/splash-v2.png' })
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 60_000 })
  await expect(page.locator('.menu-battle-stage canvas')).toBeVisible()
  await expect(page.locator('.menu-battle-stage .sr-only li')).toHaveCount(10)
  await page.screenshot({ path: 'e2e-artifacts/menu-battle-v2.png' })

  await page.getByRole('button', { name: 'KARAKTERLER' }).click()
  await expect(page.locator('.character-gallery')).toBeVisible()
  await expect(page.locator('.difficulty-select--gallery button')).toHaveCount(4)
  await page.waitForTimeout(1_200)
  await page.screenshot({ path: 'e2e-artifacts/character-gallery-v2.png' })

  await page.getByRole('button', { name: 'Karakter arşivini kapat' }).click()
  await page.getByRole('button', { name: 'OYUNA BAŞLA' }).click()
  await expect(page.locator('.controls-screen')).toBeVisible()
  await page.getByRole('button', { name: 'SAVAŞA BAŞLA' }).click()
  await expect.poll(() => page.evaluate(() => window.__MERBUT__?.getSessionState().phase), { timeout: 10_000 }).toBe('playing')
  await expect(page.locator('.player-hud')).toHaveCount(2)
  await expect(page.locator('.enemy-roster')).toBeVisible()
  await expect(page.locator('.combat-flow')).toBeVisible()
  await page.waitForTimeout(1_200)
  await page.screenshot({ path: 'e2e-artifacts/gameplay-hud-v2.png' })

  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'AYARLAR' }).click()
  await expect(page.getByLabel('Kamera uzaklığı')).toBeVisible()
  await page.screenshot({ path: 'e2e-artifacts/pause-settings-v2.png' })
  const cameraSlider = page.getByLabel('Kamera uzaklığı')
  await cameraSlider.dispatchEvent('pointerdown', { pointerId: 1 })
  await expect(page.locator('html')).toHaveClass(/is-camera-previewing/)
  await expect(page.locator('.pause-screen')).toHaveCSS('visibility', 'hidden')
  await cameraSlider.evaluate((element) => {
    const input = element as HTMLInputElement
    input.value = '18'
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await page.screenshot({ path: 'e2e-artifacts/camera-preview-v2.png' })
  await page.locator('body').dispatchEvent('pointerup', { pointerId: 1 })
  await expect(page.locator('html')).not.toHaveClass(/is-camera-previewing/)
})
