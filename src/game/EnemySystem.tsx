import { EnemyActor } from './EnemyActor'
import { useSessionStore } from '../store/sessionStore'
import { EvilJackBossActor } from './EvilJackBossActor'
import { AkuBossActor } from './AkuBossActor'

export function EnemySystem() {
  const enemies = useSessionStore((state) => state.enemies)
  return <>{enemies.map((enemy) => enemy.bossType === 'shadow'
    ? <EvilJackBossActor id={enemy.id} key={enemy.id} />
    : enemy.bossType === 'aku'
      ? <AkuBossActor id={enemy.id} key={enemy.id} />
      : <EnemyActor id={enemy.id} key={enemy.id} />)}</>
}
