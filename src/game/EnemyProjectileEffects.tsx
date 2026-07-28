import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import { useShallow } from 'zustand/react/shallow'
import { useSessionStore } from '../store/sessionStore'
import { EnemyProjectileVisual } from './EnemyProjectileVisual'
import { currentEnemyProjectileById } from './projectileLookup'

function EnemyProjectileActor({ id }: { id: string }) {
  const root = useRef<Group>(null)
  const initial = currentEnemyProjectileById(id)
  useFrame(() => {
    const projectile = currentEnemyProjectileById(id)
    if (!root.current || !projectile) return
    root.current.position.set(projectile.x, projectile.y, 0)
    root.current.rotation.z = projectile.travelled * (projectile.kind === 'time-portal' ? 1.8 : 0.7)
  })
  if (!initial) return null
  return <group ref={root} position={[initial.x, initial.y, 0]}><EnemyProjectileVisual kind={initial.kind} /></group>
}

export function EnemyProjectileEffects() {
  const projectileIds = useSessionStore(useShallow((state) => state.enemyProjectiles.map((projectile) => projectile.id)))
  return <>{projectileIds.map((id) => <EnemyProjectileActor id={id} key={id} />)}</>
}
