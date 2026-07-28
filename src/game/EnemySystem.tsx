import { useEffect, useMemo, useRef, useState } from 'react'
import { EnemyActor } from './EnemyActor'
import { useSessionStore } from '../store/sessionStore'
import { EvilJackBossActor } from './EvilJackBossActor'
import { AkuBossActor } from './AkuBossActor'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '../store/gameStore'
import { PERFORMANCE_PROFILES, usePerformanceStore } from '../store/performanceStore'
import { CrowdEnemyProxies } from './CrowdEnemyProxies'
import { buildEnemyRenderPlan, runtimeFullEnemyActorLimit } from './enemyRenderPlan'
import { EnemyHealthBars } from './EnemyHealthBars'

export function EnemySystem() {
  const roster = useSessionStore(useShallow((state) => state.enemies.map((enemy) => `${enemy.id}|${enemy.bossType ?? 'enemy'}`)))
  const tier = usePerformanceStore((state) => state.tier)
  const qualityFactor = usePerformanceStore((state) => state.qualityFactor)
  const mountDistance = PERFORMANCE_PROFILES[tier].actorMountDistance
  const enemyCount = roster.length
  const fullActorLimit = runtimeFullEnemyActorLimit(tier, qualityFactor, enemyCount)
  const [visibilityTick, setVisibilityTick] = useState(0)
  const stickyFullActors = useRef<string[]>([])

  useEffect(() => {
    const timer = window.setInterval(() => setVisibilityTick((tick) => tick + 1), 500)
    return () => window.clearInterval(timer)
  }, [])

  const renderPlan = useMemo(() => {
    void roster
    void visibilityTick
    const cameraX = useGameStore.getState().cameraX
    const enemies = useSessionStore.getState().enemies
    const plan = buildEnemyRenderPlan(enemies, cameraX, mountDistance, tier, stickyFullActors.current, fullActorLimit)
    stickyFullActors.current = plan.fullActorIds
    const bossTypes = new Map(enemies.map((enemy) => [enemy.id, enemy.bossType]))
    return {
      actorKeys: plan.fullActorIds.map((id) => `${id}|${bossTypes.get(id) ?? 'enemy'}`),
      healthBarIds: plan.fullActorIds.filter((id) => !bossTypes.get(id)),
      proxyIds: plan.proxyIds,
    }
  }, [fullActorLimit, mountDistance, roster, tier, visibilityTick])

  return <>{renderPlan.actorKeys.map((actor) => {
    const [id, bossType] = actor.split('|')
    return bossType === 'shadow'
      ? <EvilJackBossActor id={id} key={id} />
      : bossType === 'aku'
        ? <AkuBossActor id={id} key={id} />
        : <EnemyActor id={id} key={id} />
  })}<EnemyHealthBars ids={renderPlan.healthBarIds} /><CrowdEnemyProxies ids={renderPlan.proxyIds} /></>
}
