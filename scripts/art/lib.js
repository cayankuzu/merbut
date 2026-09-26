// MERBUT art studio — shared Canvas 2D helpers.
// Everything is deterministic (seeded) so re-running the generator reproduces
// the same paintings. Style: flat colour planes, strong silhouettes, atmospheric
// perspective, big graphic celestial bodies and a printed grain — album covers.

export function rng(seed) {
  let value = seed >>> 0 || 1
  return () => {
    value ^= value << 13
    value ^= value >>> 17
    value ^= value << 5
    return ((value >>> 0) % 1_000_000) / 1_000_000
  }
}

export const lerp = (a, b, t) => a + (b - a) * t
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
export const smooth = (t) => t * t * (3 - 2 * t)

/** 1D value noise with smooth interpolation, summed over octaves. */
export function noise1d(seed) {
  const random = rng(seed)
  const table = Array.from({ length: 1024 }, () => random() * 2 - 1)
  const at = (x) => {
    const i = Math.floor(x)
    const f = x - i
    const a = table[((i % 1024) + 1024) % 1024]
    const b = table[(((i + 1) % 1024) + 1024) % 1024]
    return lerp(a, b, smooth(f))
  }
  return (x, octaves = 4, persistence = 0.5) => {
    let total = 0
    let amplitude = 1
    let frequency = 1
    let norm = 0
    for (let octave = 0; octave < octaves; octave += 1) {
      total += at(x * frequency) * amplitude
      norm += amplitude
      amplitude *= persistence
      frequency *= 2
    }
    return total / norm
  }
}

export function hex(color) {
  const value = color.replace('#', '')
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)]
}

export function mix(a, b, t) {
  const [ar, ag, ab] = hex(a)
  const [br, bg, bb] = hex(b)
  const channel = (x, y) => Math.round(lerp(x, y, clamp(t, 0, 1))).toString(16).padStart(2, '0')
  return `#${channel(ar, br)}${channel(ag, bg)}${channel(ab, bb)}`
}

export const rgba = (color, alpha) => {
  const [r, g, b] = hex(color)
  return `rgba(${r},${g},${b},${alpha})`
}

export function canvas(width, height) {
  const element = document.createElement('canvas')
  element.width = width
  element.height = height
  const ctx = element.getContext('2d', { willReadFrequently: true })
  return { element, ctx, width, height }
}

/** Vertical sky gradient from a list of [position, colour] stops. */
export function sky(ctx, width, height, stops, y0 = 0, y1 = height) {
  const gradient = ctx.createLinearGradient(0, y0, 0, y1)
  stops.forEach(([at, color]) => gradient.addColorStop(at, color))
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

export function glow(ctx, x, y, radius, color, alpha = 1) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
  gradient.addColorStop(0, rgba(color, alpha))
  gradient.addColorStop(0.35, rgba(color, alpha * 0.45))
  gradient.addColorStop(1, rgba(color, 0))
  ctx.fillStyle = gradient
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
}

export function disc(ctx, x, y, radius, color) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
}

export function ring(ctx, x, y, radius, width, color) {
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.stroke()
}

/** A horizontal band of haze that thickens towards `y`. */
export function haze(ctx, width, y, height, color, alpha) {
  const gradient = ctx.createLinearGradient(0, y - height, 0, y + height * 0.4)
  gradient.addColorStop(0, rgba(color, 0))
  gradient.addColorStop(0.75, rgba(color, alpha))
  gradient.addColorStop(1, rgba(color, alpha * 0.6))
  ctx.fillStyle = gradient
  ctx.fillRect(0, y - height, width, height * 1.4)
}

/**
 * A mountain / dune / skyline ridge: the line y(x) filled down to the bottom.
 * `shape` maps a noise value to a height so the same helper makes jagged peaks,
 * soft dunes or plateaus.
 */
export function ridge(ctx, { width, height, base, amplitude, scale, seed, color, octaves = 5, persistence = 0.5, shape = (v) => v, step = 4, x0 = 0, x1 = width }) {
  const n = noise1d(seed)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x0, height)
  for (let x = x0; x <= x1 + step; x += step) {
    const value = shape(n(x / scale, octaves, persistence))
    ctx.lineTo(x, base - value * amplitude)
  }
  ctx.lineTo(x1, height)
  ctx.closePath()
  ctx.fill()
}

/** Speckled printed grain over the whole canvas (per-pixel, deterministic). */
export function grain(target, amount = 10, seed = 7) {
  const { ctx, width, height } = target
  const image = ctx.getImageData(0, 0, width, height)
  const data = image.data
  const random = rng(seed)
  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] === 0) continue
    const delta = (random() - 0.5) * amount
    data[index] = clamp(data[index] + delta, 0, 255)
    data[index + 1] = clamp(data[index + 1] + delta, 0, 255)
    data[index + 2] = clamp(data[index + 2] + delta, 0, 255)
  }
  ctx.putImageData(image, 0, 0)
}

/** Halftone dots whose size follows a vertical ramp: the print look of old posters. */
export function halftone(ctx, { x = 0, y, width, height, spacing = 14, maxRadius = 4, color, alpha = 0.25, fromTop = true }) {
  ctx.fillStyle = rgba(color, alpha)
  for (let row = 0; row * spacing < height; row += 1) {
    const t = row * spacing / height
    const radius = maxRadius * (fromTop ? 1 - t : t)
    if (radius < 0.3) continue
    for (let column = 0; column * spacing < width; column += 1) {
      const px = x + column * spacing + (row % 2 ? spacing / 2 : 0)
      ctx.beginPath()
      ctx.arc(px, y + row * spacing, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

/** Long flat cloud streaks, the kind painted with one sweep of a wide brush. */
export function streaks(ctx, { width, count, yMin, yMax, color, alpha, seed, minLength = 200, maxLength = 900, thickness = [6, 26] }) {
  const random = rng(seed)
  for (let index = 0; index < count; index += 1) {
    const length = lerp(minLength, maxLength, random())
    const x = random() * (width + length) - length / 2
    const y = lerp(yMin, yMax, random())
    const h = lerp(thickness[0], thickness[1], random())
    ctx.fillStyle = rgba(color, alpha * lerp(0.5, 1, random()))
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(x + length * 0.5, y - h * 0.9, x + length, y + h * 0.1)
    ctx.quadraticCurveTo(x + length * 0.55, y + h * 0.6, x, y)
    ctx.fill()
  }
}

/** A stylised swirl cloud (spiral curl), the ornamental motif of the throne sky. */
export function swirl(ctx, x, y, radius, color, lineWidth, turns = 2.2) {
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.beginPath()
  const steps = 90
  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps
    const angle = t * Math.PI * 2 * turns
    const r = radius * (1 - t * 0.85)
    const px = x + Math.cos(angle) * r
    const py = y + Math.sin(angle) * r * 0.7
    if (index === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()
}

/** A jagged lightning bolt with branches, drawn as a glowing stroke. */
export function bolt(ctx, { x, y, length, seed, color = '#eef3ff', glowColor = '#7f9bff', width = 5, branches = 3, drift = 0 }) {
  const random = rng(seed)
  const path = (sx, sy, len, w, depth) => {
    const points = [[sx, sy]]
    let px = sx
    let py = sy
    const segments = 12
    for (let index = 0; index < segments; index += 1) {
      px += (random() - 0.5) * len * 0.12 + drift * len / segments
      py += len / segments
      points.push([px, py])
    }
    ctx.save()
    ctx.shadowColor = glowColor
    ctx.shadowBlur = w * 6
    ctx.strokeStyle = color
    ctx.lineWidth = w
    ctx.lineJoin = 'miter'
    ctx.beginPath()
    points.forEach(([a, b], index) => (index ? ctx.lineTo(a, b) : ctx.moveTo(a, b)))
    ctx.stroke()
    ctx.restore()
    if (depth > 0) {
      for (let branch = 0; branch < branches; branch += 1) {
        const [bx, by] = points[2 + Math.floor(random() * (points.length - 4))]
        path(bx, by, len * (0.25 + random() * 0.25), w * 0.5, depth - 1)
      }
    }
  }
  path(x, y, length, width, 1)
}

export function birds(ctx, { x, y, count, spread, size, color, seed }) {
  const random = rng(seed)
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  for (let index = 0; index < count; index += 1) {
    const bx = x + (random() - 0.5) * spread
    const by = y + (random() - 0.5) * spread * 0.35
    const s = size * (0.6 + random() * 0.6)
    ctx.lineWidth = Math.max(1.5, s * 0.14)
    ctx.beginPath()
    ctx.moveTo(bx - s, by)
    ctx.quadraticCurveTo(bx - s * 0.4, by - s * 0.55, bx, by)
    ctx.quadraticCurveTo(bx + s * 0.4, by - s * 0.55, bx + s, by)
    ctx.stroke()
  }
}

/** Light rays fanning from a point, very transparent: the god-ray feel. */
export function rays(ctx, { x, y, count, length, spread, from, color, alpha, seed, width = 0.05 }) {
  const random = rng(seed)
  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  for (let index = 0; index < count; index += 1) {
    const angle = from + (index / Math.max(1, count - 1) - 0.5) * spread + (random() - 0.5) * 0.05
    const w = width * (0.5 + random())
    const gradient = ctx.createLinearGradient(x, y, x + Math.cos(angle) * length, y + Math.sin(angle) * length)
    gradient.addColorStop(0, rgba(color, alpha))
    gradient.addColorStop(1, rgba(color, 0))
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(angle - w) * length, y + Math.sin(angle - w) * length)
    ctx.lineTo(x + Math.cos(angle + w) * length, y + Math.sin(angle + w) * length)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

/** Soft vignette to focus the eye on the middle band. */
export function vignette(target, strength = 0.45, color = '#000000') {
  const { ctx, width, height } = target
  const gradient = ctx.createRadialGradient(width / 2, height * 0.45, Math.min(width, height) * 0.3, width / 2, height * 0.45, Math.max(width, height) * 0.75)
  gradient.addColorStop(0, rgba(color, 0))
  gradient.addColorStop(1, rgba(color, strength))
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

/** Draws with a temporary transform: flips, rotations and offsets without leaks. */
export function withTransform(ctx, { x = 0, y = 0, rotate = 0, scaleX = 1, scaleY = 1 }, draw) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotate)
  ctx.scale(scaleX, scaleY)
  draw()
  ctx.restore()
}

export function polygon(ctx, points, color) {
  ctx.fillStyle = color
  ctx.beginPath()
  points.forEach(([x, y], index) => (index ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.closePath()
  ctx.fill()
}
