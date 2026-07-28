import { expect, test, type Page } from '@playwright/test'

async function waitForAssets(page: Page) {
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 60_000 })
}

async function startCombat(page: Page) {
  await page.goto('/')
  await waitForAssets(page)
  if (process.env.PW_FORCE_PERFORMANCE === '1') {
    await page.evaluate(() => window.__MERBUT__!.getPerformanceState().setTier('performance'))
  }
  await page.evaluate(() => window.__MERBUT__!.getAudioState().setMusicPlaying(false))
  await page.getByRole('button', { name: 'OYUNA BAŞLA' }).click()
  await page.getByRole('button', { name: 'SAVAŞA BAŞLA' }).click()
  await expect.poll(() => page.evaluate(() => window.__MERBUT__?.getSessionState().phase), { timeout: 10_000 }).toBe('playing')
}

test('düşük donanımda hafif görüntü profili otomatik seçilir', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, get: () => 2 })
    Object.defineProperty(navigator, 'deviceMemory', { configurable: true, get: () => 2 })
  })
  await page.goto('/')
  console.info(`[browser-engine] ${await page.evaluate(() => navigator.userAgent)}`)
  await expect.poll(() => page.evaluate(() => window.__MERBUT__?.getPerformanceState().tier)).toBe('performance')
})

test('art arda iki oyuncu saldırısında render döngüsü takılmaz', async ({ page }) => {
  test.setTimeout(75_000)
  const gameErrors: string[] = []
  page.on('pageerror', (error) => gameErrors.push(error.message))
  await startCombat(page)
  await page.waitForTimeout(1_000)

  const sample = page.evaluate(() => new Promise<{ fps: number; p95: number; worst: number; over100: number }>((resolve) => {
    const samples: number[] = []
    const started = performance.now()
    let previous = started
    const frame = (now: number) => {
      samples.push(now - previous)
      previous = now
      if (now - started < 5_000) requestAnimationFrame(frame)
      else {
        const ordered = [...samples].sort((a, b) => a - b)
        const average = samples.reduce((sum, value) => sum + value, 0) / Math.max(1, samples.length)
        resolve({
          fps: 1_000 / Math.max(1, average),
          p95: ordered[Math.min(ordered.length - 1, Math.floor(ordered.length * 0.95))] ?? average,
          worst: ordered.at(-1) ?? average,
          over100: samples.filter((value) => value > 100).length,
        })
      }
    }
    requestAnimationFrame(frame)
  }))

  const attacks = (async () => {
    for (let index = 0; index < 18; index += 1) {
      await page.keyboard.press('KeyS')
      await page.keyboard.press('ArrowDown')
      await page.waitForTimeout(245)
    }
  })()
  const [metrics] = await Promise.all([sample, attacks])
  const tier = await page.evaluate(() => window.__MERBUT__!.getPerformanceState().tier)
  console.info(`[render-metrics] tier=${tier} fps=${metrics.fps.toFixed(2)} p95=${metrics.p95.toFixed(2)}ms worst=${metrics.worst.toFixed(2)}ms over100=${metrics.over100}`)

  expect(metrics.fps).toBeGreaterThanOrEqual(35)
  expect(metrics.p95).toBeLessThan(80)
  expect(metrics.worst).toBeLessThan(200)
  expect(metrics.over100).toBeLessThanOrEqual(2)
  expect(gameErrors).toEqual([])
})
