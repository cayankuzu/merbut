import { expect, type Page } from '@playwright/test'

export async function waitForAssets(page: Page) {
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 90_000 })
}

/** Loads the game and passes the "press any key" title screen. */
export async function openMainMenu(page: Page) {
  await page.goto('/')
  await waitForAssets(page)
  await page.locator('.title-screen').click()
  await expect(page.getByRole('button', { name: 'YENİ OYUN' })).toBeVisible()
}

/** New game through the real menus: briefing, prologue skipped, countdown done. */
export async function startGame(page: Page, difficulty?: string) {
  await openMainMenu(page)
  await page.getByRole('button', { name: 'YENİ OYUN' }).click()
  await expect(page.getByRole('heading', { name: 'Kahramanlarını tanı' })).toBeVisible()
  if (difficulty) await page.getByRole('button', { name: new RegExp(difficulty) }).click()
  await page.getByRole('button', { name: 'SAVAŞA BAŞLA' }).click()
  await expect(page.locator('.prologue')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.countdown')).toBeVisible()
  await expect(page.locator('.countdown')).toHaveCount(0, { timeout: 8_000 })
}

/** Starts directly from the session store (fast path for mechanics tests). */
export async function startQuick(page: Page, difficulty = 'normal') {
  await page.goto('/')
  await waitForAssets(page)
  await page.evaluate((id) => {
    const session = window.__MERBUT__!.getSessionState()
    session.setDifficulty(id as 'normal')
    session.startCountdown()
  }, difficulty)
  await expect.poll(() => page.evaluate(() => window.__MERBUT__!.getSessionState().phase), { timeout: 10_000 }).toBe('playing')
}
