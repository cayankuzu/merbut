import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, Mesh, MeshBasicMaterial } from 'three'
import { useGameStore } from '../store/gameStore'
import { AliFlameTrailVisual } from './AliFlameTrailVisual'
import { ALI_FLAME_ARCS } from './heroCombatGeometry'

export function AliFlameEffect() {
  const root = useRef<Group>(null)
  const arcs = useRef<Mesh[]>([])
  const materials = useRef<MeshBasicMaterial[]>([])
  const elapsed = useRef(2)
  const previousAttack = useRef(useGameStore.getState().attackSequences.ali)
  const warmupFrame = useRef(0)

  useFrame((_, delta) => {
    if (warmupFrame.current < 2) {
      warmupFrame.current += 1
      if (warmupFrame.current === 2 && root.current) root.current.visible = false
      return
    }
    const game = useGameStore.getState()
    const attack = game.attackSequences.ali
    if (attack > previousAttack.current && root.current) {
      const [x, y] = game.positions.ali
      const rotation = game.rotations.ali
      root.current.position.set(x + Math.cos(rotation) * 1.3, y + 0.36, -Math.sin(rotation) * 1.3)
      root.current.rotation.set(0, rotation, 0)
      root.current.scale.setScalar(1)
      root.current.visible = true
      elapsed.current = 0
    }
    previousAttack.current = attack
    if (!root.current || elapsed.current > 1) return
    elapsed.current += Math.min(delta, 0.1)
    const progress = Math.min(1, elapsed.current)
    const envelope = Math.sin(Math.PI * Math.min(1, progress * 1.12))
    arcs.current.forEach((arc, index) => {
      arc.scale.setScalar(ALI_FLAME_ARCS[index]!.scale * (0.72 + progress * 0.66))
      arc.position.y = ALI_FLAME_ARCS[index]!.position[1] + progress * 0.22
      materials.current[index]!.opacity = envelope * (0.9 - index * 0.13)
    })
    if (progress >= 1) root.current.visible = false
  })

  return (
    <group ref={root} visible scale={0.0001} name="ali-sword-flame-trail">
      <AliFlameTrailVisual arcs={arcs} materials={materials} />
    </group>
  )
}
