import { expect, test } from '@playwright/test'

test('ana menü her altı saniyede tek kahraman ve tek düşman gösterir', async ({ page }) => {
  test.setTimeout(60_000)
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('youtube.com') && !message.text().includes('compute-pressure')) consoleErrors.push(message.text())
  })

  await page.setViewportSize({ width: 1073, height: 895 })
  await page.goto('/')
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 60_000 })
  await expect(page.locator('.menu-battle-stage canvas')).toBeVisible()
  await expect(page.locator('.menu-battle-stage__categories')).toHaveCount(0)
  await expect(page.locator('.menu-fighter-name')).toHaveCount(2)
  await expect(page.locator('.menu-fighter-name--heroes')).toHaveCount(1)
  await expect(page.locator('.menu-fighter-name--enemies')).toHaveCount(1)
  await expect(page.locator('.menu-battle-stage .sr-only li')).toHaveCount(10)
  await expect(page.getByRole('list', { name: 'Yakın dövüşçüler' }).locator('li')).toHaveCount(3)
  await expect(page.getByRole('list', { name: 'Uzak dövüşçüler' }).locator('li')).toHaveCount(2)
  await expect(page.getByRole('list', { name: 'Bosslar' }).locator('li')).toHaveCount(3)

  const firstFrame = await page.locator('.menu-battle-stage').screenshot({ path: 'e2e-artifacts/menu-vertical-columns-compact.png' })
  const firstNames = await page.locator('.menu-fighter-name').allTextContents()
  await page.waitForTimeout(1_900)
  const actionFrame = await page.locator('.menu-battle-stage').screenshot({ path: 'e2e-artifacts/menu-random-attacks-v5.png' })

  expect(actionFrame.equals(firstFrame)).toBe(false)
  await page.waitForTimeout(4_300)
  await expect.poll(async () => page.locator('.menu-fighter-name').allTextContents()).not.toEqual(firstNames)
  await page.setViewportSize({ width: 1600, height: 960 })
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'e2e-artifacts/menu-vertical-columns-wide.png' })
  await page.getByRole('button', { name: 'OYUNA BAŞLA' }).click()
  await page.waitForTimeout(180)
  await page.screenshot({ path: 'e2e-artifacts/menu-heroes-strike-v5.png' })
  expect(consoleErrors).toEqual([])
})

test('splash ekranı 3B karşılaşma kompozisyonunu gösterir', async ({ page }) => {
  test.setTimeout(60_000)
  await page.setViewportSize({ width: 1600, height: 960 })
  await page.goto('/')
  await expect(page.locator('.loading-screen')).toBeVisible()
  await expect(page.locator('.loading-screen > .menu-battle-stage canvas')).toBeVisible()
  await expect(page.locator('.loading-screen__sigil svg')).toBeVisible()
  await expect(page.locator('.loading-screen__sigil')).not.toContainText('مربوط')
  await expect(page.locator('.loading-screen')).toHaveAttribute('aria-label', /yüzde 100 hazır/, { timeout: 60_000 })
  await page.screenshot({ path: 'e2e-artifacts/splash-cinematic-v5.png' })
})
