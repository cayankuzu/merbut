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
  updateWeaponSocket,
  type WeaponAttachment,
} from './WeaponSocket'

interface AnimatedCharacterProps {
  definition: CharacterDefinition
  animationState: AnimationState
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

export function AnimatedCharacter({ definition, animationState }: AnimatedCharacterProps) {
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

  const clips = useMemo(() => {
    const prepared: AnimationClip[] = [
      prepareAnimationClip(idleFile.animations[0], 'idle'),
      prepareAnimationClip(walkFile.animations[0], 'walk'),
      prepareAnimationClip(jumpFile.animations[0], 'jump', definition.jumpSubclip),
      prepareAnimationClip(attackFile.animations[0], 'attack'),
    ]

    return prepared.map((clip) => validateClipTargets(characterScene, clip))
  }, [attackFile.animations, characterScene, definition.jumpSubclip, idleFile.animations, jumpFile.animations, walkFile.animations])

  useCharacterAnimations(characterScene, clips, animationState)

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
      updateWeaponSocket(attachmentRef.current, animationState === 'attack' || animationState === 'shield', delta)
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
