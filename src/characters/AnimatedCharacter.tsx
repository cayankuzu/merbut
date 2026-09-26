import { useLayoutEffect, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { AnimationClip, MathUtils, Object3D, Quaternion, Vector3 } from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { prepareAnimationClip } from '../animation/animationLoader'
import { validateClipTargets } from '../animation/animationRetargeting'
import { useCharacterAnimations } from '../hooks/useCharacterAnimations'
import { useDebugStore } from '../store/debugStore'
import { runtimeDynamicShadows, usePerformanceStore } from '../store/performanceStore'
import { useSessionStore } from '../store/sessionStore'
import type { AnimationState } from '../types/animation'
import type { CharacterDefinition } from '../types/character'
import { measureBlade, registerBlade, type BladeKey } from '../game/vfx/bladeRegistry'
import { AliFaceLight } from './AliFaceLight'
import { polishBlade, swordEnvironment } from './swordShine'
import {
  alignWeaponAttachment,
  attachWeapon,
  findTorsoBone,
  findWeaponBodyGuard,
  keepWeaponOutsideBody,
  keepWeaponOutsideTorso,
  placeWeaponGripInPalm,
  updateWeaponSocket,
  type WeaponAttachment,
} from './WeaponSocket'

const ALI_PALM_REACH = 0.48
/** Resting guard: at ease, Zülfikar's tip sinks this far below the horizon. */
const REST_ELEVATION = MathUtils.degToRad(-36)
const UP = new Vector3(0, 1, 0)
const restAxis = new Vector3()
const restDirection = new Vector3()
const restRotation = new Quaternion()
const parentRotation = new Quaternion()

interface AnimatedCharacterProps {
  continuousFaceLight?: boolean
  definition: CharacterDefinition
  animationState: AnimationState
  /** Replays the current combat clip without changing gameplay animation state. */
  animationSignal?: number
  /** Optional presentation duration; gameplay callers keep their normal rates. */
  animationDurationSeconds?: number
  /** Gameplay heroes publish their blade so the sword trail can follow it. */
  bladeId?: BladeKey
}

function configureShadows(root: Object3D, enabled: boolean) {
  root.traverse((node) => {
    if ('isMesh' in node && node.isMesh) {
      const mesh = node as Object3D & { castShadow: boolean; receiveShadow: boolean }
      mesh.castShadow = enabled
      mesh.receiveShadow = false
    }
  })
}

export function AnimatedCharacter({ bladeId, continuousFaceLight = true, definition, animationDurationSeconds, animationState, animationSignal = 0 }: AnimatedCharacterProps) {
  const idleFile = useGLTF(definition.assets.idle)
  const walkFile = useGLTF(definition.assets.walk)
  const jumpFile = useGLTF(definition.assets.jump)
  const attackFile = useGLTF(definition.assets.attack)
  const swordFile = useGLTF(definition.assets.sword)
  const transform = useDebugStore((state) => state.transforms[definition.id])
  const tier = usePerformanceStore((state) => state.tier)
  const qualityFactor = usePerformanceStore((state) => state.qualityFactor)
  const phase = useSessionStore((state) => state.phase)
  const enemyCount = useSessionStore((state) => state.enemies.length)
  const dynamicShadows = (phase === 'menu' || phase === 'controls')
    && runtimeDynamicShadows(tier, qualityFactor, enemyCount)
  const attachmentRef = useRef<WeaponAttachment | null>(null)
  const restDip = useRef(0)
  const initialWeaponTransform = useRef(transform.weapon)

  const characterScene = useMemo(() => SkeletonUtils.clone(idleFile.scene), [idleFile.scene])
  const gl = useThree((state) => state.gl)
  const swordScene = useMemo(() => {
    const blade = swordFile.scene.clone(true)
    // Jack's katana is the brightest steel in the game; Zülfikar keeps its darker bronze.
    polishBlade(blade, swordEnvironment(gl), definition.id === 'jack' ? 0.42 : 0.16)
    return blade
  }, [definition.id, gl, swordFile.scene])
  const torso = useMemo(() => findTorsoBone(characterScene), [characterScene])
  const bodyGuard = useMemo(() => findWeaponBodyGuard(characterScene), [characterScene])

  const clips = useMemo(() => {
    const prepared: AnimationClip[] = [
      prepareAnimationClip(idleFile.animations[0], 'idle'),
      prepareAnimationClip(walkFile.animations[0], 'walk'),
      prepareAnimationClip(jumpFile.animations[0], 'jump', definition.jumpSubclip),
      prepareAnimationClip(attackFile.animations[0], 'attack'),
    ]

    return prepared.map((clip) => validateClipTargets(characterScene, clip))
  }, [attackFile.animations, characterScene, definition.jumpSubclip, idleFile.animations, jumpFile.animations, walkFile.animations])

  useCharacterAnimations(characterScene, clips, animationState, animationSignal, animationDurationSeconds)

  useLayoutEffect(() => {
    configureShadows(characterScene, dynamicShadows)
    // The weapons contain more than half a million render vertices. Their
    // silhouettes remain attached to the body shadow without a second pass.
    configureShadows(swordScene, false)
    const attachment = attachWeapon(characterScene, swordScene, initialWeaponTransform.current)
    if (definition.id === 'ali') placeWeaponGripInPalm(attachment, ALI_PALM_REACH)
    attachmentRef.current = attachment
    const hips = ['mixamorigHips', 'Hips', 'hips', 'Pelvis'].map((name) => characterScene.getObjectByName(name)).find(Boolean) ?? null
    const unregister = bladeId ? registerBlade(bladeId, { weapon: swordScene, hips, ...measureBlade(swordScene, initialWeaponTransform.current) }) : null
    return () => {
      unregister?.()
      attachment.detach()
      attachmentRef.current = null
    }
  }, [bladeId, characterScene, definition.id, dynamicShadows, swordScene])

  useLayoutEffect(() => {
    if (attachmentRef.current) alignWeaponAttachment(attachmentRef.current, transform.weapon)
  }, [transform.weapon])

  useFrame((_, delta) => {
    if (attachmentRef.current) {
      // The grip must remain part of the animated hand in every state. Keeping a
      // world-stable blade during idle/walk made it slide through the palm and
      // body as soon as the wrist moved (most visible in the roster preview).
      updateWeaponSocket(attachmentRef.current, true, delta)
      if (definition.id === 'ali') placeWeaponGripInPalm(attachmentRef.current, ALI_PALM_REACH)
      if (animationState === 'walk') {
        keepWeaponOutsideBody(
          attachmentRef.current,
          bodyGuard,
          transform.weapon,
          definition.id === 'ali' ? 136 : 122,
        )
      } else {
        // Preserve the authored idle/attack arcs; their existing torso guard is
        // intentionally narrower than the full walking-body protection.
        keepWeaponOutsideTorso(
          attachmentRef.current,
          torso,
          transform.weapon,
          definition.id === 'ali' ? 136 : 122,
          definition.id === 'ali' ? 15 : 13,
        )
      }
      // At rest Hz. Ali holds Zülfikar low, tip down, instead of levelled at his friend.
      const resting = definition.id === 'ali' && (animationState === 'idle' || animationState === 'walk')
      restDip.current = MathUtils.damp(restDip.current, resting ? 1 : 0, 9, Math.min(delta, 0.1))
      if (restDip.current > 0.01) {
        const attachment = attachmentRef.current
        attachment.weapon.updateWorldMatrix(true, false)
        restDirection.set(...transform.weapon.bladeDirection).transformDirection(attachment.weapon.matrixWorld)
        const elevation = Math.asin(MathUtils.clamp(restDirection.y, -1, 1))
        if (elevation > REST_ELEVATION) {
          restAxis.crossVectors(restDirection, UP)
          if (restAxis.lengthSq() > 0.0001) {
            restRotation.setFromAxisAngle(restAxis.normalize(), -(elevation - REST_ELEVATION) * restDip.current)
            attachment.root.getWorldQuaternion(parentRotation)
            // world-space turn about the grip, expressed in the socket's parent frame
            attachment.socket.quaternion.premultiply(parentRotation.clone().invert().multiply(restRotation).multiply(parentRotation))
          }
        }
      }
    }
  })

  return (
    <group
      name={`${definition.id}-model`}
      position={transform.modelPosition}
      rotation={transform.modelRotation}
      scale={transform.modelScale}
      visible={animationState !== 'dead'}
    >
      <primitive object={characterScene} />
      {definition.id === 'ali' ? <AliFaceLight continuous={continuousFaceLight} scene={characterScene} /> : null}
    </group>
  )
}
