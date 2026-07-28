import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import { AnimatedCharacter } from '../characters/AnimatedCharacter'
import { CHARACTERS } from '../config/gameConfig'
import type { AnimationState } from '../types/animation'
import type { CharacterId } from '../types/character'

interface RotatingCharacterPreviewProps {
  animationState?: AnimationState
  id: CharacterId
  initialRotation?: number
  rotate?: boolean
}

export function RotatingCharacterPreview({ animationState = 'idle', id, initialRotation = Math.PI, rotate = true }: RotatingCharacterPreviewProps) {
  const root = useRef<Group>(null)
  useFrame((state, delta) => {
    if (!root.current) return
    if (rotate) root.current.rotation.y += delta * 0.52
    root.current.position.y = -1.32 + Math.sin(state.clock.elapsedTime * 1.45) * 0.025
  })
  return (
    <group ref={root} position={[0, -1.32, 0]} rotation={[0, initialRotation, 0]}>
      <AnimatedCharacter continuousFaceLight={rotate} definition={CHARACTERS[id]} animationState={animationState} />
    </group>
  )
}
