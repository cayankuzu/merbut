import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, Mesh, MeshBasicMaterial } from 'three'
import { useGameStore } from '../store/gameStore'
import { JACK_SLASHES } from './heroCombatGeometry'
import { JackSlashVisual } from './JackSlashVisual'

export function JackSlashEffect() {
  const group = useRef<Group>(null)
  const slashMeshes = useRef<Mesh[]>([])
  const slashMaterials = useRef<MeshBasicMaterial[]>([])
  const elapsed = useRef(2)
  const previousAnimation = useRef(useGameStore.getState().animationStates.jack)

  useFrame((_, delta) => {
    const game = useGameStore.getState()
    const animation = game.animationStates.jack
    if (animation === 'attack' && previousAnimation.current !== 'attack' && group.current) {
      const [x, y] = game.positions.jack
      const rotation = game.rotations.jack
      group.current.position.set(
        x + Math.cos(rotation) * 1.5,
        y + 1.35,
        -Math.sin(rotation) * 1.5 + 0.18,
      )
      group.current.rotation.set(0, rotation, 0)
      group.current.visible = true
      elapsed.current = 0
    }
    previousAnimation.current = animation

    if (!group.current || elapsed.current > 1) return
    elapsed.current += Math.min(delta, 0.1)
    const progress = Math.min(1, elapsed.current)
    const reveal = Math.min(1, progress / 0.14)
    const opacity = reveal * Math.pow(1 - progress, 1.7)
    group.current.scale.setScalar(0.78 + progress * 0.48)

    for (let index = 0; index < JACK_SLASHES.length; index += 1) {
      const material = slashMaterials.current[index]
      const mesh = slashMeshes.current[index]
      if (material) material.opacity = opacity * (1 - index * 0.19)
      if (mesh) mesh.position.x = (index - 1) * 0.16 + progress * 0.28
    }
    if (progress >= 1) group.current.visible = false
  })

  return (
    <group ref={group} visible={false} name="jack-white-slash">
      <JackSlashVisual meshes={slashMeshes} materials={slashMaterials} />
    </group>
  )
}
