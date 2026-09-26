import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Group,
  LatheGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  Vector2,
} from 'three'
import { contentFor } from '../content/biomeContent'
import { simClock } from '../sim/clock'
import { gameEvents } from '../sim/events'
import {
  BELT_SPEED,
  HOURGLASS_COOLDOWN_MS,
  HOURGLASS_RADIUS,
  ROD_COOLDOWN_MS,
  biomeLeft,
  mechanicBiome,
  useMechanicsStore,
  type Hazard,
  type MechanicProp,
  type SlowField,
} from '../sim/mechanics'
import { useGameStore } from '../store/gameStore'
import { useSessionStore } from '../store/sessionStore'
import { useSettingsStore } from '../store/settingsStore'

const additive = (color: string, opacity = 1) => new MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: AdditiveBlending, toneMapped: false, side: DoubleSide })
const propById = (id: string) => useMechanicsStore.getState().props.find((candidate) => candidate.id === id)

/** A jagged polyline from (x1,y1) to (x2,y2) written into a line-segment buffer. */
function writeBolt(positions: Float32Array, x1: number, y1: number, x2: number, y2: number, z: number, jitter: number) {
  const segments = positions.length / 6
  let px = x1
  let py = y1
  for (let index = 0; index < segments; index += 1) {
    const t = (index + 1) / segments
    const last = index === segments - 1
    const nx = last ? x2 : x1 + (x2 - x1) * t + (Math.random() - 0.5) * jitter
    const ny = last ? y2 : y1 + (y2 - y1) * t + (Math.random() - 0.5) * jitter
    positions.set([px, py, z, nx, ny, z], index * 6)
    px = nx
    py = ny
  }
}

// ── Neon signs (Aku Metropolü) ──────────────────────────────────────────────
function NeonSign({ prop, index }: { prop: MechanicProp; index: number }) {
  const panel = useRef<Group>(null)
  const glow = useMemo(() => new MeshBasicMaterial({ color: index % 2 ? '#43f3ff' : '#ff2a70', toneMapped: false }), [index])
  const base = useMemo(() => new Color(glow.color), [glow])
  const dark = useMemo(() => new Color('#1a0c12'), [])
  useFrame(({ clock }) => {
    const current = propById(prop.id)
    const broken = Boolean(current?.brokenAt)
    if (broken) {
      // A dying sign sputters for a few seconds, then goes dark for good.
      const since = simClock.now() - current!.brokenAt
      const flicker = since < 2_400 && Math.sin(clock.elapsedTime * 60) > 0.6
      glow.color.copy(flicker ? base : dark)
      if (panel.current) panel.current.rotation.z = Math.min(0.32, since / 600 * 0.32)
    } else {
      glow.color.copy(base).multiplyScalar(0.85 + Math.sin(clock.elapsedTime * 4 + index) * 0.15)
    }
  })
  return (
    <group position={[prop.x, 0, -1.05]} name="neon-tabela">
      <mesh position={[0, 1.3, 0]}><cylinderGeometry args={[0.06, 0.08, 2.6, 8]} /><meshStandardMaterial color="#2a1a22" metalness={0.7} roughness={0.35} /></mesh>
      <group ref={panel} position={[0, 2.55, 0]}>
        <mesh><boxGeometry args={[1.25, 0.85, 0.12]} /><meshStandardMaterial color="#1a0d14" metalness={0.5} roughness={0.4} /></mesh>
        <mesh position={[0, 0, 0.07]} material={glow}><boxGeometry args={[1.08, 0.08, 0.02]} /></mesh>
        <mesh position={[-0.28, 0.02, 0.07]} material={glow}><boxGeometry args={[0.07, 0.6, 0.02]} /></mesh>
        <mesh position={[0.22, 0.18, 0.07]} material={glow}><boxGeometry args={[0.45, 0.07, 0.02]} /></mesh>
        <mesh position={[0.22, -0.2, 0.07]} material={glow}><boxGeometry args={[0.07, 0.36, 0.02]} /></mesh>
      </group>
    </group>
  )
}

// ── Marsh water and fireflies (Altın Bataklık) ─────────────────────────────
function MarshWater() {
  const zones = contentFor('golden-swamp').zones
  const left = biomeLeft(mechanicBiome('marsh'))
  const material = useMemo(() => new MeshStandardMaterial({ color: '#35553a', roughness: 0.04, metalness: 0.35, transparent: true, opacity: 0.8 }), [])
  const ripples = useMemo(() => zones.flatMap(() => [additive('#e8ff9a', 0.25), additive('#e8ff9a', 0.25)]), [zones])
  const rings = useRef<Mesh[]>([])
  useFrame(({ clock }) => {
    rings.current.forEach((ring, index) => {
      const phase = (clock.elapsedTime * 0.45 + index * 0.37) % 1
      ring.scale.setScalar(0.3 + phase * 1.8)
      ;(ring.material as MeshBasicMaterial).opacity = (1 - phase) * 0.28
    })
  })
  return (
    <group name="bataklik-suyu">
      {zones.map(([start, end], index) => (
        <group key={start}>
          <mesh position={[left + (start + end) / 2, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]} material={material}>
            <planeGeometry args={[end - start, 5.4]} />
          </mesh>
          {[0, 1].map((ringIndex) => (
            <mesh key={ringIndex} ref={(mesh) => { if (mesh) rings.current[index * 2 + ringIndex] = mesh }} position={[left + start + (end - start) * (0.3 + ringIndex * 0.4), 0.045, ringIndex ? 1.2 : -1]} rotation={[-Math.PI / 2, 0, 0]} material={ripples[index * 2 + ringIndex]}>
              <ringGeometry args={[0.45, 0.5, 32]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

function FireflySwarm({ prop }: { prop: MechanicProp }) {
  const group = useRef<Group>(null)
  const material = useMemo(() => additive('#f4ff8c', 0.95), [])
  const seeds = useMemo(() => Array.from({ length: 16 }, (_, index) => ({ radius: 0.3 + (index % 5) * 0.14, speed: 0.8 + (index % 4) * 0.35, phase: index * 1.7, height: 0.6 + (index % 6) * 0.22 })), [])
  useFrame(({ clock }) => {
    const current = propById(prop.id)
    const ready = !current || current.readyAt <= simClock.now()
    material.opacity = ready ? 0.95 : 0.12
    group.current?.children.forEach((child, index) => {
      const seed = seeds[index]!
      const t = clock.elapsedTime * seed.speed + seed.phase
      child.position.set(Math.cos(t) * seed.radius, seed.height + Math.sin(t * 1.7) * 0.18, Math.sin(t) * seed.radius * 0.6)
      child.scale.setScalar(0.5 + Math.max(0, Math.sin(t * 3.1)) * 0.8)
    })
  })
  return (
    <group ref={group} position={[prop.x, 0, 0.2]} name="ates-bocekleri">
      {seeds.map((_, index) => <mesh key={index} material={material}><sphereGeometry args={[0.045, 6, 4]} /></mesh>)}
    </group>
  )
}

// ── Hourglasses and slow time (Kum Saati Çölü) ─────────────────────────────
const GLASS_PROFILE = [[0.02, -1], [0.62, -0.96], [0.66, -0.7], [0.5, -0.32], [0.1, -0.04], [0.1, 0.04], [0.5, 0.32], [0.66, 0.7], [0.62, 0.96], [0.02, 1]].map(([x, y]) => new Vector2(x, y))

function HourglassMonument({ prop }: { prop: MechanicProp }) {
  const glass = useRef<Group>(null)
  const topSand = useRef<Mesh>(null)
  const bottomSand = useRef<Mesh>(null)
  const stream = useRef<Mesh>(null)
  const ring = useRef<Mesh>(null)
  const glassGeometry = useMemo(() => new LatheGeometry(GLASS_PROFILE, 28), [])
  const glassMaterial = useMemo(() => new MeshPhongMaterial({ color: '#ffe9c4', transparent: true, opacity: 0.28, shininess: 120, specular: new Color('#ffffff'), depthWrite: false, side: DoubleSide }), [])
  const sandMaterial = useMemo(() => new MeshBasicMaterial({ color: '#f2b957', toneMapped: false }), [])
  const ringMaterial = useMemo(() => additive('#ffcf5a', 0.5), [])
  const flipFrom = useRef(0)
  const lastStruck = useRef(0)
  useFrame(({ clock }) => {
    const current = propById(prop.id)
    const now = simClock.now()
    if (current && current.struckAt !== lastStruck.current) {
      lastStruck.current = current.struckAt
      flipFrom.current = glass.current?.rotation.z ?? 0
    }
    const since = current?.struckAt ? now - current.struckAt : Infinity
    // Flip half a turn in 600 ms when struck; sand then pours back over the cooldown.
    if (glass.current) {
      const flip = Math.min(1, since / 600)
      const eased = flip * flip * (3 - 2 * flip)
      glass.current.rotation.z = Number.isFinite(since) ? flipFrom.current + (Math.PI - flipFrom.current % Math.PI) * eased : 0
    }
    const ready = !current || current.readyAt <= now
    const refill = ready ? 1 : Math.min(1, since / HOURGLASS_COOLDOWN_MS)
    // In the glass's own frame the "top" bulb is whichever side is up after the flip.
    const upper = 1 - refill
    if (topSand.current) topSand.current.scale.set(0.9 * Math.max(0.05, upper), Math.max(0.02, upper), 0.9 * Math.max(0.05, upper))
    if (bottomSand.current) bottomSand.current.scale.set(0.9 * Math.max(0.05, refill), Math.max(0.02, refill), 0.9 * Math.max(0.05, refill))
    if (stream.current) stream.current.visible = !ready
    if (ring.current) {
      ring.current.scale.setScalar(ready ? 1 + Math.sin(clock.elapsedTime * 3) * 0.05 : 0.8)
      ringMaterial.opacity = ready ? 0.45 + Math.sin(clock.elapsedTime * 3) * 0.2 : 0.08
    }
  })
  return (
    <group position={[prop.x, 0, -1.1]} name="kum-saati">
      <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[1, 1.15, 0.4, 8]} /><meshLambertMaterial color="#8f5d3f" /></mesh>
      <mesh position={[-0.82, 1.9, 0]}><boxGeometry args={[0.16, 3, 0.16]} /><meshStandardMaterial color="#b88a3e" metalness={0.6} roughness={0.35} /></mesh>
      <mesh position={[0.82, 1.9, 0]}><boxGeometry args={[0.16, 3, 0.16]} /><meshStandardMaterial color="#b88a3e" metalness={0.6} roughness={0.35} /></mesh>
      <mesh position={[0, 3.45, 0]}><boxGeometry args={[2, 0.18, 0.5]} /><meshStandardMaterial color="#8a6a3c" metalness={0.5} roughness={0.4} /></mesh>
      <group ref={glass} position={[0, 1.9, 0]}>
        <mesh geometry={glassGeometry} material={glassMaterial} scale={[1, 1.35, 1]} />
        <mesh position={[0, 1.38, 0]}><cylinderGeometry args={[0.72, 0.72, 0.1, 20]} /><meshStandardMaterial color="#c9a04c" metalness={0.7} roughness={0.3} /></mesh>
        <mesh position={[0, -1.38, 0]}><cylinderGeometry args={[0.72, 0.72, 0.1, 20]} /><meshStandardMaterial color="#c9a04c" metalness={0.7} roughness={0.3} /></mesh>
        <mesh ref={topSand} position={[0, 0.62, 0]} material={sandMaterial} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.6, 0.8, 18]} /></mesh>
        <mesh ref={bottomSand} position={[0, -1.0, 0]} material={sandMaterial}><coneGeometry args={[0.6, 0.62, 18]} /></mesh>
        <mesh ref={stream} material={sandMaterial} visible={false}><cylinderGeometry args={[0.025, 0.025, 1.3, 6]} /></mesh>
      </group>
      <mesh ref={ring} position={[0, 0.06, 1.1]} rotation={[-Math.PI / 2, 0, 0]} material={ringMaterial}><ringGeometry args={[1.05, 1.22, 40]} /></mesh>
    </group>
  )
}

function SlowFieldBubble({ field }: { field: SlowField }) {
  const group = useRef<Group>(null)
  const dome = useMemo(() => additive('#ffcf6b', 0.08), [])
  const rim = useMemo(() => additive('#ffe3a1', 0.6), [])
  const hands = useRef<Group>(null)
  useFrame((_, delta) => {
    const now = simClock.now()
    const grow = Math.min(1, (now - field.startedAt) / 280)
    const fade = Math.max(0, Math.min(1, (field.until - now) / 500))
    const presence = grow * fade
    if (group.current) group.current.scale.setScalar(Math.max(0.001, presence))
    dome.opacity = 0.09 * presence
    rim.opacity = 0.65 * presence
    if (hands.current) hands.current.rotation.z -= delta * 0.6
  })
  return (
    <group ref={group} position={[field.x, 0, 0]} name="zaman-balonu">
      <mesh material={dome}><sphereGeometry args={[HOURGLASS_RADIUS, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} material={rim}><ringGeometry args={[HOURGLASS_RADIUS - 0.12, HOURGLASS_RADIUS, 64]} /></mesh>
      <group ref={hands} position={[0, 2.2, -0.4]}>
        {Array.from({ length: 12 }, (_, index) => (
          <mesh key={index} material={rim} rotation={[0, 0, (index / 12) * Math.PI * 2]} position={[Math.cos((index / 12) * Math.PI * 2) * 1.7, Math.sin((index / 12) * Math.PI * 2) * 1.7, 0]}>
            <boxGeometry args={[0.3, 0.05, 0.01]} />
          </mesh>
        ))}
        <mesh material={rim} position={[0.45, 0, 0]}><boxGeometry args={[0.9, 0.06, 0.01]} /></mesh>
        <mesh material={rim} position={[0, 0.65, 0]}><boxGeometry args={[0.05, 1.3, 0.01]} /></mesh>
      </group>
    </group>
  )
}

// ── Conveyor belts and presses (Böcek Dökümhanesi) ─────────────────────────
function beltTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 64
  const context = canvas.getContext('2d')!
  context.fillStyle = '#1c1a19'
  context.fillRect(0, 0, 128, 64)
  context.fillStyle = '#2d2a28'
  for (let x = 0; x < 128; x += 32) context.fillRect(x, 0, 16, 64)
  context.strokeStyle = '#ffae3d'
  context.lineWidth = 5
  for (let x = 8; x < 128; x += 64) {
    context.beginPath()
    context.moveTo(x, 12)
    context.lineTo(x + 18, 32)
    context.lineTo(x, 52)
    context.stroke()
  }
  const texture = new CanvasTexture(canvas)
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  return texture
}

function ConveyorBelts() {
  const biome = mechanicBiome('foundry')
  const zones = contentFor('beetle-foundry').zones
  const left = biomeLeft(biome)
  const textures = useMemo(() => zones.map((zone, index) => {
    const texture = beltTexture()
    texture.repeat.set((zone[1] - zone[0]) / 1.4, 1)
    if (index % 2 === 0) texture.rotation = Math.PI
    texture.center.set(0.5, 0.5)
    return texture
  }), [zones])
  const materials = useMemo(() => textures.map((texture) => new MeshBasicMaterial({ map: texture, color: '#bdb6ad' })), [textures])
  useFrame((_, delta) => {
    const step = Math.min(delta, 0.1) * simClock.scale() * (BELT_SPEED / 1.4)
    textures.forEach((texture) => { texture.offset.x -= step })
  })
  return (
    <group name="konveyor-bantlari">
      {zones.map(([start, end], index) => (
        <group key={start}>
          <mesh position={[left + (start + end) / 2, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]} material={materials[index]}>
            <planeGeometry args={[end - start, 3.6]} />
          </mesh>
          {[start, end].map((edge) => (
            <mesh key={edge} position={[left + edge, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.16, 0.16, 3.7, 12]} />
              <meshStandardMaterial color="#4b4540" metalness={0.7} roughness={0.35} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

function FoundryPress({ x }: { x: number }) {
  const head = useRef<Group>(null)
  const shadow = useRef<Mesh>(null)
  const lampMaterial = useMemo(() => new MeshBasicMaterial({ color: '#3a1a0a', toneMapped: false }), [])
  const shadowMaterial = useMemo(() => new MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0, depthWrite: false }), [])
  const glowMaterial = useMemo(() => additive('#ff9a2e', 0), [])
  useFrame(({ clock }) => {
    const now = simClock.now()
    const hazard = useMechanicsStore.getState().hazards.find((candidate) => candidate.kind === 'press' && Math.abs(candidate.x - x) < 0.3 && now <= candidate.endAt + 700)
    let y = 3.6
    let warn = 0
    if (hazard) {
      if (now < hazard.strikeAt) {
        warn = (now - hazard.warnAt) / Math.max(1, hazard.strikeAt - hazard.warnAt)
        y = 3.6 + warn * 0.5 + Math.sin(clock.elapsedTime * 60) * 0.03 * warn
      } else if (now <= hazard.endAt) {
        const slam = Math.min(1, (now - hazard.strikeAt) / 90)
        y = 4.1 - slam * 3.72
      } else {
        const lift = Math.min(1, (now - hazard.endAt) / 700)
        y = 0.38 + lift * 3.22
      }
    }
    if (head.current) head.current.position.y = y
    lampMaterial.color.set(warn > 0 && Math.sin(clock.elapsedTime * 18) > 0 ? '#ff5a12' : '#3a1a0a')
    if (shadow.current) {
      shadowMaterial.opacity = hazard && now <= hazard.endAt ? 0.25 + warn * 0.4 : 0
      shadow.current.scale.setScalar(0.6 + Math.min(1, warn) * 0.4)
    }
    glowMaterial.opacity = hazard && now >= hazard.strikeAt && now <= hazard.endAt + 250 ? 0.8 : 0
  })
  return (
    <group position={[x, 0, 0]} name="pres">
      {/* Cantilever press: one column behind the lane, the arm reaches over it. */}
      <mesh position={[0, 3, -2.4]}><boxGeometry args={[0.55, 6, 0.55]} /><meshStandardMaterial color="#35302c" metalness={0.65} roughness={0.4} /></mesh>
      <mesh position={[0, 5.6, -1.05]}><boxGeometry args={[0.8, 0.5, 3.1]} /><meshStandardMaterial color="#2a2522" metalness={0.6} roughness={0.4} /></mesh>
      <mesh position={[0, 5.05, -1.9]} rotation={[0.75, 0, 0]}><boxGeometry args={[0.3, 1.3, 0.3]} /><meshStandardMaterial color="#2a2522" metalness={0.6} roughness={0.4} /></mesh>
      <mesh position={[0, 4.4, -2.1]} material={lampMaterial}><sphereGeometry args={[0.16, 10, 8]} /></mesh>
      <group ref={head} position={[0, 3.6, 0]}>
        <mesh position={[0, 1.1, 0]}><cylinderGeometry args={[0.16, 0.16, 2.2, 10]} /><meshStandardMaterial color="#9a9a9a" metalness={0.9} roughness={0.2} /></mesh>
        <mesh><boxGeometry args={[1.7, 0.7, 2.2]} /><meshStandardMaterial color="#4a3f36" metalness={0.55} roughness={0.45} /></mesh>
        {[-0.75, -0.25, 0.25, 0.75].map((z, index) => (
          <mesh key={z} position={[0.86, 0, z]}><boxGeometry args={[0.02, 0.5, 0.28]} /><meshBasicMaterial color={index % 2 ? '#141212' : '#ffb000'} /></mesh>
        ))}
      </group>
      <mesh ref={shadow} position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} material={shadowMaterial}><circleGeometry args={[1.2, 24]} /></mesh>
      <mesh position={[0, 0.3, 0]} material={glowMaterial} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.9, 1.6, 28]} /></mesh>
    </group>
  )
}

// ── Lightning rods and bolts (Şimşek Zirvesi) ──────────────────────────────
function LightningRod({ prop }: { prop: MechanicProp }) {
  const orb = useMemo(() => additive('#cfe0ff', 0.9), [])
  const arcGeometry = useMemo(() => {
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(6 * 6), 3))
    return geometry
  }, [])
  const arcMaterial = useMemo(() => new LineBasicMaterial({ color: '#e6eeff', transparent: true, opacity: 0.9, blending: AdditiveBlending, depthWrite: false }), [])
  const arcs = useMemo(() => new LineSegments(arcGeometry, arcMaterial), [arcGeometry, arcMaterial])
  const orbMesh = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    const current = propById(prop.id)
    const now = simClock.now()
    const ready = !current || current.readyAt <= now
    const since = current?.struckAt ? now - current.struckAt : Infinity
    const charge = ready ? 1 : Math.min(1, since / ROD_COOLDOWN_MS) * 0.35
    orb.opacity = ready ? 0.65 + Math.sin(clock.elapsedTime * 24) * 0.25 : 0.12 + charge * 0.3
    if (orbMesh.current) orbMesh.current.scale.setScalar(ready ? 1 + Math.sin(clock.elapsedTime * 9) * 0.12 : 0.7)
    arcs.visible = ready && Math.sin(clock.elapsedTime * 13) > -0.2
    if (arcs.visible && Math.random() < 0.5) {
      const positions = arcGeometry.getAttribute('position') as BufferAttribute
      const angle = Math.random() * Math.PI * 2
      writeBolt(positions.array as Float32Array, 0, 3.85, Math.cos(angle) * 0.7, 3.85 + Math.sin(angle) * 0.7, 0, 0.18)
      positions.needsUpdate = true
    }
  })
  return (
    <group position={[prop.x, 0, -1.2]} name="paratoner">
      <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.55, 0.7, 0.5, 8]} /><meshLambertMaterial color="#3a3f5a" /></mesh>
      <mesh position={[0, 2, 0]}><cylinderGeometry args={[0.07, 0.1, 3.5, 10]} /><meshStandardMaterial color="#c98a4a" metalness={0.85} roughness={0.25} /></mesh>
      {[1.2, 1.7, 2.2, 2.7].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.22, 0.035, 6, 20]} /><meshStandardMaterial color="#e0a45e" metalness={0.9} roughness={0.2} /></mesh>
      ))}
      <mesh ref={orbMesh} position={[0, 3.85, 0]} material={orb}><sphereGeometry args={[0.26, 16, 12]} /></mesh>
      <primitive object={arcs} />
    </group>
  )
}

function BoltStrike({ hazard }: { hazard: Hazard }) {
  const ring = useRef<Mesh>(null)
  const ringMaterial = useMemo(() => additive('#9fbcff', 0), [])
  const flash = useMemo(() => additive('#e8efff', 0), [])
  const geometry = useMemo(() => {
    const bolt = new BufferGeometry()
    bolt.setAttribute('position', new BufferAttribute(new Float32Array(14 * 6), 3))
    return bolt
  }, [])
  const material = useMemo(() => new LineBasicMaterial({ color: '#f4f7ff', transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false }), [])
  const bolt = useMemo(() => new LineSegments(geometry, material), [geometry, material])
  const drawn = useRef(false)
  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])
  useFrame(({ clock }) => {
    const now = simClock.now()
    const warning = now < hazard.strikeAt
    const striking = now >= hazard.strikeAt && now <= hazard.endAt + 120
    if (ring.current) {
      const progress = Math.min(1, (now - hazard.warnAt) / Math.max(1, hazard.strikeAt - hazard.warnAt))
      ring.current.scale.setScalar(1.6 - progress * 0.7)
      ringMaterial.opacity = warning ? 0.3 + progress * 0.5 + Math.sin(clock.elapsedTime * 30) * 0.1 : 0
    }
    if (striking && !drawn.current) {
      drawn.current = true
      writeBolt((geometry.getAttribute('position') as BufferAttribute).array as Float32Array, hazard.x + (Math.random() - 0.5) * 2, 11, hazard.x, 0.05, 0.2, 0.9)
      geometry.getAttribute('position').needsUpdate = true
    }
    material.opacity = striking ? 1 : 0
    flash.opacity = striking ? 0.7 * (1 - Math.min(1, (now - hazard.strikeAt) / 400)) : 0
  })
  return (
    <group name="yildirim">
      <mesh ref={ring} position={[hazard.x, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} material={ringMaterial}><ringGeometry args={[0.72, 0.86, 36]} /></mesh>
      <mesh position={[hazard.x, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} material={flash}><circleGeometry args={[1.4, 28]} /></mesh>
      <primitive object={bolt} />
    </group>
  )
}

/** Chain-lightning arcs between creatures, and the crackle on a charged hero. */
function StormArcs() {
  const pool = useMemo(() => Array.from({ length: 6 }, () => {
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(10 * 6), 3))
    const material = new LineBasicMaterial({ color: '#dfe8ff', transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false })
    return { line: new LineSegments(geometry, material), material, geometry, until: 0 }
  }), [])
  const heroArcs = useMemo(() => (['ali', 'jack'] as const).map(() => {
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(6 * 6), 3))
    const material = new LineBasicMaterial({ color: '#b9ccff', transparent: true, opacity: 0.85, blending: AdditiveBlending, depthWrite: false })
    return { line: new LineSegments(geometry, material), geometry }
  }), [])
  useEffect(() => gameEvents.on((event) => {
    if (event.type !== 'mechanic' || event.name !== 'chain' || event.x2 === undefined) return
    const slot = pool.reduce((oldest, candidate) => candidate.until < oldest.until ? candidate : oldest, pool[0]!)
    writeBolt((slot.geometry.getAttribute('position') as BufferAttribute).array as Float32Array, event.x, 1.3, event.x2, 1.2, 0.3, 0.5)
    slot.geometry.getAttribute('position').needsUpdate = true
    slot.until = performance.now() + 240
  }), [pool])
  useFrame(() => {
    const now = performance.now()
    pool.forEach((slot) => { slot.material.opacity = slot.until > now ? (slot.until - now) / 240 : 0 })
    const charged = useMechanicsStore.getState().charged
    const positions = useGameStore.getState().positions
    const sim = simClock.now()
    ;(['ali', 'jack'] as const).forEach((id, index) => {
      const arc = heroArcs[index]!
      arc.line.visible = charged[id] > sim && Math.random() > 0.35
      if (!arc.line.visible) return
      const [x, y] = positions[id]
      const angle = Math.random() * Math.PI * 2
      writeBolt((arc.geometry.getAttribute('position') as BufferAttribute).array as Float32Array, x + Math.cos(angle) * 0.2, y + 1.1, x + Math.cos(angle) * 0.9, y + 1.1 + Math.sin(angle) * 0.9, 0.35, 0.25)
      arc.geometry.getAttribute('position').needsUpdate = true
    })
  })
  return <group name="simsek-zinciri">{pool.map((slot, index) => <primitive key={index} object={slot.line} />)}{heroArcs.map((arc, index) => <primitive key={`hero-${index}`} object={arc.line} />)}</group>
}

/** A dim sky flash for each bolt; skipped entirely when flashes are reduced. */
function StormSkyFlash() {
  const material = useMemo(() => new MeshBasicMaterial({ color: '#cfdcff', transparent: true, opacity: 0, depthWrite: false, toneMapped: false }), [])
  const flashAt = useRef(0)
  useEffect(() => gameEvents.on((event) => {
    if (event.type === 'hazard' && event.name === 'bolt' && event.stage === 'strike') flashAt.current = performance.now()
  }), [])
  useFrame(() => {
    const since = performance.now() - flashAt.current
    material.opacity = useSettingsStore.getState().reduceFlashes ? 0 : since < 180 ? 0.22 * (1 - since / 180) : 0
  })
  const center = biomeLeft(mechanicBiome('storm')) + 18
  return <mesh position={[center, 8, -12]} material={material}><planeGeometry args={[60, 20]} /></mesh>
}

// ── Twin bells (Yeşim Harabeleri) ───────────────────────────────────────────
const BELL_PROFILE = [[0, -0.55], [0.46, -0.52], [0.4, -0.3], [0.32, 0.1], [0.24, 0.35], [0.1, 0.45], [0, 0.46]].map(([x, y]) => new Vector2(x, y))

function TempleBell({ prop }: { prop: MechanicProp }) {
  const bell = useRef<Group>(null)
  const ring = useRef<Mesh>(null)
  const geometry = useMemo(() => new LatheGeometry(BELL_PROFILE, 24), [])
  const ringMaterial = useMemo(() => additive('#ffe38a', 0), [])
  useFrame(() => {
    const current = propById(prop.id)
    const since = current?.struckAt ? simClock.now() - current.struckAt : Infinity
    const swing = since < 2_600 ? Math.sin(since / 110) * Math.exp(-since / 700) * 0.45 : 0
    if (bell.current) bell.current.rotation.z = swing
    if (ring.current) {
      const progress = Math.min(1, since / 900)
      ring.current.scale.setScalar(0.4 + progress * 3)
      ringMaterial.opacity = since < 900 ? (1 - progress) * 0.7 : 0
    }
  })
  return (
    <group position={[prop.x, 0, -1.15]} name="kadim-can">
      <mesh position={[-0.75, 1.5, 0]}><boxGeometry args={[0.18, 3, 0.18]} /><meshStandardMaterial color="#1d5a45" roughness={0.7} /></mesh>
      <mesh position={[0.75, 1.5, 0]}><boxGeometry args={[0.18, 3, 0.18]} /><meshStandardMaterial color="#1d5a45" roughness={0.7} /></mesh>
      <mesh position={[0, 3.05, 0]}><boxGeometry args={[2, 0.2, 0.26]} /><meshStandardMaterial color="#16493a" roughness={0.7} /></mesh>
      <group ref={bell} position={[0, 2.95, 0]}>
        <mesh geometry={geometry} position={[0, -0.62, 0]}><meshStandardMaterial color="#9a7a3a" metalness={0.85} roughness={0.28} /></mesh>
      </group>
      <mesh ref={ring} position={[0, 2.3, 0.1]} material={ringMaterial}><torusGeometry args={[0.5, 0.03, 6, 40]} /></mesh>
    </group>
  )
}

function JadeMist() {
  const material = useMemo(() => new MeshBasicMaterial({ color: '#bff5dc', transparent: true, opacity: 0.16, depthWrite: false, toneMapped: false }), [])
  const cards = useRef<Mesh[]>([])
  const left = biomeLeft(mechanicBiome('bells'))
  useFrame(({ clock }) => {
    const resonance = useMechanicsStore.getState().resonanceUntil > simClock.now()
    material.opacity += ((resonance ? 0 : 0.17) - material.opacity) * 0.04
    cards.current.forEach((card, index) => { card.position.x = left + 3 + index * 6 + Math.sin(clock.elapsedTime * 0.12 + index) * 1.6 })
  })
  return (
    <group name="yesim-sisi">
      {Array.from({ length: 6 }, (_, index) => (
        <mesh key={index} ref={(mesh) => { if (mesh) cards.current[index] = mesh }} position={[left + 3 + index * 6, 1.2 + (index % 2) * 0.5, index % 2 ? 1.6 : -1.8]} material={material}>
          <planeGeometry args={[7, 2.4]} />
        </mesh>
      ))}
    </group>
  )
}

// ── Hazards: lava, fire vents, tide ─────────────────────────────────────────
function Eruption({ hazard }: { hazard: Hazard }) {
  const crack = useRef<Mesh>(null)
  const column = useRef<Mesh>(null)
  const lava = hazard.kind === 'lava'
  const crackMaterial = useMemo(() => additive(lava ? '#ff5a12' : '#ff8a1f', 0), [lava])
  const columnMaterial = useMemo(() => additive(lava ? '#ff7a1a' : '#ffb347', 0), [lava])
  useFrame(({ clock }) => {
    const now = simClock.now()
    const warn = Math.min(1, (now - hazard.warnAt) / Math.max(1, hazard.strikeAt - hazard.warnAt))
    const striking = now >= hazard.strikeAt && now <= hazard.endAt
    const strike = striking ? (now - hazard.strikeAt) / (hazard.endAt - hazard.strikeAt) : 0
    if (crack.current) {
      crack.current.scale.setScalar(hazard.width * (0.4 + warn * 0.6))
      crackMaterial.opacity = now < hazard.endAt ? 0.35 + warn * 0.5 + Math.sin(clock.elapsedTime * 30) * 0.12 : Math.max(0, crackMaterial.opacity - 0.05)
    }
    if (column.current) {
      column.current.visible = striking
      const height = Math.sin(Math.min(1, strike) * Math.PI) * (lava ? 3.4 : 4.6)
      column.current.scale.set(hazard.width * 0.55, Math.max(0.01, height), hazard.width * 0.55)
      column.current.position.y = height / 2
      columnMaterial.opacity = 0.85
    }
  })
  return (
    <group position={[hazard.x, 0, 0]}>
      <mesh ref={crack} position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]} material={crackMaterial}><ringGeometry args={[0.15, 0.5, 7, 1]} /></mesh>
      <mesh ref={column} material={columnMaterial} visible={false}><cylinderGeometry args={[0.5, 0.85, 1, 12, 1, true]} /></mesh>
    </group>
  )
}

function TideWave({ hazard }: { hazard: Hazard }) {
  const wave = useRef<Group>(null)
  const line = useRef<Mesh>(null)
  const body = useMemo(() => new MeshBasicMaterial({ color: '#3d7ea6', transparent: true, opacity: 0.72, depthWrite: false, side: DoubleSide }), [])
  const foam = useMemo(() => additive('#e8fbff', 0.9), [])
  const warnMaterial = useMemo(() => additive('#9fe6ff', 0), [])
  useFrame(({ clock }) => {
    const now = simClock.now()
    const warning = now < hazard.strikeAt
    if (line.current) {
      line.current.position.x = hazard.x
      warnMaterial.opacity = warning ? 0.25 + Math.sin(clock.elapsedTime * 12) * 0.2 : 0
    }
    if (!wave.current) return
    const striking = now >= hazard.strikeAt && now <= hazard.endAt + 300
    wave.current.visible = striking
    if (!striking) return
    const progress = Math.min(1, (now - hazard.strikeAt) / (hazard.endAt - hazard.strikeAt))
    wave.current.position.x = hazard.x + hazard.width * 0.5 - progress * hazard.width
    wave.current.scale.y = now > hazard.endAt ? Math.max(0.01, 1 - (now - hazard.endAt) / 300) : 1
  })
  return (
    <>
      <mesh ref={line} position={[hazard.x, 0.08, -3.2]} rotation={[-Math.PI / 2, 0, 0]} material={warnMaterial}><planeGeometry args={[hazard.width, 0.35]} /></mesh>
      <group ref={wave} visible={false}>
        <mesh position={[0.5, 0.55, 0]} rotation={[0, Math.PI / 2, 0]} material={body}><planeGeometry args={[5.6, 1.1]} /></mesh>
        <mesh position={[0.2, 1.1, 0]} rotation={[0, Math.PI / 2, 0.25]} material={foam}><planeGeometry args={[5.6, 0.22]} /></mesh>
        <mesh position={[2.2, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} material={body}><planeGeometry args={[3.4, 5.6]} /></mesh>
      </group>
    </>
  )
}

function HazardVisual({ hazard }: { hazard: Hazard }) {
  if (hazard.kind === 'tide') return <TideWave hazard={hazard} />
  if (hazard.kind === 'bolt') return <BoltStrike hazard={hazard} />
  // Presses animate their own head; lava and vents erupt from the ground.
  if (hazard.kind === 'press') return null
  return <Eruption hazard={hazard} />
}

function PropVisual({ prop, index }: { prop: MechanicProp; index: number }) {
  switch (prop.kind) {
    case 'neon': return <NeonSign prop={prop} index={index} />
    case 'bell': return <TempleBell prop={prop} />
    case 'hourglass': return <HourglassMonument prop={prop} />
    case 'rod': return <LightningRod prop={prop} />
    default: return <FireflySwarm prop={prop} />
  }
}

export function MechanicsVisuals() {
  const props = useMechanicsStore((state) => state.props)
  const hazards = useMechanicsStore((state) => state.hazards)
  const fields = useMechanicsStore((state) => state.slowFields)
  const inRun = useSessionStore((state) => state.phase !== 'menu' && state.phase !== 'controls')
  const pressXs = useMemo(() => contentFor('beetle-foundry').props.map((offset) => biomeLeft(mechanicBiome('foundry')) + offset), [])
  return (
    <group name="biome-mechanics">
      {props.map((prop, index) => <PropVisual key={prop.id} prop={prop} index={index} />)}
      <MarshWater />
      <JadeMist />
      <ConveyorBelts />
      {pressXs.map((x) => <FoundryPress key={x} x={x} />)}
      <StormArcs />
      <StormSkyFlash />
      {inRun ? hazards.map((hazard) => <HazardVisual key={hazard.id} hazard={hazard} />) : null}
      {inRun ? fields.map((field) => <SlowFieldBubble key={field.id} field={field} />) : null}
    </group>
  )
}
