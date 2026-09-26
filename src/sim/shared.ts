import { isHeavyVariant } from '../config/enemies'
import { DIFFICULTIES } from '../config/difficulty'
import { useGameStore } from '../store/gameStore'
import { useSessionStore } from '../store/sessionStore'
import type { CharacterId } from '../types/character'
import type { EnemyState, ImpactKind, MeteorState, PlayerAttackSource } from '../types/session'
import { WORLD_VISUAL_LEFT, WORLD_VISUAL_RIGHT } from '../config/biomes'
import { gameEvents } from './events'
import { isResonanceActive } from './mechanics'

export type Positions = ReturnType<typeof useGameStore.getState>['positions']
export type HitSource = PlayerAttackSource | 'hazard'

export const PLAYER_IDS: readonly CharacterId[] = ['ali', 'jack']
export const SHIELD_RADIUS = 2.22
export const IMPACTS: Record<number, ImpactKind> = { 1: 'ember', 2: 'void', 3: 'quake', 4: 'stone', 5: 'frost' }

let pickupSequence = 0
let meteorSequence = 0
let projectileSequence = 0

export const nextPickupId = () => `zemzem-${++pickupSequence}`
export const nextMeteorId = () => `meteor-${++meteorSequence}`
export const nextShotId = (prefix: string) => `${prefix}-${++projectileSequence}`

export function randomBetween(minimum: number, maximum: number) {
  return minimum + Math.random() * (maximum - minimum)
}

export function livingPlayers() {
  const session = useSessionStore.getState()
  return PLAYER_IDS.filter((id) => !session.players[id].dead)
}

export function nearestPlayerFrom(x: number, ids: readonly CharacterId[], positions: Positions) {
  if (ids.length === 0) return null
  if (ids.length === 1) return ids[0]!
  return Math.abs(positions.ali[0] - x) <= Math.abs(positions.jack[0] - x) ? 'ali' : 'jack'
}

export function nearestLivingPlayer(x: number) {
  return nearestPlayerFrom(x, livingPlayers(), useGameStore.getState().positions)
}

export function isShieldActive(now: number) {
  const jack = useSessionStore.getState().players.jack
  return jack.abilityActiveUntil > now && !jack.dead
}

export function isShielded(playerId: CharacterId, positions: Positions, shieldActive: boolean) {
  return shieldActive && Math.abs(positions[playerId][0] - positions.jack[0]) <= SHIELD_RADIUS + 0.2
}

export function dropZemzem(x: number) {
  const state = useSessionStore.getState()
  if (Math.random() >= DIFFICULTIES[state.difficulty].healDropChance) return
  state.addPickup({ id: nextPickupId(), x, type: 'zemzem' })
  gameEvents.emit({ type: 'pickup-spawned', x })
}

/**
 * Every source of damage to a creature goes through here: melee, fireballs and
 * biome hazards. Ghosts shrug off half of it until the jade bells resonate.
 */
export function hitEnemy(id: string, amount: number, attacker: CharacterId, now: number, source: HitSource = 'melee', knockback = 0) {
  const state = useSessionStore.getState()
  const before = state.enemies.find((enemy) => enemy.id === id)
  if (!before || before.animation === 'dead') return false
  const veiled = before.variant === 'ghost' && !isResonanceActive(now)
  const killed = state.damageEnemy(id, veiled ? amount * 0.5 : amount, attacker, now, source)
  const after = useSessionStore.getState().enemies.find((enemy) => enemy.id === id)
  if (after && !before.boss) {
    const poise = isHeavyVariant(before.variant) ? 0 : before.variant === 'elite' && before.windupUntil > now ? 0.25 : 1
    const push = knockback * poise * (killed ? 1.7 : 1)
    const staggerMs = killed ? 0 : 280 * poise
    if (push !== 0 || staggerMs > 0) {
      state.updateEnemy(id, {
        vx: push,
        stunUntil: Math.max(after.stunUntil, now + staggerMs),
        windupUntil: poise >= 1 ? 0 : after.windupUntil,
        nextAttackAt: poise >= 1 ? Math.max(after.nextAttackAt, now + 520) : after.nextAttackAt,
      })
    }
  }
  if (!killed) return false
  if (!before.boss) dropZemzem(before.x)
  return true
}

export function enemyImpact(kind: number, x: number, now: number, lethal = false) {
  useSessionStore.getState().addImpact({
    kind: IMPACTS[kind] ?? 'ember', x, y: 0.08, createdAt: now, duration: kind === 3 ? 1_100 : 760, lethal,
  })
}

export function startMeteorRain(enemy: EnemyState, now: number, kind: MeteorState['kind'], extra = 0) {
  const state = useSessionStore.getState()
  const game = useGameStore.getState()
  const difficulty = DIFFICULTIES[state.difficulty]
  const ids = livingPlayers()
  const targets = ids.length > 0 ? ids.map((id) => game.positions[id][0]) : [enemy.x - 2, enemy.x + 2]
  const count = difficulty.meteorCount + extra + (kind === 'fire' && enemy.bossForm === 'monster' ? 2 : 0)
  const meteors: MeteorState[] = Array.from({ length: count }, (_, index) => {
    const base = targets[index % targets.length] ?? enemy.x
    const createdAt = now + index * randomBetween(150, 280)
    return {
      id: nextMeteorId(),
      x: Math.max(WORLD_VISUAL_LEFT + 1, Math.min(WORLD_VISUAL_RIGHT - 1, base + randomBetween(-2.7, 2.7))),
      createdAt,
      impactAt: createdAt + difficulty.meteorWarning * 1_000,
      landedAt: 0,
      damage: Math.round(enemy.damage * (kind === 'fire' ? 0.7 : 0.82)),
      kind,
    }
  })
  state.addMeteors(meteors)
  meteors.forEach((meteor) => gameEvents.emit({ type: 'meteor-warning', x: meteor.x }))
}

/**
 * Resolves a telegraphed strike against one hero. Returns what happened so the
 * caller can place the right impact. A dash that blocks the strike is "perfect".
 */
export function strikePlayer(id: CharacterId, damage: number, now: number, positions: Positions, shieldActive: boolean) {
  const session = useSessionStore.getState()
  const player = session.players[id]
  if (player.dead) return 'miss' as const
  if (isShielded(id, positions, shieldActive)) return 'shielded' as const
  if (player.dodgeUntil > now) {
    session.notePerfectDodge(id, now)
    return 'dodged' as const
  }
  return session.damagePlayer(id, damage, now) === 'blocked' ? 'blocked' as const : 'hit' as const
}
