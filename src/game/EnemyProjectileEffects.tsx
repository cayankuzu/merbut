import { useSessionStore } from '../store/sessionStore'
import { EnemyProjectileVisual } from './EnemyProjectileVisual'

export function EnemyProjectileEffects() {
  const projectiles = useSessionStore((state) => state.enemyProjectiles)
  return <>{projectiles.map((projectile) => (
    <group key={projectile.id} position={[projectile.x, projectile.y, 0]}>
      <EnemyProjectileVisual kind={projectile.kind} travelled={projectile.travelled} />
    </group>
  ))}</>
}
