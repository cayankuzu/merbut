import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { DoubleSide, Group, MeshBasicMaterial, RingGeometry } from 'three'
import { emitImpactParticles } from '../game/vfx/impactParticles'
import { COMBAT_EFFECT_STYLE } from '../game/combatEffectConfig'
import { EnemyProjectileVisual } from '../game/EnemyProjectileVisual'
import { FireballVisual } from '../game/FireballVisual'
import { JackShieldVisual } from '../game/JackShieldVisual'
import { EFFECTS, burst, flash } from '../game/vfx/effects'
import { LIGHT_BLENDING } from '../game/vfx/lightBlending'
import type { EnemyProjectileState, ImpactKind } from '../types/session'
import { getMenuAttackDurationMs } from './menuShowcaseCycle'
import type { StageVfx } from './stageVfx'

export type MenuAttackEffectKind =
  | 'none'
  | 'slash'
  | 'projectile'
  | 'shockwave'
  | 'flame'
  | 'ali-slash'
  | 'ali-fireball'
  | 'jack-slash'
  | 'jack-shield'
  | 'shadow-slash'
  | 'shadow-combo'
  | 'shadow-cast'
  | 'impact-ember'
  | 'impact-void'
  | 'impact-quake'
  | 'impact-boss'
  | 'projectile-stone'
  | 'projectile-dark-orb'
  | 'projectile-aku-fire'

interface MenuAttackEffectProps {
  accent: string
  direction: -1 | 1
  kind: MenuAttackEffectKind
  originY: number
  /** Live model-derived origin used by the menu showcase without re-rendering. */
  originYRef?: MutableRefObject<number>
  presentationScale?: number
  /** Keeps the visual envelope aligned with its model's showcase move. */
  durationMs?: number
  trigger: number
  vfx: StageVfx
}

const RING = new RingGeometry(0.86, 1, 56)
/** Tilted towards the camera so a ground ring reads as an ellipse on the orthographic stage. */
const RING_TILT = -1.22
const RING_MS = 560

const PROJECTILE_TRAIL: Record<EnemyProjectileState['kind'], { color: string; end: string; impact: ImpactKind }> = {
  stone: { color: '#c8ffca', end: '#2f6b35', impact: 'stone' },
  'dark-orb': { color: '#ff6a8a', end: '#5a0018', impact: 'void' },
  'aku-fire': { color: '#fff0a8', end: '#ff3b0b', impact: 'ember' },
  'time-portal': { color: '#9aefff', end: '#4d1bff', impact: 'portal' },
}

const SHADOW_CUTS: Partial<Record<MenuAttackEffectKind, readonly number[]>> = {
  'shadow-slash': [0.38],
  'shadow-combo': [0.24, 0.47, 0.7],
}

/**
 * Menu showcase effects in the game's own vocabulary. Every move is a timeline
 * of cues (fire once when the move passes a point) and streams (emit while the
 * move is inside a window); visuals come from the shared particle presets.
 */
export function MenuAttackEffect({ accent, direction, durationMs, kind, originY, originYRef, presentationScale = 1, trigger, vfx }: MenuAttackEffectProps) {
  const mover = useRef<Group>(null)
  const ring = useRef<Group>(null)
  const ringMaterial = useMemo(() => new MeshBasicMaterial({ color: accent, transparent: true, opacity: 0, depthWrite: false, ...LIGHT_BLENDING, side: DoubleSide, toneMapped: false }), [accent])
  const timeline = useRef({ elapsed: Number.POSITIVE_INFINITY, cues: 0, lastStream: 0, ringAt: Number.NEGATIVE_INFINITY })
  const impactKind = kind.startsWith('impact-') ? kind.slice('impact-'.length) as ImpactKind : null
  const projectileKind = kind.startsWith('projectile-')
    ? kind.slice('projectile-'.length) as EnemyProjectileState['kind']
    : kind === 'shadow-cast' ? 'dark-orb' : null

  useEffect(() => () => ringMaterial.dispose(), [ringMaterial])

  useEffect(() => {
    if (trigger === 0) return
    timeline.current = { elapsed: 0, cues: 0, lastStream: 0, ringAt: Number.NEGATIVE_INFINITY }
  }, [trigger])

  useFrame((_, delta) => {
    const state = timeline.current
    const group = mover.current
    state.elapsed += Math.min(delta, 0.1)
    const elapsedMs = state.elapsed * 1_000

    // Ground ring: expands and fades on its own clock once a cue starts it.
    if (ring.current) {
      const ringProgress = (elapsedMs - state.ringAt) / RING_MS
      ring.current.visible = ringProgress >= 0 && ringProgress < 1
      if (ring.current.visible) {
        const eased = 1 - (1 - ringProgress) * (1 - ringProgress)
        ring.current.scale.setScalar((0.3 + eased * 2.3) * presentationScale)
        ringMaterial.opacity = (1 - ringProgress) * 0.85
      }
    }

    const duration = Math.max(100, durationMs ?? getMenuAttackDurationMs(kind))
    const progress = elapsedMs / duration
    if (!group) return
    if (progress >= 1) {
      group.visible = false
      return
    }

    const y = originYRef?.current ?? originY
    const cue = (index: number, at: number) => {
      if (progress < at || state.cues & (1 << index)) return false
      state.cues |= 1 << index
      return true
    }
    const stream = (from: number, to: number, everyMs: number) => {
      if (progress < from || progress > to || elapsedMs - state.lastStream < everyMs) return false
      state.lastStream = elapsedMs
      return true
    }
    const pulseRing = (x: number, color: string) => {
      ring.current?.position.set(x, 0.05, 0.1)
      ringMaterial.color.set(color)
      state.ringAt = elapsedMs
    }

    if (kind === 'ali-fireball') {
      // Cast pose first, then the fireball leaves the hand and bursts downrange.
      const launch = 0.16
      const land = 0.86
      const flight = Math.min(1, Math.max(0, (progress - launch) / (land - launch)))
      const x = direction * (0.95 + flight * flight * 2.4)
      const height = y + Math.sin(flight * Math.PI) * 0.08
      group.visible = progress >= launch && progress < land
      group.position.set(x, height, 0.2)
      group.scale.setScalar(presentationScale * (0.6 + Math.min(1, flight * 6) * 0.4))
      if (cue(0, launch)) vfx.emit(() => {
        flash(direction * 0.9, y, '#ffb347', 1.8, 0.18)
        EFFECTS.embers(direction * 0.9, y, '#ffb347', 8)
      })
      if (stream(launch, land, 34)) vfx.emit(() => EFFECTS.embers(x - direction * 0.2, height, '#ffb347', 3))
      if (cue(1, land)) {
        vfx.emit(() => EFFECTS.shower(x, height, '#fff0a8', '#ff4b12', 26))
        pulseRing(x, '#ff8a3a')
      }
      return
    }

    if (kind === 'jack-shield') {
      // The guard pops up with a burst of cold light, hums, then folds away.
      const grow = Math.min(1, progress / 0.12)
      const fold = progress > 0.84 ? 1 - (progress - 0.84) / 0.16 : 1
      group.visible = true
      group.position.set(0, y + 0.25, 0)
      group.rotation.y += delta * 0.72
      group.scale.setScalar(presentationScale * 0.62 * (1 - (1 - grow) ** 3) * fold)
      if (cue(0, 0)) vfx.emit(() => {
        flash(0, y + 0.25, '#9fe6ff', 2.6, 0.2)
        EFFECTS.sparkle(0, y + 0.25, '#9fe6ff', 18)
      })
      if (stream(0.1, 0.8, 220)) vfx.emit(() => EFFECTS.sparkle(direction * 0.3, y + 0.3, '#dff6ff', 3))
      if (cue(1, 0.84)) vfx.emit(() => EFFECTS.sparkle(0, y + 0.25, '#e6fbff', 12))
      return
    }

    if (projectileKind) {
      const palette = PROJECTILE_TRAIL[projectileKind]
      const launch = kind === 'shadow-cast' ? 0.34 : 0.22
      const land = 0.88
      const flight = Math.min(1, Math.max(0, (progress - launch) / (land - launch)))
      const startY = kind === 'shadow-cast' ? y - 0.4 : y
      const x = direction * (0.6 + (1 - (1 - flight) ** 2) * 2.5)
      const height = startY + Math.sin(flight * Math.PI) * 0.14
      group.visible = progress >= launch && progress < land
      group.position.set(x, height, 0.2)
      group.rotation.set(flight * 2.2, flight, flight * 1.4)
      group.scale.setScalar(presentationScale)
      if (cue(0, launch)) vfx.emit(() => flash(direction * 0.6, startY, palette.color, 1.6, 0.14))
      if (stream(launch, land, 30)) vfx.emit(() => burst({ x: x - direction * 0.15, y: height, count: 3, kind: 'glow', color: palette.color, endColor: palette.end, speed: [0.3, 1.2], life: [0.3, 0.55], size: [0.2, 0.02], drag: 2, angle: direction > 0 ? Math.PI : 0, spread: 0.7 }))
      if (cue(1, land)) {
        vfx.emit(() => emitImpactParticles(palette.impact, x, height, true))
        pulseRing(x, palette.color)
      }
      return
    }

    group.visible = false
    const reach = direction * 1.2

    if (kind === 'projectile') {
      // A comet of the fighter's colour: a hot head and a glowing wake.
      const flight = Math.min(1, Math.max(0, (progress - 0.2) / 0.66))
      const x = direction * (0.6 + (1 - (1 - flight) ** 2) * 2.5)
      if (progress >= 0.2 && progress <= 0.86) vfx.emit(() => {
        flash(x, y, '#fff8de', 0.55, 0.05)
        if (stream(0.2, 0.86, 26)) burst({ x, y, count: 3, kind: 'glow', color: accent, endColor: '#ffffff', speed: [0.2, 1], life: [0.25, 0.5], size: [0.22, 0.02], drag: 2 })
      })
      if (cue(0, 0.86)) vfx.emit(() => EFFECTS.shower(x, y, '#ffffff', accent, 22))
      return
    }

    if (kind === 'slash') {
      if (cue(0, 0.42)) {
        vfx.slashes.spawn(reach, y, direction, 2.4, accent)
        vfx.emit(() => EFFECTS.swordHit(reach, y, direction, accent, true))
      }
      return
    }

    if (kind === 'shockwave') {
      if (cue(0, 0.38)) {
        vfx.emit(() => {
          EFFECTS.slam(reach, '#8a6a4a')
          flash(reach, 0.3, accent, 2.2, 0.16)
        })
        pulseRing(reach, accent)
      }
      return
    }

    if (kind === 'flame') {
      // Breath of fire: a cone of glowing tongues with smoke rolling off it.
      if (cue(0, 0.22)) vfx.emit(() => flash(direction * 0.8, y, '#fff0a8', 1.8, 0.14))
      if (stream(0.22, 0.72, 28)) vfx.emit(() => {
        burst({ x: direction * 0.8, y, count: 4, kind: 'glow', color: '#fff0a8', endColor: accent, speed: [4, 7.5], life: [0.3, 0.55], size: [0.2, 0.75], drag: 1.6, angle: direction > 0 ? 0 : Math.PI, spread: 0.24, depth: 0.2 })
        if (Math.random() < 0.35) burst({ x: direction * 1.6, y: y + 0.1, count: 1, kind: 'puff', color: '#3a2420', endColor: '#0e0806', speed: [1.5, 3], life: [0.6, 0.9], size: [0.4, 1.1], gravity: 0.8, drag: 1.4, angle: direction > 0 ? 0.3 : Math.PI - 0.3, spread: 0.3 })
      })
      return
    }

    if (impactKind) {
      if (cue(0, 0.34)) {
        const style = COMBAT_EFFECT_STYLE[impactKind]
        vfx.emit(() => {
          flash(reach, y, style.primary, 2, 0.16)
          emitImpactParticles(impactKind, reach, y, true)
        })
        pulseRing(reach, style.secondary)
      }
      return
    }

    const cuts = SHADOW_CUTS[kind]
    if (cuts) {
      cuts.forEach((at, index) => {
        if (!cue(index, at)) return
        // Evil Jack carries the blade low: the cuts land below his torso.
        const cutY = y - 0.55 + (index % 2) * 0.2
        vfx.slashes.spawn(direction * 0.95, cutY, direction, 2.6, index === cuts.length - 1 ? '#ff315f' : '#ff8aa0', { angle: direction * (index % 2 ? -0.5 : 0.55) })
        vfx.emit(() => EFFECTS.swordHit(direction * 0.95, cutY, direction, '#ff315f', index === cuts.length - 1))
      })
    }
  })

  return (
    <>
      <group ref={mover} visible={false}>
        {kind === 'ali-fireball' ? <FireballVisual /> : null}
        {kind === 'jack-shield' ? <JackShieldVisual /> : null}
        {projectileKind ? <EnemyProjectileVisual kind={projectileKind} /> : null}
      </group>
      <group ref={ring} visible={false} rotation={[RING_TILT, 0, 0]}>
        <mesh geometry={RING} material={ringMaterial} dispose={null} />
      </group>
    </>
  )
}
