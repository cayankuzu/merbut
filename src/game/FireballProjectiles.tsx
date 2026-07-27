import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import { useShallow } from 'zustand/react/shallow'
import { useSessionStore } from '../store/sessionStore'
import { FireballVisual } from './FireballVisual'

function FireballActor({ id }: { id: string }) {
  const root = useRef<Group>(null)
  const initial = useSessionStore.getState().projectiles.find((projectile) => projectile.id === id)
  useFrame(() => {
    const projectile = useSessionStore.getState().projectiles.find((candidate) => candidate.id === id)
    if (!root.current || !projectile) return
    root.current.position.set(projectile.x, projectile.y, projectile.z)
  })
  if (!initial) return null
  return <group ref={root} position={[initial.x, initial.y, initial.z]}><FireballVisual directionX={initial.directionX} directionZ={initial.directionZ} /></group>
}

export function FireballProjectiles() {
  const projectileIds = useSessionStore(useShallow((state) => state.projectiles.map((projectile) => projectile.id)))
  return <>{projectileIds.map((id) => <FireballActor id={id} key={id} />)}</>
}
