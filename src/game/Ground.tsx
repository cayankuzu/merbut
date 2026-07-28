import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  BoxGeometry,
  Color,
  ConeGeometry,
  DodecahedronGeometry,
  Float32BufferAttribute,
  InstancedMesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
} from 'three'
import {
  BIOMES,
  BIOME_WORLD_WIDTH,
  WORLD_VISUAL_LEFT,
  WORLD_VISUAL_RIGHT,
  getBiomeBlend,
} from '../config/biomes'
import { GAME_CONFIG } from '../config/gameConfig'
import { useDebugStore } from '../store/debugStore'
import { FollowingContactShadows } from './FollowingContactShadows'

const GROUND_MARGIN = 7
const GROUND_WIDTH = WORLD_VISUAL_RIGHT - WORLD_VISUAL_LEFT + GROUND_MARGIN * 2
const GROUND_CENTER = (WORLD_VISUAL_LEFT + WORLD_VISUAL_RIGHT) * 0.5
const GROUND_DEPTH = 42
const PATH_STEP = 3.35
const END_DEPTHS = [-2.4, 0, 2.4] as const

const PATH_SLABS = Array.from(
  { length: Math.ceil(GROUND_WIDTH / PATH_STEP) },
  (_, index) => {
    const x = WORLD_VISUAL_LEFT - GROUND_MARGIN + 1.7 + index * PATH_STEP
    const blend = getBiomeBlend(x)
    return {
      id: `slab-${index}`,
      x,
      z: Math.sin(index * 1.31) * 0.13,
      rotation: Math.sin(index * 2.17) * 0.055,
      width: 3.12 + ((index * 17) % 7) * 0.045,
      color: new Color(blend.from.groundLight)
        .lerp(new Color(blend.to.groundLight), blend.mix)
        .multiplyScalar(0.88)
        .getStyle(),
    }
  },
)

const CRACKS = Array.from({ length: 72 }, (_, index) => ({
  id: `crack-${index}`,
  x: WORLD_VISUAL_LEFT + 1.2 + index * 2.92,
  z: (index % 2 === 0 ? 1 : -1) * (1.85 + ((index * 11) % 9) * 0.16),
  length: 0.55 + ((index * 7) % 8) * 0.09,
  rotation: Math.sin(index * 2.43) * 0.72,
}))

const ROCKS = Array.from({ length: 54 }, (_, index) => {
  const x = WORLD_VISUAL_LEFT + 1.8 + index * 3.92
  const blend = getBiomeBlend(x)
  const size = 0.48 + ((index * 13) % 9) * 0.055
  return {
    id: `rock-${index}`,
    x,
    y: size * 0.52,
    z: -6.5 - ((index * 19) % 11) * 0.34,
    size,
    rotation: Math.sin(index * 1.91) * 1.3,
    color: new Color(blend.from.horizonColor)
      .lerp(new Color(blend.to.horizonColor), blend.mix)
      .offsetHSL(0, 0.03, 0.035)
      .getStyle(),
  }
})

const HORIZON_RIDGES = Array.from({ length: 48 }, (_, index) => {
  const x = WORLD_VISUAL_LEFT - 1.5 + index * 4.65
  const blend = getBiomeBlend(x)
  return {
    id: `ridge-${index}`,
    x,
    height: 1.4 + ((index * 23) % 13) * 0.17,
    width: 2.2 + ((index * 7) % 8) * 0.18,
    rotation: Math.sin(index * 2.2) * 0.22,
    pointed: index % 5 === 0,
    color: new Color(blend.from.horizonColor)
      .lerp(new Color(blend.to.horizonColor), blend.mix)
      .getStyle(),
  }
})

const BIOME_GATES = BIOMES.slice(0, -1).map((biome, index) => {
  const next = BIOMES[index + 1]
  return {
    id: `${biome.id}-${next.id}`,
    x: WORLD_VISUAL_LEFT + (index + 1) * BIOME_WORLD_WIDTH,
    fromColor: biome.accentColor,
    toColor: next.accentColor,
  }
})

const HORIZON_BANDS = BIOMES.map((biome, index) => ({
  id: `horizon-${biome.id}`,
  x: WORLD_VISUAL_LEFT + index * BIOME_WORLD_WIDTH + BIOME_WORLD_WIDTH * 0.5,
  color: biome.horizonColor,
}))

const WORLD_ENDS = [
  { id: 'world-start', x: WORLD_VISUAL_LEFT + 0.8, rotation: -0.14 },
  { id: 'world-end', x: WORLD_VISUAL_RIGHT - 0.8, rotation: 0.14 },
] as const

interface StaticInstance {
  color?: string
  position: [number, number, number]
  rotation?: [number, number, number]
  scale: [number, number, number]
}

interface StaticInstancesProps {
  castShadow?: boolean
  instances: readonly StaticInstance[]
  kind: 'box-basic' | 'box-standard' | 'cone-standard' | 'rock-standard'
  metalness?: number
  opacity?: number
  receiveShadow?: boolean
  roughness?: number
}

function StaticInstances({
  castShadow = false,
  instances,
  kind,
  metalness = 0,
  opacity = 1,
  receiveShadow = false,
  roughness = 1,
}: StaticInstancesProps) {
  const mesh = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const geometry = useMemo(() => {
    if (kind === 'cone-standard') return new ConeGeometry(0.72, 1.7, 5)
    if (kind === 'rock-standard') return new DodecahedronGeometry(0.72, 0)
    return new BoxGeometry(1, 1, 1)
  }, [kind])
  const material = useMemo(() => kind === 'box-basic'
    ? new MeshBasicMaterial({ color: '#38242c', opacity, transparent: opacity < 1, vertexColors: true })
    : new MeshStandardMaterial({ color: '#ffffff', flatShading: true, metalness, roughness, vertexColors: true }),
  [kind, metalness, opacity, roughness])

  useLayoutEffect(() => {
    const target = mesh.current
    if (!target) return
    instances.forEach((instance, index) => {
      dummy.position.set(...instance.position)
      dummy.rotation.set(...(instance.rotation ?? [0, 0, 0]))
      dummy.scale.set(...instance.scale)
      dummy.updateMatrix()
      target.setMatrixAt(index, dummy.matrix)
      if (instance.color) target.setColorAt(index, new Color(instance.color))
    })
    target.instanceMatrix.needsUpdate = true
    if (target.instanceColor) target.instanceColor.needsUpdate = true
    target.computeBoundingSphere()
  }, [dummy, instances])

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, material, instances.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    />
  )
}

function createGroundGeometry() {
  const geometry = new PlaneGeometry(GROUND_WIDTH, GROUND_DEPTH, 168, 28)
  const positions = geometry.attributes.position
  const colors: number[] = []
  const fromDark = new Color()
  const toDark = new Color()
  const fromLight = new Color()
  const toLight = new Color()
  const dark = new Color()
  const light = new Color()
  const color = new Color()

  for (let index = 0; index < positions.count; index += 1) {
    const localX = positions.getX(index)
    const worldX = localX + GROUND_CENTER
    const depth = positions.getY(index)
    const broadNoise = Math.sin(worldX * 0.39 + depth * 0.27) * 0.5 + 0.5
    const fineNoise = Math.sin(worldX * 1.61 - depth * 1.13) * 0.5 + 0.5
    const pathMask = Math.max(0, 1 - Math.abs(depth + 1) / 6.2)
    const blend = getBiomeBlend(worldX)
    const height =
      (broadNoise - 0.5) * 0.055 +
      (fineNoise - 0.5) * 0.018 +
      Math.max(0, -depth - 9) * 0.018

    positions.setZ(index, height)
    fromDark.set(blend.from.groundDark)
    toDark.set(blend.to.groundDark)
    fromLight.set(blend.from.groundLight)
    toLight.set(blend.to.groundLight)
    dark.lerpColors(fromDark, toDark, blend.mix)
    light.lerpColors(fromLight, toLight, blend.mix)
    color.copy(dark).lerp(light, 0.24 + broadNoise * 0.22 + pathMask * 0.22)
    color.offsetHSL(0, fineNoise * 0.025, (fineNoise - 0.5) * 0.035)
    colors.push(color.r, color.g, color.b)
  }

  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
  return geometry
}

export function Ground() {
  const groundHeight = useDebugStore((state) => state.groundHeight)
  const groundGeometry = useMemo(createGroundGeometry, [])
  const horizonBandInstances = useMemo<StaticInstance[]>(() => HORIZON_BANDS.map((band) => ({
    color: band.color,
    position: [band.x, groundHeight + 0.04, -12.2],
    scale: [BIOME_WORLD_WIDTH + 0.25, 0.42, 1.65],
  })), [groundHeight])
  const pointedRidgeInstances = useMemo<StaticInstance[]>(() => HORIZON_RIDGES
    .filter((ridge) => ridge.pointed)
    .map((ridge) => ({
      color: ridge.color,
      position: [ridge.x, groundHeight + ridge.height * 0.4, -11.5],
      rotation: [0, ridge.rotation, 0.05],
      scale: [ridge.width * 0.58, ridge.height * 0.86, 1.05],
    })), [groundHeight])
  const roundedRidgeInstances = useMemo<StaticInstance[]>(() => HORIZON_RIDGES
    .filter((ridge) => !ridge.pointed)
    .map((ridge) => ({
      color: ridge.color,
      position: [ridge.x, groundHeight + ridge.height * 0.23, -11.5],
      rotation: [0, ridge.rotation, 0.05],
      scale: [ridge.width, ridge.height * 0.52, 1.35],
    })), [groundHeight])
  const pathInstances = useMemo<StaticInstance[]>(() => PATH_SLABS.map((slab) => ({
    color: slab.color,
    position: [slab.x, groundHeight - 0.012, slab.z],
    rotation: [0, slab.rotation, 0],
    scale: [slab.width, 0.075, 3.45],
  })), [groundHeight])
  const crackInstances = useMemo<StaticInstance[]>(() => CRACKS.map((crack) => ({
    position: [crack.x, groundHeight + 0.012, crack.z],
    rotation: [0, crack.rotation, 0],
    scale: [crack.length, 0.012, 0.022],
  })), [groundHeight])
  const rockInstances = useMemo<StaticInstance[]>(() => ROCKS.map((rock) => ({
    color: rock.color,
    position: [rock.x, groundHeight + rock.y, rock.z],
    rotation: [0.12, rock.rotation, -0.08],
    scale: [rock.size, rock.size * 1.35, rock.size * 0.9],
  })), [groundHeight])

  return (
    <group name="procedural-biome-world">
      <mesh
        name="visible-ground"
        geometry={groundGeometry}
        position={[GROUND_CENTER, groundHeight - 0.055, -1]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <meshStandardMaterial vertexColors flatShading roughness={0.91} metalness={0.06} />
      </mesh>

      <StaticInstances instances={horizonBandInstances} kind="box-standard" receiveShadow roughness={1} />
      <StaticInstances instances={pointedRidgeInstances} kind="cone-standard" castShadow receiveShadow roughness={0.96} />
      <StaticInstances instances={roundedRidgeInstances} kind="rock-standard" castShadow receiveShadow roughness={0.96} />
      <StaticInstances instances={pathInstances} kind="box-standard" receiveShadow roughness={0.86} metalness={0.07} />
      <StaticInstances instances={crackInstances} kind="box-basic" opacity={0.68} />
      <StaticInstances instances={rockInstances} kind="rock-standard" castShadow receiveShadow roughness={0.87} metalness={0.13} />

      {BIOME_GATES.map((gate) => (
        <group key={gate.id} position={[gate.x, groundHeight, -9.6]}>
          <mesh position={[-1.3, 2.1, 0]} rotation={[0, 0, -0.1]} castShadow>
            <cylinderGeometry args={[0.28, 0.52, 4.2, 5]} />
            <meshStandardMaterial color="#16151c" flatShading roughness={0.73} metalness={0.24} />
          </mesh>
          <mesh position={[1.3, 2.1, 0]} rotation={[0, 0, 0.1]} castShadow>
            <cylinderGeometry args={[0.28, 0.52, 4.2, 5]} />
            <meshStandardMaterial color="#16151c" flatShading roughness={0.73} metalness={0.24} />
          </mesh>
          <mesh position={[0, 4.18, 0]} scale={[2.9, 0.34, 0.38]} castShadow>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#211d27" flatShading roughness={0.7} metalness={0.28} />
          </mesh>
          <mesh position={[-1.25, 2.6, 0.45]}>
            <octahedronGeometry args={[0.18, 0]} />
            <meshStandardMaterial color={gate.fromColor} emissive={gate.fromColor} emissiveIntensity={3} />
          </mesh>
          <mesh position={[1.25, 2.6, 0.45]}>
            <octahedronGeometry args={[0.18, 0]} />
            <meshStandardMaterial color={gate.toColor} emissive={gate.toColor} emissiveIntensity={3} />
          </mesh>
        </group>
      ))}

      {WORLD_ENDS.map((end) => (
        <group key={end.id} position={[end.x, groundHeight, -0.4]} rotation={[0, end.rotation, 0]}>
          {END_DEPTHS.map((z, index) => (
            <mesh
              key={`${end.id}-${z}`}
              position={[0, 2.1 + index * 0.28, z]}
              rotation={[0.08, 0, index % 2 === 0 ? -0.08 : 0.08]}
              castShadow
            >
              <coneGeometry args={[0.72, 4.5 + index * 0.45, 5]} />
              <meshStandardMaterial color="#17151d" flatShading roughness={0.78} metalness={0.2} />
            </mesh>
          ))}
        </group>
      ))}

      <mesh
        name="ground-collider"
        position={[(GAME_CONFIG.world.left + GAME_CONFIG.world.right) * 0.5, groundHeight - 0.03, 0]}
        visible={false}
      >
        <boxGeometry args={[GAME_CONFIG.world.right - GAME_CONFIG.world.left, 0.06, 6]} />
        <meshBasicMaterial />
      </mesh>

      <FollowingContactShadows groundHeight={groundHeight} />
    </group>
  )
}
