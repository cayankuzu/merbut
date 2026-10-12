import { expect, test, type Page } from '@playwright/test'
import { openMainMenu, waitForAssets } from './helpers'

// Turkish-only letters: none of these may appear on an English screen. Two
// deliberate exceptions: the language option "Türkçe", and key caps, which show
// the letter printed on the player's own keyboard (Ö and Ç on a Turkish Q layout).
const TURKISH_LETTERS = /[çğıöşüÇĞİÖŞÜ]/

async function visibleTextWithoutLanguageOption(page: Page, selector: string) {
  return page.locator(selector).evaluate((root) => {
    const copy = root.cloneNode(true) as HTMLElement
    copy.querySelectorAll('kbd, .key-cap').forEach((cap) => cap.remove())
    document.body.append(copy)
    const text = copy.innerText
    copy.remove()
    return text.replace(/Türkçe/g, '')
  })
}

test.describe('İngilizce', () => {
  test.use({ locale: 'en-US' })

  test('İngilizce tarayıcıda oyun İngilizce açılır ve hikâye İngilizce akar', async ({ page }) => {
    await page.goto('/')
    await waitForAssets(page)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page).toHaveTitle(/Ten Realms, One Fate/)
    await page.locator('.title-screen').click()
    await expect(page.getByRole('button', { name: 'NEW GAME' })).toBeVisible()
    expect(await visibleTextWithoutLanguageOption(page, '.main-menu')).not.toMatch(TURKISH_LETTERS)

    await page.getByRole('button', { name: 'SETTINGS' }).click()
    const dialog = page.getByRole('dialog', { name: 'Settings' })
    for (const tab of ['Display', 'Audio', 'Controls', 'Gameplay', 'Accessibility', 'Save Data']) {
      await dialog.getByRole('tab', { name: tab }).click()
      expect(await visibleTextWithoutLanguageOption(page, '.settings-panel')).not.toMatch(TURKISH_LETTERS)
    }
    await page.keyboard.press('Escape')

    await page.getByRole('button', { name: 'NEW GAME' }).click()
    await expect(page.getByRole('heading', { name: 'Meet your heroes' })).toBeVisible()
    expect(await visibleTextWithoutLanguageOption(page, '.controls-screen')).not.toMatch(TURKISH_LETTERS)
    await page.getByRole('button', { name: 'START BATTLE' }).click()
    await expect(page.locator('.prologue')).toBeVisible()
    expect(await visibleTextWithoutLanguageOption(page, '.prologue')).not.toMatch(TURKISH_LETTERS)
    await page.getByRole('button', { name: /SKIP/ }).click()
    await expect.poll(() => page.evaluate(() => window.__MERBUT__!.getSessionState().phase), { timeout: 12_000 }).toBe('playing')
    // The realm's opening dialogue arrives in English too.
    await expect(page.locator('.dialogue')).toBeVisible({ timeout: 12_000 })
    expect(await visibleTextWithoutLanguageOption(page, '.dialogue')).not.toMatch(TURKISH_LETTERS)
  })
})

test('TR/EN düğmesi ve Ayarlar → Dil arayüzü anında değiştirir, seçim saklanır', async ({ page }) => {
  await openMainMenu(page)
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr')

  await page.getByRole('button', { name: 'Dili değiştir: English' }).click()
  await expect(page.getByRole('button', { name: 'NEW GAME' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')

  await page.getByRole('button', { name: 'SETTINGS' }).click()
  const language = page.getByRole('radiogroup', { name: 'Language' })
  await language.getByRole('radio', { name: 'Türkçe' }).click()
  await expect(page.getByRole('dialog', { name: 'Ayarlar' })).toBeVisible()
  await expect(page.getByRole('radiogroup', { name: 'Dil' }).getByRole('radio', { name: 'Türkçe' })).toHaveAttribute('aria-checked', 'true')
  await page.getByRole('radiogroup', { name: 'Dil' }).getByRole('radio', { name: 'English' }).click()
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible()
  await page.keyboard.press('Escape')

  // The choice outlives a reload even though the browser itself is Turkish.
  await page.reload()
  await waitForAssets(page)
  await page.locator('.title-screen').click()
  await expect(page.getByRole('button', { name: 'NEW GAME' })).toBeVisible()
  await page.getByRole('button', { name: 'Change language: Türkçe' }).click()
  await expect(page.getByRole('button', { name: 'YENİ OYUN' })).toBeVisible()
})
