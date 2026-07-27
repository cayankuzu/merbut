import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Group, MeshBasicMaterial } from 'three'
import { useGameStore } from '../store/gameStore'
import { useSessionStore } from '../store/sessionStore'
import type { CharacterId } from '../types/character'

const ids: CharacterId[] = ['ali', 'jack']

export function PlayerDeathEffects() {
  const groups = useRef<Group[]>([])
  const materials = useRef<MeshBasicMaterial[]>([])
  const previousDead = useRef({ ali: false, jack: false })
  const elapsed = useRef([2, 2])
  const modes = useRef<('fall' | 'revive')[]>(['fall', 'fall'])

  useFrame((_, delta) => {
    const session = useSessionStore.getState()
    const game = useGameStore.getState()
    ids.forEach((id, index) => {
      const dead = session.players[id].dead
      if (dead !== previousDead.current[id]) {
        const group = groups.current[index]
        if (group) {
          const [x, y] = game.positions[id]
          group.position.set(x, y + 1.25, 0)
          group.visible = true
          group.scale.setScalar(.25)
        }
        elapsed.current[index] = 0
        modes.current[index] = dead ? 'fall' : 'revive'
        previousDead.current[id] = dead
      }
      const group = groups.current[index]
      if (!group || elapsed.current[index] > 1.15) return
      elapsed.current[index] += delta
      const progress = Math.min(1, elapsed.current[index] / 1.15)
      const envelope = Math.sin(progress * Math.PI)
      group.rotation.y += delta * (modes.current[index] === 'fall' ? 3 : -3)
      group.scale.setScalar(modes.current[index] === 'fall' ? .25 + progress * 2.3 : 2.2 - progress * 1.7)
      const material = materials.current[index]
      if (material) material.opacity = envelope * .85
      if (progress >= 1) group.visible = false
    })
  })

  return <>{ids.map((id, index) => (
    <group key={id} ref={(group) => { if (group) groups.current[index] = group }} visible={false}>
      <pointLight color={id === 'ali' ? '#ff6b16' : '#85eaff'} intensity={7} distance={5} />
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[.7, .055, 8, 40]} />
        <meshBasicMaterial ref={(material) => { if (material) materials.current[index] = material }} color={id === 'ali' ? '#ff7b20' : '#b8f5ff'} transparent opacity={0} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
      </mesh>
      {Array.from({ length: 9 }, (_, shard) => <mesh key={shard} position={[Math.cos(shard * .7) * .65, Math.sin(shard * 1.3) * .5, Math.sin(shard * .7) * .65]} rotation={[shard, shard * .4, shard * .7]}>
        <octahedronGeometry args={[.09 + shard % 3 * .025, 0]} />
        <meshBasicMaterial color={id === 'ali' ? '#ffad32' : '#d8fbff'} transparent opacity={.8} toneMapped={false} />
      </mesh>)}
    </group>
  ))}</>
}
