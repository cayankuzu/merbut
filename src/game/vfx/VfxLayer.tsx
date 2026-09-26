import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { simClock } from '../../sim/clock'
import { gameEvents, type GameEvent } from '../../sim/events'
import { useGameStore } from '../../store/gameStore'
import { useSessionStore } from '../../store/sessionStore'
import type { CharacterId } from '../../types/character'
import { EFFECTS, burst, flash } from './effects'
import { vfxPools } from './particles'
import { impactFrame, speedLines } from './screenFx'
import { SlashMarks } from './slashMarks'
import { SwordTrails } from './SwordTrails'

const HERO_TINT: Record<CharacterId, string> = { ali: '#ffb347', jack: '#9fd8ff' }
const IMPACT_TINT: Record<string, string> = { ember: '#ff8a3a', void: '#c26bff', quake: '#ffd36b', stone: '#9cff9a', frost: '#9fe6ff', boss: '#ff3b5c', holy: '#fff2a8', portal: '#9aefff' }

function heroX(id: CharacterId) {
  return useGameStore.getState().positions[id][0]
}

export function VfxLayer() {
  const slashes = useMemo(() => new SlashMarks(8), [])
  const landing = useMemo(() => ({ ali: { airborne: false, lastStep: 0 }, jack: { airborne: false, lastStep: 0 } }), [])
  const fireballClock = useMemo(() => ({ last: 0 }), [])

  useEffect(() => () => slashes.dispose(), [slashes])

  useEffect(() => {
    const lastHit = new Map<string, number>()
    const slash = (x: number, y: number, direction: 1 | -1, length: number, color: string) => slashes.spawn(x, y, direction, length, color)

    const onEvent = (event: GameEvent) => {
      const positions = useGameStore.getState().positions
      switch (event.type) {
        case 'enemy-hit': {
          const attackerX = positions[event.attacker][0]
          const direction: 1 | -1 = event.x >= attackerX ? 1 : -1
          const tint = event.source === 'fireball' ? '#ff8a3a' : HERO_TINT[event.attacker]
          const y = Math.max(0.8, Math.min(2.6, event.y))
          if (event.source === 'hazard') {
            burst({ x: event.x, y, count: 6, kind: 'spark', color: '#ffffff', endColor: IMPACT_TINT[event.impact] ?? '#ffffff', speed: [3, 7], life: [0.2, 0.4], size: [0.05, 0.01], gravity: -10, drag: 3 })
          } else if (event.boss === 'shadow' || event.boss === 'aku') {
            EFFECTS.bossHit(event.x, y, direction, tint)
            slash(event.x, y, direction, 3.6, tint)
          } else {
            const now = performance.now()
            const rapid = now - (lastHit.get(event.enemyId) ?? -Infinity) < 140
            lastHit.set(event.enemyId, now)
            if (lastHit.size > 64) lastHit.clear()
            EFFECTS.swordHit(event.x, y, direction, tint, event.killed || event.boss === 'mini', rapid && !event.killed)
            if (event.source === 'melee' && !rapid) slash(event.x, y, direction, event.killed ? 2.8 : 2.1, tint)
          }
          if (event.killed) {
            const deathY = Math.max(0.7, y - 0.2)
            if (event.variant === 'mirage') EFFECTS.sandDeath(event.x, deathY)
            else if (event.variant === 'drone' || event.variant === 'queen') EFFECTS.machineDeath(event.x, deathY)
            else if (event.variant === 'ghost') EFFECTS.ghostDeath(event.x, deathY)
            else if (!event.boss || event.boss === 'mini') EFFECTS.inkDeath(event.x, deathY, IMPACT_TINT[event.impact] ?? '#ffffff')
            if (event.boss || event.variant === 'elite') impactFrame(event.boss === 'aku' ? 110 : 70)
          }
          break
        }
        case 'player-hit':
          EFFECTS.heroHurt(positions[event.id][0], positions[event.id][1] + 1.2, HERO_TINT[event.id])
          if (event.down) impactFrame(90)
          break
        case 'player-dash': {
          const facing = Math.cos(useGameStore.getState().rotations[event.id]) >= 0 ? 1 : -1
          EFFECTS.dashBurst(positions[event.id][0], positions[event.id][1], facing, event.perfect, HERO_TINT[event.id])
          if (event.perfect) speedLines(event.id === 'ali' ? '#ffe2a8' : '#dff3ff')
          break
        }
        case 'ability':
          if (event.ability === 'fireball') flash(heroX(event.id), positions[event.id][1] + 1.3, '#ffb347', 1.8, 0.18)
          else EFFECTS.sparkle(heroX(event.id), 1.4, '#9fe6ff', 18)
          break
        case 'pickup':
          EFFECTS.sparkle(heroX(event.id), 1, '#b8ffc8', 22)
          break
        case 'hazard':
          if (event.stage !== 'strike') break
          if (event.name === 'press') EFFECTS.slam(event.x, '#8a7a6a')
          else if (event.name === 'bolt') {
            EFFECTS.shower(event.x, 0.4, '#f2f6ff', '#6d8cff', 26)
            EFFECTS.dust(event.x, 0, 1.2, '#8a92b8')
          } else if (event.name === 'lava' || event.name === 'vent') {
            EFFECTS.embers(event.x, 0.4, event.name === 'lava' ? '#7dff4d' : '#ff8a2a', 16)
            EFFECTS.slam(event.x, event.name === 'lava' ? '#3a4a2a' : '#4a2a1a')
          } else if (event.name === 'tide') burst({ x: event.x, y: 0.6, count: 20, kind: 'puff', color: '#e8fbff', endColor: '#6aa8c8', speed: [1, 4], life: [0.5, 0.9], size: [0.5, 1.3], gravity: -2, drag: 2 })
          break
        case 'mechanic':
          if (event.name === 'neon') EFFECTS.shower(event.x, 2.6, '#ffffff', Math.random() > 0.5 ? '#43f3ff' : '#ff2a70', 34)
          else if (event.name === 'bell') EFFECTS.sparkle(event.x, 2.6, '#ffe38a', 12)
          else if (event.name === 'resonance') {
            EFFECTS.sparkle(event.x, 2.4, '#fff2a8', 40)
            impactFrame(80)
          } else if (event.name === 'hourglass') EFFECTS.sandSwirl(event.x)
          else if (event.name === 'rod') EFFECTS.shower(event.x, 3.8, '#f2f6ff', '#6d8cff', 24)
          else if (event.name === 'chain' && event.x2 !== undefined) flash(event.x2, 1.3, '#b9ccff', 1.4, 0.12)
          else if (event.name === 'firefly') EFFECTS.sparkle(event.x, 1, '#f6ff9a', 16)
          else if (event.name === 'team') {
            impactFrame(90)
            EFFECTS.shower(event.x, 1.4, '#ffffff', '#ffd36b', 40)
          }
          break
        case 'gate-open':
          for (let index = 0; index < 4; index += 1) EFFECTS.dust(event.x, 0, 1.4)
          break
        case 'boss-form':
          impactFrame(110)
          break
        default:
          break
      }
    }
    return gameEvents.on(onEvent)
  }, [slashes])

  useFrame((_, delta) => {
    const step = Math.min(delta, 0.1) * simClock.scale()
    vfxPools.light.advance(step)
    vfxPools.matter.advance(step)

    const now = performance.now()
    slashes.update(now)

    // Landing dust and footsteps: read straight from hero positions.
    const game = useGameStore.getState()
    const session = useSessionStore.getState()
    if (session.phase === 'playing') {
      ;(['ali', 'jack'] as const).forEach((id) => {
        const [x, y] = game.positions[id]
        const state = landing[id]
        if (y > 0.35) state.airborne = true
        else if (state.airborne && y < 0.05) {
          state.airborne = false
          EFFECTS.dust(x, 0, 0.9)
        }
        if (game.animationStates[id] === 'walk' && now - state.lastStep > 340 && y < 0.05) {
          state.lastStep = now
          EFFECTS.dust(x, 0, 0.35)
        }
      })
      // Fireballs shed embers and tongues of flame behind them.
      if (now - fireballClock.last > 32) {
        fireballClock.last = now
        for (const projectile of session.projectiles) {
          EFFECTS.embers(projectile.x, projectile.y, '#ffb347', 2)
          burst({ x: projectile.x - projectile.directionX * 0.2, y: projectile.y, z: projectile.z, count: 1, kind: 'glow', color: '#ffd27a', endColor: '#ff2a06', speed: [0.2, 0.8], life: [0.18, 0.3], size: [0.42, 0.08], drag: 3 })
        }
      }
    }
  })

  return (
    <group name="vfx">
      <primitive object={vfxPools.matter.mesh} />
      <primitive object={vfxPools.light.mesh} />
      {slashes.meshes.map((mesh, index) => <primitive key={index} object={mesh} />)}
      <SwordTrails />
    </group>
  )
}

