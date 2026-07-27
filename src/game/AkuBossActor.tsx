import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Group, LoopOnce, LoopRepeat, MathUtils, Object3D } from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { prepareAnimationClip } from '../animation/animationLoader'
import { validateClipTargets } from '../animation/animationRetargeting'
import { ASSET_PATHS } from '../config/assetPaths'
import { ENEMIES, type EnemyKind } from '../config/enemies'
import { useSessionStore } from '../store/sessionStore'

interface AkuBossActorProps { id: string }

const MINI_OFFSETS = [-4.2, -2.7, -1.35, 1.35, 2.7, 4.2] as const

function enableShadows(root: Object3D) {
  root.traverse((node) => {
    if ('isMesh' in node && node.isMesh) {
      const mesh = node as Object3D & { castShadow: boolean; receiveShadow: boolean }
      mesh.castShadow = true
      mesh.receiveShadow = true
    }
  })
}

function MimicModel({ kind }: { kind: EnemyKind }) {
  const definition = ENEMIES[kind]
  const walkFile = useGLTF(definition.walk)
  const attackFile = useGLTF(definition.attack)
  const scene = useMemo(() => SkeletonUtils.clone(walkFile.scene), [walkFile.scene])
  const clips = useMemo(() => [
    validateClipTargets(scene, prepareAnimationClip(walkFile.animations[0], 'walk')),
    validateClipTargets(scene, prepareAnimationClip(attackFile.animations[0], 'attack')),
  ], [attackFile.animations, scene, walkFile.animations])
  const { actions } = useAnimations(clips, scene)
  useEffect(() => {
    actions.attack?.reset().setLoop(LoopRepeat, Infinity).play()
    return () => { actions.attack?.stop() }
  }, [actions])
  return <primitive object={scene} scale={definition.scale * 0.92} />
}

export function AkuBossActor({ id }: AkuBossActorProps) {
  const enemy = useSessionStore((state) => state.enemies.find((candidate) => candidate.id === id))
  const bossPhase = useSessionStore((state) => state.bossPhase)
  const normalAssets = ASSET_PATHS.bosses.aku.normal
  const monsterAssets = ASSET_PATHS.bosses.aku.monster

  const normalWalk = useGLTF(normalAssets.walk)
  const normalRun = useGLTF(normalAssets.run)
  const normalAttack = useGLTF(normalAssets.attack)
  const normalHeavy = useGLTF(normalAssets.heavy)
  const normalKick = useGLTF(normalAssets.kick)
  const normalTriple = useGLTF(normalAssets.triple)
  const normalRanged = useGLTF(normalAssets.ranged)
  const normalDead = useGLTF(normalAssets.dead)
  const monsterIdle = useGLTF(monsterAssets.idle)
  const monsterWalk = useGLTF(monsterAssets.walk)
  const monsterRun = useGLTF(monsterAssets.run)
  const monsterSlash = useGLTF(monsterAssets.slash)
  const monsterDouble = useGLTF(monsterAssets.double)
  const monsterTriple = useGLTF(monsterAssets.triple)
  const monsterSpin = useGLTF(monsterAssets.spin)
  const monsterBladeSpin = useGLTF(monsterAssets.bladeSpin)
  const monsterRanged = useGLTF(monsterAssets.ranged)
  const monsterHeavy = useGLTF(monsterAssets.heavy)
  const monsterDead = useGLTF(monsterAssets.dead)

  const root = useRef<Group>(null)
  const normalRoot = useRef<Group>(null)
  const monsterRoot = useRef<Group>(null)
  const minisRoot = useRef<Group>(null)
  const miniGroups = useRef<Group[]>([])
  const morphRing = useRef<Group>(null)
  const normalScene = useMemo(() => SkeletonUtils.clone(normalWalk.scene), [normalWalk.scene])
  const monsterScene = useMemo(() => SkeletonUtils.clone(monsterIdle.scene), [monsterIdle.scene])
  const miniScenes = useMemo(() => MINI_OFFSETS.map(() => SkeletonUtils.clone(normalWalk.scene)), [normalWalk.scene])
  const normalClips = useMemo(() => [
    validateClipTargets(normalScene, prepareAnimationClip(normalWalk.animations[0], 'walk')),
    validateClipTargets(normalScene, prepareAnimationClip(normalRun.animations[0], 'run')),
    validateClipTargets(normalScene, prepareAnimationClip(normalAttack.animations[0], 'attack')),
    validateClipTargets(normalScene, prepareAnimationClip(normalHeavy.animations[0], 'heavy')),
    validateClipTargets(normalScene, prepareAnimationClip(normalKick.animations[0], 'kick')),
    validateClipTargets(normalScene, prepareAnimationClip(normalTriple.animations[0], 'triple')),
    validateClipTargets(normalScene, prepareAnimationClip(normalRanged.animations[0], 'ranged')),
    validateClipTargets(normalScene, prepareAnimationClip(normalDead.animations[0], 'dead')),
  ], [normalAttack.animations, normalDead.animations, normalHeavy.animations, normalKick.animations, normalRanged.animations, normalRun.animations, normalScene, normalTriple.animations, normalWalk.animations])
  const monsterClips = useMemo(() => [
    validateClipTargets(monsterScene, prepareAnimationClip(monsterIdle.animations[0], 'idle')),
    validateClipTargets(monsterScene, prepareAnimationClip(monsterWalk.animations[0], 'walk')),
    validateClipTargets(monsterScene, prepareAnimationClip(monsterRun.animations[0], 'run')),
    validateClipTargets(monsterScene, prepareAnimationClip(monsterSlash.animations[0], 'slash')),
    validateClipTargets(monsterScene, prepareAnimationClip(monsterDouble.animations[0], 'double')),
    validateClipTargets(monsterScene, prepareAnimationClip(monsterTriple.animations[0], 'triple')),
    validateClipTargets(monsterScene, prepareAnimationClip(monsterSpin.animations[0], 'spin')),
    validateClipTargets(monsterScene, prepareAnimationClip(monsterBladeSpin.animations[0], 'blade-spin')),
    validateClipTargets(monsterScene, prepareAnimationClip(monsterRanged.animations[0], 'ranged')),
    validateClipTargets(monsterScene, prepareAnimationClip(monsterHeavy.animations[0], 'heavy')),
    validateClipTargets(monsterScene, prepareAnimationClip(monsterDead.animations[0], 'dead')),
  ], [monsterBladeSpin.animations, monsterDead.animations, monsterDouble.animations, monsterHeavy.animations, monsterIdle.animations, monsterRanged.animations, monsterRun.animations, monsterScene, monsterSlash.animations, monsterSpin.animations, monsterTriple.animations, monsterWalk.animations])
  const normalAnimations = useAnimations(normalClips, normalScene)
  const monsterAnimations = useAnimations(monsterClips, monsterScene)

  const normalAction = enemy?.animation === 'dead' ? 'dead'
    : enemy?.special === 'aku-heavy' ? 'heavy'
      : enemy?.special === 'aku-ranged' || enemy?.special === 'aku-time-portal' || enemy?.special === 'aku-fire-rain' ? 'ranged'
        : enemy?.special === 'combo-triple' || enemy?.special === 'aku-spin' ? 'triple'
          : enemy?.special === 'aku-melee' ? 'attack'
            : enemy?.animation === 'attack' ? 'kick' : enemy?.animation === 'idle' ? 'walk' : 'run'
  const monsterAction = enemy?.animation === 'dead' ? 'dead'
    : enemy?.special === 'aku-heavy' ? 'heavy'
      : enemy?.special === 'aku-ranged' || enemy?.special === 'aku-time-portal' || enemy?.special === 'aku-fire-rain' ? 'ranged'
        : enemy?.special === 'aku-spin' ? 'blade-spin'
          : enemy?.special === 'combo-triple' ? 'triple'
            : enemy?.special === 'aku-melee' ? 'slash'
              : enemy?.animation === 'attack' ? 'double' : enemy?.animation === 'idle' ? 'idle' : 'run'

  useLayoutEffect(() => {
    enableShadows(normalScene)
    enableShadows(monsterScene)
    miniScenes.forEach(enableShadows)
  }, [miniScenes, monsterScene, normalScene])

  useEffect(() => {
    const entries = [
      { action: normalAnimations.actions[normalAction], actions: normalAnimations.actions, name: normalAction },
      { action: monsterAnimations.actions[monsterAction], actions: monsterAnimations.actions, name: monsterAction },
    ]
    entries.forEach(({ action, actions, name }) => {
      if (!action) return
      const looping = name === 'walk' || name === 'run' || name === 'idle'
      action.enabled = true
      action.paused = false
      action.clampWhenFinished = !looping
      action.setLoop(looping ? LoopRepeat : LoopOnce, looping ? Infinity : 1)
      action.reset().fadeIn(0.14).play()
      if (enemy?.animation === 'idle' && name === 'walk') {
        action.time = 0
        action.paused = true
      }
      Object.entries(actions).forEach(([candidateName, candidate]) => { if (candidateName !== name) candidate?.fadeOut(0.14) })
    })
  }, [enemy?.animation, monsterAction, monsterAnimations.actions, normalAction, normalAnimations.actions])

  useFrame((_, delta) => {
    const current = useSessionStore.getState().enemies.find((candidate) => candidate.id === id)
    if (!root.current || !normalRoot.current || !monsterRoot.current || !minisRoot.current || !current) return
    const now = performance.now()
    root.current.position.x = MathUtils.damp(root.current.position.x, current.x, 15, Math.min(delta, 0.05))
    root.current.rotation.y = MathUtils.damp(root.current.rotation.y, current.direction > 0 ? Math.PI / 2 : -Math.PI / 2, 14, Math.min(delta, 0.05))
    const arriving = bossPhase === 'prayer' ? 0 : bossPhase === 'aku-arrival' ? Math.min(1, (now - useSessionStore.getState().bossPhaseStartedAt - 2_200) / 900) : 1
    const split = current.special === 'aku-split' && current.animation !== 'dead'
    const mimicking = current.special === 'aku-shapeshift' && current.mimicKind !== null
    const deadScale = current.animation === 'dead' ? 0.9 : 1
    const normalTarget = current.bossForm === 'normal' && !split && !mimicking ? current.scale * arriving * deadScale : 0
    const monsterTarget = current.bossForm === 'monster' && !split && !mimicking ? current.scale * arriving * deadScale : 0
    normalRoot.current.scale.setScalar(MathUtils.damp(normalRoot.current.scale.x, normalTarget, 8, delta))
    monsterRoot.current.scale.setScalar(MathUtils.damp(monsterRoot.current.scale.x, monsterTarget, 8, delta))
    minisRoot.current.visible = split
    if (split) {
      const elapsed = (now - current.specialStartedAt) / 1_000
      miniGroups.current.forEach((mini, index) => {
        const base = MINI_OFFSETS[index]!
        mini.position.x = base * (0.76 + Math.sin(elapsed * 3.1 + index) * 0.18)
        mini.position.y = Math.abs(Math.sin(elapsed * 4.2 + index)) * 0.18
        mini.rotation.y = (base < 0 ? Math.PI / 2 : -Math.PI / 2) + Math.sin(elapsed * 2 + index) * 0.25
        mini.scale.setScalar(current.scale * 0.31 * (0.92 + Math.sin(elapsed * 5 + index) * 0.08))
      })
    }
    if (morphRing.current) {
      morphRing.current.visible = split || mimicking || current.bossForm === 'monster'
      morphRing.current.rotation.y += delta * 1.6
      morphRing.current.rotation.z -= delta * 0.9
      morphRing.current.scale.setScalar(0.9 + Math.sin(now * 0.008) * 0.08)
    }
  })

  if (!enemy) return null
  return (
    <group ref={root} position={[enemy.x, 0, 0]} name={enemy.title}>
      <group ref={normalRoot} scale={0}><primitive object={normalScene} /></group>
      <group ref={monsterRoot} scale={0}><primitive object={monsterScene} /></group>
      <group ref={minisRoot} visible={false}>
        {miniScenes.map((scene, index) => <group key={MINI_OFFSETS[index]} ref={(group) => { if (group) miniGroups.current[index] = group }}><primitive object={scene} /></group>)}
      </group>
      {enemy.special === 'aku-shapeshift' && enemy.mimicKind ? <group scale={1.12}><MimicModel kind={enemy.mimicKind} /></group> : null}
      <group ref={morphRing} visible={false} position={[0, 1.35, 0]}>
        <pointLight color="#73ff48" intensity={8} distance={6} />
        <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.3, 0.055, 8, 64]} /><meshBasicMaterial color="#9cff6b" transparent opacity={0.72} blending={AdditiveBlending} depthWrite={false} /></mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[1.55, 0.035, 7, 64]} /><meshBasicMaterial color="#130019" transparent opacity={0.8} /></mesh>
      </group>
    </group>
  )
}

Object.values(ASSET_PATHS.bosses.aku.normal).forEach((asset) => useGLTF.preload(asset))
Object.values(ASSET_PATHS.bosses.aku.monster).forEach((asset) => useGLTF.preload(asset))
