// MERBUT art studio — prologue panels, speaker portraits and key art.
import { bolt, canvas, disc, glow, grain, halftone, haze, mix, polygon, rays, rgba, ridge, ring, rng, sky, streaks, swirl, vignette } from './lib.js'
import { pagoda, samurai, spireTower, tyrant, veiledWarrior } from './shapes.js'

const W = 1920
const H = 1080

function finish(target, seed) {
  vignette(target, 0.55)
  grain(target, 12, seed)
  return target
}

/** 1 · Aku rises over the city he set to his own clock. */
function akuRise() {
  const target = canvas(W, H)
  const ctx = target.ctx
  sky(ctx, W, H, [[0, '#050a05'], [0.45, '#123a14'], [0.75, '#3fae3a'], [1, '#b8ff7a']])
  // the clock behind him
  const cx = W / 2
  const cy = 430
  glow(ctx, cx, cy, 700, '#9bff6a', 0.35)
  ring(ctx, cx, cy, 420, 18, rgba('#0b1a0a', 0.85))
  ctx.save()
  ctx.translate(cx, cy)
  for (let tick = 0; tick < 12; tick += 1) {
    ctx.rotate(Math.PI / 6)
    ctx.fillStyle = rgba('#0b1a0a', 0.85)
    ctx.fillRect(-10, -410, 20, 70)
  }
  ctx.restore()
  tyrant(ctx, { x: cx, base: H + 40, height: 760, color: '#050805', eyes: '#c8ff7a', flame: '#ff5a1a' })
  for (let index = 0; index < 40; index += 1) {
    const random = rng(index + 3)
    spireTower(ctx, { x: random() * W, base: H, width: 30 + random() * 60, height: 120 + random() * 220, color: '#020402', seed: index + 11 })
  }
  halftone(ctx, { y: 0, width: W, height: 300, spacing: 14, maxRadius: 3, color: '#000000', alpha: 0.35 })
  return finish(target, 101)
}

/** 2 · Jack is flung into a spiralling time rift. */
function jackExile() {
  const target = canvas(W, H)
  const ctx = target.ctx
  sky(ctx, W, H, [[0, '#0a0614'], [0.5, '#2a1450'], [1, '#6a2a8a']])
  const cx = W * 0.56
  const cy = H * 0.46
  for (let band = 0; band < 14; band += 1) swirl(ctx, cx, cy, 900 - band * 60, rgba(band % 2 ? '#8f6aff' : '#40e0ff', 0.18 + band * 0.02), 24 - band, 1.6)
  glow(ctx, cx, cy, 300, '#e8f4ff', 0.9)
  disc(ctx, cx, cy, 60, '#ffffff')
  // the samurai tumbles towards the light, sword still in hand
  ctx.save()
  ctx.translate(cx - 360, cy + 90)
  ctx.rotate(-0.6)
  samurai(ctx, { x: 0, base: 0, height: 360, color: '#07030d', drawn: true, windy: 0.8 })
  ctx.restore()
  // a clawed shadow hand reaching in from the left edge
  ctx.fillStyle = '#030106'
  ctx.beginPath()
  ctx.moveTo(0, H * 0.34)
  ctx.bezierCurveTo(160, H * 0.36, 300, H * 0.4, 400, H * 0.44)
  ctx.lineTo(420, H * 0.58)
  ctx.bezierCurveTo(300, H * 0.6, 150, H * 0.66, 0, H * 0.7)
  ctx.fill()
  ;[[0.4, -0.5], [0.45, -0.18], [0.5, 0.12], [0.55, 0.42]].forEach(([at, bend], finger) => {
    const x0 = 400
    const y0 = H * at
    const length = 190 - finger * 14
    ctx.beginPath()
    ctx.moveTo(x0, y0 - 16)
    ctx.bezierCurveTo(x0 + length * 0.4, y0 - 26 + bend * 40, x0 + length * 0.8, y0 - 10 + bend * 70, x0 + length, y0 + bend * 110)
    ctx.lineTo(x0 + length * 0.78, y0 + 12 + bend * 70)
    ctx.bezierCurveTo(x0 + length * 0.5, y0 + 14 + bend * 30, x0 + length * 0.2, y0 + 16, x0, y0 + 16)
    ctx.fill()
  })
  return finish(target, 102)
}

/** 3 · The lone samurai under a giant sun, the wind in his robe. */
function jackWanders() {
  const target = canvas(W, H)
  const ctx = target.ctx
  sky(ctx, W, H, [[0, '#2a0f1a'], [0.35, '#a0333a'], [0.62, '#ff9a4a'], [0.72, '#ffd79a']])
  glow(ctx, W * 0.5, H * 0.5, 800, '#ffe0a0', 0.55)
  disc(ctx, W * 0.5, H * 0.52, 360, '#fff0cf')
  streaks(ctx, { width: W, count: 14, yMin: 220, yMax: 520, color: '#5a1a22', alpha: 0.6, seed: 6, minLength: 300, maxLength: 1000 })
  ridge(ctx, { width: W, height: H, base: 820, amplitude: 90, scale: 500, seed: 2, color: '#1a0508', octaves: 3, shape: (v) => v * 0.6 + 0.4 })
  samurai(ctx, { x: W * 0.5, base: 790, height: 340, color: '#1a0508', windy: 1 })
  ctx.strokeStyle = rgba('#fff0cf', 0.5)
  ctx.lineWidth = 3
  for (let gust = 0; gust < 8; gust += 1) {
    ctx.beginPath()
    ctx.moveTo(200 + gust * 190, 600 + (gust % 3) * 40)
    ctx.quadraticCurveTo(300 + gust * 190, 580, 420 + gust * 190, 610 + (gust % 3) * 40)
    ctx.stroke()
  }
  return finish(target, 103)
}

/** 4 · The sky tears open and fragments of every age fall through. */
function timeRift() {
  const target = canvas(W, H)
  const ctx = target.ctx
  sky(ctx, W, H, [[0, '#060812'], [0.6, '#1d2244'], [1, '#403a6a']])
  // the tear: a jagged wound in the sky, white-hot at its edges, starfield inside
  const random = rng(4)
  const top = []
  const bottom = []
  for (let step = 0; step <= 18; step += 1) {
    const t = step / 18
    const x = W * 0.14 + t * W * 0.72
    const open = Math.sin(t * Math.PI) * 120 + 6
    const y = H * 0.34 + Math.sin(t * 9) * 30 + (random() - 0.5) * 40
    top.push([x, y - open * (0.5 + random() * 0.5)])
    bottom.push([x, y + open * (0.4 + random() * 0.5)])
  }
  const outline = () => {
    ctx.beginPath()
    top.forEach(([x, y], index) => (index ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
    for (let index = bottom.length - 1; index >= 0; index -= 1) ctx.lineTo(bottom[index][0], bottom[index][1])
    ctx.closePath()
  }
  ctx.save()
  ctx.shadowColor = '#ffd98a'
  ctx.shadowBlur = 90
  ctx.fillStyle = '#fff6d8'
  outline()
  ctx.fill()
  ctx.restore()
  ctx.save()
  outline()
  ctx.clip()
  ctx.fillStyle = '#0a0414'
  ctx.fillRect(0, 0, W, H)
  for (let star = 0; star < 260; star += 1) disc(ctx, W * 0.14 + random() * W * 0.72, H * 0.1 + random() * H * 0.5, random() * 2.4 + 0.5, rgba('#ffffff', 0.5 + random() * 0.5))
  swirl(ctx, W / 2, H * 0.34, 260, rgba('#8f6aff', 0.5), 10, 2.2)
  ctx.restore()
  ctx.strokeStyle = '#fffaf0'
  ctx.lineWidth = 5
  outline()
  ctx.stroke()
  ctx.lineWidth = 2
  for (let crack = 0; crack < 10; crack += 1) {
    const [sx, sy] = (crack % 2 ? top : bottom)[2 + Math.floor(random() * 14)]
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    let px = sx
    let py = sy
    for (let step = 0; step < 4; step += 1) {
      px += (random() - 0.5) * 90
      py += (crack % 2 ? -1 : 1) * (20 + random() * 40)
      ctx.lineTo(px, py)
    }
    ctx.stroke()
  }
  rays(ctx, { x: W / 2, y: H * 0.34, count: 14, length: 1300, spread: 2.2, from: Math.PI / 2, color: '#ffe8b0', alpha: 0.1, seed: 5 })
  // fragments of other eras tumbling out: a pyramid, a pagoda, a column, a crescent-domed tower
  const fall = [
    () => polygon(ctx, [[-90, 60], [0, -70], [90, 60]], '#0c0e1c'),
    () => pagoda(ctx, { x: 0, base: 80, width: 110, tiers: 3, tierHeight: 40, color: '#0c0e1c' }),
    () => { ctx.fillStyle = '#0c0e1c'; ctx.fillRect(-26, -90, 52, 180); ctx.fillRect(-40, -100, 80, 20); ctx.fillRect(-40, 80, 80, 20) },
    () => { ctx.fillStyle = '#0c0e1c'; ctx.fillRect(-40, -20, 80, 110); ctx.beginPath(); ctx.arc(0, -20, 40, Math.PI, 0); ctx.fill() },
  ]
  ;[[0.28, 0.6, -0.4], [0.45, 0.72, 0.3], [0.62, 0.58, 0.8], [0.76, 0.76, -0.2]].forEach(([x, y, rotate], index) => {
    ctx.save()
    ctx.translate(W * x, H * y)
    ctx.rotate(rotate)
    fall[index]()
    ctx.restore()
  })
  return finish(target, 104)
}

/** 5 · Hz. Ali falls from the rift in a column of light; his face is never shown. */
function aliFalls() {
  const target = canvas(W, H)
  const ctx = target.ctx
  sky(ctx, W, H, [[0, '#0b0612'], [0.5, '#3a1032'], [0.8, '#ff4d7a'], [1, '#ff9aa8']])
  const cx = W * 0.5
  const column = ctx.createLinearGradient(cx - 180, 0, cx + 180, 0)
  column.addColorStop(0, rgba('#fff2c0', 0))
  column.addColorStop(0.5, rgba('#fff2c0', 0.5))
  column.addColorStop(1, rgba('#fff2c0', 0))
  ctx.fillStyle = column
  ctx.fillRect(cx - 180, 0, 360, H)
  glow(ctx, cx, H * 0.38, 420, '#fff2c0', 0.6)
  for (let index = 0; index < 50; index += 1) {
    const random = rng(index + 70)
    spireTower(ctx, { x: random() * W, base: H, width: 50 + random() * 80, height: 200 + random() * 300, color: '#12040c', seed: index + 90, windows: true, windowColor: rgba('#ff4d8a', 0.7) })
  }
  ctx.save()
  ctx.translate(cx, H * 0.62)
  ctx.rotate(0.12)
  veiledWarrior(ctx, { x: 0, base: 0, height: 380, color: '#1a0c10', light: '#fff6d0', windy: 0.9 })
  ctx.restore()
  return finish(target, 105)
}

/** 6 · Two swords back to back before the road of ten realms: the album cover. */
function twoSwords() {
  const target = canvas(W, H)
  const ctx = target.ctx
  sky(ctx, W, H, [[0, '#12040a'], [0.35, '#6a1428'], [0.6, '#ff6a3a'], [0.72, '#ffd08a']])
  const cx = W * 0.5
  glow(ctx, cx, H * 0.5, 800, '#ffd08a', 0.5)
  disc(ctx, cx, H * 0.5, 330, '#ffe9c0')
  ring(ctx, cx, H * 0.5, 380, 6, rgba('#fff6e0', 0.5))
  halftone(ctx, { y: 0, width: W, height: 360, spacing: 16, maxRadius: 4, color: '#000000', alpha: 0.3 })
  ridge(ctx, { width: W, height: H, base: 820, amplitude: 60, scale: 600, seed: 3, color: '#1a0508', octaves: 3, shape: (v) => v * 0.5 + 0.5 })
  // the road narrowing towards a distant burning throne
  polygon(ctx, [[cx - 260, H], [cx - 18, 780], [cx + 18, 780], [cx + 260, H]], '#2a0a0e')
  glow(ctx, cx, 760, 60, '#ff6a1a', 0.9)
  samurai(ctx, { x: cx - 150, base: 900, height: 420, color: '#0e0306', drawn: true, facing: -1, windy: 0.6 })
  veiledWarrior(ctx, { x: cx + 150, base: 900, height: 440, color: '#0e0306', light: '#fff2c8', windy: 0.6 })
  return finish(target, 106)
}

function palm(ctx, x, base, height, color, lean, seed) {
  const random = rng(seed)
  const topX = x + lean * height
  const topY = base - height
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  ctx.lineWidth = height * 0.035
  ctx.beginPath()
  ctx.moveTo(x, base)
  ctx.quadraticCurveTo(x + lean * height * 0.2, base - height * 0.6, topX, topY)
  ctx.stroke()
  ctx.fillStyle = color
  for (let frond = 0; frond < 9; frond += 1) {
    const angle = -Math.PI / 2 + (frond / 8 - 0.5) * Math.PI * 1.7 + (random() - 0.5) * 0.2
    const reach = height * (0.32 + random() * 0.12)
    const ex = topX + Math.cos(angle) * reach
    const ey = topY + Math.sin(angle) * reach * 0.6 + reach * 0.35
    ctx.beginPath()
    ctx.moveTo(topX, topY)
    ctx.quadraticCurveTo((topX + ex) / 2 + Math.sin(angle) * 14, (topY + ey) / 2 - reach * 0.28, ex, ey)
    ctx.quadraticCurveTo((topX + ex) / 2, (topY + ey) / 2 - reach * 0.12, topX, topY)
    ctx.fill()
  }
}

/** 7 · The sequel hook: dawn over palm groves and a far city; two lights fall from a rift. */
function medina() {
  const target = canvas(W, H)
  const ctx = target.ctx
  sky(ctx, W, H, [[0, '#0b1230'], [0.35, '#3a3a6a'], [0.58, '#d88a6a'], [0.7, '#ffd9a0']])
  glow(ctx, W * 0.5, 720, 700, '#ffe2b0', 0.55)
  disc(ctx, W * 0.5, 760, 170, '#fff1d0')
  // the morning star and a thin crescent in the blue of the sky
  const stars = rng(12)
  for (let star = 0; star < 120; star += 1) disc(ctx, stars() * W, stars() * 360, stars() * 1.6 + 0.3, rgba('#ffffff', 0.3 + stars() * 0.5))
  disc(ctx, W * 0.78, 180, 34, '#fdf6e0')
  disc(ctx, W * 0.78 + 14, 170, 30, '#15183a')
  // the rift closing high above and the two falling lights
  ctx.save()
  ctx.shadowColor = '#9aefff'
  ctx.shadowBlur = 40
  ctx.strokeStyle = '#e8fbff'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(W * 0.36, 90)
  ctx.lineTo(W * 0.42, 70)
  ctx.lineTo(W * 0.47, 96)
  ctx.lineTo(W * 0.53, 74)
  ctx.stroke()
  ;[[0.43, 0.46, '#fff2c8'], [0.47, 0.5, '#bfe6ff']].forEach(([from, to, color]) => {
    const gradient = ctx.createLinearGradient(W * from, 110, W * to, 470)
    gradient.addColorStop(0, rgba(color, 0))
    gradient.addColorStop(1, rgba(color, 0.95))
    ctx.strokeStyle = gradient
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.moveTo(W * from, 110)
    ctx.lineTo(W * to, 470)
    ctx.stroke()
    disc(ctx, W * to, 470, 9, color)
  })
  ctx.restore()
  // the far city: low walls, flat roofs and a few domes on the horizon
  const city = '#3a2432'
  ctx.fillStyle = city
  ctx.fillRect(W * 0.3, 780, W * 0.4, 80)
  const roofs = rng(5)
  for (let block = 0; block < 22; block += 1) {
    const bx = W * 0.3 + block * (W * 0.4 / 22)
    ctx.fillRect(bx, 780 - roofs() * 40, W * 0.4 / 22 - 4, 80)
  }
  ;[[0.44, 46], [0.52, 64], [0.6, 40]].forEach(([at, radius]) => {
    ctx.beginPath()
    ctx.ellipse(W * at, 760, radius, radius * 0.9, 0, Math.PI, 0)
    ctx.fill()
    ctx.fillRect(W * at - radius, 760, radius * 2, 30)
  })
  ridge(ctx, { width: W, height: H, base: 870, amplitude: 40, scale: 500, seed: 9, color: '#2a1624', octaves: 3, shape: (v) => v * 0.5 + 0.5 })
  // palm groves in the foreground, the oasis at dawn
  ;[[0.08, 520, 0.18], [0.16, 440, -0.12], [0.24, 380, 0.08], [0.78, 400, -0.1], [0.86, 500, 0.14], [0.94, 430, -0.16]].forEach(([at, height, lean], index) => palm(ctx, W * at, H + 20, height, '#120a14', lean, 40 + index))
  ridge(ctx, { width: W, height: H, base: 1000, amplitude: 50, scale: 400, seed: 13, color: '#120a14', octaves: 3, shape: (v) => v * 0.5 + 0.5 })
  return finish(target, 107)
}

export const STORY = {
  '07-medina': medina,
  '01-aku-rise': akuRise,
  '02-jack-exile': jackExile,
  '03-jack-wanders': jackWanders,
  '04-time-rift': timeRift,
  '05-ali-falls': aliFalls,
  '06-two-swords': twoSwords,
}

// ── Speaker portraits (for the dialogue box) ───────────────────────────────
function portraitFrame(color, draw, seed) {
  const target = canvas(256, 256)
  const ctx = target.ctx
  sky(ctx, 256, 256, [[0, mix(color, '#000000', 0.55)], [1, mix(color, '#000000', 0.85)]])
  glow(ctx, 128, 150, 150, color, 0.45)
  draw(ctx)
  grain(target, 10, seed)
  return target
}

export const PORTRAITS = {
  aku: () => portraitFrame('#7dff5a', (ctx) => tyrant(ctx, { x: 128, base: 330, height: 210, color: '#050805', eyes: '#c8ff7a', flame: '#ff5a1a' }), 201),
  golge: () => portraitFrame('#ff3b5c', (ctx) => {
    samurai(ctx, { x: 128, base: 300, height: 230, color: '#050103', drawn: true })
    disc(ctx, 127, 89, 2.2, '#ff3b5c')
    disc(ctx, 133.5, 89, 2.2, '#ff3b5c')
  }, 202),
  kesis: () => portraitFrame('#ffd9a0', (ctx) => {
    ctx.fillStyle = '#1a0f08'
    ctx.beginPath()
    ctx.ellipse(128, 120, 44, 50, 0, 0, Math.PI * 2)
    ctx.fill()
    polygon(ctx, [[60, 256], [84, 170], [172, 170], [196, 256]], '#1a0f08')
    polygon(ctx, [[104, 140], [128, 230], [152, 140]], '#2a1a10')
    polygon(ctx, [[70, 92], [128, 40], [186, 92]], '#3a2410')
  }, 203),
  lejyon: () => portraitFrame('#c9a0ff', (ctx) => {
    ctx.fillStyle = '#0a0612'
    ctx.beginPath()
    ctx.ellipse(128, 150, 70, 80, 0, 0, Math.PI * 2)
    ctx.fill()
    polygon(ctx, [[70, 110], [40, 40], [100, 90]], '#0a0612')
    polygon(ctx, [[186, 110], [216, 40], [156, 90]], '#0a0612')
    disc(ctx, 104, 140, 9, '#e8d0ff')
    disc(ctx, 152, 140, 9, '#e8d0ff')
    ctx.fillStyle = '#e8d0ff'
    for (let tooth = 0; tooth < 5; tooth += 1) polygon(ctx, [[98 + tooth * 13, 186], [104 + tooth * 13, 200], [110 + tooth * 13, 186]], '#e8d0ff')
  }, 204),
  anlatici: () => portraitFrame('#e8dcc8', (ctx) => {
    ctx.strokeStyle = '#1a140c'
    ctx.lineWidth = 10
    ctx.beginPath()
    ctx.moveTo(78, 60)
    ctx.lineTo(178, 60)
    ctx.moveTo(78, 196)
    ctx.lineTo(178, 196)
    ctx.stroke()
    polygon(ctx, [[88, 66], [168, 66], [132, 128], [168, 190], [88, 190], [124, 128]], '#1a140c')
    polygon(ctx, [[108, 170], [148, 170], [158, 188], [98, 188]], '#e8b55a')
  }, 205),
}

// ── Store / page art ──────────────────────────────────────────────────────
/** itch.io cover (630×500) and the wide banner reuse the album-cover composition. */
export function keyArt(width, height) {
  const target = canvas(width, height)
  const ctx = target.ctx
  const scale = height / 1080
  sky(ctx, width, height, [[0, '#0d0306'], [0.35, '#5a1022'], [0.62, '#ff5a2a'], [0.74, '#ffd08a']])
  const cx = width / 2
  glow(ctx, cx, height * 0.46, 900 * scale, '#ffd08a', 0.55)
  disc(ctx, cx, height * 0.46, 330 * scale, '#ffe9c0')
  ring(ctx, cx, height * 0.46, 385 * scale, 6 * scale, rgba('#fff6e0', 0.5))
  // Aku's eyes in the upper sky, watching
  ;[-1, 1].forEach((side) => {
    ctx.fillStyle = rgba('#9bff6a', 0.85)
    ctx.beginPath()
    ctx.ellipse(cx + side * 150 * scale, height * 0.16, 80 * scale, 20 * scale, side * -0.25, 0, Math.PI * 2)
    ctx.fill()
    glow(ctx, cx + side * 150 * scale, height * 0.16, 140 * scale, '#7dff5a', 0.45)
  })
  halftone(ctx, { y: 0, width, height: height * 0.3, spacing: 14 * scale + 4, maxRadius: 3.5 * scale + 1, color: '#000000', alpha: 0.3 })
  ridge(ctx, { width, height, base: height * 0.8, amplitude: 60 * scale, scale: 600 * scale, seed: 3, color: '#1a0508', octaves: 3, shape: (v) => v * 0.5 + 0.5, step: 2 })
  bolt(ctx, { x: width * 0.2, y: 0, length: height * 0.45, seed: 8, width: 4 * scale + 1 })
  samurai(ctx, { x: cx - 150 * scale, base: height * 0.86, height: 430 * scale, color: '#0e0306', drawn: true, facing: -1, windy: 0.6 })
  veiledWarrior(ctx, { x: cx + 150 * scale, base: height * 0.86, height: 450 * scale, color: '#0e0306', light: '#fff2c8', windy: 0.6 })
  haze(ctx, width, height, height * 0.3, '#000000', 0.5)
  vignette(target, 0.5)
  grain(target, 12, 300)
  return target
}

