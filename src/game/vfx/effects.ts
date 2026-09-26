import { runtimeParticleRatio, usePerformanceStore } from '../../store/performanceStore'
import { emitParticle, type ParticleKind } from './particles'

/**
 * The effect vocabulary: every burst in the game is one of these presets, so
 * a hit in the jade ruins and a hit in the foundry share one language and only
 * change colour.
 */
const random = (minimum: number, maximum: number) => minimum + Math.random() * (maximum - minimum)
const budget = () => {
  const { tier, qualityFactor } = usePerformanceStore.getState()
  return Math.max(0.35, Math.min(1, runtimeParticleRatio(tier, qualityFactor)))
}
const scaled = (count: number) => Math.max(1, Math.round(count * budget()))

interface Burst {
  x: number
  y: number
  z?: number
  count: number
  kind: ParticleKind
  color: string
  endColor?: string
  speed: [number, number]
  life: [number, number]
  size: [number, number]
  gravity?: number
  drag?: number
  /** Direction bias in radians (0 = +x) and cone half-angle. */
  angle?: number
  spread?: number
  depth?: number
}

export function burst({ x, y, z = 0.4, count, kind, color, endColor, speed, life, size, gravity = 0, drag = 0, angle = Math.PI / 2, spread = Math.PI, depth = 0.6 }: Burst) {
  for (let index = 0; index < scaled(count); index += 1) {
    const direction = angle + random(-spread, spread)
    const velocity = random(speed[0], speed[1])
    emitParticle({
      x, y, z,
      vx: Math.cos(direction) * velocity,
      vy: Math.sin(direction) * velocity,
      vz: random(-depth, depth) * velocity * 0.4,
      life: random(life[0], life[1]),
      size: [size[0] * random(0.7, 1.2), size[1]],
      color,
      endColor,
      kind,
      gravity,
      drag,
    })
  }
}

/** A single bright flash at the contact point. */
export function flash(x: number, y: number, color: string, size = 1.3, life = 0.12, z = 0.5) {
  emitParticle({ x, y, z, vx: 0, vy: 0, vz: 0, life, size: [size, size * 0.2], color, kind: 'glow' })
}

export const EFFECTS = {
  /** Steel on flesh: white sparks thrown along the blow, tinted by the hero. */
  swordHit(x: number, y: number, direction: 1 | -1, tint: string, heavy: boolean, rapid = false) {
    // Rapid follow-up hits on one target skip the flashes: sparks alone keep it readable and cheap.
    if (!rapid) {
      flash(x, y, '#ffffff', heavy ? 1.3 : 0.85, heavy ? 0.12 : 0.08)
      flash(x, y, tint, heavy ? 1.9 : 1.25, 0.16)
    }
    burst({ x, y, count: heavy ? 22 : rapid ? 7 : 14, kind: 'spark', color: '#ffffff', endColor: tint, speed: [5, heavy ? 13 : 10], life: [0.18, 0.42], size: [0.07, 0.01], gravity: -14, drag: 3.5, angle: direction > 0 ? 0.35 : Math.PI - 0.35, spread: 0.9 })
    if (!rapid) burst({ x, y, count: heavy ? 8 : 4, kind: 'glow', color: tint, speed: [1, 3], life: [0.3, 0.6], size: [0.18, 0.02], gravity: 1.5, drag: 2 })
  },
  /** The creature bursts into black ink: no gore, just a brushstroke of death. */
  inkDeath(x: number, y: number, accent: string) {
    burst({ x, y, count: 16, kind: 'blob', color: '#1a0b12', endColor: '#050204', speed: [2.5, 7], life: [0.45, 0.8], size: [0.26, 0.04], gravity: -11, drag: 1.5 })
    burst({ x, y: y - 0.2, count: 5, kind: 'puff', color: '#2a1620', endColor: '#0a0508', speed: [0.6, 1.8], life: [0.5, 0.9], size: [0.6, 1.2], gravity: 0.8, drag: 1.6 })
    burst({ x, y, count: 10, kind: 'glow', color: accent, speed: [1.5, 4.5], life: [0.4, 0.8], size: [0.14, 0.02], gravity: 2, drag: 1.4 })
  },
  sandDeath(x: number, y: number) {
    burst({ x, y, count: 22, kind: 'blob', color: '#f2c27a', endColor: '#c98a55', speed: [1.5, 5.5], life: [0.4, 0.9], size: [0.14, 0.02], gravity: -6, drag: 2.4 })
    burst({ x, y: y - 0.3, count: 8, kind: 'puff', color: '#f0d0a0', endColor: '#c99a6a', speed: [0.8, 2.2], life: [0.7, 1.3], size: [0.9, 2.2], gravity: 0.4, drag: 1.8 })
  },
  machineDeath(x: number, y: number) {
    flash(x, y, '#ffd166', 2.4, 0.16)
    burst({ x, y, count: 26, kind: 'spark', color: '#fff2b0', endColor: '#ff7b1c', speed: [4, 12], life: [0.3, 0.7], size: [0.08, 0.01], gravity: -16, drag: 1.8 })
    burst({ x, y, count: 12, kind: 'blob', color: '#0e0b0a', endColor: '#000000', speed: [2, 6], life: [0.5, 0.9], size: [0.2, 0.06], gravity: -14, drag: 1 })
    burst({ x, y, count: 6, kind: 'puff', color: '#3a3330', endColor: '#15110f', speed: [0.5, 1.5], life: [0.8, 1.4], size: [0.8, 2], gravity: 1, drag: 1.4 })
  },
  ghostDeath(x: number, y: number) {
    burst({ x, y, count: 18, kind: 'glow', color: '#b8ffe0', endColor: '#2a8a6a', speed: [0.6, 2.4], life: [0.7, 1.3], size: [0.22, 0.02], gravity: 2.2, drag: 1.2 })
  },
  bossHit(x: number, y: number, direction: 1 | -1, tint: string) {
    EFFECTS.swordHit(x, y, direction, tint, true)
    burst({ x, y, count: 10, kind: 'blob', color: '#2a0a10', endColor: '#08020a', speed: [2, 5], life: [0.3, 0.6], size: [0.16, 0.03], gravity: -9, drag: 2 })
  },
  heroHurt(x: number, y: number, tint: string) {
    flash(x, y, '#ff3a3a', 1.6, 0.14)
    burst({ x, y, count: 12, kind: 'spark', color: '#ffd0d0', endColor: tint, speed: [3, 8], life: [0.2, 0.4], size: [0.06, 0.01], gravity: -10, drag: 3 })
  },
  dust(x: number, y: number, amount = 1, color = '#b8a48c') {
    burst({ x, y: y + 0.1, z: 0.2, count: Math.round(5 * amount), kind: 'puff', color, endColor: '#6a5a4a', speed: [0.6, 2.2 * amount], life: [0.4, 0.8], size: [0.35, 1 * amount], gravity: 0.6, drag: 3, angle: Math.PI / 2, spread: 1.4, depth: 1 })
  },
  dashBurst(x: number, y: number, direction: 1 | -1, perfect: boolean, tint: string) {
    EFFECTS.dust(x, y, 0.9)
    burst({ x, y: y + 1, count: perfect ? 22 : 8, kind: 'spark', color: '#ffffff', endColor: tint, speed: [6, perfect ? 14 : 9], life: [0.15, 0.3], size: [0.05, 0.01], drag: 4, angle: direction > 0 ? Math.PI : 0, spread: 0.25, depth: 0.2 })
    if (perfect) flash(x, y + 1.1, tint, 3.2, 0.26)
  },
  shower(x: number, y: number, color: string, endColor: string, count = 30) {
    burst({ x, y, count, kind: 'spark', color, endColor, speed: [3, 10], life: [0.4, 0.9], size: [0.07, 0.01], gravity: -12, drag: 1.2 })
    flash(x, y, color, 2.4, 0.2)
  },
  slam(x: number, color = '#c9b8a4') {
    burst({ x, y: 0.1, z: 0.2, count: 14, kind: 'puff', color, endColor: '#4a3f38', speed: [2, 6], life: [0.5, 1], size: [0.4, 1.4], gravity: 0.3, drag: 3, angle: Math.PI / 2, spread: 1.5, depth: 1.2 })
    burst({ x, y: 0.2, count: 16, kind: 'spark', color: '#fff2c0', endColor: '#ff8a1f', speed: [4, 10], life: [0.2, 0.5], size: [0.06, 0.01], gravity: -14, drag: 2, angle: Math.PI / 2, spread: 1.3 })
  },
  embers(x: number, y: number, color = '#ff8a2a', count = 10) {
    burst({ x, y, count, kind: 'glow', color, endColor: '#5a1004', speed: [1, 4], life: [0.6, 1.2], size: [0.12, 0.02], gravity: 3, drag: 1.2, spread: 0.9 })
  },
  sparkle(x: number, y: number, color: string, count = 14) {
    burst({ x, y, count, kind: 'glow', color, endColor: '#ffffff', speed: [0.5, 2.5], life: [0.6, 1.1], size: [0.16, 0.02], gravity: 2.4, drag: 1.4 })
  },
  sandSwirl(x: number) {
    for (let index = 0; index < scaled(40); index += 1) {
      const angle = (index / 40) * Math.PI * 2
      emitParticle({ x: x + Math.cos(angle) * 1.2, y: 0.3 + (index % 8) * 0.35, z: Math.sin(angle) * 1.2, vx: -Math.sin(angle) * 3, vy: 0.8, vz: Math.cos(angle) * 3, life: random(0.8, 1.4), size: [0.1, 0.02], color: '#ffe0a0', endColor: '#c98a55', kind: 'glow', drag: 0.8 })
    }
  },
}
