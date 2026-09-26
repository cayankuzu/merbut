import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Mesh,
  ShaderMaterial,
  Vector3,
} from 'three'
import { isBladeCharged } from '../../sim/mechanics'
import { simClock } from '../../sim/clock'
import { useGameStore } from '../../store/gameStore'
import type { CharacterId } from '../../types/character'
import { bladeWorld, type BladeKey } from './bladeRegistry'
import { LIGHT_BLENDING } from './lightBlending'

/**
 * A ribbon of light behind each hero's real blade. The blade's base and tip are
 * sampled every frame while a swing is live; the ribbon is smoothed with a
 * Catmull-Rom pass and fades with age, white-hot at the edge, the hero's colour
 * behind it. It runs on the simulation clock, so hitstop freezes the arc.
 */
const SAMPLES = 16
const SUBDIVISIONS = 3
const LIFETIME = 0.34
const POINTS = (SAMPLES - 1) * SUBDIVISIONS + 1

const PALETTES: Record<CharacterId, { edge: string; body: string }> = {
  ali: { edge: '#fff4c2', body: '#ff7a1a' },
  jack: { edge: '#ffffff', body: '#7fc4ff' },
}
const STORM = { edge: '#f2f6ff', body: '#6d8cff' }

const VERTEX = /* glsl */ `
  attribute float aAge;
  attribute float aSide;
  varying float vAge;
  varying float vSide;
  void main() {
    vAge = aAge;
    vSide = aSide;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const FRAGMENT = /* glsl */ `
  uniform vec3 uEdge;
  uniform vec3 uBody;
  uniform float uOpacity;
  varying float vAge;
  varying float vSide;
  void main() {
    float life = clamp(1.0 - vAge, 0.0, 1.0);
    // A crisp crescent of light along the tip's path, with only a faint
    // coloured sweep towards the grip: an ink-brush cut, not a sheet of glass.
    float edge = smoothstep(0.8, 1.0, vSide);
    float sweep = smoothstep(0.2, 0.95, vSide) * 0.3;
    float alpha = life * (edge * (0.5 + 0.5 * life) + sweep * life) * uOpacity;
    vec3 color = mix(uBody, uEdge, edge * life);
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(color * (1.0 + 0.5 * edge * life), alpha);
  }
`

interface Sample { base: Vector3; tip: Vector3; time: number }

/** Where a trail reads its swing state and time: the game simulation, or the menu stage. */
export interface TrailSource {
  swinging: () => boolean
  /** Seconds. */
  now: () => number
  charged?: () => boolean
}

const GAME_SOURCES: Record<CharacterId, TrailSource> = {
  ali: {
    swinging: () => useGameStore.getState().animationStates.ali === 'attack',
    now: () => simClock.now() / 1_000,
    charged: () => isBladeCharged('ali', simClock.now()),
  },
  jack: {
    swinging: () => useGameStore.getState().animationStates.jack === 'attack',
    now: () => simClock.now() / 1_000,
    charged: () => isBladeCharged('jack', simClock.now()),
  },
}

function catmull(p0: Vector3, p1: Vector3, p2: Vector3, p3: Vector3, t: number, target: Vector3) {
  const t2 = t * t
  const t3 = t2 * t
  target.set(
    0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
    0.5 * (2 * p1.z + (-p0.z + p2.z) * t + (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 + (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3),
  )
  return target
}

export function BladeTrail({ blade, hero, source }: { blade: BladeKey; hero: CharacterId; source: TrailSource }) {
  const samples = useMemo<Sample[]>(() => [], [])
  const scratch = useMemo(() => ({ base: new Vector3(), tip: new Vector3(), a: new Vector3(), b: new Vector3() }), [])
  const { mesh, geometry, material } = useMemo(() => {
    const buffer = new BufferGeometry()
    buffer.setAttribute('position', new BufferAttribute(new Float32Array(POINTS * 2 * 3), 3))
    buffer.setAttribute('aAge', new BufferAttribute(new Float32Array(POINTS * 2), 1))
    const sides = new Float32Array(POINTS * 2)
    for (let index = 0; index < POINTS; index += 1) sides[index * 2 + 1] = 1
    buffer.setAttribute('aSide', new BufferAttribute(sides, 1))
    const indices: number[] = []
    for (let index = 0; index < POINTS - 1; index += 1) {
      const a = index * 2
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
    buffer.setIndex(indices)
    buffer.setDrawRange(0, 0)
    const palette = PALETTES[hero]
    const shader = new ShaderMaterial({
      uniforms: { uEdge: { value: new Color(palette.edge) }, uBody: { value: new Color(palette.body) }, uOpacity: { value: 1 } },
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      ...LIGHT_BLENDING,
      side: DoubleSide,
      toneMapped: false,
    })
    const ribbon = new Mesh(buffer, shader)
    ribbon.frustumCulled = false
    ribbon.renderOrder = 13
    return { mesh: ribbon, geometry: buffer, material: shader }
  }, [hero])

  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])

  useFrame(() => {
    const now = source.now()
    if (source.swinging() && bladeWorld(blade, scratch.base, scratch.tip)) {
      const last = samples[samples.length - 1]
      if (!last || last.tip.distanceToSquared(scratch.tip) > 0.0004 || now - last.time > 0.02) {
        samples.push({ base: scratch.base.clone(), tip: scratch.tip.clone(), time: now })
        if (samples.length > SAMPLES) samples.shift()
      }
    }
    while (samples.length > 0 && now - samples[0]!.time > LIFETIME) samples.shift()
    if (samples.length < 2) {
      geometry.setDrawRange(0, 0)
      return
    }
    const palette = source.charged?.() ? STORM : PALETTES[hero]
    ;(material.uniforms.uEdge!.value as Color).set(palette.edge)
    ;(material.uniforms.uBody!.value as Color).set(palette.body)
    const positions = geometry.getAttribute('position') as BufferAttribute
    const ages = geometry.getAttribute('aAge') as BufferAttribute
    let point = 0
    for (let index = 0; index < samples.length - 1; index += 1) {
      const p0 = samples[Math.max(0, index - 1)]!
      const p1 = samples[index]!
      const p2 = samples[index + 1]!
      const p3 = samples[Math.min(samples.length - 1, index + 2)]!
      const steps = index === samples.length - 2 ? SUBDIVISIONS + 1 : SUBDIVISIONS
      for (let step = 0; step < steps; step += 1) {
        const t = step / SUBDIVISIONS
        catmull(p0.base, p1.base, p2.base, p3.base, t, scratch.a)
        catmull(p0.tip, p1.tip, p2.tip, p3.tip, t, scratch.b)
        const time = p1.time + (p2.time - p1.time) * t
        const age = Math.min(1, (now - time) / LIFETIME)
        positions.setXYZ(point * 2, scratch.a.x, scratch.a.y, scratch.a.z)
        positions.setXYZ(point * 2 + 1, scratch.b.x, scratch.b.y, scratch.b.z)
        ages.setX(point * 2, age)
        ages.setX(point * 2 + 1, age)
        point += 1
      }
    }
    positions.needsUpdate = true
    ages.needsUpdate = true
    geometry.setDrawRange(0, Math.max(0, (point - 1) * 6))
  })

  return <primitive object={mesh} />
}

export function SwordTrails() {
  return (
    <group name="kilic-izleri">
      <BladeTrail blade="ali" hero="ali" source={GAME_SOURCES.ali} />
      <BladeTrail blade="jack" hero="jack" source={GAME_SOURCES.jack} />
    </group>
  )
}
