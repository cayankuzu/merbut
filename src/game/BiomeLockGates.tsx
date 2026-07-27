import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, MathUtils } from 'three'
import { BIOMES, BIOME_WORLD_WIDTH, WORLD_VISUAL_LEFT } from '../config/biomes'
import { useSessionStore } from '../store/sessionStore'
import { getBiomeGateX } from './biomeProgress'

const depths = [-2.2, -1.1, 0, 1.1, 2.2] as const
const NO_DAMAGE_DATA = { damagesPlayer: false } as const

export function BiomeLockGates() {
  const gates = useRef<Group[]>([])
  useFrame((_, delta) => {
    const session = useSessionStore.getState()
    const currentBiome = session.currentBiome
    const finalArenaOpen = session.phase === 'final-intro' || session.enemies.some((enemy) => enemy.bossType === 'aku' && enemy.animation !== 'dead')
    gates.current.forEach((gate, index) => {
      const opened = finalArenaOpen || (currentBiome === index && session.lockedRight >= getBiomeGateX(index))
      const target = opened ? -4.2 : 0
      gate.position.y = MathUtils.damp(gate.position.y, target, 7.5, Math.min(delta, .05))
    })
  })
  return (
    <group name="sealed-biome-gates">
      {BIOMES.slice(0, -1).map((biome, index) => (
        <group
          key={biome.id}
          position={[WORLD_VISUAL_LEFT + (index + 1) * BIOME_WORLD_WIDTH, -4.2, 0]}
          name={`zarar-vermeyen-diken-kapisi-${index + 1}`}
          userData={NO_DAMAGE_DATA}
          ref={(group) => { if (group) gates.current[index] = group }}
        >
          <mesh position={[0, 2, 0]}>
            <boxGeometry args={[0.3, 4.5, 5.8]} />
            <meshStandardMaterial color="#090205" emissive={BIOMES[index + 1].accentColor} emissiveIntensity={0.18} transparent opacity={0.72} />
          </mesh>
          {depths.map((z, spike) => <mesh key={z} position={[0, 1.8 + spike % 2 * .34, z]} rotation={[0, 0, spike % 2 ? .08 : -.08]} castShadow>
            <coneGeometry args={[.58, 4.4 + spike % 2 * .55, 5]} />
            <meshStandardMaterial color="#18090c" emissive={index % 2 ? '#52120e' : '#311020'} emissiveIntensity={.45} metalness={.38} roughness={.55} />
          </mesh>)}
          <pointLight position={[0, 2.2, 1]} color={BIOMES[index + 1].accentColor} intensity={8} distance={7} />
        </group>
      ))}
    </group>
  )
}
