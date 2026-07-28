import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { AdditiveBlending, AnimationMixer, type AnimationClip, Group, LoopOnce, LoopRepeat, MathUtils, Object3D } from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { useShallow } from 'zustand/react/shallow'
import { prepareAnimationClip } from '../animation/animationLoader'
import { validateClipTargets } from '../animation/animationRetargeting'
import { ASSET_PATHS } from '../config/assetPaths'
import { ENEMIES, type EnemyKind } from '../config/enemies'
import { useGameStore } from '../store/gameStore'
import { useSessionStore } from '../store/sessionStore'
import { getMiniAkuMotion, MINI_AKU_OFFSETS } from './akuMiniSwarm'
import { currentEnemyById, enemyById } from './enemyLookup'

interface AkuBossActorProps { id: string }

function enableShadows(root: Object3D) {
  root.traverse((node) => {
    if ('isMesh' in node && node.isMesh) {
      const mesh = node as Object3D & { castShadow: boolean; receiveShadow: boolean }
      mesh.castShadow = true
      mesh.receiveShadow = true
    }
  })
}

function optimizeMiniAku(root: Object3D) {
  root.traverse((node) => {
    if ('isMesh' in node && node.isMesh) {
      const mesh = node as Object3D & { castShadow: boolean; receiveShadow: boolean; frustumCulled: boolean }
      mesh.castShadow = false
      mesh.receiveShadow = false
      mesh.frustumCulled = true
    }
  })
}

function lockMiniRootMotion(clip: AnimationClip) {
  clip.tracks.forEach((track) => {
    if (!/hips\.position$/i.test(track.name)) return
    const [x = 0, y = 0, z = 0] = track.values
    for (let index = 0; index < track.values.length; index += 3) {
      track.values[index] = x
      track.values[index + 1] = y
      track.values[index + 2] = z
    }
  })
  return clip
}

function MiniAkuModel({ bossId, index }: { bossId: string; index: number }) {
  const assets = ASSET_PATHS.bosses.aku.normal
  const runFile = useGLTF(assets.mini)
  const attackFile = useGLTF(assets.attack)
  const heavyFile = useGLTF(assets.heavy)
  const kickFile = useGLTF(assets.kick)
  const tripleFile = useGLTF(assets.triple)
  const rangedFile = useGLTF(assets.ranged)
  const scene = useMemo(() => SkeletonUtils.clone(runFile.scene), [runFile.scene])
  const clips = useMemo(() => [
    lockMiniRootMotion(validateClipTargets(scene, prepareAnimationClip(runFile.animations[0], 'run'))),
    lockMiniRootMotion(validateClipTargets(scene, prepareAnimationClip(attackFile.animations[0], 'attack-0'))),
    lockMiniRootMotion(validateClipTargets(scene, prepareAnimationClip(heavyFile.animations[0], 'attack-1'))),
    lockMiniRootMotion(validateClipTargets(scene, prepareAnimationClip(kickFile.animations[0], 'attack-2'))),
    lockMiniRootMotion(validateClipTargets(scene, prepareAnimationClip(tripleFile.animations[0], 'attack-3'))),
    lockMiniRootMotion(validateClipTargets(scene, prepareAnimationClip(rangedFile.animations[0], 'attack-4'))),
  ], [attackFile.animations, heavyFile.animations, kickFile.animations, rangedFile.animations, runFile.animations, scene, tripleFile.animations])
  const mixer = useMemo(() => new AnimationMixer(scene), [scene])
  const actions = useMemo(() => Object.fromEntries(clips.map((clip) => [clip.name, mixer.clipAction(clip)])), [clips, mixer])
  const active = useRef('run')
  const animationAccumulator = useRef(0)

  useLayoutEffect(() => optimizeMiniAku(scene), [scene])
  useEffect(() => {
    Object.entries(actions).forEach(([name, action]) => {
      action.reset()
      action.enabled = true
      action.clampWhenFinished = name !== 'run'
      action.setLoop(name === 'run' ? LoopRepeat : LoopOnce, name === 'run' ? Infinity : 1)
      action.setEffectiveWeight(name === 'run' ? 1 : 0)
      action.paused = name !== 'run'
      action.play()
    })
    return () => { mixer.stopAllAction() }
  }, [actions, mixer])
  useFrame((_, delta) => {
    const enemy = currentEnemyById(bossId)
    if (!enemy || enemy.special !== 'aku-split') return
    animationAccumulator.current += Math.min(delta, 0.1)
    if (animationAccumulator.current < 1 / 20) return
    mixer.update(animationAccumulator.current)
    animationAccumulator.current = 0
    const elapsed = performance.now() - enemy.specialStartedAt
    const game = useGameStore.getState()
    const players = useSessionStore.getState().players
    const preferred = index % 2 === 0 ? 'ali' : 'jack'
    const fallback = preferred === 'ali' ? 'jack' : 'ali'
    const targetId = !players[preferred].dead ? preferred : fallback
    const attacking = getMiniAkuMotion(index, elapsed, enemy.x, game.positions[targetId][0]).attacking
    const target = attacking ? `attack-${index % 5}` : 'run'
    if (target === active.current) return
    const previous = actions[active.current]
    const action = actions[target]
    if (!action) return
    previous.paused = true
    previous.setEffectiveWeight(0)
    action.enabled = true
    action.time = 0
    action.setEffectiveWeight(1)
    action.paused = false
    active.current = target
  })
  return <primitive object={scene} />
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
  const enemy = useSessionStore(useShallow((state) => {
    const current = enemyById(state.enemies, id)
    return current ? {
      animation: current.animation, special: current.special, bossForm: current.bossForm,
      mimicKind: current.mimicKind, title: current.title,
    } : null
  }))
  const initialX = useMemo(() => currentEnemyById(id)?.x ?? 0, [id])
  const bossPhase = useSessionStore((state) => state.bossPhase)
  const gl = useThree((state) => state.gl)
  const camera = useThree((state) => state.camera)
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
  }, [monsterScene, normalScene])

  useEffect(() => {
    if (!root.current || !minisRoot.current) return
    const miniRoot = minisRoot.current
    miniRoot.visible = true
    miniGroups.current.forEach((mini) => mini.scale.setScalar(0.0001))
    void gl.compileAsync(root.current, camera).catch(() => undefined).finally(() => {
      const current = currentEnemyById(id)
      miniRoot.visible = current?.special === 'aku-split'
    })
  }, [camera, gl, id])

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
    const current = currentEnemyById(id)
    if (!root.current || !normalRoot.current || !monsterRoot.current || !minisRoot.current || !current) return
    const now = performance.now()
    root.current.position.x = MathUtils.damp(root.current.position.x, current.x, 15, Math.min(delta, 0.1))
    root.current.rotation.y = MathUtils.damp(root.current.rotation.y, current.direction > 0 ? Math.PI / 2 : -Math.PI / 2, 14, Math.min(delta, 0.1))
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
      minisRoot.current.rotation.set(0, -root.current.rotation.y, 0)
      const elapsed = now - current.specialStartedAt
      const game = useGameStore.getState()
      const players = useSessionStore.getState().players
      miniGroups.current.forEach((mini, index) => {
        const preferred = index % 2 === 0 ? 'ali' : 'jack'
        const fallback = preferred === 'ali' ? 'jack' : 'ali'
        const targetId = !players[preferred].dead ? preferred : fallback
        const motion = getMiniAkuMotion(index, elapsed, current.x, game.positions[targetId][0])
        mini.position.set(motion.x - current.x, motion.y, motion.z)
        mini.rotation.set(0, motion.direction > 0 ? Math.PI / 2 : -Math.PI / 2, 0)
        mini.scale.setScalar(current.scale * 0.28 * (motion.attacking ? 1.08 : 1))
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
    <group ref={root} position={[initialX, 0, 0]} name={enemy.title}>
      <group ref={normalRoot} scale={0}><primitive object={normalScene} /></group>
      <group ref={monsterRoot} scale={0}><primitive object={monsterScene} /></group>
      <group ref={minisRoot} visible={false}>
        {MINI_AKU_OFFSETS.map((offset, index) => <group key={offset} name={`mini-aku-${index + 1}`} ref={(group) => { if (group) miniGroups.current[index] = group }}><MiniAkuModel bossId={id} index={index} /></group>)}
      </group>
      {enemy.special === 'aku-shapeshift' && enemy.mimicKind ? <group scale={1.12}><MimicModel kind={enemy.mimicKind} /></group> : null}
      <group ref={morphRing} visible={false} position={[0, 1.35, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.3, 0.055, 8, 64]} /><meshBasicMaterial color="#9cff6b" transparent opacity={0.72} blending={AdditiveBlending} depthWrite={false} /></mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[1.55, 0.035, 7, 64]} /><meshBasicMaterial color="#130019" transparent opacity={0.8} /></mesh>
      </group>
    </group>
  )
}
