import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react'
import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, useAnimations, useGLTF } from '@react-three/drei'
import { AnimationClip, Box3, Group, LoopOnce, MathUtils, type Object3D, Vector3 } from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { AnimatedCharacter } from '../characters/AnimatedCharacter'
import { EvilJackCharacter, type EvilJackAction } from '../characters/EvilJackCharacter'
import { JackSheath, type SheathSource } from '../characters/JackSheath'
import { ATTACK_DURATION } from '../config/combat'
import type { BladeKey } from '../game/vfx/bladeRegistry'
import { EFFECTS } from '../game/vfx/effects'
import { BladeTrail, type TrailSource } from '../game/vfx/SwordTrails'
import type { AttackStep } from '../store/gameStore'
import { prepareAnimationClip } from '../animation/animationLoader'
import { validateClipTargets } from '../animation/animationRetargeting'
import { ASSET_PATHS } from '../config/assetPaths'
import { BOSS_MODEL_SCALES } from '../config/characterTransforms'
import { ENEMIES } from '../config/enemies'
import { CHARACTERS } from '../config/gameConfig'
import type { AnimationState } from '../types/animation'
import { isSafariWebkitEngine, PERFORMANCE_PROFILES, usePerformanceStore } from '../store/performanceStore'
import { MenuAttackEffect, type MenuAttackEffectKind } from './MenuAttackEffect'
import { advanceShowcaseMove, getMenuAttackDurationMs, HERO_COMBO_OFFSETS_MS, HERO_COMBO_MS } from './menuShowcaseCycle'
import { useStageVfx, type StageVfx } from './stageVfx'
import { StageVfxLayer } from './StageVfxLayer'

export type MenuStageAction = 'idle' | 'heroes' | 'enemies'
type MenuStageVariant = 'menu' | 'splash'
/**
 * 'wide' frames the title and splash with the heroes at the left edge. 'duel'
 * is the main menu: the menu column owns the left, so the heroes step into
 * the middle and face the enemy across the right two thirds.
 */
export type MenuStageComposition = 'wide' | 'duel'
const FIGHTER_SCREEN_X: Record<MenuStageComposition, Record<'heroes' | 'enemies', number>> = {
  wide: { heroes: -0.41, enemies: 0.41 },
  duel: { heroes: 0.07, enemies: 0.39 },
}
type FighterSide = 'heroes' | 'enemies'
type MotionSet = readonly [string, string, string, string, string]
type EffectSet = readonly [MenuAttackEffectKind, MenuAttackEffectKind, MenuAttackEffectKind, MenuAttackEffectKind, MenuAttackEffectKind]

interface AttackState {
  durationMs: number
  moveNumber: number
  trigger: number
  variant: number
}

interface FighterStage extends AttackState {
  originYRef: MutableRefObject<number>
  vfx: StageVfx
}

interface FighterProps {
  accent: string
  children: (state: FighterStage) => ReactNode
  displayScale: number
  effects: EffectSet
  forced: boolean
  id: string
  index: number
  onCycleComplete: () => void
  onMove: (moveNumber: number) => void
  /** Called once the fighter's models have loaded and it is on stage. */
  onReady: (id: string) => void
  originY: number
  /** Pause after a move; heroes use it to settle and sheathe the blade. */
  recoveryMs?: number
  /** Horizontal position as a fraction of the viewport width from its centre. */
  screenX: number
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
    modelScale: BOSS_MODEL_SCALES.shadow, displayScale: 1, accent: '#ff315f', effects: ['shadow-slash', 'shadow-combo', 'shadow-combo', 'shadow-cast', 'shadow-slash'],
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
  // The same moves the heroes have in play: the three-cut chain with its spinning finisher, and each hero's ability.
  ali: { id: 'hz-ali', originY: 1.15, accent: '#f7c65f', effects: ['ali-slash', 'ali-fireball', 'ali-slash', 'ali-fireball', 'ali-slash'] },
  jack: { id: 'samuray-jack', originY: 1.15, accent: '#ff4c87', effects: ['jack-slash', 'jack-shield', 'jack-slash', 'jack-shield', 'jack-slash'] },
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
  recoveryMs: number,
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
          if (recoveryMs > 180) recoveryTimer = window.setTimeout(onCycleComplete, recoveryMs)
          else onCycleComplete()
          return
        }
        // This is a combat recovery pose, not an idle/locomotion clip. The
        // character swap itself is driven solely by the completed move count.
        recoveryTimer = window.setTimeout(strike, recoveryMs)
      }, nextDurationMs)
    }

    strike()
    return () => {
      disposed = true
      window.clearTimeout(actionTimer)
      window.clearTimeout(recoveryTimer)
    }
  }, [drawVariant, effects, onCycleComplete, onMove, recoveryMs, seed])

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

const HERO_TINT = { ali: '#ffb347', jack: '#9fd8ff' } as const
/** How far into each cut the blow lands; the finisher connects as the spin comes back around. */
const CUT_CONTACT: Record<AttackStep, number> = { 1: 0.45, 2: 0.45, 3: 0.8 }
const CUT_LUNGE: Record<AttackStep, number> = { 1: 0.12, 2: 0.26, 3: 0.46 }
const CUT_ANGLE: Record<AttackStep, number> = { 1: -0.62, 2: 0.52, 3: 0.08 }

function comboStepAt(elapsedMs: number): AttackStep {
  if (elapsedMs >= HERO_COMBO_OFFSETS_MS[2]) return 3
  if (elapsedMs >= HERO_COMBO_OFFSETS_MS[1]) return 2
  return 1
}

function Hero({ durationMs, id, kind, originYRef, trigger, vfx }: {
  durationMs: number
  id: 'ali' | 'jack'
  kind: MenuAttackEffectKind
  originYRef: MutableRefObject<number>
  trigger: number
  vfx: StageVfx
}) {
  const ability = kind === 'ali-fireball' || kind === 'jack-shield'
  const move: AnimationState = kind === 'ali-fireball' ? 'fireball' : kind === 'jack-shield' ? 'shield' : 'attack'
  const [cut, setCut] = useState<{ trigger: number; step: AttackStep }>({ trigger: 0, step: 1 })
  const [restingAfter, setRestingAfter] = useState(-1)
  const step: AttackStep = cut.trigger === trigger ? cut.step : 1
  const animation: AnimationState = restingAfter === trigger ? 'idle' : move
  const body = useRef<Group>(null)
  const timeline = useRef({ startedAt: Number.NEGATIVE_INFINITY, moveEndsAt: Number.NEGATIVE_INFINITY, landed: 0, combo: false })
  const blade: BladeKey = `showcase-${id}`
  const scene = useThree((state) => state.scene)

  useEffect(() => {
    if (trigger === 0) return
    const now = performance.now()
    timeline.current = { startedAt: now, moveEndsAt: now + durationMs, landed: 0, combo: !ability }
    const rest = window.setTimeout(() => setRestingAfter(trigger), durationMs)
    // Same chain as in play: two quick cuts, then the spinning finisher.
    const cuts = ability ? [] : ([2, 3] as const).map((next) => window.setTimeout(() => setCut({ trigger, step: next }), HERO_COMBO_OFFSETS_MS[next - 1]))
    return () => {
      window.clearTimeout(rest)
      cuts.forEach((timer) => window.clearTimeout(timer))
    }
  }, [ability, durationMs, trigger])

  const trailSource = useMemo<TrailSource>(() => ({
    swinging: () => {
      const elapsed = performance.now() - timeline.current.startedAt
      return timeline.current.combo && elapsed >= 0 && elapsed < HERO_COMBO_MS
    },
    now: () => performance.now() / 1_000,
  }), [])
  const sheathSource = useMemo<SheathSource>(() => ({
    fighting: () => performance.now() < timeline.current.moveEndsAt,
    keepDrawn: () => false,
    audible: () => false,
    glint: () => true,
    now: () => performance.now(),
    sheatheAfterMs: 380,
    pools: vfx.pools,
    toPoolSpace: vfx.toLocal,
  }), [vfx])

  useFrame((_, delta) => {
    const group = body.current
    if (!group) return
    const elapsed = performance.now() - timeline.current.startedAt
    const inCombo = trailSource.swinging()
    const current = comboStepAt(elapsed)
    const cutProgress = (elapsed - HERO_COMBO_OFFSETS_MS[current - 1]!) / (ATTACK_DURATION[current] * 1_000)

    // The finisher turns a full circle and ends facing the same way.
    if (inCombo && current === 3) {
      const spin = MathUtils.clamp(cutProgress, 0, 1)
      group.rotation.y = spin * spin * (3 - 2 * spin) * Math.PI * 2
    } else {
      group.rotation.y = 0
    }
    group.position.x = MathUtils.damp(group.position.x, inCombo ? CUT_LUNGE[current] : 0, inCombo ? 10 : 3.5, delta)

    // Each cut lands on an unseen foe in front: sparks, an anime cut line, dust on the finisher.
    const bit = 1 << current
    if (inCombo && cutProgress >= CUT_CONTACT[current] && !(timeline.current.landed & bit)) {
      timeline.current.landed |= bit
      const heavy = current === 3
      const x = group.position.x + 1.35
      const y = originYRef.current + (current === 1 ? 0.1 : 0)
      vfx.slashes.spawn(x, y, 1, heavy ? 3 : 2.2, HERO_TINT[id], { angle: CUT_ANGLE[current], ms: heavy ? 200 : 150 })
      vfx.emit(() => {
        EFFECTS.swordHit(x, y, 1, HERO_TINT[id], heavy)
        if (heavy) EFFECTS.dust(group.position.x + 0.3, 0, 1.1)
      })
    }
  })

  return (
    <>
      <group ref={body}>
        <AnimatedCharacter
          bladeId={blade}
          definition={CHARACTERS[id]}
          animationDurationSeconds={ability ? durationMs / 1_000 : ATTACK_DURATION[step]}
          animationState={animation}
          animationSignal={trigger * 4 + step}
        />
        {id === 'jack' ? <JackSheath blade={blade} facingGroup={body} source={sheathSource} /> : null}
      </group>
      {createPortal(<BladeTrail blade={blade} hero={id} source={trailSource} />, scene)}
    </>
  )
}

const SHADOW_SHOWCASE_ACTIONS: readonly EvilJackAction[] = ['slash', 'double', 'triple', 'cast', 'slash']

/** Uses the exact boss rig/weapon path so menu combos keep the katana socket. */
function ShadowShowcase({ trigger, variant }: { trigger: number; variant: number }) {
  const action = SHADOW_SHOWCASE_ACTIONS[variant] ?? 'slash'
  return (
    <group scale={BOSS_MODEL_SCALES.shadow}>
      <EvilJackCharacter key={`${action}-${trigger}`} action={action} shadows={false} />
    </group>
  )
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

function Fighter({ accent, children, displayScale, effects, forced, id, index, onCycleComplete, onMove, onReady, originY, recoveryMs = 180, screenX, side }: FighterProps) {
  const root = useRef<Group>(null)
  useEffect(() => onReady(id), [id, onReady])
  const effectOriginY = useRef(originY * displayScale)
  const vfx = useStageVfx(root)
  const viewportWidth = useThree((state) => state.viewport.width)
  const viewportHeight = useThree((state) => state.viewport.height)
  const shadows = usePerformanceStore((state) => PERFORMANCE_PROFILES[state.tier].shadows)
  const attack = useRandomAttackCycle(effects, forced, onCycleComplete, onMove, index + (side === 'enemies' ? 20 : 0), recoveryMs)
  const screenPosition = 0.79
  const baseX = viewportWidth * screenX
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
        <FootAlignedModel effectOriginY={effectOriginY} effectScale={displayScale}>{children({ ...attack, originYRef: effectOriginY, vfx })}</FootAlignedModel>
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
        vfx={vfx}
      />
      <StageVfxLayer vfx={vfx} />
    </group>
  )
}

function StageCast({ action, activeEnemyIndex, activeHeroIndex, composition, onEnemyCycleComplete, onEnemyMove, onHeroCycleComplete, onHeroMove, onReady }: {
  action: MenuStageAction
  composition: MenuStageComposition
  onReady: (id: string) => void
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
        <Fighter key={hero.id} id={hero.id} side="heroes" index={activeHeroIndex} displayScale={1} originY={hero.originY} accent={hero.accent} effects={hero.effects} forced={action === 'heroes'} onCycleComplete={onHeroCycleComplete} onMove={onHeroMove} onReady={onReady} recoveryMs={700} screenX={FIGHTER_SCREEN_X[composition].heroes}>
          {({ durationMs, originYRef, trigger, variant, vfx }) => <Hero durationMs={durationMs} id={heroId} kind={hero.effects[variant] ?? hero.effects[0]} originYRef={originYRef} trigger={trigger} vfx={vfx} />}
        </Fighter>
      </Suspense>
      <Suspense fallback={null}>
        <Fighter
          key={enemy.id}
          id={enemy.id}
          side="enemies"
          screenX={FIGHTER_SCREEN_X[composition].enemies}
          index={activeEnemyIndex + 2}
          displayScale={enemy.displayScale}
          originY={enemy.row === 1 ? 2.1 : 1.15}
          accent={enemy.accent}
          effects={enemy.effects}
          forced={action === 'enemies'}
          onCycleComplete={onEnemyCycleComplete}
          onMove={onEnemyMove}
          onReady={onReady}
        >
          {({ durationMs, trigger, variant }) => enemy.id === 'aku-shadow'
            ? <ShadowShowcase trigger={trigger} variant={variant} />
            : <ActionModel base={enemy.base} durationMs={durationMs} motions={enemy.motions} scale={enemy.modelScale} trigger={trigger} variant={variant} />}
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

export function MenuBattleStage({ action = 'idle', composition = 'wide', variant = 'menu' }: { action?: MenuStageAction; composition?: MenuStageComposition; variant?: MenuStageVariant }) {
  const splash = variant === 'splash'
  const [activeHeroIndex, setActiveHeroIndex] = useState(() => Math.floor(Math.random() * HERO_SHOWCASE.length))
  const [activeEnemyIndex, setActiveEnemyIndex] = useState(() => Math.floor(Math.random() * ENEMY_SHOWCASE.length))
  const [heroMoveNumber, setHeroMoveNumber] = useState(0)
  const [enemyMoveNumber, setEnemyMoveNumber] = useState(0)
  const activeHeroName = HERO_SHOWCASE[activeHeroIndex] === 'jack' ? 'Samuray Jack' : 'Hz. Ali'
  const activeEnemyName = (ENEMY_SHOWCASE[activeEnemyIndex] ?? ENEMY_SHOWCASE[0]).name
  const tier = usePerformanceStore((state) => state.tier)
  const graphicsPreference = usePerformanceStore((state) => state.preference)
  const qualityFactor = usePerformanceStore((state) => state.qualityFactor)
  const renderDpr = usePerformanceStore((state) => state.renderDpr)
  const profile = PERFORMANCE_PROFILES[tier]
  const budgetMenuFrames = tier === 'minimal'
    || tier === 'performance'
    || qualityFactor < 0.72
    || (graphicsPreference === 'auto' && isSafariWebkitEngine())
  const effectiveMenuFps = qualityFactor < 0.5 ? 30 : qualityFactor < 0.75 ? 45 : profile.menuFps

  // Names appear with their fighter, never over an empty stage while models stream in.
  const [readyIds, setReadyIds] = useState<ReadonlySet<string>>(() => new Set())
  const markReady = useCallback((id: string) => setReadyIds((ids) => (ids.has(id) ? ids : new Set(ids).add(id))), [])
  const heroReady = readyIds.has(HERO_SHOWCASE_DEFINITIONS[HERO_SHOWCASE[activeHeroIndex] ?? 'ali'].id)
  const enemyReady = readyIds.has((ENEMY_SHOWCASE[activeEnemyIndex] ?? ENEMY_SHOWCASE[0]).id)

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
      className={`menu-battle-stage menu-battle-stage--${variant} menu-battle-stage--${composition} is-${action}`}
      aria-label="Hz. Ali, Samuray Jack ve Aku lejyonu dikey sütunlarda savaş pozunda"
      data-enemy-move={enemyMoveNumber}
      data-hero-move={heroMoveNumber}
    >
      <Canvas key={`menu-renderer-${profile.antialias ? 'aa' : 'raw'}`} orthographic frameloop={budgetMenuFrames ? 'demand' : 'always'} dpr={renderDpr} camera={{ position: [0, CAMERA_CENTER_Y, 14], rotation: [0, 0, 0], zoom: splash ? 75 : 94 }} gl={{ alpha: true, antialias: profile.antialias, powerPreference: 'high-performance' }}>
        <BudgetedMenuFrames enabled={budgetMenuFrames} fps={effectiveMenuFps} />
        <ambientLight intensity={splash ? 2.28 : 1.72} />
        <directionalLight position={[-4, 8, 8]} intensity={splash ? 5.4 : 4.2} color="#ffe0b0" />
        {profile.dynamicLights ? <>
          <hemisphereLight args={['#ffe8c5', '#2a0812', splash ? 1.3 : 0.95]} />
          <directionalLight position={[-7, 5, 5]} intensity={splash ? 2.2 : 1.65} color="#ffb541" />
          <directionalLight position={[7, 4, 5]} intensity={splash ? 2.65 : 2} color="#ff3e62" />
        </> : null}
        <StageCast
          action={action}
          composition={composition}
          activeEnemyIndex={activeEnemyIndex}
          activeHeroIndex={activeHeroIndex}
          onEnemyCycleComplete={rotateEnemy}
          onEnemyMove={setEnemyMoveNumber}
          onHeroCycleComplete={rotateHero}
          onHeroMove={setHeroMoveNumber}
          onReady={markReady}
        />
      </Canvas>
      <div className="menu-battle-stage__hero-glow" aria-hidden="true" />
      <div className="menu-battle-stage__enemy-glow" aria-hidden="true" />
      <div className="menu-battle-stage__fighter-labels" aria-hidden="true">
        <span className={`menu-fighter-name menu-fighter-name--heroes${heroReady ? ' is-ready' : ''}`}>{activeHeroName}</span>
        <span className={`menu-fighter-name menu-fighter-name--enemies${enemyReady ? ' is-ready' : ''}`}>{activeEnemyName}</span>
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
