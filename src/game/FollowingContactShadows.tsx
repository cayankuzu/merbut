import { useRef } from 'react'
import { ContactShadows } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import { useGameStore } from '../store/gameStore'

interface FollowingContactShadowsProps {
  groundHeight: number
}

export function FollowingContactShadows({ groundHeight }: FollowingContactShadowsProps) {
  const group = useRef<Group>(null)

  useFrame(() => {
    if (group.current) group.current.position.x = useGameStore.getState().cameraX
  })

  return (
    <group ref={group}>
      <ContactShadows
        position={[0, groundHeight + 0.028, 0]}
        scale={32}
        opacity={0.42}
        blur={2.1}
        far={5.8}
        resolution={512}
        color="#111017"
      />
    </group>
  )
}
