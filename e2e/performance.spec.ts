import { expect, test, type Page } from '@playwright/test'

interface FrameBenchmark {
  averageFps: number
  frameCount: number
  longFrames: number
  p95FrameMs: number
  p99FrameMs: number
  storeFps: number
  storeP95FrameMs: number
}

async function startCombat(page: Page) {
  await page.goto('/')
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 60_000 })
  await page.getByRole('button', { name: 'OYUNA BAŞLA' }).click()
  await page.getByRole('button', { name: 'SAVAŞA BAŞLA' }).click()
  await expect.poll(() => page.evaluate(() => window.__MERBUT__?.getSessionState().phase), { timeout: 10_000 }).toBe('playing')
  await expect.poll(() => page.evaluate(() => window.__MERBUT__?.getSessionState().enemies.length)).toBeGreaterThan(0)
}

async function installStressScene(page: Page, enemyCount: number) {
  await page.evaluate((count) => {
    const api = window.__MERBUT__!
    const session = api.getSessionState()
    const template = session.enemies.find((enemy) => !enemy.boss)!
    const now = performance.now()
    const enemies = Array.from({ length: count }, (_, index) => ({
      ...template,
      id: `perf-enemy-${index}`,
      x: -18 + index % 50 * 0.72,
      direction: index % 2 === 0 ? 1 as const : -1 as const,
      health: 50_000,
      maxHealth: 50_000,
      animation: index % 3 === 0 ? 'attack' as const : 'walk' as const,
      attackUntil: now + 60_000,
      nextAttackAt: now + 60_000,
      deadAt: 0,
      boss: false,
      finalBoss: false,
      bossType: undefined,
      bossForm: undefined,
      special: 'none' as const,
    }))
    api.getPerformanceState().setTier('high')
    api.setSessionState({ enemies })
    api.getState().teleportPlayer('ali', -1)
    api.getState().teleportPlayer('jack', 1)
  }, enemyCount)
  await expect.poll(() => page.evaluate(() => window.__MERBUT__!.getSessionState().enemies.length)).toBe(enemyCount)
  await page.waitForTimeout(2_000)
}

async function benchmarkFrames(page: Page, durationMs: number, attackIntervalMs = 90): Promise<FrameBenchmark> {
  return page.evaluate(({ attackInterval, duration }) => new Promise<FrameBenchmark>((resolve) => {
    const api = window.__MERBUT__!
    const targetId = api.getSessionState().enemies[0]!.id
    let previous = 0
    let startedAt = 0
    let hit = 0
    const deltas: number[] = []
    const attackTimer = window.setInterval(() => {
      const now = performance.now()
      api.getSessionState().damageEnemy(targetId, 1, hit % 2 === 0 ? 'ali' : 'jack', now, 'melee')
      hit += 1
    }, attackInterval)

    const frame = (now: number) => {
      if (startedAt === 0) {
        startedAt = now
        previous = now
      } else {
        deltas.push(now - previous)
        previous = now
      }
      if (now - startedAt < duration) {
        requestAnimationFrame(frame)
        return
      }

      window.clearInterval(attackTimer)
      const ordered = [...deltas].sort((left, right) => left - right)
      const percentile = (ratio: number) => ordered[Math.min(ordered.length - 1, Math.floor(ordered.length * ratio))] ?? 0
      const elapsed = deltas.reduce((sum, value) => sum + value, 0)
      const performanceState = api.getPerformanceState()
      resolve({
        averageFps: elapsed > 0 ? deltas.length * 1_000 / elapsed : 0,
        frameCount: deltas.length,
        longFrames: deltas.filter((value) => value >= 50).length,
        p95FrameMs: percentile(0.95),
        p99FrameMs: percentile(0.99),
        storeFps: performanceState.fps,
        storeP95FrameMs: performanceState.p95FrameMs,
      })
    }
    requestAnimationFrame(frame)
  }), { attackInterval: attackIntervalMs, duration: durationMs })
}

async function selectTier(page: Page, tier: 'minimal' | 'performance' | 'balanced' | 'high') {
  await page.evaluate((nextTier) => window.__MERBUT__!.getPerformanceState().setTier(nextTier), tier)
  await expect(page.locator('.game-canvas')).toHaveAttribute('data-graphics-tier', tier)
  await page.waitForTimeout(1_500)
}

test('100 düşman ve ardışık saldırıda kare sürelerini bütçe içinde tutar', async ({ page }) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 1600, height: 900 })
  await startCombat(page)
  await installStressScene(page, 100)
  const scene = page.locator('.game-canvas')
  await expect(scene).toHaveAttribute('data-render-dpr', '1.10')
  await expect(scene).toHaveAttribute('data-dynamic-shadows', 'off')
  await expect(scene).toHaveAttribute('data-postprocessing', 'off')
  const high = await benchmarkFrames(page, 6_000)
  await selectTier(page, 'balanced')
  const balanced = await benchmarkFrames(page, 6_000)
  await selectTier(page, 'performance')
  const performance = await benchmarkFrames(page, 6_000)

  console.log(`MERBUT_PERF ${JSON.stringify({ high, balanced, performance })}`)
  for (const result of [high, balanced, performance]) {
    expect(result.averageFps).toBeGreaterThan(50)
    expect(result.p95FrameMs).toBeLessThan(35)
    expect(result.longFrames).toBeLessThanOrEqual(2)
  }

  await selectTier(page, 'high')
  await page.evaluate(() => {
    const api = window.__MERBUT__!
    api.setSessionState({ enemies: api.getSessionState().enemies.slice(0, 5) })
  })
  await expect(scene).toHaveAttribute('data-render-dpr', '1.35')
  await expect(scene).toHaveAttribute('data-dynamic-shadows', 'off')
  await expect(scene).toHaveAttribute('data-postprocessing', 'off')
  const highDetail = await benchmarkFrames(page, 6_000)
  console.log(`MERBUT_PERF_DETAIL ${JSON.stringify(highDetail)}`)
  expect(highDetail.averageFps).toBeGreaterThan(50)
  expect(highDetail.p95FrameMs).toBeLessThan(35)
  expect(highDetail.longFrames).toBeLessThanOrEqual(2)

  await page.evaluate(() => {
    const api = window.__MERBUT__!
    const session = api.getSessionState()
    const template = session.enemies[0]!
    const now = performance.now()
    const aku = {
      ...template,
      id: 'perf-aku',
      biome: 6,
      kind: 5 as const,
      title: 'Aku, Zamanın Efendisi',
      x: 0,
      health: 50_000,
      maxHealth: 50_000,
      scale: 3.83,
      animation: 'attack' as const,
      boss: true,
      finalBoss: true,
      bossType: 'aku' as const,
      bossForm: 'monster' as const,
      special: 'aku-fire-rain' as const,
      specialStartedAt: now,
      specialUntil: now + 60_000,
      nextSpecialAt: now + 60_000,
      nextAuraAt: now + 60_000,
    }
    api.setSessionState({
      activeBossId: aku.id,
      bossPhase: 'fight',
      enemies: [aku],
      meteors: Array.from({ length: 11 }, (_, index) => ({
        id: `perf-meteor-${index}`,
        x: aku.x - 5 + index,
        createdAt: now,
        impactAt: now + 30_000,
        landedAt: 0,
        damage: 0,
        kind: 'fire' as const,
      })),
    })
  })
  await expect.poll(() => page.evaluate(() => window.__MERBUT__!.getSessionState().enemies[0]?.bossType)).toBe('aku')
  await expect(scene).toHaveAttribute('data-render-dpr', '1.00')
  await page.waitForTimeout(2_000)
  const bossStress = await benchmarkFrames(page, 6_000, 720)
  console.log(`MERBUT_PERF_BOSS ${JSON.stringify(bossStress)}`)
  expect(bossStress.averageFps).toBeGreaterThan(50)
  expect(bossStress.p95FrameMs).toBeLessThan(35)
  expect(bossStress.longFrames).toBeLessThanOrEqual(2)
})
