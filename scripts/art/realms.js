// MERBUT art studio — the ten realms, each painted as an album cover.
// Every realm yields two layers:
//   back  (BACK_W × H): sky, celestial body, clouds and far ridges — slow parallax
//   front (FRONT_W × H, transparent sky): mid silhouettes down to the ground line
import {
  bolt, birds, canvas, disc, glow, grain, halftone, haze, mix, polygon, rays, rgba, ridge, ring, rng, sky, streaks, swirl, vignette,
} from './lib.js'
import {
  bamboo, beetleDrone, camel, chimney, crane, flagLine, gear, guardianStatue, hourglassMonument, lighthouse, mesa, neonGlyphs, pagoda, ribcage,
  ship, skullMountain, smoke, spireTower, stupa, throneSilhouette, torii,
} from './shapes.js'

export const H = 1080
export const PANEL = 1920
export const BACK_W = Math.round(PANEL * 2.6)
export const FRONT_W = PANEL * 2
/** Where the 3D floor meets the painting; everything below is hidden by the ground. */
export const GROUND = 600

function finish(target, grainAmount = 12, seed = 1) {
  grain(target, grainAmount, seed)
  return target
}

/** Solid fill from the ground line down so no gap can ever show under silhouettes. */
function floor(target, color, y = GROUND + 40) {
  target.ctx.fillStyle = color
  target.ctx.fillRect(0, y, target.width, target.height - y)
}

// ── I · Aku Metropolü — "Neon Kıyamet" ─────────────────────────────────────
function akuCity() {
  const back = canvas(BACK_W, H)
  const b = back.ctx
  sky(b, BACK_W, H, [[0, '#12040c'], [0.28, '#3a0a22'], [0.5, '#8f1840'], [0.62, '#ff4d7a'], [0.75, '#ff9aa8']])
  halftone(b, { y: 0, width: BACK_W, height: 360, spacing: 16, maxRadius: 3.5, color: '#000000', alpha: 0.28 })
  const sunX = BACK_W * 0.5
  glow(b, sunX, 330, 620, '#ff2a6d', 0.55)
  disc(b, sunX, 330, 250, '#ff5c8d')
  disc(b, sunX, 330, 236, '#12040c')
  ring(b, sunX, 330, 300, 4, rgba('#ff9ab8', 0.55))
  ring(b, sunX, 330, 340, 2, rgba('#ff9ab8', 0.3))
  streaks(b, { width: BACK_W, count: 26, yMin: 120, yMax: 470, color: '#1a0612', alpha: 0.7, seed: 11, minLength: 400, maxLength: 1400 })
  rays(b, { x: BACK_W * 0.3, y: 640, count: 3, length: 900, spread: 0.5, from: -Math.PI / 2 - 0.25, color: '#ffb3c8', alpha: 0.12, seed: 3 })
  rays(b, { x: BACK_W * 0.72, y: 640, count: 3, length: 900, spread: 0.5, from: -Math.PI / 2 + 0.2, color: '#9ff4ff', alpha: 0.1, seed: 4 })
  const far = rng(21)
  for (let index = 0; index < 60; index += 1) {
    spireTower(b, { x: far() * BACK_W, base: 640, width: 40 + far() * 70, height: 180 + far() * 260, color: '#5a1432', seed: index + 5, windows: true, windowColor: rgba('#ff8fb2', 0.6) })
  }
  haze(b, BACK_W, 600, 220, '#ff5c8d', 0.55)
  floor(back, '#2a0818', 620)

  const front = canvas(FRONT_W, H)
  const f = front.ctx
  const mid = rng(42)
  for (let index = 0; index < 22; index += 1) {
    const x = (index + 0.5) * (FRONT_W / 22) + (mid() - 0.5) * 90
    spireTower(f, { x, base: 700, width: 90 + mid() * 120, height: 330 + mid() * 330, color: '#16050e', seed: 100 + index, windows: true, windowColor: rgba('#ff4d8a', 0.8), eye: index % 5 === 2 ? '#7dff5a' : null })
  }
  for (let index = 0; index < 9; index += 1) {
    const x = 180 + index * 420 + (mid() - 0.5) * 80
    neonGlyphs(f, { x, y: 380 + mid() * 140, width: 38 + mid() * 20, height: 110 + mid() * 80, color: index % 3 ? '#ff2a6d' : '#43f3ff', seed: 300 + index })
  }
  f.strokeStyle = '#0c0308'
  f.lineWidth = 4
  for (let cable = 0; cable < 6; cable += 1) {
    const x1 = cable * 700 - 100
    f.beginPath()
    f.moveTo(x1, 300 + cable * 12)
    f.quadraticCurveTo(x1 + 400, 420, x1 + 800, 280 + cable * 10)
    f.stroke()
  }
  // an airship with running lights drifting over the skyline
  f.fillStyle = '#0c0308'
  f.beginPath()
  f.ellipse(FRONT_W * 0.62, 210, 190, 46, -0.05, 0, Math.PI * 2)
  f.fill()
  f.fillRect(FRONT_W * 0.62 - 60, 245, 120, 26)
  ;[-140, -60, 20, 100].forEach((dx) => disc(f, FRONT_W * 0.62 + dx, 214, 5, '#ff4d8a'))
  rays(f, { x: FRONT_W * 0.62, y: 270, count: 1, length: 520, spread: 0, from: Math.PI / 2 + 0.25, color: '#ffc3d6', alpha: 0.12, seed: 9, width: 0.12 })
  floor(front, '#0c0308', 690)
  return { back: finish(back, 14, 1), front: finish(front, 10, 2) }
}

// ── II · Günbatımı Limanı — "Altın Saat" ───────────────────────────────────
function karst(ctx, x, base, width, height, color, tuft, seed) {
  const random = rng(seed)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x - width * 0.5, base)
  const steps = 10
  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps
    const bulge = Math.sin(t * Math.PI) * width * 0.08 * (random() - 0.3)
    ctx.lineTo(x - width * 0.5 + width * 0.06 * t + bulge, base - height * t)
  }
  ctx.bezierCurveTo(x - width * 0.3, base - height - width * 0.35, x + width * 0.35, base - height - width * 0.3, x + width * 0.42, base - height * 0.96)
  for (let step = steps; step >= 0; step -= 1) {
    const t = step / steps
    const bulge = Math.sin(t * Math.PI) * width * 0.1 * (random() - 0.4)
    ctx.lineTo(x + width * 0.5 - width * 0.04 * t + bulge, base - height * t)
  }
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = tuft
  for (let bush = 0; bush < 5; bush += 1) disc(ctx, x - width * 0.3 + random() * width * 0.6, base - height - width * 0.12 + random() * width * 0.12, width * (0.08 + random() * 0.08), tuft)
}

function sunsetHarbor() {
  const back = canvas(BACK_W, H)
  const b = back.ctx
  const horizon = 480
  sky(b, BACK_W, H, [[0, '#231733'], [0.18, '#5a2f52'], [0.34, '#c45f62'], [0.42, '#ffb27a'], [0.445, '#ffe2a8']], 0, horizon + 20)
  const sunX = BACK_W * 0.52
  glow(b, sunX, horizon - 30, 760, '#ffcf87', 0.6)
  disc(b, sunX, horizon - 30, 210, '#fff1c4')
  streaks(b, { width: BACK_W, count: 18, yMin: 140, yMax: 420, color: '#7a3b52', alpha: 0.55, seed: 12, minLength: 500, maxLength: 1600, thickness: [8, 30] })
  streaks(b, { width: BACK_W, count: 10, yMin: 330, yMax: 460, color: '#ffb088', alpha: 0.35, seed: 13, minLength: 400, maxLength: 1200, thickness: [4, 12] })
  // the sea from the horizon down, with the sun's broken reflection
  const sea = b.createLinearGradient(0, horizon, 0, 780)
  sea.addColorStop(0, '#b77a82')
  sea.addColorStop(0.35, '#6b4a6e')
  sea.addColorStop(1, '#241a30')
  b.fillStyle = sea
  b.fillRect(0, horizon, BACK_W, H - horizon)
  const stacks = rng(5)
  for (let index = 0; index < 14; index += 1) {
    const depth = stacks()
    const x = stacks() * BACK_W
    if (Math.abs(x - sunX) < 260) continue
    karst(b, x, horizon + 6, 90 + depth * 150, 150 + depth * 230, mix('#ffd0a8', '#6a3a58', 0.35 + depth * 0.5), mix('#ffd0a8', '#3a4a3a', 0.4 + depth * 0.4), 300 + index)
  }
  const glint = rng(8)
  for (let line = 0; line < 40; line += 1) {
    const y = horizon + 6 + line * 4.5
    const spread = 90 + line * 9
    const w = 30 + glint() * spread * 0.7
    b.fillStyle = rgba('#ffe0a8', 0.8 - line * 0.016)
    b.fillRect(sunX + (glint() - 0.5) * spread * 2 - w / 2, y, w, 2.5)
  }
  birds(b, { x: BACK_W * 0.4, y: 250, count: 16, spread: 600, size: 16, color: '#2a1a26', seed: 4 })
  haze(b, BACK_W, horizon, 110, '#ffd6a0', 0.3)

  const front = canvas(FRONT_W, H)
  const f = front.ctx
  const silhouette = '#241423'
  crane(f, { x: 380, base: 612, height: 360, reach: 360, color: silhouette })
  crane(f, { x: 3200, base: 612, height: 420, reach: -380, color: silhouette })
  ship(f, { x: 1050, base: 596, length: 420, color: silhouette, masts: 3 })
  ship(f, { x: 2350, base: 600, length: 300, color: silhouette, masts: 2 })
  lighthouse(f, { x: 3620, base: 612, height: 420, color: silhouette, lamp: '#ffe6a0' })
  rays(f, { x: 3620, y: 167, count: 1, length: 1200, spread: 0, from: Math.PI + 0.12, color: '#fff0c8', alpha: 0.16, seed: 2, width: 0.06 })
  f.fillStyle = silhouette
  f.fillRect(0, 590, FRONT_W, 22)
  for (let post = 0; post < 48; post += 1) f.fillRect(post * 80 + 20, 562, 12, 60)
  f.strokeStyle = silhouette
  f.lineWidth = 3
  for (let rope = 0; rope < 24; rope += 1) {
    f.beginPath()
    f.moveTo(rope * 160 + 26, 568)
    f.quadraticCurveTo(rope * 160 + 106, 586, rope * 160 + 186, 568)
    f.stroke()
  }
  // warm rim light on the silhouettes facing the sun
  f.globalCompositeOperation = 'source-atop'
  const rim = f.createLinearGradient(0, 0, FRONT_W, 0)
  rim.addColorStop(0, rgba('#ff9a5c', 0))
  rim.addColorStop(0.5, rgba('#ff9a5c', 0.22))
  rim.addColorStop(1, rgba('#ff9a5c', 0))
  f.fillStyle = rim
  f.fillRect(0, 0, FRONT_W, H)
  f.globalCompositeOperation = 'source-over'
  floor(front, '#1a0f19', 612)
  return { back: finish(back, 12, 3), front: finish(front, 10, 4) }
}

// ── III · Kum Saati Çölü — "Kum Saatinin İçinde" ───────────────────────────
function hourglassDesert() {
  const back = canvas(BACK_W, H)
  const b = back.ctx
  sky(b, BACK_W, H, [[0, '#5fb3ad'], [0.22, '#9fd8c8'], [0.42, '#f6e7c1'], [0.56, '#ffd49a']], 0, 640)
  const sunX = BACK_W * 0.5
  const sunY = 300
  glow(b, sunX, sunY, 620, '#fff3d0', 0.8)
  disc(b, sunX, sunY, 270, '#fff8e6')
  // the sun is a clock: twelve ticks and two long shadow hands
  b.save()
  b.translate(sunX, sunY)
  for (let tick = 0; tick < 12; tick += 1) {
    b.rotate(Math.PI / 6)
    b.fillStyle = rgba('#d98a4a', tick % 3 === 2 ? 0.9 : 0.55)
    b.fillRect(-6, -262, 12, tick % 3 === 2 ? 58 : 34)
  }
  b.restore()
  b.strokeStyle = rgba('#c77a44', 0.45)
  b.lineCap = 'round'
  b.lineWidth = 16
  b.beginPath()
  b.moveTo(sunX, sunY)
  b.lineTo(sunX - 120, sunY - 150)
  b.stroke()
  b.lineWidth = 10
  b.beginPath()
  b.moveTo(sunX, sunY)
  b.lineTo(sunX + 205, sunY + 40)
  b.stroke()
  ring(b, sunX, sunY, 330, 3, rgba('#ffffff', 0.45))
  streaks(b, { width: BACK_W, count: 14, yMin: 120, yMax: 420, color: '#ffffff', alpha: 0.35, seed: 31, minLength: 500, maxLength: 1500, thickness: [4, 14] })
  const duneColors = ['#f0c890', '#e8b27a', '#dd9c62']
  duneColors.forEach((color, index) => ridge(b, { width: BACK_W, height: H, base: 560 + index * 26, amplitude: 90 - index * 20, scale: 900 - index * 200, seed: 70 + index, color, octaves: 3, shape: (v) => v * 0.8 + 0.2 }))
  const caravan = rng(9)
  for (let index = 0; index < 7; index += 1) camel(b, { x: BACK_W * 0.64 + index * 70 + caravan() * 10, base: 560, size: 46, color: rgba('#7a3b2a', 0.75) })
  haze(b, BACK_W, 600, 140, '#ffe2b0', 0.5)
  floor(back, '#c98a55', 620)

  const front = canvas(FRONT_W, H)
  const f = front.ctx
  mesa(f, { x: 380, base: 700, width: 620, height: 300, lit: '#c46a44', shadow: '#8a3a2c', seed: 3 })
  mesa(f, { x: 3350, base: 700, width: 760, height: 360, lit: '#bd6240', shadow: '#7e3428', seed: 4 })
  mesa(f, { x: 2700, base: 700, width: 380, height: 190, lit: '#cc7a4c', shadow: '#94452f', seed: 5 })
  hourglassMonument(f, { x: 1780, base: 690, height: 440, frame: '#6e3a26', glass: rgba('#fff4dc', 0.35), sand: '#f2b957' })
  // broken sundial obelisks
  ;[[1100, 250], [2320, 300], [880, 170]].forEach(([x, h]) => {
    polygon(f, [[x - 34, 700], [x - 22, 700 - h], [x, 700 - h - 40], [x + 22, 700 - h], [x + 34, 700]], '#7a3f2c')
    f.fillStyle = rgba('#ffd98a', 0.8)
    for (let mark = 0; mark < 4; mark += 1) f.fillRect(x - 3, 700 - h * 0.8 + mark * 30, 6, 14)
  })
  // near dunes sweeping across the whole panel
  ridge(f, { width: FRONT_W, height: H, base: 700, amplitude: 60, scale: 700, seed: 81, color: '#b8693e', octaves: 3, shape: (v) => v * 0.8 + 0.3 })
  // tattered caravan banners
  ;[600, 2050, 3000].forEach((x, index) => {
    f.fillStyle = '#3a1d14'
    f.fillRect(x, 470, 8, 230)
    polygon(f, [[x + 8, 480], [x + 110, 492 + index * 6], [x + 90, 540], [x + 8, 530]], '#b83a2a')
  })
  floor(front, '#a95c35', 700)
  return { back: finish(back, 11, 5), front: finish(front, 10, 6) }
}

// ── IV · Altın Bataklık — "Yeşil Altın" ────────────────────────────────────
function swampTree(ctx, x, base, height, trunk, canopy, moss, seed) {
  const random = rng(seed)
  const lean = (random() - 0.5) * height * 0.25
  ctx.fillStyle = trunk
  ctx.beginPath()
  ctx.moveTo(x - height * 0.07, base)
  ctx.bezierCurveTo(x - height * 0.02, base - height * 0.3, x + lean * 0.2 - height * 0.05, base - height * 0.55, x + lean, base - height * 0.78)
  ctx.lineTo(x + lean + height * 0.05, base - height * 0.76)
  ctx.bezierCurveTo(x + lean * 0.3 + height * 0.05, base - height * 0.5, x + height * 0.04, base - height * 0.3, x + height * 0.09, base)
  ctx.fill()
  ctx.strokeStyle = trunk
  for (let root = 0; root < 4; root += 1) {
    const reach = (random() - 0.5) * height * 0.45
    ctx.lineWidth = height * 0.016
    ctx.beginPath()
    ctx.moveTo(x, base - height * 0.1)
    ctx.quadraticCurveTo(x + reach * 0.5, base - height * 0.2, x + reach, base + 4)
    ctx.stroke()
  }
  // canopy: a few drooping lobes of different sizes, not a row of circles
  const cx = x + lean
  const cy = base - height * 0.8
  ctx.fillStyle = canopy
  for (let lobe = 0; lobe < 6; lobe += 1) {
    const angle = -Math.PI + (lobe / 5) * Math.PI
    const rx = height * (0.16 + random() * 0.14)
    const ry = rx * (0.5 + random() * 0.25)
    ctx.beginPath()
    ctx.ellipse(cx + Math.cos(angle) * height * 0.26, cy + Math.sin(angle) * height * 0.1 + ry * 0.2, rx, ry, (random() - 0.5) * 0.5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.strokeStyle = moss
  for (let strand = 0; strand < 30; strand += 1) {
    const sx = cx + (random() - 0.5) * height * 0.7
    const sy = cy + height * 0.02 + random() * height * 0.06
    const length = height * (0.12 + random() * 0.38)
    ctx.lineWidth = 1.5 + random() * 3.5
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.bezierCurveTo(sx + (random() - 0.5) * 18, sy + length * 0.4, sx + (random() - 0.5) * 24, sy + length * 0.7, sx + (random() - 0.5) * 10, sy + length)
    ctx.stroke()
  }
}

function goldenSwamp() {
  const back = canvas(BACK_W, H)
  const b = back.ctx
  sky(b, BACK_W, H, [[0, '#2f3814'], [0.28, '#6f7a2a'], [0.46, '#c9c24a'], [0.54, '#fff3a0']], 0, 620)
  glow(b, BACK_W * 0.46, 380, 700, '#fffac0', 0.7)
  disc(b, BACK_W * 0.46, 380, 150, rgba('#ffffe6', 0.85))
  rays(b, { x: BACK_W * 0.46, y: 380, count: 9, length: 900, spread: 1.6, from: Math.PI / 2, color: '#fffac0', alpha: 0.12, seed: 5 })
  const layers = [['#b7b150', 540, 0.6], ['#9a9642', 560, 0.75], ['#7b7a35', 580, 0.9]]
  layers.forEach(([color, base, scale], layer) => {
    const random = rng(90 + layer)
    for (let tree = 0; tree < 22; tree += 1) swampTree(b, random() * BACK_W, base, (150 + random() * 90) * scale, color, color, color, 500 + layer * 40 + tree)
  })
  haze(b, BACK_W, 580, 170, '#f4f0a0', 0.45)
  floor(back, '#4c5222', 600)

  const front = canvas(FRONT_W, H)
  const f = front.ctx
  // still, reflective water in the visible band just above the floor
  const water = f.createLinearGradient(0, 548, 0, 612)
  water.addColorStop(0, rgba('#f4f0a0', 0.7))
  water.addColorStop(1, rgba('#4c5222', 0.95))
  f.fillStyle = water
  f.fillRect(0, 548, FRONT_W, 70)
  const trees = rng(12)
  const spots = [120, 640, 1180, 1760, 2450, 2980, 3560]
  spots.forEach((x, index) => swampTree(f, x + (trees() - 0.5) * 120, 600, 360 + trees() * 240, '#1c210d', '#1f250f', '#2d3314', 200 + index))
  f.strokeStyle = '#262c12'
  f.lineWidth = 46
  f.beginPath()
  f.arc(2150, 604, 150, Math.PI, 0)
  f.stroke()
  f.fillStyle = rgba('#fffbc0', 0.4)
  const ripple = rng(3)
  for (let line = 0; line < 50; line += 1) f.fillRect(ripple() * FRONT_W, 560 + ripple() * 40, 40 + ripple() * 120, 2)
  const fly = rng(77)
  for (let spark = 0; spark < 80; spark += 1) {
    const x = fly() * FRONT_W
    const y = 300 + fly() * 280
    glow(f, x, y, 14, '#f6ff9a', 0.8)
    disc(f, x, y, 2.4, '#fbffd0')
  }
  floor(front, '#20260f', 612)
  return { back: finish(back, 12, 7), front: finish(front, 10, 8) }
}

// ── V · Böcek Dökümhanesi — "Demir Kovanı" ─────────────────────────────────
function beetleFoundry() {
  const back = canvas(BACK_W, H)
  const b = back.ctx
  sky(b, BACK_W, H, [[0, '#0b0808'], [0.3, '#26140f'], [0.48, '#6a2a12'], [0.58, '#ff7b1c']], 0, 640)
  const plumes = rng(19)
  for (let index = 0; index < 9; index += 1) {
    smoke(b, { x: plumes() * BACK_W, y: 560, height: 420 + plumes() * 200, drift: 0.8, color: '#1c1210', light: rgba('#ff7b1c', 0.35), seed: 40 + index, width: 70 + plumes() * 40 })
  }
  for (let index = 0; index < 14; index += 1) {
    chimney(b, { x: 100 + index * 360 + plumes() * 80, base: 610, width: 40 + plumes() * 30, height: 200 + plumes() * 200, color: '#3a2420', fire: '#ffb347' })
  }
  // gasometers
  for (let index = 0; index < 5; index += 1) {
    const x = 400 + index * 1000
    b.fillStyle = '#2e1d19'
    b.fillRect(x - 110, 450, 220, 160)
    b.beginPath()
    b.ellipse(x, 450, 110, 26, 0, 0, Math.PI * 2)
    b.fill()
    b.strokeStyle = rgba('#ff9a3c', 0.35)
    b.lineWidth = 2
    for (let line = 0; line < 6; line += 1) {
      b.beginPath()
      b.moveTo(x - 110 + line * 44, 450)
      b.lineTo(x - 110 + line * 44, 610)
      b.stroke()
    }
  }
  haze(b, BACK_W, 610, 200, '#ff7b1c', 0.45)
  floor(back, '#1a0d0a', 630)

  const front = canvas(FRONT_W, H)
  const f = front.ctx
  const metal = '#120c0b'
  // beetle-shaped hangar domes with segmented plates
  ;[[620, 380, 1], [2900, 460, -1]].forEach(([x, w, dir]) => {
    f.fillStyle = metal
    f.beginPath()
    f.ellipse(x, 640, w, w * 0.55, 0, Math.PI, 0)
    f.fill()
    // the horned head of the beetle hangar and its glowing eyes
    f.beginPath()
    f.ellipse(x + dir * w * 0.95, 610, w * 0.2, w * 0.14, 0, 0, Math.PI * 2)
    f.fill()
    polygon(f, [[x + dir * w * 1.02, 580], [x + dir * w * 1.35, 470], [x + dir * w * 1.1, 590]], metal)
    disc(f, x + dir * w * 1.02, 600, 9, '#ff3b1f')
    // wing-case seam and rivet rows lit by the furnaces
    f.strokeStyle = rgba('#ff8a1f', 0.35)
    f.lineWidth = 5
    f.beginPath()
    f.moveTo(x, 640 - w * 0.55)
    f.lineTo(x, 640)
    f.stroke()
    f.fillStyle = rgba('#ff8a1f', 0.45)
    for (let rivet = 0; rivet < 14; rivet += 1) {
      const angle = Math.PI + (rivet / 13) * Math.PI
      disc(f, x + Math.cos(angle) * w * 0.82, 640 + Math.sin(angle) * w * 0.45, 4, rgba('#ff8a1f', 0.45))
    }
  })
  // gantry truss with hanging drone shells
  f.fillStyle = metal
  f.fillRect(1100, 300, 1500, 26)
  f.strokeStyle = metal
  f.lineWidth = 5
  for (let x = 1100; x < 2600; x += 60) {
    f.beginPath()
    f.moveTo(x, 300)
    f.lineTo(x + 30, 326)
    f.stroke()
  }
  for (let x = 1180; x < 2560; x += 150) {
    f.fillRect(x - 1, 326, 2, 60)
    beetleDrone(f, { x, y: 410, size: 70, color: metal, eye: '#ff3b1f' })
  }
  f.fillRect(1100, 300, 22, 400)
  f.fillRect(2580, 300, 22, 400)
  // a ladle pouring molten metal into a vat
  f.fillStyle = metal
  f.beginPath()
  f.ellipse(1850, 520, 80, 60, 0.4, 0, Math.PI * 2)
  f.fill()
  f.save()
  f.shadowColor = '#ff8a1f'
  f.shadowBlur = 40
  f.strokeStyle = '#ffb347'
  f.lineWidth = 16
  f.beginPath()
  f.moveTo(1905, 560)
  f.quadraticCurveTo(1950, 620, 1945, 660)
  f.stroke()
  f.restore()
  f.fillStyle = metal
  f.fillRect(1860, 640, 180, 60)
  f.fillStyle = '#ffb347'
  f.fillRect(1870, 636, 160, 10)
  gear(f, { x: 300, y: 520, radius: 90, teeth: 12, color: metal, hole: rgba('#ff7b1c', 0.5) })
  gear(f, { x: 3500, y: 470, radius: 140, teeth: 16, color: metal, hole: rgba('#ff7b1c', 0.4) })
  // welding sparks
  const sparks = rng(66)
  for (let spark = 0; spark < 60; spark += 1) disc(f, 1100 + sparks() * 1500, 320 + sparks() * 360, 1.5 + sparks() * 2, rgba('#ffd166', 0.9))
  floor(front, '#0d0908', 700)
  return { back: finish(back, 14, 9), front: finish(front, 12, 10) }
}

// ── VI · Kafatası Adası — "Zehirli Ada" ─────────────────────────────────────
function skullIsland() {
  const back = canvas(BACK_W, H)
  const b = back.ctx
  sky(b, BACK_W, H, [[0, '#0f180c'], [0.3, '#26401c'], [0.5, '#6aa33a'], [0.58, '#c9f57a']], 0, 640)
  glow(b, BACK_W * 0.4, 380, 520, '#c9ff7a', 0.45)
  disc(b, BACK_W * 0.4, 380, 120, rgba('#e8ffb0', 0.8))
  streaks(b, { width: BACK_W, count: 16, yMin: 60, yMax: 300, color: '#1a2616', alpha: 0.95, seed: 61, minLength: 700, maxLength: 1900, thickness: [40, 110] })
  streaks(b, { width: BACK_W, count: 14, yMin: 120, yMax: 360, color: '#2f4526', alpha: 0.8, seed: 62, minLength: 500, maxLength: 1400, thickness: [18, 50] })
  streaks(b, { width: BACK_W, count: 10, yMin: 300, yMax: 440, color: '#b8f06a', alpha: 0.25, seed: 63, minLength: 300, maxLength: 900, thickness: [4, 10] })
  const islands = rng(4)
  for (let index = 0; index < 10; index += 1) {
    const x = islands() * BACK_W
    const w = 200 + islands() * 300
    const h = 80 + islands() * 160
    polygon(b, [[x - w / 2, 600], [x - w * 0.1, 600 - h], [x + w * 0.05, 600 - h * 0.85], [x + w / 2, 600]], '#3f5a2c')
    b.strokeStyle = rgba('#b8ff5a', 0.6)
    b.lineWidth = 4
    b.beginPath()
    b.moveTo(x - w * 0.05, 600 - h * 0.9)
    b.quadraticCurveTo(x + w * 0.08, 600 - h * 0.5, x + w * 0.02, 600)
    b.stroke()
  }
  haze(b, BACK_W, 600, 160, '#a8e070', 0.5)
  floor(back, '#1d2a15', 630)

  const front = canvas(FRONT_W, H)
  const f = front.ctx
  skullMountain(f, { x: 1920, base: 700, width: 1300, height: 560, rock: '#0f170c', socket: '#050804', glowColor: '#9cff5a', seed: 7 })
  const spires = rng(18)
  for (let index = 0; index < 16; index += 1) {
    const x = spires() * FRONT_W
    if (Math.abs(x - 1920) < 600) continue
    const w = 60 + spires() * 90
    const h = 180 + spires() * 260
    polygon(f, [[x - w / 2, 700], [x - w * 0.1, 700 - h], [x + w * 0.08, 700 - h * 0.9], [x + w / 2, 700]], '#0d140a')
  }
  f.strokeStyle = rgba('#7dff4d', 0.8)
  f.lineWidth = 6
  f.save()
  f.shadowColor = '#7dff4d'
  f.shadowBlur = 20
  f.beginPath()
  f.moveTo(1880, 640)
  f.quadraticCurveTo(1960, 670, 1900, 700)
  f.stroke()
  f.restore()
  floor(front, '#0a1008', 700)
  return { back: finish(back, 13, 11), front: finish(front, 10, 12) }
}

// ── VII · Yeşim Harabeleri — "Sisli Tapınak" ───────────────────────────────
function jadeRuins() {
  const back = canvas(BACK_W, H)
  const b = back.ctx
  sky(b, BACK_W, H, [[0, '#07141a'], [0.3, '#12403c'], [0.5, '#3f9a86'], [0.6, '#b8f5dc']], 0, 640)
  glow(b, BACK_W * 0.55, 300, 520, '#dfffee', 0.5)
  disc(b, BACK_W * 0.55, 300, 170, rgba('#effff6', 0.92))
  disc(b, BACK_W * 0.55 + 40, 280, 150, rgba('#d0f5e6', 0.25))
  rays(b, { x: BACK_W * 0.55, y: 180, count: 7, length: 1100, spread: 1.2, from: Math.PI / 2 + 0.35, color: '#ccffe8', alpha: 0.1, seed: 8 })
  const temples = rng(14)
  for (let index = 0; index < 12; index += 1) {
    pagoda(b, { x: temples() * BACK_W, base: 610, width: 110 + temples() * 60, tiers: 3 + Math.floor(temples() * 3), tierHeight: 44, color: rgba('#2f7a68', 0.85) })
  }
  ridge(b, { width: BACK_W, height: H, base: 600, amplitude: 40, scale: 300, seed: 5, color: '#2a6a5c', octaves: 3 })
  haze(b, BACK_W, 610, 240, '#c8ffe6', 0.45)
  floor(back, '#1d4a42', 630)

  const front = canvas(FRONT_W, H)
  const f = front.ctx
  const stone = '#0c211d'
  guardianStatue(f, { x: 1920, base: 700, height: 520, color: '#10302a', shade: '#0a1f1b' })
  pagoda(f, { x: 700, base: 700, width: 280, tiers: 5, tierHeight: 70, color: stone, lanternColor: '#6effb8' })
  pagoda(f, { x: 3150, base: 700, width: 320, tiers: 6, tierHeight: 74, color: stone, lanternColor: '#6effb8' })
  torii(f, { x: 1250, base: 700, width: 360, height: 300, color: stone })
  torii(f, { x: 2600, base: 700, width: 300, height: 250, color: stone })
  bamboo(f, { x: 150, base: 700, height: 520, color: '#0a1a15', seed: 5, stalks: 7 })
  bamboo(f, { x: 3700, base: 700, height: 560, color: '#0a1a15', seed: 6, stalks: 8 })
  const mist = f.createLinearGradient(0, 520, 0, 700)
  mist.addColorStop(0, rgba('#c8ffe6', 0))
  mist.addColorStop(1, rgba('#c8ffe6', 0.28))
  f.fillStyle = mist
  f.fillRect(0, 520, FRONT_W, 180)
  floor(front, '#0a1c18', 700)
  return { back: finish(back, 12, 13), front: finish(front, 10, 14) }
}

// ── VIII · Şimşek Zirvesi — "Fırtına Manastırı" ─────────────────────────────
function stormPeak() {
  const back = canvas(BACK_W, H)
  const b = back.ctx
  sky(b, BACK_W, H, [[0, '#06070f'], [0.3, '#161a36'], [0.5, '#34407a'], [0.6, '#9fb4ff']], 0, 640)
  // the storm's eye: concentric cloud bands spiralling around a pale core
  const eyeX = BACK_W * 0.5
  glow(b, eyeX, 250, 480, '#b8c8ff', 0.4)
  for (let band = 0; band < 7; band += 1) {
    swirl(b, eyeX, 250, 700 - band * 80, rgba(band % 2 ? '#2a3264' : '#1c2148', 0.85), 60 - band * 5, 1.4)
  }
  bolt(b, { x: BACK_W * 0.3, y: 120, length: 480, seed: 5, width: 6, drift: 0.2 })
  bolt(b, { x: BACK_W * 0.74, y: 90, length: 520, seed: 9, width: 5, drift: -0.15 })
  const peaks = [['#3a4686', 590, 260], ['#2a3264', 610, 200]]
  peaks.forEach(([color, base, amp], index) => ridge(b, { width: BACK_W, height: H, base, amplitude: amp, scale: 260, seed: 120 + index, color, octaves: 5, persistence: 0.55, shape: (v) => Math.abs(v) * 1.4 + 0.1 }))
  haze(b, BACK_W, 610, 200, '#8fa8ff', 0.35)
  floor(back, '#161a36', 630)

  const front = canvas(FRONT_W, H)
  const f = front.ctx
  const rock = '#090b16'
  // two cliff pinnacles with the monastery on the tallest
  polygon(f, [[1300, 700], [1480, 380], [1560, 300], [1700, 320], [1820, 420], [1960, 700]], rock)
  polygon(f, [[2500, 700], [2620, 470], [2700, 430], [2820, 480], [2950, 700]], rock)
  stupa(f, { x: 1620, base: 305, size: 130, body: '#e8e2d6', spire: '#e0b04a', shade: '#bfb8aa' })
  f.fillStyle = '#d6cfc2'
  f.fillRect(1480, 330, 110, 60)
  f.fillRect(1660, 340, 140, 70)
  ;[[1500, 350], [1540, 350], [1690, 365], [1740, 365]].forEach(([x, y]) => { f.fillStyle = '#ffb85c'; f.fillRect(x, y, 14, 18) })
  flagLine(f, { x1: 1760, y1: 380, x2: 2700, y2: 440, sag: 120, count: 28, colors: ['#e24b4b', '#f4c542', '#3fa66b', '#3d7bd8', '#f2efe6'], size: 22, line: '#1a1c2c' })
  flagLine(f, { x1: 200, y1: 420, x2: 1320, y2: 470, sag: 90, count: 24, colors: ['#3d7bd8', '#f2efe6', '#e24b4b', '#f4c542', '#3fa66b'], size: 18, line: '#1a1c2c' })
  const teeth = rng(33)
  for (let index = 0; index < 18; index += 1) {
    const x = teeth() * FRONT_W
    const w = 50 + teeth() * 80
    const h = 120 + teeth() * 180
    polygon(f, [[x - w / 2, 700], [x, 700 - h], [x + w / 2, 700]], rock)
  }
  // rain sheets
  f.strokeStyle = rgba('#c8d4ff', 0.18)
  f.lineWidth = 2
  const rain = rng(91)
  for (let drop = 0; drop < 700; drop += 1) {
    const x = rain() * FRONT_W
    const y = rain() * 700
    f.beginPath()
    f.moveTo(x, y)
    f.lineTo(x - 14, y + 46)
    f.stroke()
  }
  floor(front, '#07080f', 700)
  return { back: finish(back, 13, 15), front: finish(front, 10, 16) }
}

// ── IX · Sessiz Kemik Ovası — "Beyaz Sessizlik" ─────────────────────────────
function skullField() {
  const back = canvas(BACK_W, H)
  const b = back.ctx
  sky(b, BACK_W, H, [[0, '#070d16'], [0.3, '#1b2d42'], [0.5, '#4e7a96'], [0.6, '#c9ecf7']], 0, 640)
  const moonX = BACK_W * 0.48
  glow(b, moonX, 280, 520, '#dff4ff', 0.5)
  disc(b, moonX, 280, 190, '#eef9ff')
  disc(b, moonX - 50, 250, 40, rgba('#c9dcea', 0.6))
  disc(b, moonX + 60, 320, 26, rgba('#c9dcea', 0.5))
  // aurora ribbons
  for (let ribbon = 0; ribbon < 3; ribbon += 1) {
    b.save()
    b.globalCompositeOperation = 'screen'
    const gradient = b.createLinearGradient(0, 80, 0, 360)
    gradient.addColorStop(0, rgba('#7dffd8', 0))
    gradient.addColorStop(0.5, rgba('#7dffd8', 0.16))
    gradient.addColorStop(1, rgba('#5ac8ff', 0))
    b.fillStyle = gradient
    b.beginPath()
    for (let x = 0; x <= BACK_W; x += 40) {
      const y = 180 + Math.sin(x / 420 + ribbon * 1.3) * 60 + ribbon * 40
      if (x === 0) b.moveTo(x, y)
      else b.lineTo(x, y)
    }
    for (let x = BACK_W; x >= 0; x -= 40) b.lineTo(x, 330 + Math.sin(x / 380 + ribbon) * 50 + ribbon * 40)
    b.fill()
    b.restore()
  }
  const stars = rng(2)
  for (let star = 0; star < 260; star += 1) disc(b, stars() * BACK_W, stars() * 320, stars() * 1.8 + 0.4, rgba('#ffffff', 0.4 + stars() * 0.5))
  ;[['#9ec2d6', 590, 90], ['#c2dbe6', 612, 60]].forEach(([color, base, amp], index) => ridge(b, { width: BACK_W, height: H, base, amplitude: amp, scale: 700, seed: 140 + index, color, octaves: 3, shape: (v) => v * 0.6 + 0.4 }))
  haze(b, BACK_W, 610, 180, '#e8f7ff', 0.4)
  floor(back, '#b8d2de', 630)

  const front = canvas(FRONT_W, H)
  const f = front.ctx
  ribcage(f, { x: 1500, base: 690, length: 1500, height: 420, color: '#1a2632' })
  // the colossal skull resting at the end of the spine
  f.fillStyle = '#1a2632'
  f.beginPath()
  f.ellipse(2380, 600, 210, 150, -0.2, 0, Math.PI * 2)
  f.fill()
  disc(f, 2330, 580, 48, '#070b10')
  disc(f, 2460, 560, 40, '#070b10')
  disc(f, 2330, 585, 12, '#8fdcff')
  disc(f, 2460, 565, 10, '#8fdcff')
  // frozen spears and banners stuck in the snow
  const spears = rng(8)
  for (let index = 0; index < 22; index += 1) {
    const x = spears() * FRONT_W
    const tilt = (spears() - 0.5) * 0.6
    const h = 140 + spears() * 180
    f.strokeStyle = '#141c24'
    f.lineWidth = 5
    f.beginPath()
    f.moveTo(x, 700)
    f.lineTo(x + Math.sin(tilt) * h, 700 - Math.cos(tilt) * h)
    f.stroke()
    if (spears() > 0.6) polygon(f, [[x + Math.sin(tilt) * h, 700 - Math.cos(tilt) * h], [x + Math.sin(tilt) * h + 60, 700 - Math.cos(tilt) * h + 20], [x + Math.sin(tilt) * h * 0.85, 700 - Math.cos(tilt) * h * 0.85 + 40]], '#2a3a48')
  }
  // snow drifts
  ridge(f, { width: FRONT_W, height: H, base: 700, amplitude: 50, scale: 500, seed: 99, color: '#dcecf3', octaves: 3, shape: (v) => v * 0.7 + 0.3 })
  ridge(f, { width: FRONT_W, height: H, base: 712, amplitude: 30, scale: 400, seed: 98, color: '#a9c6d4', octaves: 3, shape: (v) => v * 0.7 + 0.3 })
  floor(front, '#c9dde6', 712)
  return { back: finish(back, 10, 17), front: finish(front, 8, 18) }
}

// ── X · Alev Tahtı — "Kıyamet Tahtı" ────────────────────────────────────────
function infernoThrone() {
  const back = canvas(BACK_W, H)
  const b = back.ctx
  sky(b, BACK_W, H, [[0, '#140302'], [0.25, '#4a0f07'], [0.45, '#b3300f'], [0.56, '#ff8a2a'], [0.6, '#ffd06a']], 0, 640)
  const curls = rng(23)
  for (let index = 0; index < 34; index += 1) {
    const x = curls() * BACK_W
    const y = 60 + curls() * 380
    const r = 60 + curls() * 110
    disc(b, x, y, r, rgba('#3a0a06', 0.85))
    swirl(b, x, y, r * 0.8, rgba('#ff8a3a', 0.55), 6, 2)
  }
  // Aku's gaze over the far throne: two green eyes in the smoke
  const eyeX = BACK_W * 0.5
  glow(b, eyeX, 250, 380, '#7dff5a', 0.25)
  ;[-1, 1].forEach((side) => {
    b.fillStyle = '#9bff6a'
    b.beginPath()
    b.ellipse(eyeX + side * 120, 250, 70, 20, side * -0.25, 0, Math.PI * 2)
    b.fill()
    glow(b, eyeX + side * 120, 250, 120, '#7dff5a', 0.5)
  })
  throneSilhouette(b, { x: eyeX, base: 600, height: 420, color: '#2a0806' })
  ridge(b, { width: BACK_W, height: H, base: 605, amplitude: 70, scale: 220, seed: 5, color: '#3a0c07', octaves: 4, shape: (v) => Math.abs(v) * 1.5 })
  haze(b, BACK_W, 610, 200, '#ffb347', 0.45)
  floor(back, '#2a0806', 630)

  const front = canvas(FRONT_W, H)
  const f = front.ctx
  const obsidian = '#0e0303'
  for (let index = 0; index < 8; index += 1) {
    const x = 180 + index * 500
    polygon(f, [[x - 60, 700], [x - 44, 260], [x, 220], [x + 44, 260], [x + 60, 700]], obsidian)
    f.fillStyle = rgba('#ff4a12', 0.8)
    f.fillRect(x - 4, 300, 8, 360)
  }
  // lava falls between the pillars
  ;[920, 2360, 3350].forEach((x) => {
    f.save()
    f.shadowColor = '#ff6a1a'
    f.shadowBlur = 50
    const lava = f.createLinearGradient(0, 260, 0, 700)
    lava.addColorStop(0, '#ffd06a')
    lava.addColorStop(1, '#ff3a0a')
    f.fillStyle = lava
    f.fillRect(x - 40, 260, 80, 440)
    f.restore()
  })
  // stairs rising towards the throne at the right edge
  for (let step = 0; step < 7; step += 1) {
    f.fillStyle = step % 2 ? '#140404' : '#1a0605'
    f.fillRect(2700 + step * 60, 700 - step * 40, 1200, 40)
  }
  f.strokeStyle = obsidian
  f.lineWidth = 6
  for (let chainIndex = 0; chainIndex < 10; chainIndex += 1) {
    const x = 80 + chainIndex * 400
    f.beginPath()
    f.moveTo(x, 0)
    f.lineTo(x + 20, 160 + (chainIndex % 3) * 40)
    f.stroke()
  }
  const embers = rng(55)
  for (let ember = 0; ember < 120; ember += 1) disc(f, embers() * FRONT_W, embers() * 680, 1.5 + embers() * 2.5, rgba('#ffb347', 0.4 + embers() * 0.5))
  floor(front, '#0b0202', 700)
  return { back: finish(back, 14, 19), front: finish(front, 10, 20) }
}

export const REALMS = {
  'aku-city': akuCity,
  'sunset-harbor': sunsetHarbor,
  'hourglass-desert': hourglassDesert,
  'golden-swamp': goldenSwamp,
  'beetle-foundry': beetleFoundry,
  'skull-island': skullIsland,
  'jade-ruins': jadeRuins,
  'storm-peak': stormPeak,
  'skull-field': skullField,
  'inferno-throne': infernoThrone,
}

/** Square album cover: the realm's two layers composited and framed on its centre. */
export function cover(id, size = 900) {
  const { back, front } = REALMS[id]()
  const target = canvas(size, size)
  const ctx = target.ctx
  ctx.drawImage(back.element, (BACK_W - 760 * 1.3) / 2, 40, 760 * 1.3, 760, 0, 0, size, size)
  ctx.drawImage(front.element, (FRONT_W - 760) / 2, 0, 760, 760, 0, 0, size, size)
  vignette(target, 0.5)
  return finish(target, 8, 30)
}

