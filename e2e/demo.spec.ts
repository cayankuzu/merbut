import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import type { ViteDevServer } from 'vite'
import { waitForAssets } from './helpers'

// The public web build is a demo (realms I–II) that ends at the gate of realm II
// with a link to the full game. This spec starts its own `--mode demo` server
// (own dep cache, so it never disturbs the suite's main dev server).
const DEMO_PORT = Number(process.env.PW_PORT ?? '5173') + 7
const DEMO_URL = `http://127.0.0.1:${DEMO_PORT}/`
const ITCH_URL = 'https://memode.itch.io/merbut'
let server: ViteDevServer | null = null

test.beforeAll(async () => {
  test.setTimeout(120_000)
  const { createServer } = await import('vite')
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  server = await createServer({
    root,
    configFile: path.join(root, 'vite.config.ts'),
    mode: 'demo',
    cacheDir: path.join(root, 'node_modules', '.vite-demo'),
    server: { host: '127.0.0.1', port: DEMO_PORT, strictPort: true },
    logLevel: 'error',
  })
  await server.listen()
})

test.afterAll(async () => {
  await server?.close()
})

/** Clears realms I–II and walks both heroes through realm II's gate. */
async function walkThroughRealmTwoGate(page: Page) {
  await page.evaluate(() => window.__MERBUT__!.getSessionState().startCountdown())
  await expect.poll(() => page.evaluate(() => window.__MERBUT__!.getSessionState().phase), { timeout: 15_000 }).toBe('playing')
  await page.evaluate(() => {
    const api = window.__MERBUT__!
    const now = api.now()
    const gateX = -9 + 2 * 36
    api.setSessionState({
      currentBiome: 1,
      lockedLeft: -9 + 36 + 1.25,
      enemies: [],
      enemyProjectiles: [],
      spawnedWaves: ['aku-city-entry', 'aku-city-mid', 'aku-city-depth', 'sunset-harbor-entry', 'sunset-harbor-mid', 'sunset-harbor-depth'],
      biomeBannerUntil: 0,
      players: Object.fromEntries(Object.entries(api.getSessionState().players).map(([id, player]) => [id, { ...player, invulnerableUntil: now + 60_000 }])) as never,
    })
    api.getState().teleportPlayer('ali', gateX + 0.8)
    api.getState().teleportPlayer('jack', gateX + 0.9)
  })
}

test('web demosu 2. diyarın kapısında biter ve itch.io’daki tam sürüme yönlendirir', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto(DEMO_URL)
  await waitForAssets(page)
  await page.locator('.title-screen').click()
  await expect(page.locator('.main-menu__demo')).toHaveText('DEMO')
  await expect(page.getByRole('button', { name: 'TAM SÜRÜM · itch.io' })).toBeVisible()

  // Only the demo's two tracks can be picked; the rest point to the full game.
  await page.getByRole('button', { name: 'BÖLÜM SEÇ' }).click()
  await expect(page.locator('.album__tracks button:not([disabled])')).toHaveCount(1)
  await expect(page.locator('.album__tracks button[disabled]').first()).toContainText('Önceki diyarı geç')
  await expect(page.locator('.album__tracks button[disabled]').last()).toContainText('Tam sürümde')
  await page.locator('.chapter-select > header button').click()

  await walkThroughRealmTwoGate(page)
  const screen = page.locator('.result-screen.is-demo-end')
  await expect(screen).toBeVisible({ timeout: 10_000 })
  const buy = screen.getByRole('link', { name: /itch\.io/ })
  await expect(buy).toHaveAttribute('href', ITCH_URL)
  await expect(buy).toHaveAttribute('target', '_blank')
  expect(await page.evaluate(() => window.__MERBUT__!.getSessionState().currentBiome)).toBe(1)

  await screen.getByRole('button', { name: 'ANA MENÜ' }).click()
  await expect(page.getByRole('button', { name: 'YENİ OYUN' })).toBeVisible()
})

test('tam sürümde aynı kapı 3. diyara açılır, demo ekranı çıkmaz', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/')
  await waitForAssets(page)
  await expect(page.locator('.main-menu__demo')).toHaveCount(0)
  await walkThroughRealmTwoGate(page)
  await expect.poll(() => page.evaluate(() => window.__MERBUT__!.getSessionState().currentBiome), { timeout: 10_000 }).toBe(2)
  await expect(page.locator('.result-screen.is-demo-end')).toHaveCount(0)
})
