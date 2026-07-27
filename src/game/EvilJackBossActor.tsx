import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Group, LoopOnce, LoopRepeat, MathUtils, Object3D } from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { prepareAnimationClip } from '../animation/animationLoader'
import { validateClipTargets } from '../animation/animationRetargeting'
import { ASSET_PATHS } from '../config/assetPaths'
import { CHARACTER_TRANSFORMS } from '../config/characterTransforms'
import { useSessionStore } from '../store/sessionStore'
import { attachWeapon, updateWeaponSocket, type WeaponAttachment } from '../characters/WeaponSocket'

interface EvilJackBossActorProps { id: string }

function enableShadows(root: Object3D) {
  root.traverse((node) => {
    if ('isMesh' in node && node.isMesh) {
      const mesh = node as Object3D & { castShadow: boolean; receiveShadow: boolean }
      mesh.castShadow = true
      mesh.receiveShadow = true
    }
  })
}

export function EvilJackBossActor({ id }: EvilJackBossActorProps) {
  const enemy = useSessionStore((state) => state.enemies.find((candidate) => candidate.id === id))
  const bossPhase = useSessionStore((state) => state.bossPhase)
  const assets = ASSET_PATHS.bosses.evilJack
  const walkFile = useGLTF(assets.walk)
  const runFile = useGLTF(assets.run)
  const slashFile = useGLTF(assets.slash)
  const doubleFile = useGLTF(assets.doubleCombo)
  const tripleFile = useGLTF(assets.tripleCombo)
  const castFile = useGLTF(assets.cast)
  const hitFile = useGLTF(assets.hit)
  const swordFile = useGLTF(ASSET_PATHS.jack.sword)
  const root = useRef<Group>(null)
  const modelRoot = useRef<Group>(null)
  const attachment = useRef<WeaponAttachment | null>(null)
  const scene = useMemo(() => SkeletonUtils.clone(walkFile.scene), [walkFile.scene])
  const sword = useMemo(() => swordFile.scene.clone(true), [swordFile.scene])
  const clips = useMemo(() => [
    validateClipTargets(scene, prepareAnimationClip(walkFile.animations[0], 'walk')),
    validateClipTargets(scene, prepareAnimationClip(runFile.animations[0], 'run')),
    validateClipTargets(scene, prepareAnimationClip(slashFile.animations[0], 'slash')),
    validateClipTargets(scene, prepareAnimationClip(doubleFile.animations[0], 'double')),
    validateClipTargets(scene, prepareAnimationClip(tripleFile.animations[0], 'triple')),
    validateClipTargets(scene, prepareAnimationClip(castFile.animations[0], 'cast')),
    validateClipTargets(scene, prepareAnimationClip(hitFile.animations[0], 'dead')),
  ], [castFile.animations, doubleFile.animations, hitFile.animations, runFile.animations, scene, slashFile.animations, tripleFile.animations, walkFile.animations])
  const { actions } = useAnimations(clips, scene)
  const actionName = enemy?.animation === 'dead'
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

  useLayoutEffect(() => {
    enableShadows(scene)
    enableShadows(sword)
    attachment.current = attachWeapon(scene, sword, CHARACTER_TRANSFORMS.jack.weapon)
    return () => { attachment.current?.detach(); attachment.current = null }
  }, [scene, sword])

  useEffect(() => {
    const action = actions[actionName]
    if (!action) return
    const looping = actionName === 'run' || actionName === 'walk'
    action.enabled = true
    action.paused = false
    action.clampWhenFinished = !looping
    action.setLoop(looping ? LoopRepeat : LoopOnce, looping ? Infinity : 1)
    action.reset().fadeIn(0.12).play()
    if (actionName === 'walk') {
      action.time = 0
      action.paused = true
    }
    Object.entries(actions).forEach(([name, candidate]) => { if (name !== actionName) candidate?.fadeOut(0.12) })
  }, [actionName, actions])

  useFrame((_, delta) => {
    const current = useSessionStore.getState().enemies.find((candidate) => candidate.id === id)
    if (!root.current || !modelRoot.current || !current) return
    root.current.position.x = MathUtils.damp(root.current.position.x, current.x, 16, Math.min(delta, 0.05))
    root.current.rotation.y = MathUtils.damp(root.current.rotation.y, current.direction > 0 ? Math.PI / 2 : -Math.PI / 2, 14, Math.min(delta, 0.05))
    const arrivalScale = bossPhase === 'offering' || bossPhase === 'drinking' ? 0 : 1
    const targetScale = current.scale * arrivalScale * (current.animation === 'dead' ? 0.86 : 1)
    modelRoot.current.scale.setScalar(MathUtils.damp(modelRoot.current.scale.x, targetScale, 7, delta))
    if (attachment.current) updateWeaponSocket(attachment.current, actionName !== 'run', delta)
  })

  if (!enemy) return null
  return (
    <group ref={root} position={[enemy.x, 0, 0]} name={enemy.title}>
      <group ref={modelRoot} scale={0}><primitive object={scene} /></group>
    </group>
  )
}
