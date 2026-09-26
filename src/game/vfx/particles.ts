import {
  AdditiveBlending,
  Color,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  NormalBlending,
  PlaneGeometry,
  ShaderMaterial,
  type Blending,
} from 'three'
import { asLight } from './lightBlending'

/**
 * One GPU particle pool. Every particle is fully described at birth (origin,
 * velocity, drag, gravity, size and colour ramps); the vertex shader integrates
 * it from the pool clock, so the CPU only writes a few floats per spawn and
 * nothing per frame. The clock follows the simulation, so a hitstop freezes
 * sparks mid-air like an anime impact frame.
 */
export type ParticleKind = 'spark' | 'puff' | 'glow' | 'blob'
const KIND_INDEX: Record<ParticleKind, number> = { spark: 0, puff: 1, glow: 2, blob: 3 }

export interface ParticleSpawn {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  life: number
  size: [number, number]
  color: string | Color
  endColor?: string | Color
  kind: ParticleKind
  gravity?: number
  drag?: number
}

const VERTEX = /* glsl */ `
  uniform float uTime;
  attribute vec3 aOrigin;
  attribute vec3 aVelocity;
  attribute vec4 aTiming; // birth, life, gravity, drag
  attribute vec3 aSizeKind; // start size, end size, kind
  attribute vec3 aColorA;
  attribute vec3 aColorB;
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vKind;
  void main() {
    float age = uTime - aTiming.x;
    float t = age / aTiming.y;
    if (t < 0.0 || t > 1.0) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      return;
    }
    float drag = max(aTiming.w, 0.0001);
    float fade = exp(-drag * age);
    vec3 displacement = aVelocity * (1.0 - fade) / drag;
    displacement.y += 0.5 * aTiming.z * age * age;
    vec3 velocity = aVelocity * fade;
    velocity.y += aTiming.z * age;
    vec4 view = modelViewMatrix * vec4(aOrigin + displacement, 1.0);
    float size = mix(aSizeKind.x, aSizeKind.y, t);
    float kind = aSizeKind.z;
    if (kind < 0.5) {
      // sparks stretch along their screen-space velocity
      vec3 viewVelocity = (modelViewMatrix * vec4(velocity, 0.0)).xyz;
      vec2 direction = length(viewVelocity.xy) > 0.0001 ? normalize(viewVelocity.xy) : vec2(1.0, 0.0);
      vec2 normal = vec2(-direction.y, direction.x);
      float stretch = size * (1.2 + length(velocity) * 0.09) * 2.4;
      view.xy += direction * position.x * stretch + normal * position.y * size * 0.5;
    } else {
      view.xy += position.xy * size;
    }
    gl_Position = projectionMatrix * view;
    vUv = uv;
    vKind = kind;
    vColor = mix(aColorA, aColorB, t);
    vAlpha = kind < 1.5 && kind > 0.5 ? (1.0 - t) * smoothstep(0.0, 0.12, t) : kind > 2.5 ? 1.0 - t * t * t : 1.0 - t;
  }
`

const FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vKind;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float d = length(p);
    float alpha;
    if (vKind < 0.5) {
      float core = 1.0 - smoothstep(0.0, 1.0, abs(p.y));
      alpha = core * core * (1.0 - smoothstep(0.55, 1.0, abs(p.x)));
    } else if (vKind < 1.5) {
      alpha = (1.0 - smoothstep(0.15, 1.0, d)) * 0.55;
    } else if (vKind < 2.5) {
      alpha = exp(-d * d * 3.6);
    } else {
      alpha = 1.0 - smoothstep(0.72, 0.9, d);
    }
    alpha *= vAlpha;
    if (alpha < 0.012) discard;
    gl_FragColor = vec4(vColor, alpha);
  }
`

const scratch = new Color()

export class ParticlePool {
  readonly mesh: Mesh<InstancedBufferGeometry, ShaderMaterial>
  private readonly origin: InstancedBufferAttribute
  private readonly velocity: InstancedBufferAttribute
  private readonly timing: InstancedBufferAttribute
  private readonly sizeKind: InstancedBufferAttribute
  private readonly colorA: InstancedBufferAttribute
  private readonly colorB: InstancedBufferAttribute
  private head = 0
  private dirty = false
  time = 0

  readonly capacity: number

  constructor(capacity: number, blending: Blending) {
    this.capacity = capacity
    const quad = new PlaneGeometry(1, 1)
    const geometry = new InstancedBufferGeometry()
    geometry.index = quad.index
    geometry.setAttribute('position', quad.getAttribute('position'))
    geometry.setAttribute('uv', quad.getAttribute('uv'))
    const attribute = (size: number) => new InstancedBufferAttribute(new Float32Array(capacity * size), size)
    this.origin = attribute(3)
    this.velocity = attribute(3)
    this.timing = attribute(4)
    this.sizeKind = attribute(3)
    this.colorA = attribute(3)
    this.colorB = attribute(3)
    // Every slot starts dead: born in the far past with a tiny life.
    for (let index = 0; index < capacity; index += 1) this.timing.setXYZW(index, -1_000, 0.001, 0, 0)
    geometry.setAttribute('aOrigin', this.origin)
    geometry.setAttribute('aVelocity', this.velocity)
    geometry.setAttribute('aTiming', this.timing)
    geometry.setAttribute('aSizeKind', this.sizeKind)
    geometry.setAttribute('aColorA', this.colorA)
    geometry.setAttribute('aColorB', this.colorB)
    geometry.instanceCount = capacity
    const material = new ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending,
      toneMapped: false,
    })
    // Glows add pure light over the transparent canvas instead of dimming what lies behind it.
    if (blending === AdditiveBlending) asLight(material)
    this.mesh = new Mesh(geometry, material)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = blending === AdditiveBlending ? 12 : 11
  }

  emit(spawn: ParticleSpawn) {
    const index = this.head
    this.head = (this.head + 1) % this.capacity
    this.origin.setXYZ(index, spawn.x, spawn.y, spawn.z)
    this.velocity.setXYZ(index, spawn.vx, spawn.vy, spawn.vz)
    this.timing.setXYZW(index, this.time, spawn.life, spawn.gravity ?? 0, spawn.drag ?? 0)
    this.sizeKind.setXYZ(index, spawn.size[0], spawn.size[1], KIND_INDEX[spawn.kind])
    scratch.set(spawn.color)
    this.colorA.setXYZ(index, scratch.r, scratch.g, scratch.b)
    scratch.set(spawn.endColor ?? spawn.color)
    this.colorB.setXYZ(index, scratch.r, scratch.g, scratch.b)
    this.dirty = true
  }

  advance(seconds: number) {
    this.time += seconds
    this.mesh.material.uniforms.uTime!.value = this.time
    if (!this.dirty) return
    this.dirty = false
    for (const attribute of [this.origin, this.velocity, this.timing, this.sizeKind, this.colorA, this.colorB]) attribute.needsUpdate = true
  }

  dispose() {
    this.mesh.geometry.dispose()
    this.mesh.material.dispose()
  }
}

/** Glowing, additive pool (sparks, flashes, embers) and a normal pool (dust, ink, sand). */
export interface VfxPools {
  light: ParticlePool
  matter: ParticlePool
}

export const createVfxPools = (light = 900, matter = 700): VfxPools => ({
  light: new ParticlePool(light, AdditiveBlending),
  matter: new ParticlePool(matter, NormalBlending),
})

/** The game world's pools. Other canvases (the menu stage) own their own. */
export const vfxPools = createVfxPools()
let target: VfxPools = vfxPools

/** Runs `emit` with every effect preset writing into `pools` instead of the game world's. */
export function emitInto(pools: VfxPools, emit: () => void) {
  const previous = target
  target = pools
  try {
    emit()
  } finally {
    target = previous
  }
}

export function emitParticle(spawn: ParticleSpawn) {
  const pool = spawn.kind === 'puff' || spawn.kind === 'blob' ? target.matter : target.light
  pool.emit(spawn)
}
