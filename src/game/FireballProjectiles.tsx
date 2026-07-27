import { useSessionStore } from '../store/sessionStore'
import { FireballVisual } from './FireballVisual'

export function FireballProjectiles() {
  const projectiles = useSessionStore((state) => state.projectiles)
  return (
    <>
      {projectiles.map((projectile) => (
        <group key={projectile.id} position={[projectile.x, projectile.y, projectile.z]}>
          <FireballVisual directionX={projectile.directionX} directionZ={projectile.directionZ} />
        </group>
      ))}
    </>
  )
}
