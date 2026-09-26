import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, AnimationMixer, Color, Group, LoopRepeat, MathUtils, Mesh, MeshBasicMaterial, Object3D, type AnimationAction, type Material, type MeshStandardMaterial } from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { useShallow } from 'zustand/react/shallow'
import { prepareAnimationClip } from '../animation/animationLoader'
import { validateClipTargets } from '../animation/animationRetargeting'
import { ENEMIES, ENEMY_VARIANTS, ENEMY_WINDUP_MS } from '../config/enemies'
import { simClock } from '../sim/clock'
import { gameEvents } from '../sim/events'
import { useSessionStore } from '../store/sessionStore'
import { useSettingsStore } from '../store/settingsStore'
import { runtimeAnimationFps, usePerformanceStore } from '../store/performanceStore'
import { currentEnemyById, enemyById } from './enemyLookup'
import { labOff } from '../utils/labFlags'

interface EnemyActorProps {
  id: string
}

type EnemyActionName = 'walk' | 'attack'
type EnemyActions = Record<EnemyActionName, AnimationAction>
type TintableMaterial = MeshStandardMaterial & { emissive: Color; emissiveIntensity: number }

const HIT_FLASH_MS = 110
const WHITE = new Color('#ffffff')
const TELEGRAPH = new Color('#ff2a1a')
/** Colour-blind friendly warning: bright yellow-white reads for every kind of colour vision. */
const TELEGRAPH_SAFE = new Color('#ffe45c')
const GHOST = new Color('#57ffc0')
const ELITE = new Color('#ffb72e')
const GIANT = new Color('#bfe6ff')
const MIRAGE = new Color('#ffc46b')

/** Each actor owns its materials so a hit flash never lights up the whole crowd. */
function ownMaterials(root: Object3D) {
  const materials: TintableMaterial[] = []
  root.traverse((node) => {
    if (!(node instanceof Mesh)) return
    node.castShadow = false
    node.receiveShadow = false
    // Idempotent: StrictMode may run this twice; a material already owned by
    // this actor is reused instead of cloned again.
    const cloneOne = (material: Material) => {
      const copy = (material.userData.ownerId === root.uuid ? material : material.clone()) as TintableMaterial
      copy.userData.ownerId = root.uuid
      if ('emissive' in copy) materials.push(copy)
      return copy
    }
    node.material = Array.isArray(node.material) ? node.material.map(cloneOne) : cloneOne(node.material)
  })
  return materials
}

export function EnemyActor({ id }: EnemyActorProps) {
  const enemy = useSessionStore(useShallow((state) => {
    const current = enemyById(state.enemies, id)
    return current ? { kind: current.kind, title: current.title, animation: current.animation, scale: current.scale, variant: current.variant, z: current.z } : null
  }))
  const initialX = useMemo(() => currentEnemyById(id)?.x ?? 0, [id])
  const root = useRef<Group>(null)
  const modelRoot = useRef<Group>(null)
  const telegraphRing = useRef<Mesh>(null)
  const ringMaterial = useMemo(() => new MeshBasicMaterial({ color: '#ff3b24', transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending, toneMapped: false }), [])
  const animationAccumulator = useRef(0)
  const hitAt = useRef(-Infinity)
  const tier = usePerformanceStore((state) => state.tier)
  const qualityFactor = usePerformanceStore((state) => state.qualityFactor)
  const animationFps = runtimeAnimationFps(tier, qualityFactor)
  const kind = enemy?.kind ?? 1
  const variant = enemy?.variant ?? 'normal'
  const definition = ENEMIES[kind]
  const walkFile = useGLTF(definition.walk)
  const attackFile = useGLTF(definition.attack)
  const scene = useMemo(() => SkeletonUtils.clone(walkFile.scene), [walkFile.scene])
  const materials = useMemo(() => labOff('actorfx') ? [] : ownMaterials(scene), [scene])
  const baseEmissive = useMemo(() => materials.map((material) => ({ color: material.emissive.clone(), intensity: material.emissiveIntensity })), [materials])
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

  useLayoutEffect(() => {
    if (variant !== 'ghost' && variant !== 'mirage') return
    materials.forEach((material) => {
      material.transparent = true
      material.opacity = variant === 'ghost' ? 0.58 : 0.72
    })
  }, [materials, variant])

  useEffect(() => () => {
    materials.forEach((material) => material.dispose())
    ringMaterial.dispose()
  }, [materials, ringMaterial])

  useEffect(() => gameEvents.on((event) => {
    if (event.type === 'enemy-hit' && event.enemyId === id) hitAt.current = performance.now()
  }), [id])

  // Keep both clips registered for the life of this actor; switching weights is
  // allocation-free and never re-lends a PropertyBinding under load.
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
    if (activeAction.current !== nextName) next.reset()
    const attackDuration = clips[1]?.duration ?? 1
    // The swing's contact frame (about half way) lines up with the telegraph end.
    const windup = variant === 'normal' ? ENEMY_WINDUP_MS[kind] : ENEMY_VARIANTS[variant].windupMs
    actions.walk.timeScale = variant === 'giant' ? 0.72 : 1.05
    actions.attack.timeScale = attackDuration / Math.max(0.6, (windup * 2) / 1_000)
    actions.walk.setEffectiveWeight(nextName === 'walk' ? 1 : 0)
    actions.attack.setEffectiveWeight(nextName === 'attack' ? 1 : 0)
    actions.walk.paused = nextName !== 'walk' || animation === 'idle'
    actions.attack.paused = nextName !== 'attack'
    if (animation === 'idle') actions.walk.time = 0
    activeAction.current = nextName
  }, [actions, animation, clips, kind, variant])

  useFrame(({ clock }, delta) => {
    const current = currentEnemyById(id)
    if (!root.current || !current) return
    const now = simClock.now()
    const frameDelta = Math.min(delta, 0.1)
    root.current.position.x = MathUtils.damp(root.current.position.x, current.x, 16, frameDelta)
    root.current.position.z = MathUtils.damp(root.current.position.z, current.z, 6, frameDelta)
    const targetRotation = current.direction > 0 ? Math.PI / 2 : -Math.PI / 2
    root.current.rotation.y = MathUtils.damp(root.current.rotation.y, targetRotation, 14, frameDelta)

    if (modelRoot.current) {
      const deadProgress = current.animation === 'dead' ? Math.min(1, (now - current.deadAt) / 900) : 0
      const rise = current.variant === 'giant' ? Math.min(1, (now - current.spawnedAt) / 1_900) : 1
      const stunned = current.stunUntil > now && current.animation !== 'dead'
      modelRoot.current.rotation.z = MathUtils.damp(modelRoot.current.rotation.z, -deadProgress * 1.28 + (stunned ? Math.sin(clock.elapsedTime * 22) * 0.06 : 0), 8, frameDelta)
      modelRoot.current.position.y = -deadProgress * 0.48 - (1 - rise) * 3.2
      modelRoot.current.scale.setScalar(current.scale * (1 - deadProgress * 0.32))
      if (current.variant === 'mirage') {
        // Heat haze: the copy wavers sideways and melts into the sand when cut.
        modelRoot.current.position.x = Math.sin(clock.elapsedTime * 23 + current.spawnedAt) * 0.035
        if (deadProgress > 0) modelRoot.current.scale.y = current.scale * Math.max(0.02, 1 - deadProgress * 1.6)
        materials.forEach((material) => { material.opacity = deadProgress > 0 ? Math.max(0, 0.7 - deadProgress) : 0.62 + Math.sin(clock.elapsedTime * 9 + current.spawnedAt) * 0.16 })
      }
    }

    // A shrinking red ring on the ground says "this one strikes next".
    if (telegraphRing.current) {
      const remaining = current.windupUntil - now
      const active = remaining > 0 && current.animation !== 'dead'
      telegraphRing.current.visible = active
      if (active) {
        const progress = 1 - Math.min(1, remaining / 650)
        const safe = useSettingsStore.getState().colorSafeTelegraphs
        telegraphRing.current.scale.setScalar((1.9 - progress * 0.9) * (safe ? 1.25 : 1))
        ringMaterial.color.set(safe ? '#fff3a0' : '#ff3b24')
        ringMaterial.opacity = 0.35 + progress * 0.55
      }
    }

    // Hit flash beats telegraph; telegraph beats the variant's resting glow.
    const flashing = performance.now() - hitAt.current < HIT_FLASH_MS && !useSettingsStore.getState().reduceFlashes
    const telegraph = current.windupUntil > now ? 0.5 + Math.sin(clock.elapsedTime * 26) * 0.5 : 0
    materials.forEach((material, index) => {
      const base = baseEmissive[index]!
      if (flashing) {
        material.emissive.copy(WHITE)
        material.emissiveIntensity = 1.6
      } else if (telegraph > 0) {
        material.emissive.copy(useSettingsStore.getState().colorSafeTelegraphs ? TELEGRAPH_SAFE : TELEGRAPH)
        material.emissiveIntensity = 0.35 + telegraph * 0.9
      } else if (current.variant !== 'normal') {
        material.emissive.copy(current.variant === 'ghost' ? GHOST : current.variant === 'elite' ? ELITE : current.variant === 'mirage' ? MIRAGE : GIANT)
        material.emissiveIntensity = current.variant === 'ghost' ? 0.42 : current.variant === 'mirage' ? 0.34 : 0.22 + Math.sin(clock.elapsedTime * 3) * 0.06
      } else {
        material.emissive.copy(base.color)
        material.emissiveIntensity = base.intensity
      }
    })

    if (current.animation !== 'dead') {
      animationAccumulator.current += frameDelta * simClock.scale()
      if (animationAccumulator.current >= 1 / animationFps) {
        mixer.update(animationAccumulator.current)
        animationAccumulator.current = 0
      }
    }
  })

  if (!enemy) return null
  return (
    <group ref={root} position={[initialX, 0, enemy.z]} name={enemy.title}>
      <group ref={modelRoot} scale={enemy.scale}>
        <primitive object={scene} />
      </group>
      <mesh ref={telegraphRing} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} material={ringMaterial} visible={false} renderOrder={3}>
        <ringGeometry args={[0.72, 0.9, 36]} />
      </mesh>
    </group>
  )
}
