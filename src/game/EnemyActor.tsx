import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { AnimationMixer, Group, LoopRepeat, MathUtils, Object3D, type AnimationAction } from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { useShallow } from 'zustand/react/shallow'
import { prepareAnimationClip } from '../animation/animationLoader'
import { validateClipTargets } from '../animation/animationRetargeting'
import { ENEMIES } from '../config/enemies'
import { useSessionStore } from '../store/sessionStore'
import { PERFORMANCE_PROFILES, runtimeAnimationFps, usePerformanceStore } from '../store/performanceStore'
import { WorldHealthBar } from './WorldHealthBar'
import { currentEnemyById, enemyById } from './enemyLookup'

interface EnemyActorProps {
  id: string
}

type EnemyActionName = 'walk' | 'attack'
type EnemyActions = Record<EnemyActionName, AnimationAction>

function configureEnemyShadows(root: Object3D, enabled: boolean) {
  root.traverse((node) => {
    if ('isMesh' in node && node.isMesh) {
      const mesh = node as Object3D & { castShadow: boolean; receiveShadow: boolean }
      mesh.castShadow = enabled
      mesh.receiveShadow = enabled
    }
  })
}

export function EnemyActor({ id }: EnemyActorProps) {
  const enemy = useSessionStore(useShallow((state) => {
    const current = enemyById(state.enemies, id)
    return current ? {
      kind: current.kind, title: current.title, animation: current.animation, scale: current.scale,
      health: current.health, maxHealth: current.maxHealth, accent: current.accent, boss: current.boss,
    } : null
  }))
  const initialX = useMemo(() => currentEnemyById(id)?.x ?? 0, [id])
  const root = useRef<Group>(null)
  const modelRoot = useRef<Group>(null)
  const animationAccumulator = useRef(0)
  const tier = usePerformanceStore((state) => state.tier)
  const qualityFactor = usePerformanceStore((state) => state.qualityFactor)
  const profile = PERFORMANCE_PROFILES[tier]
  const animationFps = runtimeAnimationFps(tier, qualityFactor)
  const definition = ENEMIES[enemy?.kind ?? 1]
  const walkFile = useGLTF(definition.walk)
  const attackFile = useGLTF(definition.attack)
  const scene = useMemo(() => SkeletonUtils.clone(walkFile.scene), [walkFile.scene])
  const clips = useMemo(() => [
    validateClipTargets(scene, prepareAnimationClip(walkFile.animations[0], 'walk')),
    validateClipTargets(scene, prepareAnimationClip(attackFile.animations[0], 'attack')),
  ], [attackFile.animations, scene, walkFile.animations])
  const mixer = useMemo(() => new AnimationMixer(scene), [scene])
  const actions = useMemo<EnemyActions>(() => ({
    walk: mixer.clipAction(clips[0]!),
    attack: mixer.clipAction(clips[1]!),
  }), [clips, mixer])
  const activeAction = useRef<EnemyActionName | null>(null)
  const actionsPrimed = useRef(false)

  useLayoutEffect(() => configureEnemyShadows(scene, profile.shadows), [profile.shadows, scene])

  // Keep both clips registered with the mixer for the life of this actor. Calling
  // play() after an action has been faded out can make Three's internal binding
  // cache inconsistent when React mounts/unmounts distant actors under load.
  // Switching weights is allocation-free and never re-lends a PropertyBinding.
  useEffect(() => {
    Object.values(actions).forEach((action) => {
      action.enabled = true
      action.paused = false
      action.clampWhenFinished = false
      action.setLoop(LoopRepeat, Infinity)
      action.reset().play()
      action.setEffectiveWeight(0)
    })
    actions.walk.setEffectiveWeight(1)
    actionsPrimed.current = true
    activeAction.current = null

    return () => {
      actionsPrimed.current = false
      activeAction.current = null
      mixer.stopAllAction()
    }
  }, [actions, mixer])

  const animation = enemy?.animation

  useEffect(() => {
    if (!actionsPrimed.current) return
    if (!animation || animation === 'dead') {
      actions.walk.setEffectiveWeight(0)
      actions.attack.setEffectiveWeight(0)
      actions.walk.paused = true
      actions.attack.paused = true
      activeAction.current = null
      return
    }

    const nextName: EnemyActionName = animation === 'attack' ? 'attack' : 'walk'
    const next = actions[nextName]
    const changed = activeAction.current !== nextName
    const attackDuration = clips.find((clip) => clip.name === 'attack')?.duration ?? 1

    if (changed) next.reset()
    actions.walk.timeScale = 1.05
    actions.attack.timeScale = attackDuration / 0.82
    actions.walk.enabled = true
    actions.attack.enabled = true
    actions.walk.setEffectiveWeight(nextName === 'walk' ? 1 : 0)
    actions.attack.setEffectiveWeight(nextName === 'attack' ? 1 : 0)
    actions.walk.paused = nextName !== 'walk' || animation === 'idle'
    actions.attack.paused = nextName !== 'attack'
    if (animation === 'idle') actions.walk.time = 0
    activeAction.current = nextName
  }, [actions, animation, clips])

  useFrame((_, delta) => {
    const current = currentEnemyById(id)
    if (!root.current || !current) return
    root.current.position.x = MathUtils.damp(root.current.position.x, current.x, 16, Math.min(delta, 0.1))
    const targetRotation = current.direction > 0 ? Math.PI / 2 : -Math.PI / 2
    root.current.rotation.y = MathUtils.damp(root.current.rotation.y, targetRotation, 14, Math.min(delta, 0.1))
    if (modelRoot.current) {
      const deadProgress = current.animation === 'dead' ? Math.min(1, (performance.now() - current.deadAt) / 900) : 0
      modelRoot.current.rotation.z = MathUtils.damp(modelRoot.current.rotation.z, -deadProgress * 1.28, 8, delta)
      modelRoot.current.position.y = -deadProgress * 0.48
      modelRoot.current.scale.setScalar(current.scale * (1 - deadProgress * 0.32))
    }
    if (current.animation !== 'dead') {
      animationAccumulator.current += Math.min(delta, 0.1)
      if (animationAccumulator.current >= 1 / animationFps) {
        mixer.update(animationAccumulator.current)
        animationAccumulator.current = 0
      }
    }
  })

  if (!enemy) return null
  return (
    <group ref={root} position={[initialX, 0, 0]} name={enemy.title}>
      <group ref={modelRoot} scale={enemy.scale}>
        <primitive object={scene} />
      </group>
      {enemy.animation !== 'dead' && !enemy.boss ? (
        <group position={[0, enemy.scale * 1.9, 0]}>
          <WorldHealthBar label={enemy.title} health={enemy.health} maxHealth={enemy.maxHealth} accent={enemy.accent} />
        </group>
      ) : null}
    </group>
  )
}
