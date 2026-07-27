import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, useAnimations, useGLTF, useProgress } from '@react-three/drei'
import { type AnimationClip, Box3, Group, LoopOnce, LoopRepeat, MathUtils, type Object3D, Vector3 } from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { AnimatedCharacter } from '../characters/AnimatedCharacter'
import { prepareAnimationClip } from '../animation/animationLoader'
import { validateClipTargets } from '../animation/animationRetargeting'
import { ASSET_PATHS } from '../config/assetPaths'
import { ENEMIES } from '../config/enemies'
import { CHARACTERS } from '../config/gameConfig'
import type { AnimationState } from '../types/animation'
import { MenuAttackEffect, type MenuAttackEffectKind } from './MenuAttackEffect'

export type MenuStageAction = 'idle' | 'heroes' | 'enemies'
type MenuStageVariant = 'menu' | 'splash'
type FighterSide = 'heroes' | 'enemies'
type MotionSet = readonly [string, string, string]

interface AttackState {
  attacking: boolean
  trigger: number
  variant: number
}

interface FighterProps {
  accent: string
  children: (state: AttackState) => ReactNode
  displayScale: number
  effect: MenuAttackEffectKind
  effectVariants?: readonly [MenuAttackEffectKind, MenuAttackEffectKind, MenuAttackEffectKind]
  forced: boolean
  id: string
  index: number
  originY: number
  side: FighterSide
}

interface EnemyShowcaseDefinition {
  accent: string
  base: string
  column: number
  displayScale: number
  effect: MenuAttackEffectKind
  id: string
  modelScale: number
  motions: MotionSet
  name: string
  row: number
  rowCount: number
}

const repeatMotion = (motion: string): MotionSet => [motion, motion, motion]

const ENEMY_SHOWCASE: readonly EnemyShowcaseDefinition[] = [
  { id: 'myrkhan', name: 'Myrkhan', row: 0, column: 0, rowCount: 3, base: ENEMIES[1].walk, motions: repeatMotion(ENEMIES[1].attack), modelScale: ENEMIES[1].scale, displayScale: 1.24, accent: ENEMIES[1].accent, effect: 'impact-ember' },
  { id: 'zorvex', name: 'Zorvex', row: 0, column: 1, rowCount: 3, base: ENEMIES[2].walk, motions: repeatMotion(ENEMIES[2].attack), modelScale: ENEMIES[2].scale, displayScale: 1.18, accent: ENEMIES[2].accent, effect: 'impact-void' },
  { id: 'kharzul', name: 'Kharzul', row: 0, column: 2, rowCount: 3, base: ENEMIES[3].walk, motions: repeatMotion(ENEMIES[3].attack), modelScale: ENEMIES[3].scale, displayScale: 1.28, accent: ENEMIES[3].accent, effect: 'impact-quake' },
  { id: 'vhalgor', name: 'Vhalgor', row: 2, column: 0, rowCount: 2, base: ENEMIES[4].walk, motions: repeatMotion(ENEMIES[4].attack), modelScale: ENEMIES[4].scale, displayScale: 1.18, accent: ENEMIES[4].accent, effect: 'projectile-stone' },
  { id: 'nexrath', name: 'Nexrath', row: 2, column: 1, rowCount: 2, base: ENEMIES[5].walk, motions: repeatMotion(ENEMIES[5].attack), modelScale: ENEMIES[5].scale, displayScale: 1.22, accent: ENEMIES[5].accent, effect: 'projectile-dark-orb' },
  {
    id: 'aku-shadow', name: 'Aku’nun Gölgesi', row: 1, column: 0, rowCount: 3,
    base: ASSET_PATHS.bosses.evilJack.walk,
    motions: [ASSET_PATHS.bosses.evilJack.slash, ASSET_PATHS.bosses.evilJack.doubleCombo, ASSET_PATHS.bosses.evilJack.tripleCombo],
    modelScale: 2.35, displayScale: 1.16, accent: '#ff315f', effect: 'impact-boss',
  },
  {
    id: 'aku', name: 'Aku', row: 1, column: 1, rowCount: 3,
    base: ASSET_PATHS.bosses.aku.normal.walk,
    motions: [ASSET_PATHS.bosses.aku.normal.attack, ASSET_PATHS.bosses.aku.normal.heavy, ASSET_PATHS.bosses.aku.normal.ranged],
    modelScale: 3.05, displayScale: 1.12, accent: '#75ff70', effect: 'projectile-aku-fire',
  },
  {
    id: 'aku-monster', name: 'Aku · Canavar', row: 1, column: 2, rowCount: 3,
    base: ASSET_PATHS.bosses.aku.monster.idle,
    motions: [ASSET_PATHS.bosses.aku.monster.slash, ASSET_PATHS.bosses.aku.monster.bladeSpin, ASSET_PATHS.bosses.aku.monster.ranged],
    modelScale: 3.05, displayScale: 1.15, accent: '#ff244f', effect: 'impact-boss',
  },
] as const

const CAMERA_CENTER_Y = 2.15
const CATEGORY_DURATION_MS = 6_000
const HERO_SHOWCASE = ['ali', 'jack'] as const

function pickDifferentIndex(length: number, current: number) {
  if (length <= 1) return 0
  return (current + 1 + Math.floor(Math.random() * (length - 1))) % length
}

ENEMY_SHOWCASE.forEach((enemy) => {
  useGLTF.preload(enemy.base)
  enemy.motions.forEach((motion) => useGLTF.preload(motion))
})

type RootMotionAnchors = ReadonlyMap<string, readonly [number, number, number]>

function getRootMotionAnchors(clip: AnimationClip) {
  const anchors = new Map<string, readonly [number, number, number]>()
  clip.tracks.forEach((track) => {
    const trackName = track.name.toLowerCase()
    if (!trackName.endsWith('.position') || !/(hips|pelvis|root|armature)/.test(trackName)) return
    anchors.set(trackName, [track.values[0] ?? 0, track.values[1] ?? 0, track.values[2] ?? 0])
  })
  return anchors
}

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

function prepareShowcaseClip(scene: Object3D, source: AnimationClip | undefined, name: string, anchors?: RootMotionAnchors) {
  const clip = validateClipTargets(scene, prepareAnimationClip(source, name))
  return keepShowcaseClipInPlace(clip, anchors ?? getRootMotionAnchors(clip))
}

function useRandomAttackCycle(forced: boolean, seed: number): AttackState {
  const [attacking, setAttacking] = useState(false)
  const [trigger, setTrigger] = useState(0)
  const [variant, setVariant] = useState(seed % 3)

  useEffect(() => {
    let startTimer = 0
    let endTimer = 0
    let disposed = false

    const schedule = () => {
      const delay = 1_250 + Math.random() * 2_750 + (seed % 4) * 90
      startTimer = window.setTimeout(() => {
        if (disposed) return
        setVariant(Math.floor(Math.random() * 3))
        setTrigger((value) => value + 1)
        setAttacking(true)
        endTimer = window.setTimeout(() => {
          setAttacking(false)
          schedule()
        }, 680 + Math.random() * 420)
      }, delay)
    }

    schedule()
    return () => {
      disposed = true
      window.clearTimeout(startTimer)
      window.clearTimeout(endTimer)
    }
  }, [seed])

  useEffect(() => {
    if (!forced) return
    setVariant(Math.floor(Math.random() * 3))
    setTrigger((value) => value + 1)
    setAttacking(true)
    const timeout = window.setTimeout(() => setAttacking(false), 880)
    return () => window.clearTimeout(timeout)
  }, [forced])

  return { attacking, trigger, variant }
}

function ActionModel({ attacking, base, motions, scale, variant }: { attacking: boolean; base: string; motions: MotionSet; scale: number; variant: number }) {
  const baseFile = useGLTF(base)
  const motionFile0 = useGLTF(motions[0])
  const motionFile1 = useGLTF(motions[1])
  const motionFile2 = useGLTF(motions[2])
  const scene = useMemo(() => SkeletonUtils.clone(baseFile.scene), [baseFile.scene])
  const clips = useMemo(() => {
    const stance = prepareShowcaseClip(scene, baseFile.animations[0], 'stance')
    const anchors = getRootMotionAnchors(stance)
    return [
      stance,
      prepareShowcaseClip(scene, motionFile0.animations[0], 'attack-0', anchors),
      prepareShowcaseClip(scene, motionFile1.animations[0], 'attack-1', anchors),
      prepareShowcaseClip(scene, motionFile2.animations[0], 'attack-2', anchors),
    ]
  }, [baseFile.animations, motionFile0.animations, motionFile1.animations, motionFile2.animations, scene])
  const { actions } = useAnimations(clips, scene)

  useEffect(() => {
    const actionName = attacking ? `attack-${variant}` : 'stance'
    const selected = actions[actionName]
    if (!selected) return

    const clipDuration = clips.find((clip) => clip.name === actionName)?.duration ?? 1
    selected.enabled = true
    selected.paused = false
    selected.clampWhenFinished = attacking
    selected.setLoop(attacking ? LoopOnce : LoopRepeat, attacking ? 1 : Infinity)
    selected.timeScale = attacking ? Math.max(0.8, clipDuration / 0.86) : 0.32
    selected.reset().fadeIn(0.12).play()
    Object.entries(actions).forEach(([name, candidate]) => {
      if (name !== actionName) candidate?.fadeOut(0.12)
    })
  }, [actions, attacking, clips, variant])

  return <primitive object={scene} scale={scale} />
}

function Hero({ attacking, id, variant }: { attacking: boolean; id: 'ali' | 'jack'; variant: number }) {
  const animation: AnimationState = !attacking
    ? 'idle'
    : id === 'ali' && variant === 1
      ? 'fireball'
      : id === 'jack' && variant === 1
        ? 'shield'
        : 'attack'
  return <AnimatedCharacter definition={CHARACTERS[id]} animationState={animation} />
}

function FootAlignedModel({ children }: { children: ReactNode }) {
  const anchor = useRef<Group>(null)
  const visual = useRef<Group>(null)
  const bounds = useMemo(() => new Box3(), [])
  const anchorPosition = useMemo(() => new Vector3(), [])
  const anchorScale = useMemo(() => new Vector3(), [])
  const nextMeasurementAt = useRef(0)
  const initialized = useRef(false)

  useFrame(({ clock }) => {
    if (!anchor.current || !visual.current || clock.elapsedTime < nextMeasurementAt.current) return
    nextMeasurementAt.current = clock.elapsedTime + 0.08

    const hiddenWeapons: Object3D[] = []
    visual.current.traverse((node) => {
      if (node.name === 'WeaponSocket' && node.visible) {
        hiddenWeapons.push(node)
        node.visible = false
      }
    })
    visual.current.updateWorldMatrix(true, true)
    bounds.makeEmpty().setFromObject(visual.current, true)
    hiddenWeapons.forEach((weapon) => { weapon.visible = true })
    if (bounds.isEmpty() || !Number.isFinite(bounds.min.y)) return

    anchor.current.getWorldPosition(anchorPosition)
    anchor.current.getWorldScale(anchorScale)
    const targetY = visual.current.position.y
      + (anchorPosition.y - bounds.min.y) / Math.max(0.0001, Math.abs(anchorScale.y))
    visual.current.position.y = initialized.current
      ? MathUtils.damp(visual.current.position.y, targetY, 20, 0.08)
      : targetY
    initialized.current = true
  })

  return <group ref={anchor}><group ref={visual}>{children}</group></group>
}

function Fighter({ accent, children, displayScale, effect, effectVariants, forced, id, index, originY, side }: FighterProps) {
  const root = useRef<Group>(null)
  const viewportWidth = useThree((state) => state.viewport.width)
  const viewportHeight = useThree((state) => state.viewport.height)
  const attack = useRandomAttackCycle(forced, index + (side === 'enemies' ? 20 : 0))
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
        <FootAlignedModel>{children(attack)}</FootAlignedModel>
      </group>
      <ContactShadows position={[0, 0.01, 0]} scale={side === 'heroes' ? 5 : 7} opacity={0.32} blur={2.4} far={4} color="#060104" />
      <MenuAttackEffect
        accent={accent}
        direction={side === 'heroes' ? 1 : -1}
        kind={effectVariants?.[attack.variant] ?? effect}
        originY={originY}
        presentationScale={displayScale}
        trigger={attack.trigger}
        variant={attack.variant}
      />
    </group>
  )
}

function StageCast({ action, activeEnemyIndex, activeHeroIndex }: { action: MenuStageAction; activeEnemyIndex: number; activeHeroIndex: number }) {
  const heroId = HERO_SHOWCASE[activeHeroIndex] ?? 'ali'
  const hero = heroId === 'ali'
    ? { id: 'hz-ali', originY: 1.15, accent: '#f7c65f', effect: 'ali-slash' as const, effects: ['ali-slash', 'ali-fireball', 'ali-slash'] as const }
    : { id: 'samuray-jack', originY: 1.15, accent: '#ff4c87', effect: 'jack-slash' as const, effects: ['jack-slash', 'jack-shield', 'jack-slash'] as const }
  const enemy = ENEMY_SHOWCASE[activeEnemyIndex] ?? ENEMY_SHOWCASE[0]
  return (
    <>
      <Suspense fallback={null}>
        <Fighter key={hero.id} id={hero.id} side="heroes" index={activeHeroIndex} displayScale={1} originY={hero.originY} accent={hero.accent} effect={hero.effect} effectVariants={hero.effects} forced={action === 'heroes'}>
          {({ attacking, variant }) => <Hero id={heroId} attacking={attacking} variant={variant} />}
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
          effect={enemy.effect}
          forced={action === 'enemies'}
        >
          {({ attacking, variant }) => <ActionModel attacking={attacking} base={enemy.base} motions={enemy.motions} scale={enemy.modelScale} variant={variant} />}
        </Fighter>
      </Suspense>
    </>
  )
}

export function MenuBattleStage({ action = 'idle', variant = 'menu' }: { action?: MenuStageAction; variant?: MenuStageVariant }) {
  const splash = variant === 'splash'
  const [activeHeroIndex, setActiveHeroIndex] = useState(() => Math.floor(Math.random() * HERO_SHOWCASE.length))
  const [activeEnemyIndex, setActiveEnemyIndex] = useState(() => Math.floor(Math.random() * ENEMY_SHOWCASE.length))
  const [carouselRunning, setCarouselRunning] = useState(splash)
  const { active: loading, loaded, total } = useProgress()
  const activeHeroName = HERO_SHOWCASE[activeHeroIndex] === 'jack' ? 'Samuray Jack' : 'Hz. Ali'
  const activeEnemyName = (ENEMY_SHOWCASE[activeEnemyIndex] ?? ENEMY_SHOWCASE[0]).name

  useEffect(() => {
    if (splash || total === 0 || loading || loaded < total) return
    const revealTimer = window.setTimeout(() => {
      setCarouselRunning(true)
    }, 1_250)
    return () => window.clearTimeout(revealTimer)
  }, [loaded, loading, splash, total])

  useEffect(() => {
    if (!carouselRunning) return
    const timer = window.setInterval(() => {
      setActiveHeroIndex((index) => pickDifferentIndex(HERO_SHOWCASE.length, index))
      setActiveEnemyIndex((index) => pickDifferentIndex(ENEMY_SHOWCASE.length, index))
    }, CATEGORY_DURATION_MS)
    return () => window.clearInterval(timer)
  }, [carouselRunning])

  return (
    <div className={`menu-battle-stage menu-battle-stage--${variant} is-${action}`} aria-label="Hz. Ali, Samuray Jack ve Aku lejyonu dikey sütunlarda savaş pozunda">
      <Canvas orthographic dpr={[1, 1.35]} camera={{ position: [0, CAMERA_CENTER_Y, 14], rotation: [0, 0, 0], zoom: splash ? 75 : 94 }} gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}>
        <ambientLight intensity={splash ? 2.28 : 1.72} />
        <directionalLight position={[-4, 8, 8]} intensity={splash ? 5.4 : 4.2} color="#ffe0b0" />
        <pointLight position={[-5, 1, 4]} intensity={splash ? 10 : 7.5} color="#ffb541" distance={13} />
        <pointLight position={[6, 1.8, 4]} intensity={splash ? 18 : 13} color="#ff3e62" distance={16} />
        <pointLight position={[4.6, -1, 3]} intensity={splash ? 12 : 8.5} color="#ffd0a0" distance={11} />
        <StageCast action={action} activeEnemyIndex={activeEnemyIndex} activeHeroIndex={activeHeroIndex} />
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
