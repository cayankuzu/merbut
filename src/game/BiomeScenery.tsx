import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Group, PointsMaterial } from 'three'
import { BIOMES, BIOME_WORLD_WIDTH, WORLD_VISUAL_LEFT } from '../config/biomes'
import { runtimeParticleRatio, usePerformanceStore } from '../store/performanceStore'

const centers = BIOMES.map((_, index) => WORLD_VISUAL_LEFT + index * BIOME_WORLD_WIDTH + BIOME_WORLD_WIDTH / 2)

function particles(count: number, seed: number) {
  const values = new Float32Array(count * 3)
  for (let index = 0; index < count; index += 1) {
    values[index * 3] = (Math.sin(index * 71.3 + seed) * 0.5 + 0.5) * (BIOME_WORLD_WIDTH - 3) - (BIOME_WORLD_WIDTH - 3) / 2
    values[index * 3 + 1] = (Math.sin(index * 19.7 + seed * 2) * 0.5 + 0.5) * 6.8 + 0.3
    values[index * 3 + 2] = Math.cos(index * 43.1) * 3 - 2
  }
  return values
}

export function BiomeScenery() {
  const weather = useRef<Group>(null)
  const weatherMaterials = useRef<PointsMaterial[]>([])
  const tier = usePerformanceStore((state) => state.tier)
  const qualityFactor = usePerformanceStore((state) => state.qualityFactor)
  const particleRatio = runtimeParticleRatio(tier, qualityFactor)
  const particleSets = useMemo(() => BIOMES.map((_, index) => particles(Math.round((58 + index * 6) * particleRatio), index + 1)), [particleRatio])

  useFrame(({ clock }, delta) => {
    if (weather.current) {
      weather.current.children.forEach((child, index) => {
        child.position.y -= delta * ([0.25, 4.8, -0.12, 0.42, 0.04, 0.85, -1.4][index] ?? 0.2)
        const limit = index === 1 ? -7 : -2.5
        if (child.position.y < limit) child.position.y = index === 1 ? 8 : 2
        child.rotation.z = Math.sin(clock.elapsedTime * 0.16 + index) * 0.018
      })
    }
    weatherMaterials.current.forEach((material, index) => {
      material.opacity = 0.28 + Math.sin(clock.elapsedTime * (0.55 + index * 0.08) + index) * 0.08
    })
  })

  return (
    <group name="unique-biome-scenery">
      <group position={[centers[0], 0, -8.7]} name="aku-machinery">
        {[-13, -7, 1, 8, 14].map((x, index) => <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 2.1 + index % 2, 0]} castShadow><cylinderGeometry args={[0.3, 0.62, 4.2 + index % 2 * 2, 5]} /><meshStandardMaterial color="#190c17" metalness={0.62} roughness={0.38} /></mesh>
          <mesh position={[0, 3.1 + index % 2, 0.35]}><boxGeometry args={[0.32, 1.1, 0.16]} /><meshStandardMaterial color="#ff286f" emissive="#ff1458" emissiveIntensity={3} /></mesh>
          <mesh position={[0, 4.5 + index % 2, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.75, 0.11, 5, 12]} /><meshStandardMaterial color="#421226" metalness={0.8} /></mesh>
        </group>)}
      </group>

      <group position={[centers[1], 0, -8.4]} name="sunset-harbor-rig">
        {[-13, -4, 6, 14].map((x, index) => <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 2.4, 0]}><boxGeometry args={[0.34, 4.8, 0.42]} /><meshStandardMaterial color="#241e21" metalness={0.48} /></mesh>
          <mesh position={[index % 2 ? -1.3 : 1.3, 4.65, 0]} rotation={[0, 0, index % 2 ? 0.22 : -0.22]}><boxGeometry args={[3, 0.28, 0.34]} /><meshStandardMaterial color="#322529" /></mesh>
          <mesh position={[index % 2 ? -2.55 : 2.55, 3.5, 0]}><cylinderGeometry args={[0.025, 0.025, 2.2, 5]} /><meshStandardMaterial color="#171316" /></mesh>
        </group>)}
      </group>

      <group position={[centers[2], 0, -7.8]} name="golden-swamp-grove">
        {[-14, -9, -3, 4, 10, 15].map((x, index) => <group key={x} position={[x, 0, 0]} rotation={[0, 0, Math.sin(index * 4) * 0.2]}>
          <mesh position={[0, 2.1, 0]}><cylinderGeometry args={[0.25, 0.58, 4.2, 6]} /><meshStandardMaterial color="#242817" roughness={1} /></mesh>
          <mesh position={[-0.8, 3.5, 0]} rotation={[0, 0, 0.7]}><cylinderGeometry args={[0.1, 0.24, 2.3, 5]} /><meshStandardMaterial color="#242817" /></mesh>
          <mesh position={[0.9, 3.25, 0]} rotation={[0, 0, -0.78]}><cylinderGeometry args={[0.08, 0.22, 2, 5]} /><meshStandardMaterial color="#242817" /></mesh>
        </group>)}
        {[-11, -2, 8, 14].map((x) => <mesh key={x} position={[x, 0.025, -0.5]} rotation={[Math.PI / 2, 0, 0]} scale={[1.8, 1, 1]}><circleGeometry args={[1.2, 24]} /><meshStandardMaterial color="#9b952d" emissive="#7a791e" emissiveIntensity={0.45} metalness={0.25} roughness={0.3} /></mesh>)}
      </group>

      <group position={[centers[3], 0, -8.1]} name="skull-island-arches">
        {[-12, -2, 9].map((x, index) => <group key={x} position={[x, 0, 0]} scale={1 + index * 0.12}>
          <mesh position={[-1.25, 1.8, 0]} rotation={[0, 0, -0.15]}><coneGeometry args={[0.55, 3.8, 5]} /><meshStandardMaterial color="#1b2817" flatShading /></mesh>
          <mesh position={[1.25, 1.8, 0]} rotation={[0, 0, 0.15]}><coneGeometry args={[0.55, 3.8, 5]} /><meshStandardMaterial color="#1b2817" flatShading /></mesh>
          <mesh position={[0, 3.5, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[1.35, 0.34, 5, 12, Math.PI]} /><meshStandardMaterial color="#314329" roughness={.9} /></mesh>
        </group>)}
      </group>

      <group position={[centers[4], 0, -8.5]} name="jade-temple">
        {[-13, -5, 5, 13].map((x, index) => <group key={x} position={[x, 0, 0]}>
          <mesh position={[-1.15, 1.75, 0]}><boxGeometry args={[0.38, 3.5, 0.55]} /><meshStandardMaterial color="#143a31" roughness={.78} /></mesh>
          <mesh position={[1.15, 1.75, 0]}><boxGeometry args={[0.38, 3.5, 0.55]} /><meshStandardMaterial color="#143a31" roughness={.78} /></mesh>
          <mesh position={[0, 3.28, 0]} rotation={[0, 0, index % 2 ? .04 : -.04]}><boxGeometry args={[3.2, 0.3, 0.7]} /><meshStandardMaterial color="#245f4c" roughness={.72} /></mesh>
          <mesh position={[0, 3.72, 0]}><boxGeometry args={[2.45, 0.18, 0.55]} /><meshStandardMaterial color="#39ff91" emissive="#1ca75d" emissiveIntensity={.7} /></mesh>
        </group>)}
      </group>

      <group position={[centers[5], 0, -8.1]} name="bone-field">
        {[-15, -10, -4, 3, 9, 15].map((x, index) => <group key={x} position={[x, 0, 0]} rotation={[0, 0, Math.sin(index) * .13]}>
          <mesh position={[0, 1.9, 0]}><cylinderGeometry args={[.12, .2, 3.8, 7]} /><meshStandardMaterial color="#c5d6d0" roughness={.95} /></mesh>
          {[0, 1, 2].map((branch) => <mesh key={branch} position={[(branch - 1) * .42, 2.5 + branch * .36, 0]} rotation={[0, 0, (branch - 1) * .72]}><coneGeometry args={[.18, 1.4, 5]} /><meshStandardMaterial color="#d5e0d7" /></mesh>)}
          <mesh position={[0, .38, .2]}><dodecahedronGeometry args={[.5, 0]} /><meshStandardMaterial color="#354b55" emissive="#194454" emissiveIntensity={.5} /></mesh>
        </group>)}
      </group>

      <group position={[centers[6], 0, -7.8]} name="inferno-fortress">
        {[-15, -10, 10, 15].map((x) => <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 3, 0]}><cylinderGeometry args={[.72, 1.15, 6, 6]} /><meshStandardMaterial color="#180706" metalness={.52} roughness={.55} /></mesh>
          <mesh position={[0, 5.4, .2]}><octahedronGeometry args={[.7, 0]} /><meshStandardMaterial color="#ff4a12" emissive="#ff2700" emissiveIntensity={4} /></mesh>
        </group>)}
        {[-12, -7, -2, 3, 8, 13].map((x) => <mesh key={x} position={[x, .035, -.5]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[.14, 4.8]} /><meshBasicMaterial color="#ff5b13" transparent opacity={.82} toneMapped={false} /></mesh>)}
      </group>

      <group ref={weather} name="biome-weather">
        {BIOMES.map((biome, index) => <points key={biome.id} position={[centers[index], 0, 0]} rotation={[0, 0, index === 1 ? -.2 : 0]}>
          <bufferGeometry><bufferAttribute attach="attributes-position" args={[particleSets[index], 3]} /></bufferGeometry>
          <pointsMaterial ref={(material) => { if (material) weatherMaterials.current[index] = material }} color={biome.weather === 'rain' ? '#b7d7e8' : biome.weather === 'snow' ? '#e8fbff' : biome.accentColor} size={biome.weather === 'rain' ? .065 : biome.weather === 'mist' ? .18 : .075} transparent opacity={.3} depthWrite={false} blending={biome.weather === 'firestorm' || biome.weather === 'embers' ? AdditiveBlending : undefined} sizeAttenuation />
        </points>)}
      </group>
    </group>
  )
}
