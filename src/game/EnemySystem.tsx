import { EnemyActor } from './EnemyActor'
import { useSessionStore } from '../store/sessionStore'
import { EvilJackBossActor } from './EvilJackBossActor'
import { AkuBossActor } from './AkuBossActor'
import { useShallow } from 'zustand/react/shallow'

export function EnemySystem() {
  const actors = useSessionStore(useShallow((state) => state.enemies.map((enemy) => `${enemy.id}|${enemy.bossType ?? 'enemy'}`)))
  return <>{actors.map((actor) => {
    const [id, bossType] = actor.split('|')
    return bossType === 'shadow'
      ? <EvilJackBossActor id={id} key={id} />
      : bossType === 'aku'
        ? <AkuBossActor id={id} key={id} />
        : <EnemyActor id={id} key={id} />
  })}</>
}
