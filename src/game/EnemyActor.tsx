import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Group, LoopOnce, LoopRepeat, MathUtils, Object3D } from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { useShallow } from 'zustand/react/shallow'
import { prepareAnimationClip } from '../animation/animationLoader'
import { validateClipTargets } from '../animation/animationRetargeting'
import { ENEMIES } from '../config/enemies'
import { useSessionStore } from '../store/sessionStore'
import { WorldHealthBar } from './WorldHealthBar'

interface EnemyActorProps {
  id: string
}

function enableEnemyShadows(root: Object3D) {
  root.traverse((node) => {
    if ('isMesh' in node && node.isMesh) {
      const mesh = node as Object3D & { castShadow: boolean; receiveShadow: boolean }
      mesh.castShadow = true
      mesh.receiveShadow = true
    }
  })
}

export function EnemyActor({ id }: EnemyActorProps) {
  const enemy = useSessionStore(useShallow((state) => {
    const current = state.enemies.find((candidate) => candidate.id === id)
    return current ? {
      kind: current.kind, title: current.title, animation: current.animation, scale: current.scale,
      health: current.health, maxHealth: current.maxHealth, accent: current.accent, boss: current.boss,
    } : null
  }))
  const initialX = useMemo(() => useSessionStore.getState().enemies.find((candidate) => candidate.id === id)?.x ?? 0, [id])
  const root = useRef<Group>(null)
  const modelRoot = useRef<Group>(null)
  const definition = ENEMIES[enemy?.kind ?? 1]
  const walkFile = useGLTF(definition.walk)
  const attackFile = useGLTF(definition.attack)
  const scene = useMemo(() => SkeletonUtils.clone(walkFile.scene), [walkFile.scene])
  const clips = useMemo(() => [
    validateClipTargets(scene, prepareAnimationClip(walkFile.animations[0], 'walk')),
    validateClipTargets(scene, prepareAnimationClip(attackFile.animations[0], 'attack')),
  ], [attackFile.animations, scene, walkFile.animations])
  const { actions } = useAnimations(clips, scene)

  useLayoutEffect(() => enableEnemyShadows(scene), [scene])

  const animation = enemy?.animation

  useEffect(() => {
    if (!animation || animation === 'dead') {
      actions.walk?.fadeOut(0.18)
      actions.attack?.fadeOut(0.18)
      return
    }
    const action = actions[animation === 'idle' ? 'walk' : animation]
    if (!action) return
    if (animation === 'idle') {
      action.enabled = true
      action.reset().play()
      action.time = 0
      action.paused = true
      actions.attack?.fadeOut(0.12)
      return
    }
    action.paused = false
    const attackDuration = clips.find((clip) => clip.name === 'attack')?.duration ?? 1
    action.enabled = true
    action.clampWhenFinished = animation === 'attack'
    action.setLoop(animation === 'walk' ? LoopRepeat : LoopOnce, animation === 'walk' ? Infinity : 1)
    action.timeScale = animation === 'attack' ? attackDuration / 0.82 : 1.05
    action.reset().fadeIn(0.12).play()
    const other = animation === 'walk' ? actions.attack : actions.walk
    other?.fadeOut(0.12)
  }, [actions, animation, clips])

  useFrame((_, delta) => {
    const current = useSessionStore.getState().enemies.find((candidate) => candidate.id === id)
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
  })

  if (!enemy) return null
  return (
    <group ref={root} position={[initialX, 0, 0]} name={enemy.title}>
      <group ref={modelRoot} scale={enemy.scale}>
        <primitive object={scene} />
      </group>
      {enemy.animation !== 'dead' && !enemy.boss ? (
        <group position={[0, 2.55, 0]}>
          <WorldHealthBar label={enemy.title} health={enemy.health} maxHealth={enemy.maxHealth} accent={enemy.accent} />
        </group>
      ) : null}
    </group>
  )
}
