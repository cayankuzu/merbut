import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  SphereGeometry,
  TorusGeometry,
} from 'three'
import { useShallow } from 'zustand/react/shallow'
import { simClock } from '../sim/clock'
import { gameEvents } from '../sim/events'
import { useSessionStore } from '../store/sessionStore'
import { useSettingsStore } from '../store/settingsStore'
import { currentEnemyById, enemyById } from './enemyLookup'

/**
 * Aku's beetle drones, built from primitives instead of a skinned model: a
 * lacquered shell that splits for the attack, six scuttling legs and a red
 * visor. Kind decides the silhouette (pincers, a back cannon, a lens), the
 * queen variant is the same rig at monster scale with a molten core.
 */
const SHELL = new SphereGeometry(0.5, 20, 14)
const HALF_SHELL = new SphereGeometry(0.5, 16, 10, 0, Math.PI)
const HEAD = new SphereGeometry(0.22, 14, 10)
const EYE = new SphereGeometry(0.055, 8, 6)
const LEG = new CylinderGeometry(0.035, 0.022, 0.78, 5)
const PINCER = new ConeGeometry(0.06, 0.42, 6)
const BARREL = new CylinderGeometry(0.07, 0.09, 0.62, 10)
const CORE = new TorusGeometry(0.2, 0.05, 8, 20)
const HIT_FLASH_MS = 110
const WHITE = new Color('#ffffff')
const RED = new Color('#ff2a1a')
const SAFE = new Color('#ffe45c')

export function DroneActor({ id }: { id: string }) {
  const enemy = useSessionStore(useShallow((state) => {
    const current = enemyById(state.enemies, id)
    return current ? { kind: current.kind, variant: current.variant, scale: current.scale, title: current.title, z: current.z } : null
  }))
  const initialX = useMemo(() => currentEnemyById(id)?.x ?? 0, [id])
  const root = useRef<Group>(null)
  const body = useRef<Group>(null)
  const leftCase = useRef<Mesh>(null)
  const rightCase = useRef<Mesh>(null)
  const legs = useRef<Group[]>([])
  const pincers = useRef<Mesh[]>([])
  const hitAt = useRef(-Infinity)
  const queen = enemy?.variant === 'queen'
  const shell = useMemo(() => new MeshPhongMaterial({ color: queen ? '#2a1208' : '#15100f', specular: new Color('#ffb070'), shininess: 70, emissive: new Color('#000000') }), [queen])
  const metal = useMemo(() => new MeshPhongMaterial({ color: '#3b3533', specular: new Color('#ffffff'), shininess: 40 }), [])
  const eyes = useMemo(() => new MeshBasicMaterial({ color: '#ff3b1f', toneMapped: false }), [])
  const glow = useMemo(() => new MeshBasicMaterial({ color: '#ff8a1f', transparent: true, opacity: 0.85, blending: AdditiveBlending, depthWrite: false, toneMapped: false }), [])

  useEffect(() => () => { shell.dispose(); metal.dispose(); eyes.dispose(); glow.dispose() }, [eyes, glow, metal, shell])
  useEffect(() => gameEvents.on((event) => {
    if (event.type === 'enemy-hit' && event.enemyId === id) hitAt.current = performance.now()
  }), [id])

  useFrame(({ clock }, delta) => {
    const current = currentEnemyById(id)
    if (!root.current || !current) return
    const now = simClock.now()
    const frameDelta = Math.min(delta, 0.1)
    const t = clock.elapsedTime
    root.current.position.x = MathUtils.damp(root.current.position.x, current.x, 16, frameDelta)
    root.current.position.z = MathUtils.damp(root.current.position.z, current.z, 6, frameDelta)
    root.current.rotation.y = MathUtils.damp(root.current.rotation.y, current.direction > 0 ? Math.PI / 2 : -Math.PI / 2, 14, frameDelta)

    const dead = current.animation === 'dead'
    const deadProgress = dead ? Math.min(1, (now - current.deadAt) / 700) : 0
    const winding = current.windupUntil > now
    const walking = current.animation === 'walk'
    const attacking = current.animation === 'attack' && !winding
    // Queens drop from the gantry on a cable; drones just scuttle in.
    const drop = queen ? Math.max(0, 1 - (now - current.spawnedAt) / 1_400) : 0

    if (body.current) {
      body.current.position.y = 0.66 + drop * 6 + (walking ? Math.abs(Math.sin(t * 16)) * 0.04 : 0) - deadProgress * 0.3
      body.current.rotation.x = attacking ? -0.35 : winding ? 0.18 + Math.sin(t * 40) * 0.04 : 0
      body.current.rotation.z = dead ? deadProgress * 2.6 : 0
      body.current.position.x = attacking ? 0.2 : 0
    }
    // The wing cases part while winding up and snap shut on the strike.
    const open = winding ? 0.55 : attacking ? 0.15 : 0
    if (leftCase.current) leftCase.current.rotation.z = MathUtils.damp(leftCase.current.rotation.z, open + deadProgress * 1.4, 14, frameDelta)
    if (rightCase.current) rightCase.current.rotation.z = MathUtils.damp(rightCase.current.rotation.z, -open - deadProgress * 1.8, 14, frameDelta)
    legs.current.forEach((leg, index) => {
      const side = index < 3 ? 1 : -1
      const phase = (index % 3) * 2.1 + (side > 0 ? 0 : Math.PI)
      leg.rotation.z = side * ((walking ? Math.sin(t * 16 + phase) * 0.3 : 0) + deadProgress * 0.8)
      leg.rotation.y = walking ? Math.cos(t * 16 + phase) * 0.3 : 0
    })
    pincers.current.forEach((pincer, index) => {
      pincer.rotation.y = (index ? -1 : 1) * (winding ? 0.7 : attacking ? -0.1 : 0.35)
    })

    const flashing = performance.now() - hitAt.current < HIT_FLASH_MS && !useSettingsStore.getState().reduceFlashes
    if (flashing) shell.emissive.copy(WHITE)
    else if (winding) shell.emissive.copy(useSettingsStore.getState().colorSafeTelegraphs ? SAFE : RED)
    else shell.emissive.setRGB(0, 0, 0)
    shell.emissiveIntensity = flashing ? 1.2 : winding ? 0.4 + Math.sin(t * 26) * 0.3 : 0
    eyes.color.set(dead ? '#1a0806' : winding ? '#ffe070' : '#ff3b1f')
    glow.opacity = dead ? Math.max(0, 0.85 - deadProgress) : 0.55 + Math.sin(t * 5) * 0.25
    root.current.visible = deadProgress < 1 || now - current.deadAt < 1_400
    // The rig is authored at unit size; machines stand a head shorter than creatures.
    root.current.scale.setScalar(current.scale * 0.72 * (1 - deadProgress * 0.25))
  })

  if (!enemy) return null
  const kind = enemy.kind
  return (
    <group ref={root} position={[initialX, 0, enemy.z]} scale={enemy.scale * 0.72} name={enemy.title}>
      <group ref={body}>
        <mesh geometry={SHELL} material={shell} scale={[0.95, 0.62, 1.35]} />
        <mesh ref={leftCase} geometry={HALF_SHELL} material={shell} position={[0.02, 0.1, 0]} rotation={[0, Math.PI / 2, 0]} scale={[0.99, 0.66, 1.4]} />
        <mesh ref={rightCase} geometry={HALF_SHELL} material={shell} position={[-0.02, 0.1, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[0.99, 0.66, 1.4]} />
        <mesh geometry={HEAD} material={metal} position={[0, 0.02, 0.66]} scale={[1.1, 0.8, 1]} />
        <mesh geometry={EYE} material={eyes} position={[0.1, 0.07, 0.84]} />
        <mesh geometry={EYE} material={eyes} position={[-0.1, 0.07, 0.84]} />
        {queen || kind === 3 ? <mesh geometry={CORE} material={glow} position={[0, 0.3, -0.1]} rotation={[Math.PI / 2, 0, 0]} scale={queen ? 1.6 : 1} /> : null}
        {kind === 2 || queen ? [1, -1].map((side, index) => (
          <mesh key={side} ref={(mesh) => { if (mesh) pincers.current[index] = mesh }} geometry={PINCER} material={metal} position={[side * 0.16, -0.02, 0.88]} rotation={[Math.PI / 2, 0, 0]} />
        )) : null}
        {kind === 4 ? (
          <group position={[0, 0.34, 0]}>
            <mesh geometry={BARREL} material={metal} rotation={[Math.PI / 2.4, 0, 0]} position={[0, 0.08, 0.1]} />
            <mesh geometry={EYE} material={glow} position={[0, 0.22, 0.4]} scale={1.4} />
          </group>
        ) : null}
        {kind === 5 ? <mesh geometry={EYE} material={glow} position={[0, 0.1, 0.9]} scale={2.2} /> : null}
        {[0, 1, 2, 3, 4, 5].map((index) => {
          const side = index < 3 ? 1 : -1
          const row = index % 3
          return (
            <group key={index} ref={(group) => { if (group) legs.current[index] = group }} position={[side * 0.36, -0.08, 0.38 - row * 0.38]}>
              <mesh geometry={LEG} material={metal} position={[side * 0.26, -0.26, 0]} rotation={[0, 0, side * 0.72]} />
            </group>
          )
        })}
      </group>
    </group>
  )
}
