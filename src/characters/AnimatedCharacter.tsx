import { useLayoutEffect, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { AnimationClip, Object3D } from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { prepareAnimationClip } from '../animation/animationLoader'
import { validateClipTargets } from '../animation/animationRetargeting'
import { useCharacterAnimations } from '../hooks/useCharacterAnimations'
import { useDebugStore } from '../store/debugStore'
import type { AnimationState } from '../types/animation'
import type { CharacterDefinition } from '../types/character'
import {
  alignWeaponAttachment,
  attachWeapon,
  findTorsoBone,
  keepWeaponOutsideTorso,
  updateWeaponSocket,
  type WeaponAttachment,
} from './WeaponSocket'

interface AnimatedCharacterProps {
  definition: CharacterDefinition
  animationState: AnimationState
  /** Replays the current combat clip without changing gameplay animation state. */
  animationSignal?: number
  /** Optional presentation duration; gameplay callers keep their normal rates. */
  animationDurationSeconds?: number
}

function enableShadows(root: Object3D) {
  root.traverse((node) => {
    if ('isMesh' in node && node.isMesh) {
      const mesh = node as Object3D & { castShadow: boolean; receiveShadow: boolean }
      mesh.castShadow = true
      mesh.receiveShadow = true
    }
  })
}

export function AnimatedCharacter({ definition, animationDurationSeconds, animationState, animationSignal = 0 }: AnimatedCharacterProps) {
  const idleFile = useGLTF(definition.assets.idle)
  const walkFile = useGLTF(definition.assets.walk)
  const jumpFile = useGLTF(definition.assets.jump)
  const attackFile = useGLTF(definition.assets.attack)
  const swordFile = useGLTF(definition.assets.sword)
  const transform = useDebugStore((state) => state.transforms[definition.id])
  const attachmentRef = useRef<WeaponAttachment | null>(null)
  const initialWeaponTransform = useRef(transform.weapon)

  const characterScene = useMemo(() => SkeletonUtils.clone(idleFile.scene), [idleFile.scene])
  const swordScene = useMemo(() => swordFile.scene.clone(true), [swordFile.scene])
  const torso = useMemo(() => findTorsoBone(characterScene), [characterScene])

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
    enableShadows(characterScene)
    enableShadows(swordScene)
    const attachment = attachWeapon(characterScene, swordScene, initialWeaponTransform.current)
    attachmentRef.current = attachment
    return () => {
      attachment.detach()
      attachmentRef.current = null
    }
  }, [characterScene, swordScene])

  useLayoutEffect(() => {
    if (attachmentRef.current) alignWeaponAttachment(attachmentRef.current, transform.weapon)
  }, [transform.weapon])

  useFrame((_, delta) => {
    if (attachmentRef.current) {
      // The grip must remain part of the animated hand in every state. Keeping a
      // world-stable blade during idle/walk made it slide through the palm and
      // body as soon as the wrist moved (most visible in the roster preview).
      updateWeaponSocket(attachmentRef.current, true, delta)
      keepWeaponOutsideTorso(
        attachmentRef.current,
        torso,
        transform.weapon,
        definition.id === 'ali' ? 136 : 122,
        definition.id === 'ali' ? 15 : 13,
      )
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
    </group>
  )
}
