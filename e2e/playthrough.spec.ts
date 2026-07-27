import { expect, test, type Page } from '@playwright/test'

type Difficulty = 'easy' | 'normal' | 'hard' | 'soulslike'

const MODES: Array<{ id: Difficulty; index: number; label: string }> = [
  { id: 'easy', index: 0, label: 'KOLAY' },
  { id: 'normal', index: 1, label: 'ORTA' },
  { id: 'hard', index: 2, label: 'ZOR' },
  { id: 'soulslike', index: 3, label: 'SOULS LIKE' },
]

interface Snapshot {
  phase: string
  bossPhase: string
  biome: number
  elapsed: number
  positions: { ali: number; jack: number }
  players: Record<'ali' | 'jack', { health: number; maxHealth: number; lives: number; dead: boolean; charge: number; activeUntil: number; frozenUntil: number }>
  enemies: Array<{ id: string; kind: number; x: number; health: number; maxHealth: number; boss: boolean; bossType: string | null; special: string; animation: string }>
  meteors: Array<{ x: number; impactAt: number; landedAt: number }>
  enemyProjectiles: Array<{ x: number; targetX: number }>
  pickups: Array<{ x: number }>
  now: number
}

async function readSnapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(() => {
    const session = window.__MERBUT__!.getSessionState()
    const game = window.__MERBUT__!.getState()
    return {
      phase: session.phase,
      bossPhase: session.bossPhase,
      biome: session.currentBiome,
      elapsed: session.elapsedSeconds,
      positions: { ali: game.positions.ali[0], jack: game.positions.jack[0] },
      players: {
        ali: { health: session.players.ali.health, maxHealth: session.players.ali.maxHealth, lives: session.players.ali.lives, dead: session.players.ali.dead, charge: session.players.ali.abilityCharge, activeUntil: session.players.ali.abilityActiveUntil, frozenUntil: session.players.ali.frozenUntil },
        jack: { health: session.players.jack.health, maxHealth: session.players.jack.maxHealth, lives: session.players.jack.lives, dead: session.players.jack.dead, charge: session.players.jack.abilityCharge, activeUntil: session.players.jack.abilityActiveUntil, frozenUntil: session.players.jack.frozenUntil },
      },
      enemies: session.enemies.filter((enemy) => enemy.animation !== 'dead').map((enemy) => ({ id: enemy.id, kind: enemy.kind, x: enemy.x, health: enemy.health, maxHealth: enemy.maxHealth, boss: enemy.boss, bossType: enemy.bossType, special: enemy.special, animation: enemy.animation })),
      meteors: session.meteors.map((meteor) => ({ x: meteor.x, impactAt: meteor.impactAt, landedAt: meteor.landedAt })),
      enemyProjectiles: session.enemyProjectiles.map((projectile) => ({ x: projectile.x, targetX: projectile.targetX })),
      pickups: session.pickups.map((pickup) => ({ x: pickup.x })),
      now: performance.now(),
    }
  })
}

async function startMode(page: Page, mode: typeof MODES[number]) {
  await page.goto('/')
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 60_000 })
  await page.getByRole('button', { name: 'OYUNA BAŞLA' }).click()
  await page.locator('.difficulty-select button').nth(mode.index).click()
  await page.getByRole('button', { name: 'SAVAŞA BAŞLA' }).click()
  await expect.poll(() => page.evaluate(() => window.__MERBUT__!.getSessionState().phase), { timeout: 10_000 }).toBe('playing')
}

async function playAttempt(page: Page, mode: typeof MODES[number], attempt: number) {
  const held = new Set<string>()
  const lastAttack = { ali: 0, jack: 0 }
  const lastJump = { ali: 0, jack: 0 }
  let lastFire = 0
  let lastShield = 0
  let lastReport = 0
  let lastBiome = -1
  let lastBossHealth = -1

  const setMovement = async (id: 'ali' | 'jack', direction: -1 | 0 | 1) => {
    const left = id === 'ali' ? 'KeyA' : 'ArrowLeft'
    const right = id === 'ali' ? 'KeyD' : 'ArrowRight'
    for (const key of [left, right]) {
      const shouldHold = direction < 0 ? key === left : direction > 0 ? key === right : false
      // Re-emit movement keydown so browser focus/scene resets cannot leave the
      // external driver believing a key is held after the game's input set was cleared.
      if (shouldHold) { await page.keyboard.down(key); held.add(key) }
      if (!shouldHold && held.has(key)) { await page.keyboard.up(key); held.delete(key) }
    }
  }

  const releaseMovement = async () => {
    for (const key of [...held]) await page.keyboard.up(key)
    held.clear()
  }

  const startedAt = Date.now()
  while (Date.now() - startedAt < 12 * 60_000) {
    const state = await readSnapshot(page)
    if (state.phase === 'defeat') {
      await releaseMovement()
      console.log(`[OYUN] ${mode.label} · ${attempt}. deneme YENİLGİ · biyom ${state.biome + 1}/7 · ${Math.round(state.elapsed)} sn`)
      return { victory: false, state }
    }
    if (state.phase === 'ending' && state.bossPhase === 'continued') {
      await releaseMovement()
      await expect(page.locator('.ending-overlay--continued h1')).toBeVisible()
      await page.waitForTimeout(2_500)
      await page.screenshot({ path: `e2e-artifacts/playthrough-${mode.id}-attempt-${attempt}.png` })
      console.log(`[OYUN] ${mode.label} · ${attempt}. deneme ZAFER · ${Math.round(state.elapsed)} sn`)
      return { victory: true, state }
    }

    if (state.biome !== lastBiome) {
      lastBiome = state.biome
      console.log(`[OYUN] ${mode.label} · ${attempt}. deneme · biyom ${state.biome + 1}/7 başladı`)
    }

    if (state.phase !== 'playing') {
      await releaseMovement()
      await page.waitForTimeout(120)
      continue
    }

    const livingEnemies = state.enemies
    const boss = livingEnemies.find((enemy) => enemy.boss)
    if (boss && (lastBossHealth < 0 || Math.abs(boss.health - lastBossHealth) >= boss.maxHealth * 0.1)) {
      lastBossHealth = boss.health
      console.log(`[OYUN] ${mode.label} · boss ${boss.bossType} · ${Math.ceil(boss.health)}/${boss.maxHealth}`)
    }

    const midpoint = (state.positions.ali + state.positions.jack) / 2
    const lowHealthPickup = state.pickups
      .map((pickup) => ({ ...pickup, distance: Math.abs(pickup.x - midpoint) }))
      .sort((a, b) => a.distance - b.distance)[0]
    const targetPriority = (enemy: Snapshot['enemies'][number]) => (
      enemy.health + Math.abs(enemy.x - midpoint) * 20
    )
    const groupTarget = boss ?? livingEnemies.slice().sort((a, b) => targetPriority(a) - targetPriority(b))[0]
    const dangerousBossSpecial = Boolean(boss && [
      'combo-double', 'combo-triple', 'aku-heavy', 'aku-split', 'aku-spin',
    ].includes(boss.special))

    for (const id of ['ali', 'jack'] as const) {
      const player = state.players[id]
      if (player.dead || player.frozenUntil > state.now) { await setMovement(id, 0); continue }
      const x = state.positions[id]
      const imminentMeteor = state.meteors.find((meteor) => meteor.landedAt === 0 && meteor.impactAt - state.now < 1_450 && meteor.impactAt > state.now && Math.abs(meteor.x - x) < 1.7)
      const incomingProjectile = state.enemyProjectiles.find((projectile) => Math.abs(projectile.x - x) < 2.5 && Math.abs(projectile.targetX - x) < 1.7)
      const closeThreats = livingEnemies.filter((enemy) => Math.abs(enemy.x - x) < 3.2)
      const evadeWindow = Math.floor(state.now / 1_600) % 3 === 0
      const crowdRetreat = !boss && evadeWindow && closeThreats.length >= 2 && player.health < player.maxHealth * 0.82
      const shielded = id === 'jack' && player.activeUntil > state.now
      const retreatFromBoss = Boolean(
        boss && dangerousBossSpecial && !shielded
        && (boss.bossType === 'shadow' || player.health < player.maxHealth * 0.65),
      )
      const retreatDirection: -1 | 1 = boss && x > boss.x ? 1 : -1
      let targetX: number | null = null
      if (imminentMeteor) targetX = x + (x <= imminentMeteor.x ? -2.8 : 2.8)
      else if (incomingProjectile) targetX = x + (x <= incomingProjectile.targetX ? -2.5 : 2.5)
      else if (retreatFromBoss) targetX = x + retreatDirection * 6
      else if (crowdRetreat) {
        const nearestThreat = closeThreats.slice().sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0]
        const away: -1 | 1 = nearestThreat && nearestThreat.x < x ? 1 : -1
        targetX = x + away * 4
      }
      else if (lowHealthPickup && player.health < player.maxHealth * 0.68 && lowHealthPickup.distance < 8 && !boss) targetX = lowHealthPickup.x
      else if (groupTarget) targetX = groupTarget.x + (id === 'ali' ? -1.2 : 1.2)
      else targetX = x + 8

      const partnerId = id === 'ali' ? 'jack' : 'ali'
      const partnerX = state.positions[partnerId]
      if (!crowdRetreat && !retreatFromBoss && !state.players[partnerId].dead && Math.abs(x - partnerX) > 5.5) targetX = (x + partnerX) / 2
      const difference = targetX - x
      await setMovement(id, Math.abs(difference) < 0.04 ? 0 : difference > 0 ? 1 : -1)

      const nearby = livingEnemies.filter((enemy) => Math.abs(enemy.x - x) <= (id === 'ali' ? 2.25 : 2.15))
      const now = Date.now()
      if (nearby.length > 0 && now - lastAttack[id] >= 1_320) {
        await page.keyboard.press(id === 'ali' ? 'KeyS' : 'ArrowDown')
        lastAttack[id] = now
      }
      if ((retreatFromBoss || (crowdRetreat && player.health < player.maxHealth * 0.7)) && now - lastJump[id] >= 1_800) {
        await page.keyboard.press(id === 'ali' ? 'KeyW' : 'Space')
        lastJump[id] = now
      }
    }

    const now = Date.now()
    if (!state.players.ali.dead && livingEnemies.length > 0 && (state.players.ali.charge >= 99 || state.players.ali.activeUntil > state.now) && now - lastFire >= 340) {
      await page.keyboard.press('KeyR')
      lastFire = now
    }
    if (!state.players.jack.dead && state.players.jack.charge >= 99 && (Boolean(boss) || dangerousBossSpecial || state.players.jack.health < state.players.jack.maxHealth * 0.8 || livingEnemies.length >= 3) && now - lastShield >= 1_000) {
      await page.keyboard.press('KeyL')
      lastShield = now
    }

    if (now - lastReport > 20_000) {
      lastReport = now
      const targetReport = groupTarget ? ` · hedef K${groupTarget.kind} ${Math.ceil(groupTarget.health)}/${groupTarget.maxHealth} x${groupTarget.x.toFixed(1)} ${groupTarget.animation}` : ''
      console.log(`[OYUN] ${mode.label} · biyom ${state.biome + 1}/7 · düşman ${livingEnemies.length} · Hz. Ali ${Math.ceil(state.players.ali.health)}/${state.players.ali.maxHealth} (${state.players.ali.lives}) x${state.positions.ali.toFixed(1)} · Samuray Jack ${Math.ceil(state.players.jack.health)}/${state.players.jack.maxHealth} (${state.players.jack.lives}) x${state.positions.jack.toFixed(1)}${targetReport}`)
    }
    await page.waitForTimeout(105)
  }

  await releaseMovement()
  throw new Error(`${mode.label} ${attempt}. deneme 12 dakikalık güvenlik sınırını aştı`)
}

test.describe.configure({ mode: 'serial' })

for (const mode of MODES) {
  test(`${mode.label} modu dış klavye girdileriyle tamamlanabilir`, async ({ page }) => {
    test.setTimeout(35 * 60_000)
    await startMode(page, mode)
    const attemptOffset = Number(process.env.PLAYTHROUGH_ATTEMPT_OFFSET ?? 0)
    for (let attempt = attemptOffset + 1; attempt <= 25; attempt += 1) {
      const result = await playAttempt(page, mode, attempt)
      if (result.victory) {
        expect(result.state.biome).toBe(6)
        return
      }
      await page.getByRole('button', { name: 'TEKRAR OYNA' }).click()
      await expect.poll(() => page.evaluate(() => window.__MERBUT__!.getSessionState().phase), { timeout: 10_000 }).toBe('playing')
    }
    throw new Error(`${mode.label} 25 denemede tamamlanamadı`)
  })
}
