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
  const previousAttack = useRef(useGameStore.getState().attackSequences.jack)
  const warmupFrame = useRef(0)

  useFrame((_, delta) => {
    if (warmupFrame.current < 2) {
      warmupFrame.current += 1
      if (warmupFrame.current === 2 && group.current) group.current.visible = false
      return
    }
    const game = useGameStore.getState()
    const attack = game.attackSequences.jack
    if (attack > previousAttack.current && group.current) {
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
    previousAttack.current = attack

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
    <group ref={group} visible scale={0.0001} name="jack-white-slash">
      <JackSlashVisual meshes={slashMeshes} materials={slashMaterials} />
    </group>
  )
}
