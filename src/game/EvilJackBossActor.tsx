import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, MathUtils } from 'three'
import { useShallow } from 'zustand/react/shallow'
import { EvilJackCharacter, type EvilJackAction } from '../characters/EvilJackCharacter'
import { useSessionStore } from '../store/sessionStore'
import { currentEnemyById, enemyById } from './enemyLookup'

interface EvilJackBossActorProps { id: string }

export function EvilJackBossActor({ id }: EvilJackBossActorProps) {
  const enemy = useSessionStore(useShallow((state) => {
    const current = enemyById(state.enemies, id)
    return current ? { animation: current.animation, special: current.special, title: current.title } : null
  }))
  const initialX = useMemo(() => currentEnemyById(id)?.x ?? 0, [id])
  const bossPhase = useSessionStore((state) => state.bossPhase)
  const root = useRef<Group>(null)
  const modelRoot = useRef<Group>(null)
  const actionName: EvilJackAction = enemy?.animation === 'dead'
    ? 'dead'
    : enemy?.animation === 'idle'
      ? 'walk'
    : bossPhase === 'arrival'
      ? 'cast'
      : enemy?.special === 'meteor'
        ? 'cast'
        : enemy?.special === 'combo-triple'
          ? 'triple'
          : enemy?.special === 'combo-double'
            ? 'double'
            : enemy?.animation === 'attack'
              ? 'slash'
              : 'run'

  useFrame((_, delta) => {
    const current = currentEnemyById(id)
    if (!root.current || !modelRoot.current || !current) return
    root.current.position.x = MathUtils.damp(root.current.position.x, current.x, 16, Math.min(delta, 0.1))
    root.current.rotation.y = MathUtils.damp(root.current.rotation.y, current.direction > 0 ? Math.PI / 2 : -Math.PI / 2, 14, Math.min(delta, 0.1))
    const arrivalScale = bossPhase === 'offering' || bossPhase === 'drinking' ? 0 : 1
    const targetScale = current.scale * arrivalScale * (current.animation === 'dead' ? 0.86 : 1)
    modelRoot.current.scale.setScalar(MathUtils.damp(modelRoot.current.scale.x, targetScale, 7, delta))
  })

  if (!enemy) return null
  return (
    <group ref={root} position={[initialX, 0, 0]} name={enemy.title}>
      <group ref={modelRoot} scale={0}><EvilJackCharacter action={actionName} shadows={false} /></group>
    </group>
  )
}
