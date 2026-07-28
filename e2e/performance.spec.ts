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

async function measureFrameWindow(page: Page, durationMs: number) {
  return page.evaluate((duration) => new Promise<{ fps: number; p95: number; worst: number; over100: number }>((resolve) => {
    const samples: number[] = []
    const started = performance.now()
    let previous = started
    const frame = (now: number) => {
      samples.push(now - previous)
      previous = now
      if (now - started < duration) requestAnimationFrame(frame)
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
  }), durationMs)
}

test('en düşük donanımda minimal görüntü profili otomatik seçilir', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, get: () => 1 })
    Object.defineProperty(navigator, 'deviceMemory', { configurable: true, get: () => 1 })
  })
  await page.goto('/')
  console.info(`[browser-engine] ${await page.evaluate(() => navigator.userAgent)}`)
  await expect.poll(() => page.evaluate(() => window.__MERBUT__?.getPerformanceState().tier)).toBe('minimal')
})

test('art arda iki oyuncu saldırısında render döngüsü takılmaz', async ({ page }) => {
  test.setTimeout(75_000)
  const gameErrors: string[] = []
  page.on('pageerror', (error) => gameErrors.push(error.message))
  await startCombat(page)
  await page.waitForTimeout(1_000)

  const sample = measureFrameWindow(page, 5_000)

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

test('120 canlı düşman bulunan dünyada adaptif render bütçesi akıcı kalır', async ({ page }) => {
  test.setTimeout(90_000)
  const gameErrors: string[] = []
  page.on('pageerror', (error) => gameErrors.push(error.message))
  await startCombat(page)
  await expect.poll(() => page.evaluate(() => window.__MERBUT__!.getSessionState().enemies.length)).toBeGreaterThan(0)
  await page.evaluate(() => {
    const template = window.__MERBUT__!.getSessionState().enemies.find((enemy) => !enemy.boss)!
    const now = performance.now()
    const enemies = Array.from({ length: 120 }, (_, index) => ({
      ...template,
      id: `stress-enemy-${index}`,
      title: `Stress ${index + 1}`,
      x: -4 + (index / 119) * 238,
      biome: Math.min(6, Math.floor(index / 18)),
      animation: 'walk' as const,
      direction: index % 2 === 0 ? -1 as const : 1 as const,
      health: template.maxHealth,
      deadAt: 0,
      nextAttackAt: now + 750 + index * 13,
      attackUntil: 0,
      boss: false,
      finalBoss: false,
      bossType: null,
    }))
    window.__MERBUT__!.setSessionState({ enemies })
  })
  await expect.poll(() => page.evaluate(() => window.__MERBUT__!.getSessionState().enemies.length)).toBeGreaterThanOrEqual(120)
  await page.waitForTimeout(5_000)

  const metrics = await measureFrameWindow(page, 5_000)
  const performanceState = await page.evaluate(() => window.__MERBUT__!.getPerformanceState())
  console.info(`[120-enemy-metrics] tier=${performanceState.tier} fps=${metrics.fps.toFixed(2)} p95=${metrics.p95.toFixed(2)}ms worst=${metrics.worst.toFixed(2)}ms over100=${metrics.over100}`)

  expect(metrics.fps).toBeGreaterThanOrEqual(35)
  expect(metrics.p95).toBeLessThan(80)
  expect(metrics.over100).toBeLessThanOrEqual(2)
  expect(gameErrors).toEqual([])
})
