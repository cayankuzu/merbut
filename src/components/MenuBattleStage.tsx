import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, useAnimations, useGLTF } from '@react-three/drei'
import { AnimationClip, Box3, Group, LoopOnce, MathUtils, type Object3D, Vector3 } from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { AnimatedCharacter } from '../characters/AnimatedCharacter'
import { prepareAnimationClip } from '../animation/animationLoader'
import { validateClipTargets } from '../animation/animationRetargeting'
import { ASSET_PATHS } from '../config/assetPaths'
import { BOSS_MODEL_SCALES } from '../config/characterTransforms'
import { ENEMIES } from '../config/enemies'
import { CHARACTERS } from '../config/gameConfig'
import type { AnimationState } from '../types/animation'
import { isSafariWebkitEngine, PERFORMANCE_PROFILES, usePerformanceStore } from '../store/performanceStore'
import { MenuAttackEffect, type MenuAttackEffectKind } from './MenuAttackEffect'
import { advanceShowcaseMove, getMenuAttackDurationMs } from './menuShowcaseCycle'

export type MenuStageAction = 'idle' | 'heroes' | 'enemies'
type MenuStageVariant = 'menu' | 'splash'
type FighterSide = 'heroes' | 'enemies'
type MotionSet = readonly [string, string, string, string, string]
type EffectSet = readonly [MenuAttackEffectKind, MenuAttackEffectKind, MenuAttackEffectKind, MenuAttackEffectKind, MenuAttackEffectKind]

interface AttackState {
  durationMs: number
  moveNumber: number
  trigger: number
  variant: number
}

interface FighterProps {
  accent: string
  children: (state: AttackState) => ReactNode
  displayScale: number
  effects: EffectSet
  forced: boolean
  id: string
  index: number
  onCycleComplete: () => void
  onMove: (moveNumber: number) => void
  originY: number
  side: FighterSide
}

interface EnemyShowcaseDefinition {
  accent: string
  base: string
  column: number
  displayScale: number
  effects: EffectSet
  id: string
  modelScale: number
  motions: MotionSet
  name: string
  row: number
  rowCount: number
}

const repeatMotion = (motion: string): MotionSet => [motion, motion, motion, motion, motion]

const ENEMY_SHOWCASE: readonly EnemyShowcaseDefinition[] = [
  // `base` supplies the skinned mesh. It is never played as locomotion: the
  // action mixer below starts an attack clip immediately after mounting.
  { id: 'myrkhan', name: 'Myrkhan', row: 0, column: 0, rowCount: 3, base: ENEMIES[1].walk, motions: repeatMotion(ENEMIES[1].attack), modelScale: ENEMIES[1].scale, displayScale: 1, accent: ENEMIES[1].accent, effects: ['impact-ember', 'slash', 'impact-quake', 'shockwave', 'flame'] },
  { id: 'zorvex', name: 'Zorvex', row: 0, column: 1, rowCount: 3, base: ENEMIES[2].walk, motions: repeatMotion(ENEMIES[2].attack), modelScale: ENEMIES[2].scale, displayScale: 1, accent: ENEMIES[2].accent, effects: ['impact-void', 'slash', 'projectile', 'impact-void', 'shockwave'] },
  { id: 'kharzul', name: 'Kharzul', row: 0, column: 2, rowCount: 3, base: ENEMIES[3].walk, motions: repeatMotion(ENEMIES[3].attack), modelScale: ENEMIES[3].scale, displayScale: 1, accent: ENEMIES[3].accent, effects: ['impact-quake', 'shockwave', 'slash', 'impact-boss', 'slash'] },
  { id: 'vhalgor', name: 'Vhalgor', row: 2, column: 0, rowCount: 2, base: ENEMIES[4].walk, motions: repeatMotion(ENEMIES[4].attack), modelScale: ENEMIES[4].scale, displayScale: 1, accent: ENEMIES[4].accent, effects: ['projectile-stone', 'impact-quake', 'projectile-stone', 'shockwave', 'projectile-stone'] },
  { id: 'nexrath', name: 'Nexrath', row: 2, column: 1, rowCount: 2, base: ENEMIES[5].walk, motions: repeatMotion(ENEMIES[5].attack), modelScale: ENEMIES[5].scale, displayScale: 1, accent: ENEMIES[5].accent, effects: ['projectile-dark-orb', 'impact-void', 'projectile-dark-orb', 'flame', 'projectile-dark-orb'] },
  {
    id: 'aku-shadow', name: 'Aku’nun Gölgesi', row: 1, column: 0, rowCount: 3,
    base: ASSET_PATHS.bosses.evilJack.walk,
    motions: [ASSET_PATHS.bosses.evilJack.slash, ASSET_PATHS.bosses.evilJack.doubleCombo, ASSET_PATHS.bosses.evilJack.tripleCombo, ASSET_PATHS.bosses.evilJack.cast, ASSET_PATHS.bosses.evilJack.slash],
    modelScale: BOSS_MODEL_SCALES.shadow, displayScale: 1, accent: '#ff315f', effects: ['slash', 'impact-boss', 'shockwave', 'projectile-dark-orb', 'slash'],
  },
  {
    id: 'aku', name: 'Aku', row: 1, column: 1, rowCount: 3,
    base: ASSET_PATHS.bosses.aku.normal.walk,
    motions: [ASSET_PATHS.bosses.aku.normal.attack, ASSET_PATHS.bosses.aku.normal.heavy, ASSET_PATHS.bosses.aku.normal.kick, ASSET_PATHS.bosses.aku.normal.triple, ASSET_PATHS.bosses.aku.normal.ranged],
    modelScale: BOSS_MODEL_SCALES.aku, displayScale: 1, accent: '#75ff70', effects: ['impact-boss', 'shockwave', 'slash', 'flame', 'projectile-aku-fire'],
  },
  {
    id: 'aku-monster', name: 'Aku · Canavar', row: 1, column: 2, rowCount: 3,
    base: ASSET_PATHS.bosses.aku.monster.idle,
    motions: [ASSET_PATHS.bosses.aku.monster.slash, ASSET_PATHS.bosses.aku.monster.double, ASSET_PATHS.bosses.aku.monster.triple, ASSET_PATHS.bosses.aku.monster.spin, ASSET_PATHS.bosses.aku.monster.ranged],
    modelScale: BOSS_MODEL_SCALES.aku, displayScale: 1, accent: '#ff244f', effects: ['slash', 'impact-boss', 'shockwave', 'shockwave', 'projectile-aku-fire'],
  },
] as const

const CAMERA_CENTER_Y = 2.15
const HERO_SHOWCASE = ['ali', 'jack'] as const
const HERO_SHOWCASE_DEFINITIONS = {
  ali: { id: 'hz-ali', originY: 1.15, accent: '#f7c65f', effects: ['ali-slash', 'ali-fireball', 'impact-ember', 'ali-fireball', 'ali-slash'] },
  jack: { id: 'samuray-jack', originY: 1.15, accent: '#ff4c87', effects: ['jack-slash', 'jack-shield', 'impact-quake', 'jack-shield', 'jack-slash'] },
} as const satisfies Record<(typeof HERO_SHOWCASE)[number], { id: string; originY: number; accent: string; effects: EffectSet }>

function pickDifferentIndex(length: number, current: number) {
  if (length <= 1) return 0
  return (current + 1 + Math.floor(Math.random() * (length - 1))) % length
}

type RootMotionAnchors = ReadonlyMap<string, readonly [number, number, number]>

function keepShowcaseClipInPlace(clip: AnimationClip, anchors: RootMotionAnchors) {
  clip.tracks.forEach((track) => {
    const trackName = track.name.toLowerCase()
    if (!trackName.endsWith('.position') || !/(hips|pelvis|root|armature)/.test(trackName)) return

    const [anchoredX, anchoredY, anchoredZ] = anchors.get(trackName)
      ?? [track.values[0] ?? 0, track.values[1] ?? 0, track.values[2] ?? 0]
    for (let index = 0; index < track.values.length; index += 3) {
      track.values[index] = anchoredX
      track.values[index + 1] = anchoredY
      track.values[index + 2] = anchoredZ
    }
  })
  return clip
}

function prepareShowcaseAttackClip(
  scene: Object3D,
  source: AnimationClip | undefined,
  name: string,
  fallback: AnimationClip,
  anchors: RootMotionAnchors,
) {
  if (!source) return { clip: Object.assign(fallback.clone(), { name }), fallback: true }
  try {
    const clip = validateClipTargets(scene, prepareAnimationClip(source, name))
    return { clip: keepShowcaseClipInPlace(clip, anchors), fallback: false }
  } catch {
    return { clip: Object.assign(fallback.clone(), { name }), fallback: true }
  }
}

function shuffledVariants(count: number, previous: number) {
  const values = Array.from({ length: count }, (_, index) => index)
  for (let index = values.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
    ;[values[index], values[target]] = [values[target]!, values[index]!]
  }
  if (values.length > 1 && values.at(-1) === previous) {
    ;[values[0], values[values.length - 1]] = [values[values.length - 1]!, values[0]!]
  }
  return values
}

function useRandomAttackCycle(
  effects: EffectSet,
  forced: boolean,
  onCycleComplete: () => void,
  onMove: (moveNumber: number) => void,
  seed: number,
): AttackState {
  const variantCount = effects.length
  const [trigger, setTrigger] = useState(0)
  const [variant, setVariant] = useState(seed % variantCount)
  const [durationMs, setDurationMs] = useState(() => getMenuAttackDurationMs(effects[seed % variantCount] ?? effects[0]))
  const [moveNumber, setMoveNumber] = useState(0)
  const bag = useRef<number[]>([])
  const currentVariant = useRef(variant)

  const drawVariant = useCallback(() => {
    if (bag.current.length === 0) bag.current = shuffledVariants(variantCount, currentVariant.current)
    const next = bag.current.pop() ?? 0
    currentVariant.current = next
    return next
  }, [variantCount])

  useEffect(() => {
    let actionTimer = 0
    let recoveryTimer = 0
    let disposed = false
    let completedMoves = 0

    const strike = () => {
      if (disposed) return
      const nextVariant = drawVariant()
      const nextDurationMs = getMenuAttackDurationMs(effects[nextVariant] ?? effects[0])
      const progress = advanceShowcaseMove(completedMoves)
      completedMoves = progress.moveNumber
      setVariant(nextVariant)
      setDurationMs(nextDurationMs)
      setMoveNumber(progress.moveNumber)
      setTrigger((value) => value + 1)
      onMove(progress.moveNumber)
      actionTimer = window.setTimeout(() => {
        if (disposed) return
        if (progress.characterComplete) {
          onCycleComplete()
          return
        }
        // This is a combat recovery pose, not an idle/locomotion clip. The
        // character swap itself is driven solely by the completed move count.
        recoveryTimer = window.setTimeout(strike, 180)
      }, nextDurationMs)
    }

    strike()
    return () => {
      disposed = true
      window.clearTimeout(actionTimer)
      window.clearTimeout(recoveryTimer)
    }
  }, [drawVariant, effects, onCycleComplete, onMove, seed])

  useEffect(() => {
    if (!forced) return
    const nextVariant = drawVariant()
    setVariant(nextVariant)
    setDurationMs(getMenuAttackDurationMs(effects[nextVariant] ?? effects[0]))
    setTrigger((value) => value + 1)
  }, [drawVariant, effects, forced])

  return { durationMs, moveNumber, trigger, variant }
}

function ActionModel({ base, durationMs, motions, scale, trigger, variant }: { base: string; durationMs: number; motions: MotionSet; scale: number; trigger: number; variant: number }) {
  const baseFile = useGLTF(base)
  const motionFile0 = useGLTF(motions[0])
  const motionFile1 = useGLTF(motions[1])
  const motionFile2 = useGLTF(motions[2])
  const motionFile3 = useGLTF(motions[3])
  const motionFile4 = useGLTF(motions[4])
  const scene = useMemo(() => SkeletonUtils.clone(baseFile.scene), [baseFile.scene])
  const preparedActions = useMemo(() => {
    // Never fall back to the base walk/idle clip. If an optional attack is
    // incompatible, a stationary procedural strike and its combat effect run.
    const fallback = new AnimationClip('fallback-strike', 1, [])
    const anchors: RootMotionAnchors = new Map()
    return [
      prepareShowcaseAttackClip(scene, motionFile0.animations[0], 'attack-0', fallback, anchors),
      prepareShowcaseAttackClip(scene, motionFile1.animations[0], 'attack-1', fallback, anchors),
      prepareShowcaseAttackClip(scene, motionFile2.animations[0], 'attack-2', fallback, anchors),
      prepareShowcaseAttackClip(scene, motionFile3.animations[0], 'attack-3', fallback, anchors),
      prepareShowcaseAttackClip(scene, motionFile4.animations[0], 'attack-4', fallback, anchors),
    ]
  }, [motionFile0.animations, motionFile1.animations, motionFile2.animations, motionFile3.animations, motionFile4.animations, scene])
  const clips = useMemo(() => preparedActions.map((action) => action.clip), [preparedActions])
  const { actions } = useAnimations(clips, scene)
  const proceduralRoot = useRef<Group>(null)
  const actionStartedAt = useRef(performance.now())
  const actionsPrimed = useRef(false)

  // Keep showcase actions registered with their mixer for the lifetime of the
  // card so a new random move does not allocate work during combat playback.
  useEffect(() => {
    Object.values(actions).forEach((action) => {
      if (!action) return
      action.enabled = true
      action.paused = false
      action.clampWhenFinished = true
      action.setLoop(LoopOnce, 1)
      action.reset().play()
      action.setEffectiveWeight(0)
    })
    actionsPrimed.current = true
    return () => {
      actionsPrimed.current = false
      Object.values(actions).forEach((action) => action?.stop())
    }
  }, [actions])

  useEffect(() => {
    if (!actionsPrimed.current) return
    const actionName = `attack-${variant}`
    const selected = actions[actionName]
    if (!selected) return

    const clipDuration = clips[variant]?.duration ?? 0.86
    selected.enabled = true
    selected.paused = false
    selected.clampWhenFinished = true
    selected.setLoop(LoopOnce, 1)
    selected.timeScale = clipDuration / Math.max(0.1, durationMs / 1_000)
    selected.reset().play()
    Object.entries(actions).forEach(([name, candidate]) => {
      if (!candidate) return
      candidate.enabled = true
      candidate.setEffectiveWeight(name === actionName ? 1 : 0)
      if (name !== actionName) candidate.paused = true
    })
    actionStartedAt.current = performance.now()
  }, [actions, clips, durationMs, trigger, variant])

  const usesFallback = preparedActions[variant]?.fallback ?? true
  useFrame((_, delta) => {
    const root = proceduralRoot.current
    if (!root) return
    const progress = Math.min(1, (performance.now() - actionStartedAt.current) / durationMs)
    const recoil = usesFallback ? Math.sin(progress * Math.PI) : 0
    root.position.x = MathUtils.damp(root.position.x, -recoil * 0.12, 18, delta)
    root.rotation.z = MathUtils.damp(root.rotation.z, recoil * 0.12, 18, delta)
  })

  return <group ref={proceduralRoot}><primitive object={scene} scale={scale} /></group>
}

function Hero({ durationMs, id, trigger, variant }: { durationMs: number; id: 'ali' | 'jack'; trigger: number; variant: number }) {
  const animation: AnimationState = id === 'ali' && (variant === 1 || variant === 3)
      ? 'fireball'
      : id === 'jack' && (variant === 1 || variant === 3)
        ? 'shield'
        : 'attack'
  return <AnimatedCharacter definition={CHARACTERS[id]} animationDurationSeconds={durationMs / 1_000} animationState={animation} animationSignal={trigger} />
}

function FootAlignedModel({ children, effectOriginY, effectScale }: { children: ReactNode; effectOriginY: MutableRefObject<number>; effectScale: number }) {
  const anchor = useRef<Group>(null)
  const visual = useRef<Group>(null)
  const bounds = useMemo(() => new Box3(), [])
  const anchorPosition = useMemo(() => new Vector3(), [])
  const anchorScale = useMemo(() => new Vector3(), [])
  const nextMeasurementAt = useRef(0)
  const initialized = useRef(false)
  const hiddenWeapons = useRef<Object3D[]>([])

  useFrame(({ clock }) => {
    if (!anchor.current || !visual.current || clock.elapsedTime < nextMeasurementAt.current) return
    nextMeasurementAt.current = clock.elapsedTime + 0.08

    const hidden = hiddenWeapons.current
    hidden.length = 0
    visual.current.traverse((node) => {
      if (node.name === 'WeaponSocket' && node.visible) {
        hidden.push(node)
        node.visible = false
      }
    })
    visual.current.updateWorldMatrix(true, true)
    bounds.makeEmpty().setFromObject(visual.current, true)
    hidden.forEach((weapon) => { weapon.visible = true })
    if (bounds.isEmpty() || !Number.isFinite(bounds.min.y)) return

    anchor.current.getWorldPosition(anchorPosition)
    anchor.current.getWorldScale(anchorScale)
    const scaleY = Math.max(0.0001, Math.abs(anchorScale.y))
    const targetY = visual.current.position.y + (anchorPosition.y - bounds.min.y) / scaleY
    visual.current.position.y = initialized.current
      ? MathUtils.damp(visual.current.position.y, targetY, 20, 0.08)
      : targetY
    const localFloor = (bounds.min.y - anchorPosition.y) / scaleY
    const localHeight = (bounds.max.y - bounds.min.y) / scaleY
    // Combat effects live outside the scaled visual group. Store a live,
    // model-derived torso/weapon height in fighter coordinates so every body
    // size receives the same alignment as its in-game counterpart.
    effectOriginY.current = (localFloor + Math.max(0.42, localHeight * 0.56)) * effectScale
    initialized.current = true
  })

  return <group ref={anchor}><group ref={visual}>{children}</group></group>
}

function Fighter({ accent, children, displayScale, effects, forced, id, index, onCycleComplete, onMove, originY, side }: FighterProps) {
  const root = useRef<Group>(null)
  const effectOriginY = useRef(originY * displayScale)
  const viewportWidth = useThree((state) => state.viewport.width)
  const viewportHeight = useThree((state) => state.viewport.height)
  const shadows = usePerformanceStore((state) => PERFORMANCE_PROFILES[state.tier].shadows)
  const attack = useRandomAttackCycle(effects, forced, onCycleComplete, onMove, index + (side === 'enemies' ? 20 : 0))
  const screenPosition = 0.79
  const desiredX = viewportWidth * (side === 'heroes' ? -0.41 : 0.41)
  const baseX = desiredX
  const baseY = CAMERA_CENTER_Y + (0.5 - screenPosition) * viewportHeight

  useFrame(({ clock }, delta) => {
    const group = root.current
    if (!group) return
    const charge = forced ? (side === 'heroes' ? 0.58 : -0.58) : 0
    const breathing = Math.sin(clock.elapsedTime * 0.72 + index * 1.4) * 0.055
    group.position.x = MathUtils.damp(group.position.x, baseX + charge + breathing, 8.5, delta)
    group.position.y = baseY + Math.sin(clock.elapsedTime * (1.35 + index * 0.04) + index * 1.7) * 0.032 + (forced ? 0.08 : 0)
    group.rotation.z = Math.sin(clock.elapsedTime * 1.25 + index) * 0.008
  })

  return (
    <group ref={root} name={id} position={[baseX, baseY, side === 'heroes' ? -0.08 : -0.28]}>
      <group rotation={[0, side === 'heroes' ? 0 : -Math.PI / 2, 0]} scale={displayScale}>
        <FootAlignedModel effectOriginY={effectOriginY} effectScale={displayScale}>{children(attack)}</FootAlignedModel>
      </group>
      {shadows ? <ContactShadows position={[0, 0.01, 0]} scale={side === 'heroes' ? 5 : 7} opacity={0.32} blur={2.4} far={4} color="#060104" /> : null}
      <MenuAttackEffect
        accent={accent}
        direction={side === 'heroes' ? 1 : -1}
        durationMs={attack.durationMs}
        kind={effects[attack.variant] ?? effects[0]}
        originY={originY * displayScale}
        originYRef={effectOriginY}
        presentationScale={displayScale}
        trigger={attack.trigger}
        variant={attack.variant}
      />
    </group>
  )
}

function StageCast({ action, activeEnemyIndex, activeHeroIndex, onEnemyCycleComplete, onEnemyMove, onHeroCycleComplete, onHeroMove }: {
  action: MenuStageAction
  activeEnemyIndex: number
  activeHeroIndex: number
  onEnemyCycleComplete: () => void
  onEnemyMove: (moveNumber: number) => void
  onHeroCycleComplete: () => void
  onHeroMove: (moveNumber: number) => void
}) {
  const heroId = HERO_SHOWCASE[activeHeroIndex] ?? 'ali'
  const hero = HERO_SHOWCASE_DEFINITIONS[heroId]
  const enemy = ENEMY_SHOWCASE[activeEnemyIndex] ?? ENEMY_SHOWCASE[0]
  return (
    <>
      <Suspense fallback={null}>
        <Fighter key={hero.id} id={hero.id} side="heroes" index={activeHeroIndex} displayScale={1} originY={hero.originY} accent={hero.accent} effects={hero.effects} forced={action === 'heroes'} onCycleComplete={onHeroCycleComplete} onMove={onHeroMove}>
          {({ durationMs, trigger, variant }) => <Hero durationMs={durationMs} id={heroId} trigger={trigger} variant={variant} />}
        </Fighter>
      </Suspense>
      <Suspense fallback={null}>
        <Fighter
          key={enemy.id}
          id={enemy.id}
          side="enemies"
          index={activeEnemyIndex + 2}
          displayScale={enemy.displayScale}
          originY={enemy.row === 1 ? 2.1 : 1.15}
          accent={enemy.accent}
          effects={enemy.effects}
          forced={action === 'enemies'}
          onCycleComplete={onEnemyCycleComplete}
          onMove={onEnemyMove}
        >
          {({ durationMs, trigger, variant }) => <ActionModel base={enemy.base} durationMs={durationMs} motions={enemy.motions} scale={enemy.modelScale} trigger={trigger} variant={variant} />}
        </Fighter>
      </Suspense>
    </>
  )
}

function BudgetedMenuFrames({ enabled, fps }: { enabled: boolean; fps: number }) {
  const invalidate = useThree((state) => state.invalidate)
  useEffect(() => {
    if (!enabled) return
    const timer = window.setInterval(invalidate, 1_000 / fps)
    return () => window.clearInterval(timer)
  }, [enabled, fps, invalidate])
  return null
}

export function MenuBattleStage({ action = 'idle', variant = 'menu' }: { action?: MenuStageAction; variant?: MenuStageVariant }) {
  const splash = variant === 'splash'
  const [activeHeroIndex, setActiveHeroIndex] = useState(() => Math.floor(Math.random() * HERO_SHOWCASE.length))
  const [activeEnemyIndex, setActiveEnemyIndex] = useState(() => Math.floor(Math.random() * ENEMY_SHOWCASE.length))
  const [heroMoveNumber, setHeroMoveNumber] = useState(0)
  const [enemyMoveNumber, setEnemyMoveNumber] = useState(0)
  const activeHeroName = HERO_SHOWCASE[activeHeroIndex] === 'jack' ? 'Samuray Jack' : 'Hz. Ali'
  const activeEnemyName = (ENEMY_SHOWCASE[activeEnemyIndex] ?? ENEMY_SHOWCASE[0]).name
  const tier = usePerformanceStore((state) => state.tier)
  const profile = PERFORMANCE_PROFILES[tier]
  const budgetMenuFrames = isSafariWebkitEngine() || tier === 'minimal' || tier === 'performance'

  const rotateHero = useCallback(() => {
    setHeroMoveNumber(0)
    setActiveHeroIndex((index) => pickDifferentIndex(HERO_SHOWCASE.length, index))
  }, [])
  const rotateEnemy = useCallback(() => {
    setEnemyMoveNumber(0)
    setActiveEnemyIndex((index) => pickDifferentIndex(ENEMY_SHOWCASE.length, index))
  }, [])

  return (
    <div
      className={`menu-battle-stage menu-battle-stage--${variant} is-${action}`}
      aria-label="Hz. Ali, Samuray Jack ve Aku lejyonu dikey sütunlarda savaş pozunda"
      data-enemy-move={enemyMoveNumber}
      data-hero-move={heroMoveNumber}
    >
      <Canvas orthographic frameloop={budgetMenuFrames ? 'demand' : 'always'} dpr={profile.dpr} camera={{ position: [0, CAMERA_CENTER_Y, 14], rotation: [0, 0, 0], zoom: splash ? 75 : 94 }} gl={{ alpha: true, antialias: profile.antialias, powerPreference: 'high-performance' }}>
        <BudgetedMenuFrames enabled={budgetMenuFrames} fps={profile.menuFps} />
        <ambientLight intensity={splash ? 2.28 : 1.72} />
        <directionalLight position={[-4, 8, 8]} intensity={splash ? 5.4 : 4.2} color="#ffe0b0" />
        {profile.dynamicLights ? <>
          <hemisphereLight args={['#ffe8c5', '#2a0812', splash ? 1.3 : 0.95]} />
          <directionalLight position={[-7, 5, 5]} intensity={splash ? 2.2 : 1.65} color="#ffb541" />
          <directionalLight position={[7, 4, 5]} intensity={splash ? 2.65 : 2} color="#ff3e62" />
        </> : null}
        <StageCast
          action={action}
          activeEnemyIndex={activeEnemyIndex}
          activeHeroIndex={activeHeroIndex}
          onEnemyCycleComplete={rotateEnemy}
          onEnemyMove={setEnemyMoveNumber}
          onHeroCycleComplete={rotateHero}
          onHeroMove={setHeroMoveNumber}
        />
      </Canvas>
      <div className="menu-battle-stage__hero-glow" aria-hidden="true" />
      <div className="menu-battle-stage__enemy-glow" aria-hidden="true" />
      <div className="menu-battle-stage__fighter-labels" aria-hidden="true">
        <span className="menu-fighter-name menu-fighter-name--heroes">{activeHeroName}</span>
        <span className="menu-fighter-name menu-fighter-name--enemies">{activeEnemyName}</span>
      </div>
      <ul className="sr-only" aria-label="Kahramanlar">
        {['Hz. Ali', 'Samuray Jack'].map((name) => <li key={name}>{name}</li>)}
      </ul>
      <ul className="sr-only" aria-label="Yakın dövüşçüler">
        {ENEMY_SHOWCASE.filter((enemy) => enemy.row === 0).map((enemy) => <li key={enemy.id}>{enemy.name}</li>)}
      </ul>
      <ul className="sr-only" aria-label="Bosslar">
        {ENEMY_SHOWCASE.filter((enemy) => enemy.row === 1).map((enemy) => <li key={enemy.id}>{enemy.name}</li>)}
      </ul>
      <ul className="sr-only" aria-label="Uzak dövüşçüler">
        {ENEMY_SHOWCASE.filter((enemy) => enemy.row === 2).map((enemy) => <li key={enemy.id}>{enemy.name}</li>)}
      </ul>
    </div>
  )
}
