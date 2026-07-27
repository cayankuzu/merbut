import { useMemo } from 'react'
import { Color, Float32BufferAttribute, PlaneGeometry } from 'three'
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

function createGroundGeometry() {
  const geometry = new PlaneGeometry(GROUND_WIDTH, GROUND_DEPTH, 336, 56)
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

      {HORIZON_BANDS.map((band) => (
        <mesh key={band.id} position={[band.x, groundHeight + 0.04, -12.2]} receiveShadow>
          <boxGeometry args={[BIOME_WORLD_WIDTH + 0.25, 0.42, 1.65]} />
          <meshStandardMaterial color={band.color} roughness={1} />
        </mesh>
      ))}

      {HORIZON_RIDGES.map((ridge) => (
        <mesh
          key={ridge.id}
          position={[
            ridge.x,
            groundHeight + ridge.height * (ridge.pointed ? 0.4 : 0.23),
            -11.5,
          ]}
          rotation={[0, ridge.rotation, 0.05]}
          scale={ridge.pointed
            ? [ridge.width * 0.58, ridge.height * 0.86, 1.05]
            : [ridge.width, ridge.height * 0.52, 1.35]}
          castShadow
          receiveShadow
        >
          {ridge.pointed ? (
            <coneGeometry args={[0.72, 1.7, 5]} />
          ) : (
            <dodecahedronGeometry args={[0.72, 0]} />
          )}
          <meshStandardMaterial color={ridge.color} flatShading roughness={0.96} />
        </mesh>
      ))}

      {PATH_SLABS.map((slab) => (
        <mesh
          key={slab.id}
          position={[slab.x, groundHeight - 0.012, slab.z]}
          rotation={[0, slab.rotation, 0]}
          receiveShadow
        >
          <boxGeometry args={[slab.width, 0.075, 3.45]} />
          <meshStandardMaterial color={slab.color} roughness={0.86} metalness={0.07} />
        </mesh>
      ))}

      {CRACKS.map((crack) => (
        <mesh
          key={crack.id}
          position={[crack.x, groundHeight + 0.012, crack.z]}
          rotation={[0, crack.rotation, 0]}
        >
          <boxGeometry args={[crack.length, 0.012, 0.022]} />
          <meshBasicMaterial color="#38242c" transparent opacity={0.68} />
        </mesh>
      ))}

      {ROCKS.map((rock) => (
        <mesh
          key={rock.id}
          position={[rock.x, groundHeight + rock.y, rock.z]}
          rotation={[0.12, rock.rotation, -0.08]}
          scale={[rock.size, rock.size * 1.35, rock.size * 0.9]}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[0.72, 0]} />
          <meshStandardMaterial color={rock.color} flatShading roughness={0.87} metalness={0.13} />
        </mesh>
      ))}

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
          <pointLight position={[-1.25, 2.55, 1]} color={gate.fromColor} intensity={3.2} distance={5} />
          <pointLight position={[1.25, 2.55, 1]} color={gate.toColor} intensity={3.2} distance={5} />
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
