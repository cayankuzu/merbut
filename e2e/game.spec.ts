import { expect, test } from '@playwright/test'
import { APP_VERSION } from '../src/config/version'
import { openMainMenu, startGame, waitForAssets } from './helpers'

test('başlık ekranı, ana menü, brifing, prolog ve duraklatma akışı çalışır', async ({ page }) => {
  await openMainMenu(page)
  await expect(page.getByRole('heading', { name: 'MERBUT' })).toBeVisible()
  await expect(page.locator('.merbut-copyright')).toContainText(`SÜRÜM v${APP_VERSION}`)
  await expect(page.locator('iframe')).toHaveCount(0)
  const audioDefaults = await page.evaluate(() => window.__MERBUT__!.getAudioState())
  expect(audioDefaults).toMatchObject({ musicPlaying: true })
  for (const label of ['BÖLÜM SEÇ', 'KARAKTERLER', 'BAŞARIMLAR', 'AYARLAR', 'YAPIMCILAR']) {
    await expect(page.getByRole('button', { name: label })).toBeVisible()
  }
  await page.getByRole('button', { name: 'YENİ OYUN' }).click()
  await expect(page.getByRole('heading', { name: 'Kahramanlarını tanı' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Orta/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('Kaçınma · kırmızı halkadan sıyrıl').first()).toBeVisible()
  await page.getByRole('button', { name: 'SAVAŞA BAŞLA' }).click()
  await expect(page.locator('.prologue')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.countdown')).toHaveCount(0, { timeout: 8_000 })
  await expect(page.locator('.merbut-copyright')).toHaveCount(0)
  await expect(page.locator('.hero-card')).toHaveCount(2)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('heading', { name: 'Zaman dondu' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'YENİDEN BAŞLA' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'ANA MENÜYE DÖN' })).toBeVisible()
  await page.getByRole('button', { name: 'KONTROLLER' }).click()
  await expect(page.getByRole('heading', { name: 'Kontroller' })).toBeVisible()
  await expect(page.getByLabel('Oyun duraklatıldı').getByRole('heading', { name: 'Samuray Jack' })).toBeVisible()
  await page.getByRole('button', { name: 'GERİ' }).click()
  const before = await page.evaluate(() => ({ elapsed: window.__MERBUT__!.getSessionState().elapsedSeconds, now: window.__MERBUT__!.now() }))
  await page.waitForTimeout(500)
  const after = await page.evaluate(() => ({ elapsed: window.__MERBUT__!.getSessionState().elapsedSeconds, now: window.__MERBUT__!.now() }))
  expect(after).toEqual(before)
  await page.getByRole('button', { name: 'DEVAM ET' }).click()
  await expect(page.getByRole('heading', { name: 'Zaman dondu' })).toHaveCount(0)
})

test('karakter arşivi tüm kadroyu, özellikleri ve döndürülebilir Aku modelini gösterir', async ({ page }) => {
  await openMainMenu(page)
  await page.getByRole('button', { name: 'KARAKTERLER' }).click()
  const rosterButtons = page.locator('.character-gallery__strip button')
  await expect(rosterButtons).toHaveCount(10)
  for (let index = 0; index < 10; index += 1) {
    await rosterButtons.nth(index).click()
    await expect(page.locator('.character-gallery > header small')).toContainText(`${index + 1}/10`)
    await expect(page.locator('.character-gallery__model canvas')).toBeVisible()
  }
  await page.getByRole('button', { name: /Aku · Canavar/ }).click()
  await expect(page.getByRole('heading', { name: 'Aku · Canavar' })).toBeVisible()
  await expect(page.getByText('Dönüş / Bölünme / Taklit')).toBeVisible()
  await expect(page.locator('.character-gallery__model canvas')).toBeVisible()
  await expect(page.locator('.character-gallery__model > span')).toContainText('%100')
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'e2e-artifacts/character-gallery-aku-monster-fit.png' })
})

test('iki oyuncu bağımsız hareket eder, zıplar, saldırır ve doğru yöne bakar', async ({ page }) => {
  test.setTimeout(60_000)
  await startGame(page)
  const before = await page.evaluate(() => window.__MERBUT__!.getState().positions)
  await page.keyboard.down('KeyD')
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(350)
  await page.keyboard.up('KeyD')
  await page.keyboard.up('ArrowRight')
  const afterMove = await page.evaluate(() => window.__MERBUT__!.getState().positions)
  expect(afterMove.ali[0]).toBeGreaterThan(before.ali[0])
  expect(afterMove.jack[0]).toBeGreaterThan(before.jack[0])
  const rightFacing = await page.evaluate(() => window.__MERBUT__!.getState().rotations)
  expect(Math.abs(rightFacing.ali)).toBeLessThan(0.01)
  expect(Math.abs(rightFacing.jack)).toBeLessThan(0.01)

  await page.keyboard.down('KeyA')
  await page.keyboard.down('ArrowLeft')
  await page.waitForTimeout(280)
  await page.keyboard.up('KeyA')
  await page.keyboard.up('ArrowLeft')
  const leftFacing = await page.evaluate(() => window.__MERBUT__!.getState().rotations)
  expect(Math.abs(leftFacing.ali)).toBeCloseTo(Math.PI, 2)
  expect(Math.abs(leftFacing.jack)).toBeCloseTo(Math.PI, 2)

  await page.keyboard.press('KeyW')
  await page.keyboard.press('ArrowUp')
  // Firefox may dispatch the two synthetic key presses across adjacent render
  // frames. Assert the observable airborne state instead of sampling a fixed
  // wall-clock instant between the two jump buffers.
  await expect.poll(() => page.evaluate(() => {
    const positions = window.__MERBUT__!.getState().positions
    return positions.ali[1] > 0 && positions.jack[1] > 0
  }), { timeout: 1_000 }).toBe(true)

  await page.keyboard.press('KeyS')
  await page.keyboard.press('ArrowDown')
  // Firefox can deliver the two synthetic attack keys on adjacent render
  // frames while the jump clip is still visible. Verify the observable
  // transition instead of sampling one fixed 120 ms instant.
  await expect.poll(() => page.evaluate(() => {
    const animations = window.__MERBUT__!.getState().animationStates
    return `${animations.ali}/${animations.jack}`
  }), { timeout: 1_000 }).toBe('attack/attack')
})

test('saldırı animasyonu bitmeden art arda saldırı kabul edilmez', async ({ page }) => {
  await startGame(page)
  const initial = await page.evaluate(() => window.__MERBUT__!.getState().attackSequences)

  for (let index = 0; index < 6; index += 1) {
    await page.keyboard.press('KeyS')
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(60)
  }

  const duringAttack = await page.evaluate(() => window.__MERBUT__!.getState().attackSequences)
  expect(duringAttack).toEqual({ ali: initial.ali + 1, jack: initial.jack + 1 })

  // Kilit sırasında basılan tuşlar kuyruklanmamalı ve sonradan saldırı başlatmamalı.
  await page.waitForTimeout(500)
  const afterAnimation = await page.evaluate(() => window.__MERBUT__!.getState().attackSequences)
  expect(afterAnimation).toEqual(duringAttack)

  await page.keyboard.press('KeyS')
  await page.keyboard.press('ArrowDown')
  await expect.poll(() => page.evaluate(() => {
    const sequences = window.__MERBUT__!.getState().attackSequences
    return `${sequences.ali}/${sequences.jack}`
  })).toBe(`${initial.ali + 2}/${initial.jack + 2}`)
})

test('özel yetenekler etkinleşir ve sahne sınırları korunur', async ({ page }) => {
  await startGame(page)
  const abilityState = await page.evaluate(() => {
    const state = window.__MERBUT__!.getSessionState()
    state.grantAbilityCharge('ali', 100)
    state.grantAbilityCharge('jack', 100)
    const now = window.__MERBUT__!.now()
    const aliActivated = state.launchFireball(now, 0, 0, 0)
    const jackActivated = state.activateShield(now)
    const current = window.__MERBUT__!.getSessionState()
    return {
      aliActivated,
      jackActivated,
      aliActive: current.players.ali.abilityActiveUntil === now + 4_000,
      jackActive: current.players.jack.abilityActiveUntil === now + 4_000,
      aliCharge: current.players.ali.abilityCharge,
      jackCharge: current.players.jack.abilityCharge,
      shots: current.players.ali.abilityShots,
      projectiles: current.projectiles.length,
    }
  })
  expect(abilityState.aliActivated).toBe(true)
  expect(abilityState.jackActivated).toBe(true)
  expect(abilityState.aliActive).toBe(true)
  expect(abilityState.jackActive).toBe(true)
  expect(abilityState.aliCharge).toBe(0)
  expect(abilityState.jackCharge).toBe(0)
  expect(abilityState.shots).toBe(1)
  expect(abilityState.projectiles).toBeLessThanOrEqual(1)
  await expect(page.locator('canvas').first()).toBeVisible()

  await page.keyboard.down('KeyA')
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(2_000)
  await page.keyboard.up('KeyA')
  await page.keyboard.up('ArrowRight')
  const state = await page.evaluate(() => window.__MERBUT__!.getState())
  expect(state.positions.ali[0]).toBeGreaterThanOrEqual(-4.8)
  expect(state.positions.jack[0]).toBeLessThanOrEqual(238.8)
  expect(Math.abs(state.positions.ali[0] - state.positions.jack[0])).toBeLessThanOrEqual(7.3)
})

test('1920x1080 ekranda on diyarı iki katmanlı tablolarla doğru sırayla gösterir', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('/')
  await waitForAssets(page)
  const canvasBounds = await page.locator('.game-canvas').boundingBox()
  const trackBounds = await page.locator('.scene-backdrop__track').boundingBox()
  const realms = page.locator('.realm-backdrop')
  await expect(realms).toHaveCount(10)
  expect(canvasBounds).toMatchObject({ width: 1920, height: 1080 })
  // Ten realms of two panels each, one panel per screen width.
  expect(trackBounds).toMatchObject({ width: 38400, height: 1080 })
  const order = await realms.evaluateAll((elements) => elements.map((element) => element.getAttribute('data-biome')))
  expect(order).toEqual(['aku-city', 'sunset-harbor', 'hourglass-desert', 'golden-swamp', 'beetle-foundry', 'skull-island', 'jade-ruins', 'storm-peak', 'skull-field', 'inferno-throne'])
  await expect(page.locator('.realm-backdrop__back')).toHaveCount(10)
  await expect(page.locator('.realm-backdrop__front')).toHaveCount(10)
  // The first realm's layers are decoded at full painting resolution.
  const layers = await page.locator('.realm-backdrop').first().locator('img').evaluateAll((images) => images.map((image) => (image as HTMLImageElement).naturalWidth))
  expect(layers.every((width) => width >= 3000)).toBe(true)
  // The painting's ground line follows the live 3D horizon.
  await expect.poll(() => page.locator('.scene-backdrop').evaluate((element) => (element as HTMLElement).style.getPropertyValue('--horizon-y'))).toMatch(/^[\d.]+%$/)
  const overflow = await page.evaluate(() => ({ x: document.documentElement.scrollWidth - innerWidth, y: document.documentElement.scrollHeight - innerHeight }))
  expect(overflow).toEqual({ x: 0, y: 0 })
})

test('yirmi panellik dünya kamera ile akıcı biçimde hareket eder', async ({ page }) => {
  await startGame(page)
  const track = page.locator('.scene-backdrop__track')
  const before = await track.evaluate((element) => (element as HTMLElement).style.transform)
  await page.keyboard.down('KeyD')
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(1_000)
  await page.keyboard.up('KeyD')
  await page.keyboard.up('ArrowRight')
  await page.waitForTimeout(200)
  const after = await track.evaluate((element) => (element as HTMLElement).style.transform)
  expect(before).not.toBe(after)
  expect(after).toMatch(/^translate3d\(-[\d.]+%, 0px, 0px\)$/)
})

test('bir kahraman düştüğünde yaşayan kahraman tek başına ilerleyebilir', async ({ page }) => {
  await startGame(page)
  await page.evaluate(() => window.__MERBUT__!.getSessionState().damagePlayer('ali', 1_000, window.__MERBUT__!.now()))
  const before = await page.evaluate(() => window.__MERBUT__!.getState().positions)
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(1_850)
  await page.keyboard.up('ArrowRight')
  const after = await page.evaluate(() => window.__MERBUT__!.getState().positions)
  expect(after.jack[0]).toBeGreaterThan(before.jack[0] + 0.2)
  expect(after.jack[0] - after.ali[0]).toBeGreaterThan(before.jack[0] - before.ali[0])
  await expect(page.getByText('Birbirinizden kopmayın')).not.toHaveClass(/is-visible/)
})
