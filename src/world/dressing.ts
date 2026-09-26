import { BIOMES, BIOME_WORLD_WIDTH, WORLD_VISUAL_LEFT, type BiomeId } from '../config/biomes'
import { contentFor } from '../content/biomeContent'
import { Kit, seeded } from './kit'

/**
 * Procedural set dressing for all ten biomes, in three depth layers:
 *   path  (z ±2)      what the heroes walk on
 *   mid   (z -3..-9)  props that frame the fight against the painted backdrop
 *   fore  (z +4..+8)  dark silhouettes near the camera that sell the depth
 */
type Dress = (kit: Kit, left: number, random: () => number) => void

const W = BIOME_WORLD_WIDTH
const TAU = Math.PI * 2
const range = (count: number) => Array.from({ length: count }, (_, index) => index)
const pick = <T,>(random: () => number, items: readonly T[]) => items[Math.floor(random() * items.length)]!
const between = (random: () => number, minimum: number, maximum: number) => minimum + random() * (maximum - minimum)

function hangingCable(kit: Kit, x1: number, x2: number, y: number, z: number, sag: number, color: string, radius = 0.035) {
  const middle = (x1 + x2) / 2
  kit.tube('silhouette', [[x1, y, z], [(x1 + middle) / 2, y - sag * 0.75, z], [middle, y - sag, z], [(middle + x2) / 2, y - sag * 0.75, z], [x2, y, z]], radius, { color })
}

function chain(kit: Kit, x: number, top: number, bottom: number, z: number, color: string) {
  const links = Math.floor((top - bottom) / 0.22)
  range(links).forEach((index) => kit.torus('silhouette', 0.1, 0.028, { at: [x, top - index * 0.22, z], rotate: [0, index % 2 ? Math.PI / 2 : 0, 0], color }, TAU, 10))
}

// ── 1 · Aku Metropolü ─────────────────────────────────────────────────────
const city: Dress = (kit, left, random) => {
  range(Math.floor(W / 1.2)).forEach((index) => {
    const x = left + 0.6 + index * 1.2
    kit.box('stone', [1.08, 0.03, 1.1], { at: [x, 0.055, -1.2], color: '#3a2830' })
    kit.box('stone', [1.08, 0.03, 1.1], { at: [x, 0.055, 1.2], color: '#302128' })
    if (index % 3 !== 1) kit.box('glow', [0.9, 0.025, 0.05], { at: [x, 0.07, 1.92], color: '#ff2a70' })
    if (index % 4 !== 2) kit.box('glow', [0.9, 0.025, 0.05], { at: [x, 0.07, -1.92], color: '#ff5c9a' })
  })
  range(9).forEach(() => kit.cylinder('gloss', 0.9, 0.9, 0.01, { at: [left + between(random, 1, W - 1), 0.075, between(random, -1.5, 1.5)], scale: [between(random, 0.6, 1.4), 1, between(random, 0.4, 0.8)], color: '#150b10' }, 18))
  // mid: street lamps, pylons with neon rings, hologram billboards, cables
  range(6).forEach((index) => {
    const x = left + 3 + index * 6 + between(random, -0.6, 0.6)
    kit.cylinder('metal', 0.07, 0.11, 4.4, { at: [x, 2.2, -3.4], color: '#2c1b24' })
    kit.box('metal', [1.1, 0.08, 0.1], { at: [x + 0.5, 4.35, -3.4], color: '#2c1b24' })
    kit.sphere('glow', 0.16, { at: [x + 1, 4.18, -3.4], color: '#ffc3dd' })
    kit.box('metal', [0.5, 0.9, 0.3], { at: [x - 1.6, 0.45, -3.9], color: '#231419' })
    kit.box('glow', [0.36, 0.24, 0.02], { at: [x - 1.6, 0.66, -3.74], color: index % 2 ? '#43f3ff' : '#ff3d7f' })
  })
  range(4).forEach((index) => {
    const x = left + 5 + index * 9
    const height = between(random, 5.5, 8)
    kit.cylinder('metal', 0.34, 0.6, height, { at: [x, height / 2, -7.4], color: '#1b0d16' }, 6)
    kit.torus('metal', 0.8, 0.1, { at: [x, height - 0.6, -7.4], rotate: [Math.PI / 2, 0, 0], color: '#421226' })
    kit.torus('glow', 0.82, 0.03, { at: [x, height - 0.6, -7.2], rotate: [Math.PI / 2, 0, 0], color: '#ff286f' })
    kit.box('glow', [1.6, 0.9, 0.04], { at: [x + 1.6, height * 0.6, -7.1], color: index % 2 ? '#7d2bff' : '#ff2a6d' })
    range(3).forEach((stripe) => kit.box('stone', [1.6, 0.06, 0.05], { at: [x + 1.6, height * 0.6 - 0.25 + stripe * 0.25, -7.05], color: '#1a0712' }))
  })
  hangingCable(kit, left - 2, left + 14, 7.6, -5.5, 1.1, '#0c0509', 0.04)
  hangingCable(kit, left + 14, left + 30, 7.3, -5.5, 0.9, '#0c0509', 0.04)
  // fore: pipes, barrier posts, hanging cables near the lens
  range(4).forEach((index) => {
    const x = left + 2 + index * 9 + between(random, -1, 1)
    kit.cylinder('silhouette', 0.22, 0.22, 3.2, { at: [x, 0.3, 6.2], rotate: [0, 0, Math.PI / 2], color: '#0b0408' })
    kit.box('silhouette', [0.18, 1.2, 0.18], { at: [x + 2.4, 0.6, 5.6], color: '#0b0408' })
    kit.box('glow', [0.05, 0.5, 0.05], { at: [x + 2.4, 0.9, 5.7], color: '#ff286f' })
  })
  hangingCable(kit, left, left + 18, 8.6, 5.2, 0.9, '#070205', 0.05)
  hangingCable(kit, left + 18, left + W, 8.8, 5.6, 1.2, '#070205', 0.05)
}

// ── 2 · Günbatımı Limanı ──────────────────────────────────────────────────
const harbor: Dress = (kit, left, random) => {
  const planks = ['#5a3f2e', '#4d3526', '#624531', '#553a2b']
  range(Math.floor(W / 0.4)).forEach((index) => {
    kit.box('wood', [0.36, 0.08, 4.1], { at: [left + 0.2 + index * 0.4, 0.04 + random() * 0.015, 0], rotate: [0, (random() - 0.5) * 0.02, 0], color: pick(random, planks) })
  })
  range(Math.floor(W / 3)).forEach((index) => {
    const x = left + 1.5 + index * 3
    kit.cylinder('wood', 0.13, 0.15, 1.1, { at: [x, 0.5, -2.2], color: '#3b2a20' })
    kit.cylinder('wood', 0.13, 0.15, 0.9, { at: [x, 0.4, 2.25], color: '#3b2a20' })
    if (index < Math.floor(W / 3) - 1) kit.tube('wood', [[x, 0.95, -2.2], [x + 1.5, 0.72, -2.2], [x + 3, 0.95, -2.2]], 0.025, { color: '#b58f5c' }, 12)
  })
  // mid: crate stacks, barrels, lanterns, masts
  range(5).forEach((index) => {
    const x = left + 3.5 + index * 7 + between(random, -1, 1)
    kit.box('wood', [1, 1, 1], { at: [x, 0.5, -4.2], rotate: [0, 0.2, 0], color: '#6a4a33' })
    kit.box('wood', [0.8, 0.8, 0.8], { at: [x + 0.2, 1.4, -4.3], rotate: [0, -0.3, 0], color: '#7a5539' })
    kit.cylinder('wood', 0.38, 0.38, 0.9, { at: [x + 1.4, 0.45, -3.8], color: '#5c3c29' }, 12)
    kit.torus('metal', 0.39, 0.03, { at: [x + 1.4, 0.2, -3.8], rotate: [Math.PI / 2, 0, 0], color: '#2a2320' })
    kit.torus('metal', 0.39, 0.03, { at: [x + 1.4, 0.7, -3.8], rotate: [Math.PI / 2, 0, 0], color: '#2a2320' })
    kit.cylinder('wood', 0.06, 0.08, 3.3, { at: [x - 2, 1.65, -3.5], color: '#2f221b' })
    kit.box('metal', [0.32, 0.4, 0.32], { at: [x - 2, 3.1, -3.5], color: '#2a1f18' })
    kit.box('glow', [0.24, 0.3, 0.24], { at: [x - 2, 3.1, -3.5], color: '#ffc46b' })
  })
  range(3).forEach((index) => {
    const x = left + 6 + index * 12
    kit.cylinder('wood', 0.16, 0.22, 9, { at: [x, 4.5, -9], color: '#1f1612' })
    kit.box('wood', [4.2, 0.14, 0.14], { at: [x, 7.2, -9], color: '#1f1612' })
    kit.tube('wood', [[x - 2, 7.2, -9], [x - 0.4, 3, -9], [x + 1.6, 0.5, -9]], 0.02, { color: '#1a120e' }, 10)
  })
  // fore: barrels, rope coils, a hanging lantern
  range(4).forEach((index) => {
    const x = left + 1 + index * 9 + between(random, -1.2, 1.2)
    kit.cylinder('silhouette', 0.5, 0.5, 1.2, { at: [x, 0.6, 6.4], color: '#0f0a08' }, 12)
    kit.box('silhouette', [1.3, 0.9, 1], { at: [x + 1.4, 0.45, 6.9], rotate: [0, 0.3, 0], color: '#0c0806' })
    kit.torus('silhouette', 0.35, 0.09, { at: [x - 1.2, 0.1, 5.8], rotate: [Math.PI / 2, 0, 0], color: '#18110c' })
  })
  kit.tube('silhouette', [[left + 8, 9.5, 5.6], [left + 8.2, 8.5, 5.6], [left + 8.4, 7.7, 5.6]], 0.03, { color: '#0a0705' })
  kit.box('glow', [0.3, 0.42, 0.3], { at: [left + 8.4, 7.4, 5.6], color: '#ffb34f' })
}

// ── 3 · Kum Saati Çölü ────────────────────────────────────────────────────
const desert: Dress = (kit, left, random) => {
  const sands = ['#c98d55', '#d49a60', '#bf8150', '#dba56a']
  // path: an old caravan road of cracked sandstone half swallowed by dunes
  range(Math.floor(W / 1.3)).forEach((index) => {
    const x = left + 0.65 + index * 1.3
    ;[-1.1, 0.15, 1.35].forEach((z) => {
      if (random() < 0.18) return
      kit.box('stone', [between(random, 0.9, 1.22), between(random, 0.05, 0.12), between(random, 0.8, 1.15)], { at: [x + between(random, -0.1, 0.1), 0.03, z], rotate: [0, between(random, -0.12, 0.12), between(random, -0.03, 0.03)], color: pick(random, ['#a9744c', '#b98256', '#9c6a45']) })
    })
  })
  range(22).forEach(() => kit.sphere('stone', between(random, 0.7, 1.6), { at: [left + between(random, 0.5, W - 0.5), 0, pick(random, [-2.5, -2.9, 2.4, 2.8])], scale: [between(random, 1.4, 2.4), between(random, 0.18, 0.32), 1], color: pick(random, sands) }, 12))
  range(10).forEach(() => kit.box('glow', [between(random, 0.5, 1.3), 0.012, 0.03], { at: [left + between(random, 1, W - 1), 0.07, between(random, -1.8, 1.8)], rotate: [0, between(random, -0.3, 0.3), 0], color: '#ffe0a0' }))
  // mid: sundial obelisks, half-buried clock gears, broken colonnade, mesas
  range(4).forEach((index) => {
    const x = left + 4 + index * 9 + between(random, -1, 1)
    const z = between(random, -3.6, -4.4)
    const height = between(random, 3.8, 5.2)
    kit.box('stone', [0.62, height, 0.62], { at: [x, height / 2, z], color: '#8f5d3f' })
    kit.cone('stone', 0.46, 0.8, { at: [x, height + 0.4, z], rotate: [0, Math.PI / 4, 0], color: '#7b4d33' }, 4)
    kit.gem('glow', 0.16, { at: [x, height + 0.9, z], color: '#ffd36b' })
    range(6).forEach((mark) => kit.box('glow', [0.05, 0.22, 0.02], { at: [x - 0.2 + (mark % 3) * 0.2, height * 0.7 - Math.floor(mark / 3) * 0.5, z + 0.32], color: '#ffcf7a' }))
  })
  range(3).forEach((index) => {
    const x = left + 8 + index * 11 + between(random, -1, 1)
    const z = between(random, -6, -7.5)
    const radius = between(random, 2, 2.8)
    kit.torus('metal', radius, 0.22, { at: [x, radius * 0.35, z], rotate: [0, between(random, -0.3, 0.3), between(random, -0.25, 0.25)], color: '#8a6a3c' }, Math.PI * 2, 32)
    range(16).forEach((tooth) => {
      const angle = (tooth / 16) * TAU
      kit.box('metal', [0.32, 0.4, 0.3], { at: [x + Math.cos(angle) * (radius + 0.25), radius * 0.35 + Math.sin(angle) * (radius + 0.25), z], rotate: [0, 0, angle], color: '#7a5a30' })
    })
    kit.cylinder('metal', 0.35, 0.35, 0.5, { at: [x, radius * 0.35, z], rotate: [Math.PI / 2, 0, 0], color: '#a88748' })
  })
  range(7).forEach((index) => {
    const x = left + 2 + index * 5 + between(random, -0.6, 0.6)
    const height = random() > 0.4 ? between(random, 1.1, 3.4) : 0
    if (height === 0) {
      kit.cylinder('stone', 0.36, 0.36, 2.2, { at: [x, 0.3, -5.4], rotate: [0, between(random, 0, Math.PI), Math.PI / 2], color: '#a06c47' }, 10)
      return
    }
    kit.cylinder('stone', 0.34, 0.4, height, { at: [x, height / 2, -5.4], color: '#a57049' }, 10)
    kit.box('stone', [0.95, 0.24, 0.95], { at: [x, height + 0.12, -5.4], rotate: [0, between(random, -0.2, 0.2), between(random, -0.1, 0.1)], color: '#946442' })
  })
  range(3).forEach((index) => {
    const x = left + 5 + index * 12
    const width = between(random, 5, 8)
    const height = between(random, 3, 4.5)
    kit.box('stone', [width, height, 2], { at: [x, height / 2, -11], color: '#b46a44' })
    kit.box('stone', [width * 0.8, 0.5, 2.2], { at: [x, height + 0.25, -11], color: '#9a5536' })
  })
  // fore: dune crests, a caravan banner on a leaning pole
  range(6).forEach((index) => {
    const x = left + index * 6.2 + between(random, -1, 1)
    kit.sphere('silhouette', between(random, 1.2, 1.9), { at: [x, -0.35, between(random, 5.6, 6.8)], scale: [2.2, 0.55, 1], color: '#2a160e' }, 14)
  })
  range(3).forEach((index) => {
    const x = left + 4 + index * 12 + between(random, -1, 1)
    kit.cylinder('silhouette', 0.05, 0.05, 3.2, { at: [x, 1.4, 5.4], rotate: [0, 0, 0.12], color: '#1e110a' })
    kit.plane('silhouette', 0.9, 1.6, { at: [x + 0.55, 2.4, 5.4], rotate: [0, 0, -0.08], color: '#3b1f14' })
  })
}

// ── 4 · Altın Bataklık ────────────────────────────────────────────────────
const swamp: Dress = (kit, left, random) => {
  const zones = contentFor('golden-swamp').zones
  zones.forEach(([start, end]) => {
    range(Math.floor((end - start) / 1.3)).forEach((index) => {
      kit.rock('stone', 0.42, { at: [left + start + 0.6 + index * 1.3, 0.04, between(random, -0.6, 0.6)], scale: [1.2, 0.22, 1], color: '#4a4b2a' })
    })
    range(10).forEach(() => kit.cylinder('foliage', 0.28, 0.28, 0.015, { at: [left + between(random, start, end), 0.06, between(random, -2.4, 2.4)], color: pick(random, ['#5d7a2b', '#6f8f33', '#4f6a24']) }, 9))
  })
  range(70).forEach(() => {
    const x = left + between(random, 0.5, W - 0.5)
    const z = pick(random, [-2.3, -2.6, 2.2, 2.5]) + between(random, -0.3, 0.3)
    const height = between(random, 0.6, 1.4)
    kit.cone('foliage', 0.05, height, { at: [x, height / 2, z], rotate: [between(random, -0.2, 0.2), 0, between(random, -0.25, 0.25)], color: pick(random, ['#8b8a2c', '#a19b38', '#6d6a22']) }, 4)
  })
  // mid: twisted dead trees with hanging moss, lanterns
  range(6).forEach((index) => {
    const x = left + 2.5 + index * 6 + between(random, -1, 1)
    const z = between(random, -4.2, -7.5)
    const lean = between(random, -0.6, 0.6)
    kit.tube('wood', [[x, 0, z], [x + lean * 0.4, 1.8, z], [x + lean, 3.6, z + 0.2], [x + lean * 1.4, 5.2, z]], 0.22, { color: '#2a2a16' }, 16)
    kit.tube('wood', [[x + lean, 3.4, z], [x + lean + 1.2, 4.3, z], [x + lean + 2, 4.1, z]], 0.08, { color: '#2a2a16' }, 10)
    kit.tube('wood', [[x + lean * 0.8, 2.9, z], [x + lean - 1, 3.6, z], [x + lean - 1.7, 3.2, z]], 0.07, { color: '#2a2a16' }, 10)
    range(4).forEach((strand) => kit.cone('foliage', 0.08, between(random, 0.9, 1.8), { at: [x + lean + strand * 0.5 - 0.5, 3.2, z + 0.1], rotate: [Math.PI, 0, 0], color: '#6b6d2c' }, 4))
    kit.cylinder('wood', 0.04, 0.05, 1.7, { at: [x + 1.5, 0.85, -3.3], color: '#1e1c10' })
    kit.sphere('glow', 0.14, { at: [x + 1.5, 1.8, -3.3], color: '#f6ff9a' })
  })
  // fore: reeds, roots and moss curtains near the lens
  range(10).forEach((index) => {
    const x = left + index * 3.7 + between(random, -0.8, 0.8)
    range(5).forEach(() => kit.cone('silhouette', 0.06, between(random, 0.9, 1.8), { at: [x + between(random, -0.4, 0.4), 0.6, between(random, 5.4, 6.8)], rotate: [0, 0, between(random, -0.2, 0.2)], color: '#0e0f06' }, 4))
  })
  range(4).forEach((index) => {
    const x = left + 4 + index * 9
    kit.tube('silhouette', [[x - 2, 9, 5.8], [x - 1, 7.8, 5.8], [x, 7.4, 5.8], [x + 1.2, 7.9, 5.8], [x + 2.2, 9, 5.8]], 0.09, { color: '#0a0b05' }, 14)
    range(3).forEach((strand) => kit.cone('silhouette', 0.07, between(random, 1, 2), { at: [x - 1 + strand, 6.9, 5.8], rotate: [Math.PI, 0, 0], color: '#0a0b05' }, 4))
  })
}

// ── 5 · Böcek Dökümhanesi ─────────────────────────────────────────────────
const foundry: Dress = (kit, left, random) => {
  const { zones, props } = contentFor('beetle-foundry')
  // path: riveted floor plates; belts get side rails, presses get warning stripes
  range(Math.floor(W / 1.2)).forEach((index) => {
    const x = left + 0.6 + index * 1.2
    ;[-1.2, 0, 1.2].forEach((z) => kit.box('metal', [1.16, 0.06, 1.16], { at: [x, 0.03, z], color: pick(random, ['#2c2b2e', '#323034', '#29282b']) }))
    kit.box('metal', [0.04, 0.02, 3.6], { at: [x + 0.6, 0.065, 0], color: '#141315' })
  })
  zones.forEach(([start, end]) => {
    ;[-1.95, 1.95].forEach((z) => {
      kit.box('metal', [end - start, 0.32, 0.18], { at: [left + (start + end) / 2, 0.16, z], color: '#3e3a36' })
      kit.box('glow', [end - start, 0.03, 0.04], { at: [left + (start + end) / 2, 0.33, z], color: '#ffae3d' })
    })
  })
  props.forEach((offset) => {
    range(6).forEach((stripe) => kit.box(stripe % 2 ? 'metal' : 'glow', [0.3, 0.02, 3.4], { at: [left + offset - 0.9 + stripe * 0.36, 0.07, 0], color: stripe % 2 ? '#141212' : '#ffb000' }))
  })
  // mid: molten vats, chimneys, pipes, racks of unfinished beetle drones, a crane
  range(4).forEach((index) => {
    const x = left + 3 + index * 9 + between(random, -0.8, 0.8)
    kit.cylinder('metal', 1.1, 0.95, 1.6, { at: [x, 0.8, -4.3], color: '#3a302b' }, 14)
    kit.torus('metal', 1.1, 0.07, { at: [x, 1.58, -4.3], rotate: [Math.PI / 2, 0, 0], color: '#22201f' })
    kit.cylinder('glow', 1.0, 1.0, 0.04, { at: [x, 1.52, -4.3], color: '#ff7a1c' }, 14)
    kit.cylinder('glow', 0.5, 0.5, 0.05, { at: [x, 1.55, -4.3], color: '#ffd166' }, 12)
  })
  range(3).forEach((index) => {
    const x = left + 6 + index * 12 + between(random, -1, 1)
    const height = between(random, 8, 11)
    kit.cylinder('metal', 0.7, 0.95, height, { at: [x, height / 2, -9], color: '#1f1b1a' }, 10)
    range(3).forEach((band) => kit.torus('metal', 0.8, 0.06, { at: [x, 2 + band * 2.6, -9], rotate: [Math.PI / 2, 0, 0], color: '#3b3330' }))
    kit.cylinder('glow', 0.72, 0.72, 0.1, { at: [x, height, -9], color: '#ff8a1f' }, 10)
  })
  ;[2.6, 4.9].forEach((y, row) => {
    const z = -3.2 - row * 1.8
    kit.tube('metal', [[left - 1, y, z], [left + W * 0.33, y + 0.2, z], [left + W * 0.66, y - 0.15, z], [left + W + 1, y, z]], 0.16, { color: row ? '#433935' : '#5a4a3f' }, 40)
  })
  range(5).forEach((index) => {
    const x = left + 2.5 + index * 7 + between(random, -0.6, 0.6)
    kit.box('metal', [2.8, 0.12, 0.12], { at: [x, 4.2, -6.2], color: '#2a2524' })
    range(3).forEach((slot) => {
      const dx = x - 0.9 + slot * 0.9
      kit.cylinder('metal', 0.015, 0.015, 0.7, { at: [dx, 3.8, -6.2], color: '#2a2524' })
      kit.sphere('gloss', 0.34, { at: [dx, 3.2, -6.2], scale: [1, 0.72, 1.35], color: '#16110f' }, 12)
      kit.sphere('glow', 0.05, { at: [dx - 0.09, 3.22, -5.8], color: '#ff3b1f' }, 6)
      kit.sphere('glow', 0.05, { at: [dx + 0.09, 3.22, -5.8], color: '#ff3b1f' }, 6)
    })
  })
  kit.box('metal', [W + 2, 0.4, 0.5], { at: [left + W / 2, 7.8, -5], color: '#1d1a19' })
  kit.box('metal', [1.2, 0.6, 0.8], { at: [left + W * 0.4, 7.4, -5], color: '#2e2926' })
  kit.cylinder('metal', 0.02, 0.02, 3, { at: [left + W * 0.4, 5.8, -5], color: '#1a1717' })
  // fore: chains, pipe elbows and crates near the lens
  range(5).forEach((index) => chain(kit, left + 2 + index * 7.6 + between(random, -1, 1), 9.2, between(random, 6.9, 7.8), between(random, 5.2, 6.2), '#0b0909'))
  range(4).forEach((index) => {
    const x = left + 1 + index * 9 + between(random, -1, 1)
    kit.tube('silhouette', [[x - 1.5, 0.2, 6], [x - 0.4, 0.3, 6], [x, 1.2, 6.2], [x + 0.2, 2.4, 6.2]], 0.28, { color: '#0c0a09' }, 16)
    kit.box('silhouette', [1.1, 0.9, 1], { at: [x + 2, 0.45, 6.6], rotate: [0, 0.25, 0], color: '#0f0c0b' })
  })
}

// ── 6 · Kafatası Adası ────────────────────────────────────────────────────
const skullIsland: Dress = (kit, left, random) => {
  range(Math.floor(W / 0.95)).forEach((index) => {
    const x = left + 0.5 + index * 0.95
    ;[-1.25, 0, 1.25].forEach((z, row) => {
      const offset = row % 2 ? 0.47 : 0
      kit.cylinder('stone', 0.52, 0.55, between(random, 0.08, 0.18), { at: [x + offset, 0.04, z], rotate: [0, Math.PI / 6, 0], color: pick(random, ['#1f2a1b', '#26331f', '#1a2317']) }, 6)
    })
    if (random() > 0.55) kit.box('glow', [between(random, 0.3, 0.8), 0.02, 0.04], { at: [x, 0.1, between(random, -1.6, 1.6)], rotate: [0, between(random, 0, Math.PI), 0], color: '#7dff4d' })
  })
  // mid: skull rocks, bone spikes, toxic pools
  range(3).forEach((index) => {
    const x = left + 6 + index * 11 + between(random, -1, 1)
    const z = between(random, -6, -8)
    kit.rock('stone', 1.8, { at: [x, 1.6, z], scale: [1.2, 1, 1], color: '#2e3a26' }, 1)
    kit.sphere('stone', 0.42, { at: [x - 0.6, 1.9, z + 1.55], color: '#050704' })
    kit.sphere('stone', 0.42, { at: [x + 0.6, 1.9, z + 1.55], color: '#050704' })
    kit.sphere('glow', 0.12, { at: [x - 0.6, 1.9, z + 1.8], color: '#9cff5a' })
    kit.sphere('glow', 0.12, { at: [x + 0.6, 1.9, z + 1.8], color: '#9cff5a' })
    kit.box('stone', [1.6, 0.5, 1], { at: [x, 0.5, z + 1.1], color: '#26321f' })
    range(4).forEach((tooth) => kit.cone('stone', 0.12, 0.4, { at: [x - 0.55 + tooth * 0.37, 0.88, z + 1.55], rotate: [Math.PI, 0, 0], color: '#c9cfb2' }, 4))
  })
  range(12).forEach(() => kit.cone('stone', between(random, 0.25, 0.5), between(random, 1.5, 3.6), { at: [left + between(random, 0, W), 0.9, between(random, -3.6, -6)], rotate: [between(random, -0.2, 0.2), 0, between(random, -0.25, 0.25)], color: '#1b2517' }, 5))
  range(5).forEach(() => kit.cylinder('glow', 1, 1, 0.01, { at: [left + between(random, 2, W - 2), 0.03, between(random, -3.2, -4.8)], scale: [between(random, 0.7, 1.4), 1, 0.5], color: '#4cff3a' }, 16))
  // fore: rock spikes and bones
  range(6).forEach((index) => {
    const x = left + index * 6.4 + between(random, -1, 1)
    kit.cone('silhouette', 0.55, between(random, 1.1, 1.9), { at: [x, 0.6, between(random, 5.6, 6.8)], rotate: [0, 0, between(random, -0.3, 0.3)], color: '#070a05' }, 5)
    kit.cylinder('silhouette', 0.07, 0.07, 1.4, { at: [x + 1.5, 0.15, 5.4], rotate: [0.2, 0.4, Math.PI / 2], color: '#141711' })
  })
}

// ── 7 · Yeşim Harabeleri ──────────────────────────────────────────────────
const jadeRuins: Dress = (kit, left, random) => {
  range(Math.floor(W / 1.15)).forEach((index) => {
    ;[-1.2, 0, 1.2].forEach((z) => {
      if (random() < 0.07) return
      kit.box('stone', [1.08, 0.1, 1.1], { at: [left + 0.58 + index * 1.15, 0.05, z], rotate: [0, between(random, -0.03, 0.03), 0], color: pick(random, ['#4f665d', '#5a7168', '#475d54', '#536b61']) })
      if (random() > 0.72) kit.box('foliage', [between(random, 0.3, 0.8), 0.02, between(random, 0.2, 0.6)], { at: [left + 0.58 + index * 1.15 + between(random, -0.3, 0.3), 0.11, z + between(random, -0.3, 0.3)], color: '#3b7a3c' })
    })
  })
  // mid: torii gates, stone lanterns, bamboo
  range(3).forEach((index) => {
    const x = left + 5 + index * 12 + between(random, -1, 1)
    const z = between(random, -5, -7)
    kit.cylinder('stone', 0.2, 0.24, 4.4, { at: [x - 1.5, 2.2, z], color: '#1d5a45' }, 10)
    kit.cylinder('stone', 0.2, 0.24, 4.4, { at: [x + 1.5, 2.2, z], color: '#1d5a45' }, 10)
    kit.box('stone', [4.2, 0.28, 0.36], { at: [x, 4.3, z], color: '#16493a' })
    kit.box('stone', [3.6, 0.18, 0.3], { at: [x, 3.7, z], color: '#1d5a45' })
    kit.box('glow', [0.5, 0.7, 0.02], { at: [x, 4, z + 0.2], color: '#6effb8' })
  })
  range(6).forEach((index) => {
    const x = left + 2 + index * 6 + between(random, -0.5, 0.5)
    kit.box('stone', [0.5, 0.5, 0.5], { at: [x, 0.25, -3.4], color: '#5c6e66' })
    kit.cylinder('stone', 0.12, 0.14, 0.7, { at: [x, 0.85, -3.4], color: '#56675f' })
    kit.box('stone', [0.55, 0.4, 0.55], { at: [x, 1.4, -3.4], color: '#5c6e66' })
    kit.box('glow', [0.3, 0.2, 0.3], { at: [x, 1.4, -3.4], color: '#b8ffd9' })
    kit.cone('stone', 0.5, 0.35, { at: [x, 1.78, -3.4], color: '#47584f' }, 4)
    range(5).forEach(() => {
      const height = between(random, 3.5, 6.5)
      kit.cylinder('foliage', 0.06, 0.07, height, { at: [x + 2.6 + between(random, -0.5, 0.5), height / 2, between(random, -4.6, -6)], color: pick(random, ['#3f7a36', '#4c8a3f', '#35682e']) }, 6)
    })
  })
  // fore: bamboo and paper lanterns near the lens
  range(7).forEach((index) => {
    const x = left + index * 5.3 + between(random, -1, 1)
    // Short cut bamboo at the bottom edge; full stalks would hide the fight.
    range(3).forEach(() => {
      const height = between(random, 0.8, 2)
      kit.cylinder('silhouette', 0.09, 0.1, height, { at: [x + between(random, -0.5, 0.5), height / 2, between(random, 5.6, 7)], color: '#06100b' }, 6)
    })
    kit.cone('silhouette', 0.9, 1.6, { at: [x + 2.6, 8.4, 5.8], rotate: [Math.PI, 0, 0.3], color: '#050a07' }, 5)
  })
  range(3).forEach((index) => {
    const x = left + 6 + index * 11
    kit.tube('silhouette', [[x, 9.5, 5.4], [x, 8.2, 5.4]], 0.02, { color: '#050806' })
    kit.sphere('glow', 0.32, { at: [x, 7.9, 5.4], scale: [1, 1.3, 1], color: '#ffcf8a' })
  })
}

// ── 8 · Şimşek Zirvesi ────────────────────────────────────────────────────
const stormPeak: Dress = (kit, left, random) => {
  // path: wet slate along a cliff ridge, rope railing on the far side
  const slabs = Math.floor(W / 1.1)
  range(slabs).forEach((index) => {
    const x = left + 0.55 + index * 1.1
    ;[-1.15, 0.05, 1.25].forEach((z) => kit.box('stone', [between(random, 0.95, 1.1), between(random, 0.06, 0.14), between(random, 0.95, 1.12)], { at: [x, 0.04, z], rotate: [0, between(random, -0.06, 0.06), 0], color: pick(random, ['#3a3f5a', '#434965', '#353a52']) }))
    if (index % 3 === 0) {
      kit.cylinder('wood', 0.07, 0.08, 1.2, { at: [x, 0.6, -2.3], color: '#2a2233' })
      if (index + 3 < slabs) kit.tube('wood', [[x, 1.1, -2.3], [x + 1.65, 0.88, -2.3], [x + 3.3, 1.1, -2.3]], 0.025, { color: '#8a7a6a' }, 10)
    }
  })
  range(7).forEach(() => kit.cylinder('gloss', 0.8, 0.8, 0.01, { at: [left + between(random, 1, W - 1), 0.09, between(random, -1.5, 1.5)], scale: [between(random, 0.6, 1.2), 1, between(random, 0.35, 0.6)], color: '#161a2c' }, 18))
  // mid: white stupas with golden spires, prayer-flag lines, jagged spires, a bronze gong
  range(3).forEach((index) => {
    const x = left + 5 + index * 12 + between(random, -1, 1)
    const z = between(random, -5, -6.5)
    kit.box('stone', [2.6, 1.4, 2.6], { at: [x, 0.7, z], color: '#dcd6cc' })
    kit.sphere('stone', 1.2, { at: [x, 1.6, z], scale: [1, 0.8, 1], color: '#e8e2d6' }, 16)
    kit.box('stone', [0.9, 0.5, 0.9], { at: [x, 2.7, z], color: '#d1c9ba' })
    range(6).forEach((ring) => kit.cylinder('metal', 0.36 - ring * 0.05, 0.4 - ring * 0.05, 0.22, { at: [x, 3.05 + ring * 0.24, z], color: '#c9a24a' }, 10))
    kit.gem('glow', 0.12, { at: [x, 4.6, z], color: '#ffe38a' })
  })
  const flagColors = ['#e24b4b', '#f4c542', '#3fa66b', '#3d7bd8', '#f2efe6']
  range(4).forEach((index) => {
    const x = left + index * 9 + between(random, -1, 1)
    kit.tube('wood', [[x, 6.4, -4.2], [x + 2.2, 5.5, -4.2], [x + 4.5, 5.2, -4.2], [x + 6.8, 5.6, -4.2], [x + 9, 6.4, -4.2]], 0.02, { color: '#6a5d52' }, 20)
    range(9).forEach((flag) => {
      const t = (flag + 0.5) / 9
      kit.plane('foliage', 0.34, 0.42, { at: [x + t * 9, 6.4 - Math.sin(t * Math.PI) * 1.15 - 0.24, -4.2], rotate: [0, 0, between(random, -0.12, 0.12)], color: flagColors[flag % flagColors.length]! })
    })
  })
  range(9).forEach(() => {
    const height = between(random, 4, 9)
    kit.cone('stone', between(random, 0.9, 1.8), height, { at: [left + between(random, 0, W), height / 2 - 0.4, between(random, -8, -11)], rotate: [0, between(random, 0, Math.PI), between(random, -0.12, 0.12)], color: pick(random, ['#262b44', '#2d3350', '#20243a']) }, 5)
  })
  const gongX = left + W * 0.55
  kit.box('wood', [0.2, 3.2, 0.2], { at: [gongX - 1.2, 1.6, -3.4], color: '#3a2a22' })
  kit.box('wood', [0.2, 3.2, 0.2], { at: [gongX + 1.2, 1.6, -3.4], color: '#3a2a22' })
  kit.box('wood', [2.8, 0.22, 0.26], { at: [gongX, 3.2, -3.4], color: '#4a3326' })
  kit.cylinder('metal', 0.95, 0.95, 0.08, { at: [gongX, 1.9, -3.4], rotate: [Math.PI / 2, 0, 0], color: '#b8862e' }, 28)
  kit.torus('glow', 0.5, 0.03, { at: [gongX, 1.9, -3.34], color: '#ffd98a' })
  // fore: black rock teeth and a flag line close to the lens
  range(6).forEach((index) => {
    const x = left + index * 6.3 + between(random, -1, 1)
    kit.cone('silhouette', between(random, 0.5, 0.8), between(random, 1.6, 2.8), { at: [x, 0.8, between(random, 5.6, 6.8)], rotate: [0, 0, between(random, -0.35, 0.35)], color: '#07080f' }, 5)
  })
  kit.tube('silhouette', [[left, 9.4, 5.4], [left + W * 0.5, 8.3, 5.4], [left + W, 9.4, 5.4]], 0.03, { color: '#07080f' }, 20)
  range(12).forEach((flag) => kit.plane('silhouette', 0.5, 0.62, { at: [left + (flag + 0.5) * (W / 12), 9.05 - Math.sin(((flag + 0.5) / 12) * Math.PI) * 1.1 - 0.3, 5.4], color: '#0b0c16' }))
}

// ── 9 · Sessiz Kemik Ovası ────────────────────────────────────────────────
const boneField: Dress = (kit, left, random) => {
  kit.box('stone', [W, 0.06, 4.2], { at: [left + W / 2, 0.02, 0], color: '#c9dde4' })
  contentFor('skull-field').zones.forEach(([start, end]) => {
    kit.box('ice', [end - start, 0.03, 3.6], { at: [left + (start + end) / 2, 0.07, 0], color: '#9fd9ff' })
  })
  range(26).forEach(() => {
    const x = left + between(random, 0.5, W - 0.5)
    const z = between(random, -2.2, 2.2)
    kit.cylinder('stone', 0.05, 0.05, between(random, 0.5, 1), { at: [x, 0.08, z], rotate: [0, between(random, 0, Math.PI), Math.PI / 2], color: '#e8e3d2' })
  })
  range(10).forEach(() => kit.sphere('stone', between(random, 0.6, 1.4), { at: [left + between(random, 0, W), 0, pick(random, [-2.8, 2.9])], scale: [1.6, 0.35, 1], color: '#dbeaf0' }, 10))
  // mid: giant rib cages and bone spikes
  range(2).forEach((index) => {
    const x = left + 8 + index * 18
    const z = -6.5
    range(6).forEach((rib) => kit.torus('stone', 2.6 - rib * 0.1, 0.13, { at: [x + rib * 1.1, 0, z], rotate: [0, Math.PI / 2 + 0.2, 0], color: '#d6d2c2' }, Math.PI, 18))
    kit.cylinder('stone', 0.2, 0.2, 7, { at: [x + 2.8, 2.5, z], rotate: [0, 0, Math.PI / 2 - 0.08], color: '#c8c3b2' })
    kit.sphere('stone', 0.9, { at: [x - 1.2, 1.1, z], scale: [1.3, 1, 1], color: '#dcd8c8' })
  })
  range(10).forEach(() => kit.cone('stone', between(random, 0.12, 0.25), between(random, 1.5, 3.2), { at: [left + between(random, 0, W), 0.8, between(random, -3.5, -5)], rotate: [0, 0, between(random, -0.35, 0.35)], color: '#d9d6c8' }, 5))
  // fore: ribs and broken spears
  range(5).forEach((index) => {
    const x = left + 2 + index * 7.4 + between(random, -1, 1)
    kit.torus('silhouette', 1.6, 0.1, { at: [x, 0, 6.3], rotate: [0, Math.PI / 2, 0], color: '#0c1116' }, Math.PI * 0.8, 14)
    kit.cylinder('silhouette', 0.04, 0.04, 2.6, { at: [x + 2.5, 1, 5.7], rotate: [0, 0, 0.5], color: '#0a0e12' })
  })
}

// ── 10 · Alev Tahtı ────────────────────────────────────────────────────────
const throne: Dress = (kit, left, random) => {
  const vents = contentFor('inferno-throne').props.map((offset) => left + offset)
  range(Math.floor(W / 1.2)).forEach((index) => {
    ;[-1.2, 0, 1.2].forEach((z) => kit.box('gloss', [1.14, 0.08, 1.14], { at: [left + 0.6 + index * 1.2, 0.04, z], color: pick(random, ['#140807', '#1a0b09', '#100605']) }))
    kit.box('glow', [0.04, 0.02, 3.6], { at: [left + 1.2 + index * 1.2, 0.085, 0], color: '#ff4d0f' })
  })
  vents.forEach((x) => {
    kit.box('metal', [1.4, 0.06, 1.4], { at: [x, 0.1, 0], color: '#2a1512' })
    range(5).forEach((slit) => kit.box('glow', [1.1, 0.02, 0.07], { at: [x, 0.14, -0.5 + slit * 0.25], color: '#ff7a1a' }))
  })
  // mid: braziers, obsidian pillars, banners, throne steps at the end
  range(6).forEach((index) => {
    const x = left + 2.5 + index * 6.2
    kit.cylinder('metal', 0.5, 0.25, 0.5, { at: [x, 1.3, -3.4], color: '#3a1d14' }, 10)
    kit.cylinder('metal', 0.06, 0.12, 1.1, { at: [x, 0.55, -3.4], color: '#2a130d' })
    kit.cone('glow', 0.4, 0.9, { at: [x, 1.9, -3.4], color: '#ff8a1f' }, 7)
    kit.cone('glow', 0.22, 0.6, { at: [x, 2.1, -3.4], color: '#ffe08a' }, 6)
  })
  range(5).forEach((index) => {
    const x = left + 4 + index * 7.5
    kit.cylinder('gloss', 0.7, 0.95, 8, { at: [x, 4, -7.8], color: '#120606' }, 6)
    kit.plane('foliage', 1.4, 3.4, { at: [x, 4.5, -7], color: '#5a0d0d' })
    kit.gem('glow', 0.35, { at: [x, 5.2, -6.95], scale: [1, 1.4, 0.3], color: '#6dff4a' })
  })
  range(4).forEach((step) => kit.box('gloss', [6 - step, 0.5, 5 - step * 0.8], { at: [left + W - 3, 0.25 + step * 0.5, -6 - step * 0.3], color: '#170808' }))
  // fore: hanging chains, rubble and brazier silhouettes
  range(6).forEach((index) => chain(kit, left + 1.5 + index * 6.4 + between(random, -0.8, 0.8), 9.2, between(random, 6.8, 7.8), between(random, 5.2, 6.4), '#0c0404'))
  range(5).forEach((index) => {
    const x = left + index * 7.7 + between(random, -1, 1)
    kit.rock('silhouette', 0.7, { at: [x, 0.2, between(random, 5.6, 6.6)], scale: [1.4, 0.8, 1], color: '#070202' })
  })
}

const DRESSINGS: Record<BiomeId, Dress> = {
  'aku-city': city,
  'sunset-harbor': harbor,
  'hourglass-desert': desert,
  'golden-swamp': swamp,
  'beetle-foundry': foundry,
  'skull-island': skullIsland,
  'jade-ruins': jadeRuins,
  'storm-peak': stormPeak,
  'skull-field': boneField,
  'inferno-throne': throne,
}

/** Seeds follow the biome id, not its slot, so reordering never reshuffles a set. */
const seedFor = (id: BiomeId) => [...id].reduce((sum, char) => sum * 31 + char.charCodeAt(0), 7) >>> 0

export function dressBiome(index: number) {
  const kit = new Kit()
  const left = WORLD_VISUAL_LEFT + index * W
  const biome = BIOMES[index]
  if (biome) DRESSINGS[biome.id](kit, left, seeded(seedFor(biome.id)))
  return kit.build()
}

export const DRESSED_BIOMES = BIOMES.map((_, index) => index)
