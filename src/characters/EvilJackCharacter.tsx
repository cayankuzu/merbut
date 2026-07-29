import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Color, LoopOnce, LoopRepeat, Mesh, MeshStandardMaterial, Object3D } from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { prepareAnimationClip } from '../animation/animationLoader'
import { validateClipTargets } from '../animation/animationRetargeting'
import { ASSET_PATHS } from '../config/assetPaths'
import { SHADOW_WEAPON_TRANSFORM } from '../config/characterTransforms'
import { attachWeapon, type WeaponAttachment } from './WeaponSocket'
import { findShadowTorsoBone, updateShadowWeaponSocket } from './shadowWeapon'

export type EvilJackAction = 'walk' | 'run' | 'slash' | 'double' | 'triple' | 'cast' | 'dead'

interface EvilJackCharacterProps {
  action: EvilJackAction
  loopCombat?: boolean
  shadows?: boolean
}

const SHADOW_STEEL_TINT = new Color('#5c0b13')

function configureShadows(root: Object3D, enabled: boolean) {
  root.traverse((node) => {
    if ('isMesh' in node && node.isMesh) {
      const mesh = node as Object3D & { castShadow: boolean; receiveShadow: boolean }
      mesh.castShadow = enabled
      mesh.receiveShadow = enabled
    }
  })
}

/** Aku'nun Gölgesi için oyun ve galeri tarafından paylaşılan rig/silah yolu. */
export function EvilJackCharacter({ action, loopCombat = false, shadows = true }: EvilJackCharacterProps) {
  const assets = ASSET_PATHS.bosses.evilJack
  const walkFile = useGLTF(assets.walk)
  const runFile = useGLTF(assets.run)
  const slashFile = useGLTF(assets.slash)
  const doubleFile = useGLTF(assets.doubleCombo)
  const tripleFile = useGLTF(assets.tripleCombo)
  const castFile = useGLTF(assets.cast)
  const hitFile = useGLTF(assets.hit)
  const swordFile = useGLTF(ASSET_PATHS.jack.sword)
  const attachment = useRef<WeaponAttachment | null>(null)
  const scene = useMemo(() => SkeletonUtils.clone(walkFile.scene), [walkFile.scene])
  const sword = useMemo(() => {
    const clone = swordFile.scene.clone(true)
    clone.traverse((node) => {
      if (!(node instanceof Mesh)) return
      const materials = Array.isArray(node.material) ? node.material : [node.material]
      const owned = materials.map((material) => {
        const copy = material.clone()
        if (copy instanceof MeshStandardMaterial) {
          copy.color.lerp(SHADOW_STEEL_TINT, 0.38)
          copy.emissive.set('#ff174c')
          copy.emissiveIntensity = 0.42
          copy.metalness = Math.max(copy.metalness, 0.72)
          copy.roughness = Math.min(copy.roughness, 0.34)
        }
        return copy
      })
      node.material = Array.isArray(node.material) ? owned : owned[0]!
    })
    return clone
  }, [swordFile.scene])
  const torso = useMemo(() => findShadowTorsoBone(scene), [scene])
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

  useLayoutEffect(() => {
    configureShadows(scene, shadows)
    configureShadows(sword, shadows)
    attachment.current = attachWeapon(scene, sword, SHADOW_WEAPON_TRANSFORM)
    return () => {
      attachment.current?.detach()
      attachment.current = null
    }
  }, [scene, shadows, sword])

  useEffect(() => {
    const next = actions[action]
    if (!next) return
    const looping = action === 'run' || action === 'walk' || loopCombat
    next.enabled = true
    next.paused = false
    next.clampWhenFinished = !looping
    next.setLoop(looping ? LoopRepeat : LoopOnce, looping ? Infinity : 1)
    next.reset().fadeIn(0.12).play()
    if (action === 'walk' && !loopCombat) {
      next.time = 0
      next.paused = true
    }
    Object.entries(actions).forEach(([name, candidate]) => {
      if (name !== action) candidate?.fadeOut(0.12)
    })
  }, [action, actions, loopCombat])

  useEffect(() => () => {
    sword.traverse((node) => {
      if (!(node instanceof Mesh)) return
      const materials = Array.isArray(node.material) ? node.material : [node.material]
      materials.forEach((material) => material.dispose())
    })
  }, [sword])

  useFrame((_, delta) => {
    if (!attachment.current) return
    const followsHand = action !== 'dead'
    const guardsTorso = action !== 'walk' && action !== 'run'
    updateShadowWeaponSocket(
      attachment.current,
      followsHand && guardsTorso ? torso : null,
      followsHand,
      delta,
    )
  })

  return <primitive object={scene} />
}
