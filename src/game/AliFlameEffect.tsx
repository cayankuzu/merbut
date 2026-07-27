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
  const previousAnimation = useRef(useGameStore.getState().animationStates.ali)

  useFrame((_, delta) => {
    const game = useGameStore.getState()
    const animation = game.animationStates.ali
    if (animation === 'attack' && previousAnimation.current !== 'attack' && root.current) {
      const [x, y] = game.positions.ali
      const rotation = game.rotations.ali
      root.current.position.set(x + Math.cos(rotation) * 1.3, y + 0.36, -Math.sin(rotation) * 1.3)
      root.current.rotation.set(0, rotation, 0)
      root.current.visible = true
      elapsed.current = 0
    }
    previousAnimation.current = animation
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
    <group ref={root} visible={false} name="ali-sword-flame-trail">
      <AliFlameTrailVisual arcs={arcs} materials={materials} />
    </group>
  )
}
