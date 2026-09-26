import { BIOMES, BIOME_WORLD_WIDTH, WORLD_VISUAL_LEFT } from '../config/biomes'
import { DIFFICULTIES } from '../config/difficulty'
import type { EnemyKind } from '../config/enemies'
import { useGameStore } from '../store/gameStore'
import { useSessionStore } from '../store/sessionStore'
import type { CharacterId } from '../types/character'
import type { EnemyProjectileState, EnemySpecial, EnemyState } from '../types/session'
import {
  AKU_FIRE_SPIKE_DAMAGE_COOLDOWN_MS,
  AKU_FIRE_SPIKE_DAMAGE_MULTIPLIER,
  isActiveAkuFight,
  isInsideAkuFireSpikeField,
} from './akuCombat'
import { getMiniAkuMotion, MINI_AKU_ATTACK_TIMES } from './akuMiniSwarm'
import { buildAkuPortalAmbush } from './akuPortalAmbush'
import { nextEnemyId } from './enemyFactory'
import { gameEvents } from './events'
import { setFracture, useMechanicsStore } from './mechanics'
import { chooseShadowAttack, getShadowStrikeThresholds } from './shadowCombat'
import {
  isShieldActive,
  livingPlayers,
  nearestLivingPlayer,
  nextShotId,
  randomBetween,
  startMeteorRain,
  strikePlayer,
  type Positions,
} from './shared'

type AkuSpecial = Exclude<EnemySpecial, 'none' | 'shadow-slash' | 'combo-double' | 'combo-triple' | 'meteor'>

const AKU_SPECIAL_DURATION: Record<AkuSpecial, number> = {
  'aku-melee': 1_900,
  'aku-heavy': 2_700,
  'aku-ranged': 2_500,
  'aku-fire-rain': 5_300,
  'aku-time-portal': 3_200,
  'aku-split': 4_500,
  'aku-shapeshift': 4_200,
  'aku-spin': 3_100,
}

/** Aku breaks time itself once he is nearly beaten: the third and final phase. */
export const AKU_FRACTURE_RATIO = 0.25

function strikeArea(x: number, radius: number, damage: number, now: number, positions: Positions, maxY = Infinity) {
  const shieldActive = isShieldActive(now)
  for (const id of livingPlayers()) {
    if (Math.abs(positions[id][0] - x) <= radius && positions[id][1] <= maxY) strikePlayer(id, damage, now, positions, shieldActive)
  }
}

export function runShadowBoss(enemy: EnemyState, now: number, positions: Positions): EnemyState | null {
  const session = useSessionStore.getState()
  if (session.bossPhase !== 'fight') return enemy
  const rules = DIFFICULTIES[session.difficulty]
  if (enemy.special !== 'none') {
    if (now >= enemy.specialUntil) {
      return { ...enemy, special: 'none', specialHitMask: 0, animation: 'idle', nextSpecialAt: now + randomBetween(4_200, 6_400) * rules.bossCooldown }
    }
    if (enemy.special === 'meteor') {
      let nextAuraAt = enemy.nextAuraAt
      if (now >= nextAuraAt) {
        strikeArea(enemy.x, 3.05, Math.round(enemy.damage * 0.38), now, positions)
        nextAuraAt = now + 720
      }
      return { ...enemy, animation: 'attack', nextAuraAt }
    }
    const elapsed = now - enemy.specialStartedAt
    let mask = enemy.specialHitMask
    getShadowStrikeThresholds(enemy.special).forEach((threshold, index) => {
      const bit = 1 << index
      if (elapsed < threshold || (mask & bit) !== 0) return
      mask |= bit
      const multiplier = enemy.special === 'shadow-slash' ? 0.72 : 0.58
      strikeArea(enemy.x, 2.65, Math.round(enemy.damage * multiplier), now, positions)
      session.addImpact({ kind: 'boss', x: enemy.x + enemy.direction * 1.4, y: 1.1, createdAt: now, duration: 700, lethal: false })
    })
    return { ...enemy, animation: 'attack', specialHitMask: mask }
  }
  if (now < enemy.nextSpecialAt) return null
  const living = livingPlayers()
  if (living.length === 0) return null
  const closestDistance = Math.min(...living.map((id) => Math.abs(positions[id][0] - enemy.x)))
  const choice = chooseShadowAttack(Math.random(), closestDistance, enemy.attackRange)
  if (choice === 'approach') return { ...enemy, animation: 'walk', nextSpecialAt: now + 900 }
  gameEvents.emit({ type: 'enemy-windup', enemyId: enemy.id, x: enemy.x })
  if (choice === 'meteor') {
    startMeteorRain(enemy, now, 'shadow')
    return { ...enemy, special: 'meteor', specialStartedAt: now, specialUntil: now + 6_400, nextAuraAt: now, animation: 'attack' }
  }
  if (choice === 'slash') {
    return { ...enemy, special: 'shadow-slash', specialStartedAt: now, specialUntil: now + 1_250, specialHitMask: 0, animation: 'attack' }
  }
  const triple = choice === 'triple'
  return {
    ...enemy,
    special: triple ? 'combo-triple' : 'combo-double',
    specialStartedAt: now,
    specialUntil: now + (triple ? 4_350 : 2_850),
    specialHitMask: 0,
    animation: 'attack',
  }
}

function addAkuProjectile(enemy: EnemyState, kind: EnemyProjectileState['kind'], targetX: number) {
  const session = useSessionStore.getState()
  if (kind === 'time-portal' && !isActiveAkuFight(session, enemy)) return
  session.addEnemyProjectile({
    id: nextShotId('aku-shot'),
    kind,
    sourceId: enemy.id,
    x: enemy.x,
    y: kind === 'time-portal' ? 1.6 : 2.2,
    targetX,
    damage: Math.round(enemy.damage * (kind === 'time-portal' ? 0.88 : 0.72)),
    travelled: 0,
  })
  gameEvents.emit({ type: 'enemy-shot', kind, x: enemy.x })
}

export function teleportPlayersThroughAkuPortal(now: number) {
  const session = useSessionStore.getState()
  const game = useGameStore.getState()
  const midpoint = (game.positions.ali[0] + game.positions.jack[0]) / 2
  const currentWorldBiome = Math.max(0, Math.min(BIOMES.length - 1, Math.floor((midpoint - WORLD_VISUAL_LEFT) / BIOME_WORLD_WIDTH)))
  const destinations = BIOMES.map((_, index) => index).filter((index) => index !== currentWorldBiome)
  const destination = destinations[Math.floor(Math.random() * destinations.length)] ?? 0
  const destinationX = WORLD_VISUAL_LEFT + destination * BIOME_WORLD_WIDTH + BIOME_WORLD_WIDTH * 0.5
  const ambush = buildAkuPortalAmbush({
    destinationBiome: destination,
    destinationX,
    difficulty: session.difficulty,
    now,
    nextId: () => nextEnemyId('portal-enemy'),
  })
  session.spawnEnemies(ambush)
  game.teleportPlayer('ali', destinationX - 1.05)
  game.teleportPlayer('jack', destinationX + 1.05)
  session.showPortalAlert('ZAMAN PUSUSU', `${BIOMES[destination]!.title}: ${ambush.length} düşman bekliyor`, now)
  gameEvents.emit({ type: 'portal-ambush', biome: destination, count: ambush.length })
}

function chooseAkuSpecial(form: EnemyState['bossForm'], fracture: boolean): EnemySpecial {
  const normal: EnemySpecial[] = ['aku-melee', 'aku-heavy', 'aku-ranged', 'aku-time-portal', 'aku-fire-rain']
  const monster: EnemySpecial[] = ['aku-heavy', 'aku-ranged', 'aku-fire-rain', 'aku-time-portal', 'aku-split', 'aku-shapeshift', 'aku-spin', 'combo-triple']
  // In the fractured final phase Aku leans on his time magic.
  const pool = fracture ? [...monster, 'aku-time-portal', 'aku-split', 'aku-fire-rain'] as EnemySpecial[] : form === 'monster' ? monster : normal
  return pool[Math.floor(Math.random() * pool.length)] ?? 'aku-melee'
}

function hitAkuArea(enemy: EnemyState, positions: Positions, now: number, radius: number, multiplier: number) {
  strikeArea(enemy.x, radius, Math.round(enemy.damage * multiplier), now, positions)
  useSessionStore.getState().addImpact({ kind: enemy.special === 'aku-time-portal' ? 'portal' : 'boss', x: enemy.x, y: 1.1, createdAt: now, duration: 820, lethal: false })
}

function hitMiniAku(enemy: EnemyState, index: number, positions: Positions, now: number) {
  const session = useSessionStore.getState()
  const preferred: CharacterId = index % 2 === 0 ? 'ali' : 'jack'
  const targetId = session.players[preferred].dead ? nearestLivingPlayer(enemy.x) : preferred
  if (!targetId) return
  const motion = getMiniAkuMotion(index, now - enemy.specialStartedAt, enemy.x, positions[targetId][0])
  strikeArea(motion.x, 1.65, Math.round(enemy.damage * 0.34), now, positions, 1.05)
  session.addImpact({ kind: 'boss', x: motion.x, y: 0.72, createdAt: now, duration: 680, lethal: false })
}

export function runAkuBoss(enemy: EnemyState, now: number, positions: Positions): EnemyState | null {
  const session = useSessionStore.getState()
  if (!isActiveAkuFight(session, enemy)) return enemy
  const ratio = enemy.maxHealth > 0 ? enemy.health / enemy.maxHealth : 0
  const fracture = useMechanicsStore.getState().fracture
  if (!fracture && ratio <= AKU_FRACTURE_RATIO) {
    setFracture(true)
    gameEvents.emit({ type: 'boss-form', form: 'fracture' })
    session.addImpact({ kind: 'portal', x: enemy.x, y: 1.8, createdAt: now, duration: 1_800, lethal: true })
    return { ...enemy, bossForm: 'monster', mimicKind: null, special: 'none', specialHitMask: 0, nextSpecialAt: now + 1_400, animation: 'walk' }
  }
  const nextForm = fracture
    ? 'monster'
    : enemy.bossForm === 'normal' && ratio <= 0.46
      ? 'monster'
      : enemy.bossForm === 'monster' && ratio >= 0.52
        ? 'normal'
        : enemy.bossForm
  if (nextForm !== enemy.bossForm) {
    gameEvents.emit({ type: 'boss-form', form: nextForm })
    session.addImpact({ kind: 'portal', x: enemy.x, y: 1.4, createdAt: now, duration: 1_300, lethal: false })
    return { ...enemy, bossForm: nextForm, mimicKind: null, special: 'none', specialHitMask: 0, nextSpecialAt: now + 900, animation: 'walk' }
  }
  const rules = DIFFICULTIES[session.difficulty]
  if (enemy.special === 'none') {
    if (now < enemy.nextSpecialAt) return null
    const special = chooseAkuSpecial(enemy.bossForm, fracture)
    if (special === 'aku-fire-rain') startMeteorRain(enemy, now, 'fire', fracture ? 2 : 0)
    gameEvents.emit({ type: 'enemy-windup', enemyId: enemy.id, x: enemy.x })
    const duration = special === 'combo-triple' ? 4_350 : AKU_SPECIAL_DURATION[special as AkuSpecial]
    return {
      ...enemy,
      special,
      specialStartedAt: now,
      specialUntil: now + duration,
      specialHitMask: 0,
      nextAuraAt: special === 'aku-fire-rain' ? now : enemy.nextAuraAt,
      mimicKind: special === 'aku-shapeshift' ? (Math.floor(Math.random() * 5) + 1) as EnemyKind : null,
      animation: 'attack',
    }
  }
  if (now >= enemy.specialUntil) {
    const [minimum, maximum] = rules.akuSpecialCooldown
    const pace = fracture ? 0.75 : 1
    return { ...enemy, special: 'none', mimicKind: null, specialHitMask: 0, nextAuraAt: 0, animation: 'walk', nextSpecialAt: now + randomBetween(minimum, maximum) * 1_000 * pace }
  }

  const elapsed = now - enemy.specialStartedAt
  let mask = enemy.specialHitMask
  const trigger = (index: number, threshold: number, action: () => void) => {
    const bit = 1 << index
    if (elapsed >= threshold && (mask & bit) === 0) {
      mask |= bit
      action()
    }
  }
  const targetId = nearestLivingPlayer(enemy.x)
  const targetX = targetId ? positions[targetId][0] : enemy.x + enemy.direction * 4
  if (enemy.special === 'aku-melee') {
    trigger(0, 620, () => hitAkuArea(enemy, positions, now, 2.9, 0.78))
    trigger(1, 1_280, () => hitAkuArea(enemy, positions, now, 3.1, 0.62))
  } else if (enemy.special === 'aku-heavy') {
    trigger(0, 1_260, () => hitAkuArea(enemy, positions, now, 3.65, 1.18))
  } else if (enemy.special === 'aku-ranged') {
    trigger(0, 760, () => addAkuProjectile(enemy, 'aku-fire', targetX))
    if (enemy.bossForm === 'monster') trigger(1, 1_520, () => addAkuProjectile(enemy, 'aku-fire', targetX + randomBetween(-1.6, 1.6)))
  } else if (enemy.special === 'aku-fire-rain') {
    let nextAuraAt = enemy.nextAuraAt
    if (now >= nextAuraAt) {
      const shieldActive = isShieldActive(now)
      let playerInside = false
      for (const id of livingPlayers()) {
        if (!isInsideAkuFireSpikeField(enemy.x, positions[id][0], positions[id][1])) continue
        playerInside = true
        strikePlayer(id, Math.round(enemy.damage * AKU_FIRE_SPIKE_DAMAGE_MULTIPLIER), now, positions, shieldActive)
      }
      if (playerInside) {
        nextAuraAt = now + AKU_FIRE_SPIKE_DAMAGE_COOLDOWN_MS
        session.addImpact({ kind: 'ember', x: enemy.x, y: 0.08, createdAt: now, duration: 520, lethal: false })
      }
    }
    return { ...enemy, animation: 'attack', specialHitMask: mask, nextAuraAt }
  } else if (enemy.special === 'aku-time-portal') {
    trigger(0, 1_020, () => {
      session.showPortalAlert('ZAMAN PORTALI AÇILDI', 'Temastan kaçın: Aku sizi başka bir diyara savurabilir', now)
      addAkuProjectile(enemy, 'time-portal', targetX)
    })
    if (enemy.bossForm === 'monster') trigger(1, 1_880, () => addAkuProjectile(enemy, 'time-portal', targetX + randomBetween(-2, 2)))
  } else if (enemy.special === 'aku-split') {
    MINI_AKU_ATTACK_TIMES.forEach((threshold, index) => trigger(index, threshold, () => hitMiniAku(enemy, index, positions, now)))
  } else if (enemy.special === 'aku-spin' || enemy.special === 'combo-triple') {
    ;[520, 1_080, 1_680, 2_320].forEach((threshold, index) => trigger(index, threshold, () => hitAkuArea(enemy, positions, now, 3.25, 0.48)))
  } else if (enemy.special === 'aku-shapeshift') {
    const rangedMimic = enemy.mimicKind === 4 || enemy.mimicKind === 5
    ;[900, 2_050, 3_150].forEach((threshold, index) => trigger(index, threshold, () => {
      if (rangedMimic) addAkuProjectile(enemy, enemy.mimicKind === 4 ? 'stone' : 'dark-orb', targetX)
      else hitAkuArea(enemy, positions, now, 3.1, 0.56)
    }))
  }
  return { ...enemy, animation: 'attack', specialHitMask: mask }
}
