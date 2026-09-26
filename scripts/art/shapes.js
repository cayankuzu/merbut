// MERBUT art studio — silhouette vocabulary shared by every realm painting.
import { disc, lerp, polygon, rgba, rng } from './lib.js'

export function spireTower(ctx, { x, base, width, height, color, seed, windows, windowColor, eye }) {
  const random = rng(seed)
  const top = base - height
  const taper = width * (0.18 + random() * 0.2)
  polygon(ctx, [[x - width / 2, base], [x - taper, top + height * 0.08], [x, top], [x + taper, top + height * 0.08], [x + width / 2, base]], color)
  // fins and rings give the Aku skyline its hostile, clawed read
  const fins = 1 + Math.floor(random() * 3)
  for (let fin = 0; fin < fins; fin += 1) {
    const fy = lerp(top + height * 0.25, base - height * 0.2, random())
    const side = random() > 0.5 ? 1 : -1
    const reach = width * (0.6 + random() * 0.9)
    polygon(ctx, [[x, fy], [x + side * reach, fy - height * 0.08], [x + side * reach * 0.3, fy + height * 0.05]], color)
  }
  ctx.fillRect(x - 1.5, top - height * 0.12, 3, height * 0.12)
  if (windows) {
    ctx.fillStyle = windowColor
    const rows = Math.floor(height / 26)
    for (let row = 2; row < rows; row += 1) {
      if (random() > 0.35) continue
      const wy = top + row * 26
      const span = lerp(taper, width / 2, (wy - top) / height) * 0.7
      ctx.fillRect(x - span + random() * span, wy, 3 + random() * 5, 4)
    }
  }
  if (eye) {
    const ey = top + height * 0.3
    ctx.fillStyle = eye
    ctx.beginPath()
    ctx.ellipse(x, ey, width * 0.28, width * 0.09, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** A tiered pagoda with upturned eaves. */
export function pagoda(ctx, { x, base, width, tiers, tierHeight, color, lanternColor }) {
  let y = base
  let w = width
  for (let tier = 0; tier < tiers; tier += 1) {
    const bodyW = w * 0.62
    ctx.fillStyle = color
    ctx.fillRect(x - bodyW / 2, y - tierHeight, bodyW, tierHeight)
    const roofY = y - tierHeight
    const eave = w * 0.62
    ctx.beginPath()
    ctx.moveTo(x - eave - w * 0.12, roofY - tierHeight * 0.32)
    ctx.quadraticCurveTo(x - eave * 0.6, roofY + tierHeight * 0.02, x - bodyW * 0.3, roofY - tierHeight * 0.18)
    ctx.lineTo(x, roofY - tierHeight * 0.55)
    ctx.lineTo(x + bodyW * 0.3, roofY - tierHeight * 0.18)
    ctx.quadraticCurveTo(x + eave * 0.6, roofY + tierHeight * 0.02, x + eave + w * 0.12, roofY - tierHeight * 0.32)
    ctx.lineTo(x, roofY - tierHeight * 0.1)
    ctx.closePath()
    ctx.fill()
    if (lanternColor) disc(ctx, x, y - tierHeight * 0.45, tierHeight * 0.12, lanternColor)
    y = roofY - tierHeight * 0.25
    w *= 0.8
  }
  ctx.fillStyle = color
  ctx.fillRect(x - 2, y - tierHeight * 1.2, 4, tierHeight * 1.2)
}

/** A white stupa with a golden stepped spire (the storm monastery). */
export function stupa(ctx, { x, base, size, body, spire, shade }) {
  ctx.fillStyle = body
  ctx.fillRect(x - size * 0.7, base - size * 0.35, size * 1.4, size * 0.35)
  ctx.beginPath()
  ctx.ellipse(x, base - size * 0.35, size * 0.55, size * 0.5, 0, Math.PI, 0)
  ctx.fill()
  if (shade) {
    ctx.fillStyle = shade
    ctx.beginPath()
    ctx.ellipse(x + size * 0.1, base - size * 0.35, size * 0.45, size * 0.5, 0, Math.PI * 1.5, 0)
    ctx.fill()
  }
  ctx.fillStyle = body
  ctx.fillRect(x - size * 0.16, base - size * 1.02, size * 0.32, size * 0.2)
  ctx.fillStyle = spire
  for (let ring = 0; ring < 7; ring += 1) {
    const w = size * (0.14 - ring * 0.015)
    ctx.fillRect(x - w, base - size * 1.06 - ring * size * 0.07, w * 2, size * 0.05)
  }
  polygon(ctx, [[x - size * 0.03, base - size * 1.55], [x, base - size * 1.72], [x + size * 0.03, base - size * 1.55]], spire)
}

export function bamboo(ctx, { x, base, height, color, seed, stalks = 6 }) {
  const random = rng(seed)
  for (let stalk = 0; stalk < stalks; stalk += 1) {
    const sx = x + (random() - 0.5) * 80
    const h = height * (0.6 + random() * 0.4)
    const w = 6 + random() * 6
    const lean = (random() - 0.5) * 40
    ctx.strokeStyle = color
    ctx.lineWidth = w
    ctx.beginPath()
    ctx.moveTo(sx, base)
    ctx.quadraticCurveTo(sx + lean * 0.3, base - h * 0.5, sx + lean, base - h)
    ctx.stroke()
    ctx.fillStyle = color
    for (let leaf = 0; leaf < 5; leaf += 1) {
      const t = 0.55 + leaf * 0.09
      const lx = sx + lean * t * t
      const ly = base - h * t
      const dir = leaf % 2 ? 1 : -1
      ctx.beginPath()
      ctx.moveTo(lx, ly)
      ctx.quadraticCurveTo(lx + dir * 34, ly - 16, lx + dir * 70, ly + 6)
      ctx.quadraticCurveTo(lx + dir * 34, ly + 4, lx, ly)
      ctx.fill()
    }
  }
}

/** Flat-topped desert mesa with a lit face and a shadow face. */
export function mesa(ctx, { x, base, width, height, lit, shadow, seed }) {
  const random = rng(seed)
  const topInset = width * (0.12 + random() * 0.1)
  const points = [[x - width / 2, base], [x - width / 2 + topInset, base - height], [x + width / 2 - topInset * 1.3, base - height], [x + width / 2, base]]
  polygon(ctx, points, lit)
  polygon(ctx, [[x + width * 0.05, base - height], [x + width / 2 - topInset * 1.3, base - height], [x + width / 2, base], [x + width * 0.18, base]], shadow)
  // strata lines
  ctx.strokeStyle = rgba('#000000', 0.12)
  ctx.lineWidth = 3
  for (let line = 1; line < 4; line += 1) {
    const y = base - height * (line / 4)
    ctx.beginPath()
    ctx.moveTo(x - width / 2 + topInset * (line / 4) + 10, y)
    ctx.lineTo(x + width / 2 - topInset * (line / 4) - 10, y)
    ctx.stroke()
  }
}

/** The colossal half-buried hourglass of the desert. */
export function hourglassMonument(ctx, { x, base, height, frame, glass, sand, sandLevel = 0.6 }) {
  const w = height * 0.42
  const top = base - height
  ctx.fillStyle = frame
  ctx.fillRect(x - w * 0.62, top, w * 1.24, height * 0.06)
  ctx.fillRect(x - w * 0.62, base - height * 0.06, w * 1.24, height * 0.06)
  ctx.fillRect(x - w * 0.6, top, height * 0.035, height)
  ctx.fillRect(x + w * 0.6 - height * 0.035, top, height * 0.035, height)
  const bulb = (upper) => {
    const y0 = upper ? top + height * 0.06 : base - height * 0.06
    const dir = upper ? 1 : -1
    ctx.beginPath()
    ctx.moveTo(x - w * 0.5, y0)
    ctx.bezierCurveTo(x - w * 0.52, y0 + dir * height * 0.3, x - w * 0.05, y0 + dir * height * 0.36, x - w * 0.04, y0 + dir * height * 0.44)
    ctx.lineTo(x + w * 0.04, y0 + dir * height * 0.44)
    ctx.bezierCurveTo(x + w * 0.05, y0 + dir * height * 0.36, x + w * 0.52, y0 + dir * height * 0.3, x + w * 0.5, y0)
    ctx.closePath()
  }
  ctx.fillStyle = glass
  bulb(true)
  ctx.fill()
  bulb(false)
  ctx.fill()
  // sand heaped in the lower bulb and a thin falling stream
  ctx.save()
  bulb(false)
  ctx.clip()
  ctx.fillStyle = sand
  const surface = base - height * 0.06 - height * 0.4 * sandLevel
  ctx.beginPath()
  ctx.moveTo(x - w, base)
  ctx.lineTo(x - w, surface + height * 0.08)
  ctx.quadraticCurveTo(x, surface - height * 0.05, x + w, surface + height * 0.08)
  ctx.lineTo(x + w, base)
  ctx.fill()
  ctx.restore()
  ctx.fillStyle = sand
  ctx.fillRect(x - 2, top + height * 0.48, 4, height * 0.2)
}

export function gear(ctx, { x, y, radius, teeth, color, hole }) {
  ctx.fillStyle = color
  ctx.beginPath()
  for (let tooth = 0; tooth < teeth * 2; tooth += 1) {
    const angle = (tooth / (teeth * 2)) * Math.PI * 2
    const r = tooth % 2 ? radius : radius * 1.14
    const a0 = angle - Math.PI / (teeth * 2) * 0.8
    const a1 = angle + Math.PI / (teeth * 2) * 0.8
    ctx.lineTo(x + Math.cos(a0) * r, y + Math.sin(a0) * r)
    ctx.lineTo(x + Math.cos(a1) * r, y + Math.sin(a1) * r)
  }
  ctx.closePath()
  ctx.fill()
  if (hole) disc(ctx, x, y, radius * 0.35, hole)
}

export function chimney(ctx, { x, base, width, height, color, fire }) {
  polygon(ctx, [[x - width / 2, base], [x - width * 0.36, base - height], [x + width * 0.36, base - height], [x + width / 2, base]], color)
  ctx.fillStyle = color
  ctx.fillRect(x - width * 0.46, base - height - 10, width * 0.92, 14)
  for (let band = 1; band < 4; band += 1) {
    ctx.fillStyle = rgba('#000000', 0.25)
    ctx.fillRect(x - width * 0.45, base - height * band / 4, width * 0.9, 6)
  }
  if (fire) {
    ctx.fillStyle = fire
    ctx.beginPath()
    ctx.moveTo(x - width * 0.3, base - height - 8)
    ctx.quadraticCurveTo(x - width * 0.1, base - height - width * 1.2, x, base - height - width * 0.8)
    ctx.quadraticCurveTo(x + width * 0.15, base - height - width * 1.4, x + width * 0.3, base - height - 8)
    ctx.fill()
  }
}

/** Billowing smoke column: a chain of circles drifting with the wind. */
export function smoke(ctx, { x, y, height, drift, color, light, seed, width = 60 }) {
  const random = rng(seed)
  for (let puff = 0; puff < 16; puff += 1) {
    const t = puff / 15
    const px = x + drift * t * t * height + (random() - 0.5) * width * 0.4
    const py = y - t * height
    const r = width * (0.4 + t * 1.3) * (0.8 + random() * 0.4)
    disc(ctx, px, py, r, color)
    if (light) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(px, py, r, 0, Math.PI * 2)
      ctx.clip()
      disc(ctx, px, py + r * 0.7, r * 0.8, light)
      ctx.restore()
    }
  }
}

export function crane(ctx, { x, base, height, reach, color }) {
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 6
  ctx.fillRect(x - 10, base - height, 20, height)
  // lattice
  ctx.lineWidth = 2
  for (let y = base; y > base - height; y -= 30) {
    ctx.beginPath()
    ctx.moveTo(x - 10, y)
    ctx.lineTo(x + 10, y - 30)
    ctx.stroke()
  }
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.moveTo(x - reach * 0.25, base - height)
  ctx.lineTo(x + reach, base - height - 10)
  ctx.stroke()
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x, base - height - 60)
  ctx.lineTo(x + reach, base - height - 10)
  ctx.moveTo(x, base - height - 60)
  ctx.lineTo(x - reach * 0.25, base - height)
  ctx.moveTo(x + reach * 0.8, base - height - 8)
  ctx.lineTo(x + reach * 0.8, base - height + height * 0.4)
  ctx.stroke()
  ctx.fillRect(x - 3, base - height - 60, 6, 60)
  ctx.fillRect(x + reach * 0.8 - 14, base - height + height * 0.4, 28, 24)
}

export function ship(ctx, { x, base, length, color, masts = 2 }) {
  polygon(ctx, [[x - length / 2, base - length * 0.12], [x + length / 2 + length * 0.08, base - length * 0.14], [x + length * 0.42, base], [x - length * 0.4, base]], color)
  ctx.fillStyle = color
  for (let mast = 0; mast < masts; mast += 1) {
    const mx = x - length * 0.25 + mast * length * 0.45
    ctx.fillRect(mx - 3, base - length * 0.95, 6, length * 0.85)
    ctx.fillRect(mx - length * 0.18, base - length * 0.7, length * 0.36, 4)
    ctx.fillRect(mx - length * 0.13, base - length * 0.88, length * 0.26, 4)
  }
}

export function lighthouse(ctx, { x, base, height, color, lamp }) {
  polygon(ctx, [[x - height * 0.09, base], [x - height * 0.055, base - height], [x + height * 0.055, base - height], [x + height * 0.09, base]], color)
  ctx.fillStyle = color
  ctx.fillRect(x - height * 0.08, base - height - height * 0.02, height * 0.16, height * 0.03)
  ctx.fillStyle = lamp
  ctx.fillRect(x - height * 0.045, base - height - height * 0.11, height * 0.09, height * 0.09)
  polygon(ctx, [[x - height * 0.07, base - height - height * 0.11], [x, base - height - height * 0.18], [x + height * 0.07, base - height - height * 0.11]], color)
}

/** A mountain whose face reads as an enormous skull. */
export function skullMountain(ctx, { x, base, width, height, rock, socket, glowColor, seed }) {
  const random = rng(seed)
  ctx.fillStyle = rock
  ctx.beginPath()
  ctx.moveTo(x - width / 2, base)
  for (let peak = 0; peak <= 12; peak += 1) {
    const t = peak / 12
    const px = x - width / 2 + t * width
    const envelope = Math.sin(t * Math.PI)
    const py = base - height * envelope * (0.72 + random() * 0.28) - (peak % 2 ? height * 0.06 : 0)
    ctx.lineTo(px, py)
  }
  ctx.lineTo(x + width / 2, base)
  ctx.fill()
  const cy = base - height * 0.48
  ;[-1, 1].forEach((side) => {
    ctx.fillStyle = socket
    ctx.beginPath()
    ctx.ellipse(x + side * width * 0.14, cy, width * 0.1, height * 0.12, side * 0.2, 0, Math.PI * 2)
    ctx.fill()
    if (glowColor) {
      ctx.fillStyle = glowColor
      ctx.beginPath()
      ctx.ellipse(x + side * width * 0.14, cy + height * 0.02, width * 0.03, height * 0.035, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  })
  polygon(ctx, [[x - width * 0.04, cy + height * 0.14], [x, cy + height * 0.06], [x + width * 0.04, cy + height * 0.14]], socket)
  ctx.fillStyle = socket
  ctx.fillRect(x - width * 0.16, cy + height * 0.22, width * 0.32, height * 0.08)
  ctx.fillStyle = rock
  for (let tooth = 0; tooth < 6; tooth += 1) ctx.fillRect(x - width * 0.15 + tooth * width * 0.055, cy + height * 0.22, width * 0.03, height * 0.08)
}

/** Colossal creature skeleton: a spine arc with ribs, half sunk into snow. */
export function ribcage(ctx, { x, base, length, height, color, ribs = 9 }) {
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  ctx.lineWidth = height * 0.06
  ctx.beginPath()
  ctx.moveTo(x - length / 2, base - height * 0.2)
  ctx.quadraticCurveTo(x, base - height * 1.05, x + length / 2, base - height * 0.35)
  ctx.stroke()
  for (let rib = 0; rib < ribs; rib += 1) {
    const t = (rib + 0.5) / ribs
    const sx = x - length / 2 + t * length
    const sy = base - height * 0.2 - Math.sin(t * Math.PI) * height * 0.72 - (t > 0.5 ? (t - 0.5) * height * 0.3 : 0)
    ctx.lineWidth = height * (0.04 - Math.abs(t - 0.5) * 0.03)
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.quadraticCurveTo(sx + length * 0.08, sy + height * 0.35, sx - length * 0.02, base + 6)
    ctx.stroke()
  }
}

export function camel(ctx, { x, base, size, color }) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(x, base - size * 0.62, size * 0.45, size * 0.2, 0, 0, Math.PI * 2)
  ctx.fill()
  disc(ctx, x - size * 0.08, base - size * 0.8, size * 0.16, color)
  ctx.lineWidth = size * 0.07
  ctx.strokeStyle = color
  ctx.beginPath()
  ctx.moveTo(x + size * 0.38, base - size * 0.66)
  ctx.quadraticCurveTo(x + size * 0.55, base - size * 0.95, x + size * 0.68, base - size * 0.92)
  ctx.stroke()
  ctx.lineWidth = size * 0.05
  ;[-0.3, -0.16, 0.2, 0.32].forEach((leg) => {
    ctx.beginPath()
    ctx.moveTo(x + leg * size, base - size * 0.5)
    ctx.lineTo(x + leg * size + size * 0.02, base)
    ctx.stroke()
  })
}

/** Samurai silhouette drawn in a 100-unit body space: hakama, wide sleeves, topknot, katana. */
export function samurai(ctx, { x, base, height, color, drawn = false, facing = 1, windy = 0 }) {
  const u = height / 100
  const w = windy
  ctx.save()
  ctx.translate(x, base)
  ctx.scale(facing * u, u)
  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  // hakama: flared trousers split between the legs, hem pushed back by the wind
  ctx.beginPath()
  ctx.moveTo(-14 - w * 6, 0)
  ctx.bezierCurveTo(-13 - w * 4, -16, -11, -34, -8.5, -47)
  ctx.lineTo(8.5, -47)
  ctx.bezierCurveTo(10.5, -34, 12.5, -16, 14 - w * 2, 0)
  ctx.lineTo(4.5, 0)
  ctx.quadraticCurveTo(1.5, -8, 0.5, -15)
  ctx.quadraticCurveTo(-0.5, -8, -3, 0)
  ctx.closePath()
  ctx.fill()
  // sandals
  ctx.fillRect(-13, -1.6, 9, 1.8)
  ctx.fillRect(3.5, -1.6, 10, 1.8)
  // gi torso and obi
  ctx.beginPath()
  ctx.moveTo(-8.8, -46)
  ctx.bezierCurveTo(-10.2, -56, -10.6, -70, -8, -79)
  ctx.quadraticCurveTo(-4, -82.5, 0, -82.5)
  ctx.quadraticCurveTo(5, -82.5, 8.5, -79)
  ctx.bezierCurveTo(10.6, -70, 10.2, -56, 8.8, -46)
  ctx.closePath()
  ctx.fill()
  ctx.fillRect(-10, -52, 20, 5)
  // back sleeve: the wide kimono sleeve hanging and flying backwards
  ctx.beginPath()
  ctx.moveTo(-7.5, -79.5)
  ctx.bezierCurveTo(-14 - w * 4, -76, -19 - w * 10, -66, -21 - w * 13, -55 - w * 2)
  ctx.lineTo(-13 - w * 7, -53)
  ctx.bezierCurveTo(-12, -60, -10, -66, -7, -70)
  ctx.closePath()
  ctx.fill()
  if (drawn) {
    // front arm raised forward, both hands on the grip, blade up and ahead
    ctx.beginPath()
    ctx.moveTo(6, -79)
    ctx.bezierCurveTo(13, -78, 19, -74, 23, -69)
    ctx.lineTo(20, -64)
    ctx.bezierCurveTo(15, -66, 10, -68, 6, -70)
    ctx.closePath()
    ctx.fill()
    ctx.lineWidth = 3.2
    ctx.beginPath()
    ctx.moveTo(19, -64)
    ctx.lineTo(26, -71)
    ctx.stroke()
    ctx.lineWidth = 1.7
    ctx.beginPath()
    ctx.moveTo(26, -71)
    ctx.quadraticCurveTo(44, -86, 60, -97)
    ctx.stroke()
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(24.2, -72.8)
    ctx.lineTo(27.6, -69.2)
    ctx.stroke()
  } else {
    // front sleeve hanging, hand resting on the hilt of the sheathed katana
    ctx.beginPath()
    ctx.moveTo(6.5, -79.5)
    ctx.bezierCurveTo(12, -76, 15, -68, 15.5, -58)
    ctx.lineTo(9, -56)
    ctx.bezierCurveTo(8.5, -63, 7, -69, 5, -72)
    ctx.closePath()
    ctx.fill()
    ctx.lineWidth = 2.4
    ctx.beginPath()
    ctx.moveTo(-20, -38)
    ctx.lineTo(9, -52)
    ctx.stroke()
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(9, -52)
    ctx.lineTo(18, -56.5)
    ctx.stroke()
  }
  // neck, head, topknot
  ctx.fillRect(-1.8, -87, 3.6, 6)
  ctx.beginPath()
  ctx.ellipse(0.6, -91.5, 5.4, 6.3, 0.05, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(-0.8, -99.2, 2.5, 2.2, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillRect(-1.6, -98.2, 1.8, 2.8)
  ctx.restore()
}

/**
 * Hz. Ali, drawn with respect: turban, a long aba that flows in the wind and
 * Zülfikar with its forked tip. The face is never drawn; a veil of light
 * covers it.
 */
export function veiledWarrior(ctx, { x, base, height, color, light, facing = 1, windy = 0, blade = true, raised = false }) {
  const u = height / 100
  const w = windy
  ctx.save()
  ctx.translate(x, base)
  ctx.scale(facing * u, u)
  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  // the aba: broad-shouldered cloak falling to the ankles, its back edge lifted by the wind
  ctx.beginPath()
  ctx.moveTo(-12.5, -78)
  ctx.bezierCurveTo(-18 - w * 4, -60, -21 - w * 10, -32, -26 - w * 16, -2 + w * 3)
  ctx.quadraticCurveTo(-12, 1, -2, 0)
  ctx.lineTo(15.5, 0)
  ctx.bezierCurveTo(14.5, -26, 14, -56, 12.5, -78)
  ctx.closePath()
  ctx.fill()
  // feet under the hem
  ctx.fillRect(-4, -1.6, 9, 1.8)
  ctx.fillRect(7, -1.6, 9, 1.8)
  // rounded shoulders
  ctx.beginPath()
  ctx.ellipse(0, -78.5, 14.5, 5.5, 0, 0, Math.PI * 2)
  ctx.fill()
  // back arm hidden in the cloak; the sword arm reaches forward
  ctx.beginPath()
  ctx.moveTo(9.5, -79)
  if (raised) {
    ctx.bezierCurveTo(16, -84, 20, -90, 22, -96)
    ctx.lineTo(18, -98)
    ctx.bezierCurveTo(15, -92, 11, -86, 7, -82)
  } else {
    ctx.bezierCurveTo(16, -72, 20, -64, 23, -57)
    ctx.lineTo(18.5, -55)
    ctx.bezierCurveTo(15, -62, 11, -68, 7, -72)
  }
  ctx.closePath()
  ctx.fill()
  // neck, head and turban with its tail cloth flowing behind
  ctx.fillRect(-2.2, -86, 4.4, 6)
  ctx.beginPath()
  ctx.ellipse(0.8, -89.5, 5.8, 6.6, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(0, -95, 8.4, 5.2, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(0.4, -98.6, 6, 3.6, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(-6.5, -95)
  ctx.bezierCurveTo(-11 - w * 5, -93, -13 - w * 9, -86, -12 - w * 12, -76)
  ctx.lineTo(-9.5 - w * 10, -77)
  ctx.bezierCurveTo(-10 - w * 6, -85, -8 - w * 3, -90, -5, -91)
  ctx.closePath()
  ctx.fill()
  if (blade) {
    // Zülfikar: a long straight blade whose tip splits in two
    const [hx, hy, tx, ty] = raised ? [20, -97, 30, -128] : [21, -56, 54, -40]
    const dx = tx - hx
    const dy = ty - hy
    const len = Math.hypot(dx, dy)
    const nx = dx / len
    const ny = dy / len
    ctx.lineWidth = 2.6
    ctx.beginPath()
    ctx.moveTo(hx - nx * 5, hy - ny * 5)
    ctx.lineTo(hx + nx * 2, hy + ny * 2)
    ctx.stroke()
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(hx + nx * 2 - ny * 3.2, hy + ny * 2 + nx * 3.2)
    ctx.lineTo(hx + nx * 2 + ny * 3.2, hy + ny * 2 - nx * 3.2)
    ctx.stroke()
    ctx.lineWidth = 2.4
    const split = 0.8
    const sx = hx + dx * split
    const sy = hy + dy * split
    ctx.beginPath()
    ctx.moveTo(hx + nx * 2, hy + ny * 2)
    ctx.lineTo(sx, sy)
    ctx.stroke()
    ctx.lineWidth = 1.5
    ;[-1, 1].forEach((side) => {
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(tx - ny * side * 2.2, ty + nx * side * 2.2)
      ctx.stroke()
    })
  }
  ctx.restore()
  if (light) {
    const headX = x + facing * 0.8 * u
    const headY = base - 90 * u
    const gradient = ctx.createRadialGradient(headX, headY, 0, headX, headY, 14 * u)
    const [r, g, b] = [parseInt(light.slice(1, 3), 16), parseInt(light.slice(3, 5), 16), parseInt(light.slice(5, 7), 16)]
    gradient.addColorStop(0, `rgba(${r},${g},${b},1)`)
    gradient.addColorStop(0.45, `rgba(${r},${g},${b},0.85)`)
    gradient.addColorStop(1, `rgba(${r},${g},${b},0)`)
    ctx.fillStyle = gradient
    ctx.fillRect(headX - 14 * u, headY - 14 * u, 28 * u, 28 * u)
  }
}

/** A looming tyrant with a cape, horns, flame brows and burning eyes. */
export function tyrant(ctx, { x, base, height, color, eyes, flame }) {
  const s = height / 100
  ctx.save()
  ctx.translate(x, base)
  ctx.scale(s, s)
  ctx.fillStyle = color
  // cape spreading across the frame
  ctx.beginPath()
  ctx.moveTo(-60, 0)
  ctx.bezierCurveTo(-52, -30, -40, -52, -22, -62)
  ctx.quadraticCurveTo(-14, -70, -12, -78)
  ctx.lineTo(12, -78)
  ctx.quadraticCurveTo(14, -70, 22, -62)
  ctx.bezierCurveTo(40, -52, 52, -30, 60, 0)
  ctx.closePath()
  ctx.fill()
  // head: long, narrow chin, high cheekbones
  ctx.beginPath()
  ctx.moveTo(0, -60)
  ctx.bezierCurveTo(-10, -62, -15, -76, -14, -88)
  ctx.bezierCurveTo(-13, -97, -6, -101, 0, -101)
  ctx.bezierCurveTo(6, -101, 13, -97, 14, -88)
  ctx.bezierCurveTo(15, -76, 10, -62, 0, -60)
  ctx.fill()
  // horns sweeping up and out
  ;[-1, 1].forEach((side) => {
    ctx.beginPath()
    ctx.moveTo(side * 7, -97)
    ctx.bezierCurveTo(side * 18, -104, side * 28, -116, side * 30, -128)
    ctx.bezierCurveTo(side * 22, -116, side * 14, -106, side * 3, -100)
    ctx.closePath()
    ctx.fill()
  })
  if (flame) {
    ctx.fillStyle = flame
    ;[-1, 1].forEach((side) => {
      ctx.beginPath()
      ctx.moveTo(side * 1.5, -86)
      ctx.bezierCurveTo(side * 8, -92, side * 14, -97, side * 22, -100)
      ctx.bezierCurveTo(side * 17, -96, side * 18, -93, side * 16, -89)
      ctx.bezierCurveTo(side * 11, -90, side * 6, -88, side * 1.5, -86)
      ctx.fill()
    })
  }
  ctx.fillStyle = eyes
  ;[-1, 1].forEach((side) => {
    ctx.beginPath()
    ctx.ellipse(side * 6.2, -82.5, 3.8, 1.5, side * -0.28, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.restore()
}

export function beetleDrone(ctx, { x, y, size, color, eye }) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(x, y, size * 0.5, size * 0.34, 0, 0, Math.PI * 2)
  ctx.fill()
  disc(ctx, x + size * 0.46, y + size * 0.04, size * 0.16, color)
  ctx.strokeStyle = color
  ctx.lineWidth = size * 0.05
  for (let leg = 0; leg < 3; leg += 1) {
    ctx.beginPath()
    ctx.moveTo(x - size * 0.2 + leg * size * 0.2, y + size * 0.2)
    ctx.lineTo(x - size * 0.3 + leg * size * 0.22, y + size * 0.5)
    ctx.stroke()
  }
  disc(ctx, x + size * 0.52, y, size * 0.04, eye)
}

/** Prayer flags on a sagging line between two points. */
export function flagLine(ctx, { x1, y1, x2, y2, sag, count, colors, size, line }) {
  ctx.strokeStyle = line
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.quadraticCurveTo((x1 + x2) / 2, Math.max(y1, y2) + sag, x2, y2)
  ctx.stroke()
  for (let flag = 0; flag < count; flag += 1) {
    const t = (flag + 0.5) / count
    const px = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * ((x1 + x2) / 2) + t * t * x2
    const py = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * (Math.max(y1, y2) + sag) + t * t * y2
    ctx.fillStyle = colors[flag % colors.length]
    ctx.fillRect(px - size * 0.4, py, size * 0.8, size)
  }
}

/** Neon glyph block: invented strokes that read as signage without any real script. */
export function neonGlyphs(ctx, { x, y, width, height, color, seed }) {
  const random = rng(seed)
  ctx.save()
  ctx.shadowColor = color
  ctx.shadowBlur = 18
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(3, width * 0.06)
  ctx.lineCap = 'square'
  ctx.strokeRect(x, y, width, height)
  const cells = Math.max(1, Math.round(height / width))
  for (let cell = 0; cell < cells; cell += 1) {
    const cy = y + (cell + 0.5) * (height / cells)
    ctx.beginPath()
    ctx.moveTo(x + width * 0.2, cy - height / cells * 0.25)
    ctx.lineTo(x + width * 0.8, cy - height / cells * 0.25)
    if (random() > 0.4) {
      ctx.moveTo(x + width * 0.5, cy - height / cells * 0.3)
      ctx.lineTo(x + width * 0.5, cy + height / cells * 0.3)
    }
    if (random() > 0.5) {
      ctx.moveTo(x + width * 0.25, cy + height / cells * 0.2)
      ctx.lineTo(x + width * 0.75, cy + height / cells * 0.2)
    }
    ctx.stroke()
  }
  ctx.restore()
}

/** A torii gate. */
export function torii(ctx, { x, base, width, height, color }) {
  ctx.fillStyle = color
  ctx.fillRect(x - width * 0.38, base - height, width * 0.07, height)
  ctx.fillRect(x + width * 0.31, base - height, width * 0.07, height)
  ctx.fillRect(x - width * 0.45, base - height * 0.82, width * 0.9, height * 0.06)
  ctx.beginPath()
  ctx.moveTo(x - width * 0.55, base - height * 1.02)
  ctx.quadraticCurveTo(x, base - height * 0.9, x + width * 0.55, base - height * 1.02)
  ctx.lineTo(x + width * 0.5, base - height * 0.93)
  ctx.quadraticCurveTo(x, base - height * 0.84, x - width * 0.5, base - height * 0.93)
  ctx.fill()
}

/** Seated stone guardian with a sword across the knees. */
export function guardianStatue(ctx, { x, base, height, color, shade }) {
  const s = height
  ctx.fillStyle = color
  ctx.fillRect(x - s * 0.4, base - s * 0.16, s * 0.8, s * 0.16)
  ctx.beginPath()
  ctx.ellipse(x, base - s * 0.26, s * 0.36, s * 0.14, 0, 0, Math.PI * 2)
  ctx.fill()
  polygon(ctx, [[x - s * 0.24, base - s * 0.3], [x - s * 0.19, base - s * 0.7], [x + s * 0.19, base - s * 0.7], [x + s * 0.24, base - s * 0.3]], color)
  disc(ctx, x, base - s * 0.8, s * 0.11, color)
  polygon(ctx, [[x - s * 0.13, base - s * 0.86], [x, base - s * 1.02], [x + s * 0.13, base - s * 0.86]], color)
  if (shade) polygon(ctx, [[x + s * 0.02, base - s * 0.3], [x + s * 0.02, base - s * 0.7], [x + s * 0.19, base - s * 0.7], [x + s * 0.24, base - s * 0.3]], shade)
  ctx.fillStyle = shade ?? color
  ctx.fillRect(x - s * 0.5, base - s * 0.3, s, s * 0.025)
}

/** A great throne silhouette with a high, spiked back. */
export function throneSilhouette(ctx, { x, base, height, color }) {
  const s = height
  polygon(ctx, [[x - s * 0.34, base], [x - s * 0.3, base - s * 0.62], [x - s * 0.22, base - s * 0.95], [x - s * 0.1, base - s * 0.8], [x, base - s * 1.08], [x + s * 0.1, base - s * 0.8], [x + s * 0.22, base - s * 0.95], [x + s * 0.3, base - s * 0.62], [x + s * 0.34, base]], color)
  ctx.fillStyle = color
  ctx.fillRect(x - s * 0.5, base - s * 0.34, s, s * 0.08)
  ctx.fillRect(x - s * 0.62, base - s * 0.08, s * 1.24, s * 0.08)
}
