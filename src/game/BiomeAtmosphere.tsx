import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  Group,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  OctahedronGeometry,
} from 'three'
import { biomeAtmosphere } from '../config/biomeAtmosphere'
import { BIOMES, BIOME_WORLD_WIDTH, WORLD_VISUAL_LEFT, getBiomeBlend } from '../config/biomes'
import { useGameStore } from '../store/gameStore'
import { PERFORMANCE_PROFILES, runtimeParticleRatio, usePerformanceStore } from '../store/performanceStore'
import { useSessionStore } from '../store/sessionStore'

const MOTIFS_PER_BIOME = 12
const HIDDEN_SCALE = 0.0001

interface Motif {
  biomeIndex: number
  localIndex: number
  x: number
  y: number
  z: number
  size: number
  phase: number
  color: string
}

const MOTIFS: readonly Motif[] = BIOMES.flatMap((biome, biomeIndex) =>
  Array.from({ length: MOTIFS_PER_BIOME }, (_, localIndex) => {
    const seed = (localIndex + 1) * (biomeIndex + 3)
    return {
      biomeIndex,
      localIndex,
      x: WORLD_VISUAL_LEFT + biomeIndex * BIOME_WORLD_WIDTH + 2.5 + ((Math.sin(seed * 13.17) * 0.5 + 0.5) * (BIOME_WORLD_WIDTH - 5)),
      y: 0.8 + (Math.sin(seed * 7.91) * 0.5 + 0.5) * 5.6,
      z: -4.5 - (localIndex % 4) * 0.7,
      size: 0.055 + (localIndex % 4) * 0.022,
      phase: seed * 0.73,
      color: biome.accentColor,
    }
  }),
)

function isCinematicPhase() {
  const session = useSessionStore.getState()
  return session.phase === 'boss-intro' || session.phase === 'final-intro' || session.phase === 'ending'
}

function MotifField() {
  const mesh = useRef<InstancedMesh>(null)
  const geometry = useMemo(() => new OctahedronGeometry(1, 0), [])
  const material = useMemo(() => new MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.82, depthWrite: false, blending: AdditiveBlending, toneMapped: false }), [])
  const dummy = useMemo(() => new Object3D(), [])
  const colors = useMemo(() => MOTIFS.map((motif) => new Color(motif.color).lerp(new Color('#fff6d4'), 0.18)), [])
  const tier = usePerformanceStore((state) => state.tier)
  const qualityFactor = usePerformanceStore((state) => state.qualityFactor)
  const accumulator = useRef(0)

  useLayoutEffect(() => {
    const instance = mesh.current
    if (!instance) return
    instance.instanceMatrix.setUsage(DynamicDrawUsage)
    instance.castShadow = false
    instance.receiveShadow = false
    instance.frustumCulled = false
    MOTIFS.forEach((_, index) => instance.setColorAt(index, colors[index]!))
    if (instance.instanceColor) instance.instanceColor.needsUpdate = true
  }, [colors])

  useFrame(({ clock }, rawDelta) => {
    const profile = PERFORMANCE_PROFILES[tier]
    accumulator.current += Math.min(rawDelta, 0.1)
    if (accumulator.current < 1 / Math.max(10, profile.animationFps)) return
    accumulator.current = 0
    const instance = mesh.current
    if (!instance) return
    const cameraX = useGameStore.getState().cameraX
    const cinematic = isCinematicPhase()
    const motifBudget = Math.max(1, Math.ceil(MOTIFS_PER_BIOME * runtimeParticleRatio(tier, qualityFactor)))
    const now = clock.elapsedTime

    MOTIFS.forEach((motif, index) => {
      const style = biomeAtmosphere(BIOMES[motif.biomeIndex]!)
      const visible = motif.localIndex < motifBudget && Math.abs(motif.x - cameraX) < 27
      if (!visible) {
        dummy.scale.setScalar(HIDDEN_SCALE)
      } else {
        const drift = Math.sin(now * style.driftSpeed + motif.phase)
        const lift = Math.cos(now * (style.driftSpeed * 0.58 + 0.14) + motif.phase) * style.motifLift
        const scale = motif.size * (cinematic ? 1.24 : 1)
        dummy.position.set(motif.x + drift * 0.24, motif.y + lift, motif.z)
        dummy.rotation.set(drift * 0.42, 0, now * style.motifSpin + motif.phase)
        dummy.scale.setScalar(scale)
      }
      dummy.updateMatrix()
      instance.setMatrixAt(index, dummy.matrix)
    })
    instance.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={mesh} args={[geometry, material, MOTIFS.length]} name="biome-atmosphere-motifs" />
}

function CinematicGroundPulse() {
  const root = useRef<Group>(null)
  const outer = useRef<MeshBasicMaterial>(null)
  const inner = useRef<MeshBasicMaterial>(null)
  const tier = usePerformanceStore((state) => state.tier)
  const paleColor = useMemo(() => new Color('#fff1c0'), [])

  useFrame(({ clock }, delta) => {
    const rootNode = root.current
    if (!rootNode || !outer.current || !inner.current) return
    const profile = PERFORMANCE_PROFILES[tier]
    const session = useSessionStore.getState()
    const visible = (session.phase === 'boss-intro' || session.phase === 'final-intro' || session.phase === 'ending') && profile.particleRatio > 0.14
    rootNode.visible = visible
    if (!visible) return
    const blend = getBiomeBlend(useGameStore.getState().cameraX)
    const color = blend.mix > 0.5 ? blend.to.accentColor : blend.from.accentColor
    const terminal = session.bossPhase === 'portal' || session.bossPhase === 'falling'
    const pulse = 0.88 + Math.sin(clock.elapsedTime * (terminal ? 5.2 : 2.2)) * (terminal ? 0.16 : 0.07)
    rootNode.position.set(useGameStore.getState().cameraX, 0.045, -0.7)
    rootNode.rotation.y += delta * (terminal ? 1.45 : 0.42)
    rootNode.scale.setScalar(pulse * (terminal ? 1.35 : 1))
    outer.current.color.set(color)
    inner.current.color.copy(outer.current.color).lerp(paleColor, 0.36)
    outer.current.opacity = terminal ? 0.38 : 0.22
    inner.current.opacity = terminal ? 0.72 : 0.45
  })

  return (
    <group ref={root} name="boss-cinematic-ground-pulse" visible={false}>
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.25, 1.25, 1]}>
        <ringGeometry args={[2.5, 2.72, 48]} />
        <meshBasicMaterial ref={outer} color="#ff5b72" transparent opacity={0} side={DoubleSide} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[0.82, 0.82, 1]}>
        <ringGeometry args={[2.1, 2.16, 40]} />
        <meshBasicMaterial ref={inner} color="#fff0c0" transparent opacity={0} side={DoubleSide} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** Shared, low-poly art-direction layer. It adds no assets and remains under
 * three draw calls regardless of enemy count or number of biomes. */
export function BiomeAtmosphere() {
  return (
    <group name="adaptive-biome-atmosphere">
      <MotifField />
      <CinematicGroundPulse />
    </group>
  )
}
