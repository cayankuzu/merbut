import { BIOMES, WORLD_VISUAL_LEFT, WORLD_VISUAL_RIGHT } from '../config/biomes'
import { BOSS_MODEL_SCALES } from '../config/characterTransforms'
import { DIFFICULTIES } from '../config/difficulty'
import { BOSS_DEFINITIONS, ENEMIES, ENEMY_VARIANTS, ENEMY_WINDUP_MS, isHeavyVariant } from '../config/enemies'
import { expandWaveSpawns, getWaveSpawnX, shouldTriggerWave, WAVES, type WaveDefinition } from '../config/waves'
import { useGameStore } from '../store/gameStore'
import { useSessionStore } from '../store/sessionStore'
import type { CharacterId } from '../types/character'
import type { EnemyProjectileState, EnemyState, MeteorState, ProjectileState } from '../types/session'
import { isActiveAkuFight } from './akuCombat'
import { runAkuBoss, runShadowBoss, teleportPlayersThroughAkuPortal } from './bosses'
import { areBiomeEnemiesCleared, arePriorBiomeWavesCleared, BIOME_GATE_PADDING, getBiomeGateX, getClosedBiomeRightLimit } from './biomeProgress'
import { enemyCatchUpMultiplier, getEffectiveAttackRange, heroGap, shouldEnemyApproach } from './enemyAI'
import { createEnemy, laneForIndex, nextEnemyId } from './enemyFactory'
import { gameEvents } from './events'
import { beltVelocityAt, chainLightning, creatureTimeScale, groundModifiers, stepMechanics, strikeProps } from './mechanics'
import {
  enemyImpact,
  hitEnemy,
  isShieldActive,
  livingPlayers,
  nearestPlayerFrom,
  nextShotId,
  PLAYER_IDS,
  randomBetween,
  SHIELD_RADIUS,
  strikePlayer,
  type Positions,
} from './shared'

export const COMBAT_STEP = 1 / 30
const MELEE = {
  ali: { range: 2.35, damage: 42, knockback: 4.4 },
  jack: { range: 2.25, damage: 36, knockback: 3.8 },
} as const
const FIREBALL_SPEED = 11.5
const FIREBALL_RANGE = 13.5
/** Nobody attacks during the first seconds of a run: time to read the tutorial. */
const OPENING_GRACE_SECONDS = 9
const GIANT_RISE_MS = 1_900
const RECOVERY_MS = 420
/** Attack tokens: at most this many creatures may wind up on one hero at once. */
const MAX_ATTACKERS_PER_HERO = 2
/** The opening biome teaches: softer hits and a slower attack rhythm. */
const TUTORIAL_DAMAGE = 0.7
const TUTORIAL_COOLDOWN = 1.4

let lastToken = -1
let previousAttackSequences: Record<CharacterId, number> = { ali: 0, jack: 0 }
let lastClearedBiome = -1
/** Last melee contact per creature and hero, for the two-sword team strike. */
let teamContacts = new Map<string, { ali: number; jack: number; teamAt: number }>()

/** Chain step multipliers: the third blow is a spinning finisher. */
const CHAIN = {
  1: { damage: 1, knockback: 1, reach: 0 },
  2: { damage: 1.15, knockback: 1.1, reach: 0.1 },
  3: { damage: 1.75, knockback: 2.1, reach: 0.45 },
} as const
const TEAM_WINDOW_MS = 420
const PARRY_REACH = 1.9

export function buildWave(wave: WaveDefinition, midpoint: number, now: number): EnemyState[] {
  const session = useSessionStore.getState()
  const difficulty = DIFFICULTIES[session.difficulty]
  // Middle beats take half the difficulty's extra bodies: a realm grows harder, not longer.
  const extra = wave.id.endsWith('-mid') ? Math.ceil(difficulty.extraEnemies / 2) : difficulty.extraEnemies
  return expandWaveSpawns(wave, extra).map((spawn, index) => {
    const x = getWaveSpawnX(midpoint, spawn.side, index, session.lockedLeft, session.lockedRight)
    const lane = laneForIndex(index)
    if (!spawn.boss) {
      const enemy = createEnemy({ biome: wave.biome, kind: spawn.kind, variant: spawn.variant, x, now, lane })
      return {
        ...enemy,
        direction: spawn.side === 1 ? -1 as const : 1 as const,
        nextAttackAt: now + randomBetween(500, 1_400),
      }
    }
    const boss = BOSS_DEFINITIONS[spawn.boss]
    const base = ENEMIES[spawn.kind]
    const maxHealth = Math.round(boss.health * difficulty.bossHealth)
    return {
      ...createEnemy({ id: nextEnemyId(), biome: wave.biome, kind: spawn.kind, x, now, lane: 0 }),
      title: boss.title,
      health: maxHealth,
      maxHealth,
      damage: Math.round(boss.damage * difficulty.bossDamage),
      speed: (boss.bossType === 'shadow' ? 4.8 : 3.1) * difficulty.bossSpeed,
      attackRange: boss.bossType === 'shadow' ? 3.7 : 4.25,
      attackCooldown: base.attackCooldown * difficulty.bossCooldown * 0.86,
      score: boss.score,
      scale: BOSS_MODEL_SCALES[boss.bossType],
      accent: boss.bossType === 'shadow' ? '#ff244f' : '#74f05b',
      direction: spawn.side === 1 ? -1 as const : 1 as const,
      boss: true,
      finalBoss: spawn.boss === 'final',
      bossType: boss.bossType,
      nextSpecialAt: now + randomBetween(2_800, 4_800),
    }
  })
}

function resetForSession(token: number) {
  lastToken = token
  previousAttackSequences = { ...useGameStore.getState().attackSequences }
  lastClearedBiome = -1
  teamContacts = new Map()
}

/** Both heroes cut the same creature within a heartbeat: the two-sword strike. */
function registerContact(enemyId: string, id: CharacterId, now: number, facing: number, damage: number) {
  const contact = teamContacts.get(enemyId) ?? { ali: -Infinity, jack: -Infinity, teamAt: -Infinity }
  contact[id] = now
  teamContacts.set(enemyId, contact)
  const other = id === 'ali' ? contact.jack : contact.ali
  if (now - other > TEAM_WINDOW_MS || now - contact.teamAt < 1_500) return
  const enemy = useSessionStore.getState().enemies.find((candidate) => candidate.id === enemyId)
  if (!enemy || enemy.animation === 'dead') return
  contact.teamAt = now
  gameEvents.emit({ type: 'mechanic', biome: enemy.biome, name: 'team', x: enemy.x })
  hitEnemy(enemyId, damage, id, now, 'melee', enemy.boss ? 0 : facing * 6)
  const after = useSessionStore.getState().enemies.find((candidate) => candidate.id === enemyId)
  if (after && after.animation !== 'dead' && !after.boss) useSessionStore.getState().updateEnemy(enemyId, { stunUntil: now + 900, windupUntil: 0 })
}

/** A swing that meets an incoming shot sends it back at its thrower. */
function parryShots(id: CharacterId, playerX: number, facing: number, now: number) {
  const session = useSessionStore.getState()
  let parried = false
  const shots = session.enemyProjectiles.map((shot) => {
    if (shot.reflectedBy || shot.kind === 'time-portal') return shot
    const offset = shot.x - playerX
    if (Math.abs(offset) > PARRY_REACH || offset * facing < -0.6) return shot
    parried = true
    const source = session.enemies.find((enemy) => enemy.id === shot.sourceId && enemy.animation !== 'dead')
    gameEvents.emit({ type: 'mechanic', biome: session.currentBiome, name: 'parry', x: shot.x, id })
    session.addImpact({ kind: 'frost', x: shot.x, y: shot.y, createdAt: now, duration: 420, lethal: false })
    return { ...shot, reflectedBy: id, targetX: source ? source.x : shot.x + facing * 14, damage: Math.round(shot.damage * 1.6 + 20), travelled: 0 }
  })
  if (parried) session.updateEnemyProjectiles(shots)
}

function stepProgression(now: number, progressionX: number) {
  const session = useSessionStore.getState()
  const finalArenaOpen = session.enemies.some((enemy) => enemy.bossType === 'aku' && enemy.animation !== 'dead')
  const biomeClear = areBiomeEnemiesCleared(session.currentBiome, session.spawnedWaves, session.enemies)
  const gateX = getBiomeGateX(session.currentBiome)
  const lastBiome = session.currentBiome === BIOMES.length - 1
  session.setBiomeRightLimit(finalArenaOpen || lastBiome ? WORLD_VISUAL_RIGHT : gateX + (biomeClear ? BIOME_GATE_PADDING : -BIOME_GATE_PADDING))
  if (biomeClear && !lastBiome && lastClearedBiome !== session.currentBiome) {
    lastClearedBiome = session.currentBiome
    gameEvents.emit({ type: 'gate-open', biome: session.currentBiome, x: gateX })
  }
  if (biomeClear && !lastBiome && progressionX >= gateX + 0.2) {
    const nextBiome = session.currentBiome + 1
    session.setCurrentBiome(nextBiome, getClosedBiomeRightLimit(nextBiome), now)
  }
}

function spawnWaves(now: number, midpoint: number) {
  for (const wave of WAVES) {
    const current = useSessionStore.getState()
    if (!shouldTriggerWave(wave, current.currentBiome, current.spawnedWaves, current.elapsedSeconds, midpoint)) continue
    if (!arePriorBiomeWavesCleared(wave, current.spawnedWaves, current.enemies)) continue
    current.markWaveSpawned(wave.id)
    const waveEnemies = buildWave(wave, midpoint, now)
    current.spawnEnemies(waveEnemies)
    const shadow = waveEnemies.find((enemy) => enemy.bossType === 'shadow')
    const aku = waveEnemies.find((enemy) => enemy.bossType === 'aku')
    gameEvents.emit({ type: 'wave', biome: wave.biome, boss: Boolean(shadow || aku) })
    if (shadow) current.startBossEncounter(shadow.id, now)
    if (aku) current.startFinalEncounter(aku.id, now)
  }
}

function stepPlayerAttacks(now: number) {
  const game = useGameStore.getState()
  const session = useSessionStore.getState()
  const rules = DIFFICULTIES[session.difficulty]
  for (const id of PLAYER_IDS) {
    const sequence = game.attackSequences[id]
    const newAttack = sequence > previousAttackSequences[id]
    previousAttackSequences[id] = sequence
    if (!newAttack || session.players[id].dead) continue
    const playerX = game.positions[id][0]
    const facingX = Math.cos(game.rotations[id])
    const facing = facingX >= 0 ? 1 : -1
    const step = game.attackSteps[id] ?? 1
    const chain = CHAIN[step]
    const struck: string[] = []
    for (const enemy of useSessionStore.getState().enemies) {
      const offset = enemy.x - playerX
      // The spinning finisher cuts all around the hero.
      const behind = step === 3 ? false : offset * facingX < -0.15
      if (enemy.animation === 'dead' || Math.abs(offset) > MELEE[id].range + chain.reach + (enemy.boss ? 0.4 : 0) || behind) continue
      struck.push(enemy.id)
      const push = (offset >= 0 ? 1 : -1) * MELEE[id].knockback * chain.knockback
      hitEnemy(enemy.id, MELEE[id].damage * chain.damage * rules.playerDamage, id, now, 'melee', push)
      registerContact(enemy.id, id, now, offset >= 0 ? 1 : -1, 38 * rules.playerDamage)
    }
    chainLightning(id, struck, now, hitEnemy)
    parryShots(id, playerX, facing, now)
    strikeProps(id, playerX + facing * 1.05, 1.35 + chain.reach, now, hitEnemy)
    gameEvents.emit({ type: 'player-attack', id, x: playerX, step })
  }
}

function windupMs(enemy: EnemyState, difficultyScale: number, biome: number) {
  if (enemy.boss) return 420 * difficultyScale
  const base = enemy.variant === 'normal' ? ENEMY_WINDUP_MS[enemy.kind] : ENEMY_VARIANTS[enemy.variant].windupMs
  return base * difficultyScale * (biome === 0 ? 1.35 : 1)
}

/** Knockback, stun, telegraphed attacks and approach for one regular creature. */
/** Attack tokens held per hero during one combat step (existing + newly started). */
type AttackTokens = Map<CharacterId, number>

function countTokens(enemies: readonly EnemyState[], now: number, livingIds: readonly CharacterId[], positions: Positions): AttackTokens {
  const tokens: AttackTokens = new Map()
  for (const enemy of enemies) {
    if (enemy.boss || enemy.windupUntil <= now) continue
    const target = nearestPlayerFrom(enemy.x, livingIds, positions)
    if (target) tokens.set(target, (tokens.get(target) ?? 0) + 1)
  }
  return tokens
}

function stepRegularEnemy(enemy: EnemyState, step: number, now: number, livingIds: readonly CharacterId[], positions: Positions, attacksAllowed: boolean, tokens: AttackTokens = new Map()): EnemyState {
  const session = useSessionStore.getState()
  const rules = DIFFICULTIES[session.difficulty]
  let x = enemy.x
  let vx = enemy.vx
  if (Math.abs(vx) > 0.05) {
    x += vx * step
    vx *= Math.exp(-9 * step)
  } else vx = 0
  // Heavy machines are bolted to the floor; everyone else rides the belts.
  if (!enemy.boss && enemy.variant !== 'queen') x += beltVelocityAt(enemy.biome, x) * step
  // Inside an hourglass field the creature's own clock crawls: it moves slowly
  // and its telegraphs and cooldowns stretch by the same amount.
  const timeScale = enemy.boss ? 1 : creatureTimeScale(enemy.biome, x, now)
  if (timeScale < 1) {
    const lag = step * 1_000 * (1 - timeScale)
    if (enemy.windupUntil > now) enemy = { ...enemy, windupUntil: enemy.windupUntil + lag }
    if (enemy.nextAttackAt > now) enemy = { ...enemy, nextAttackAt: enemy.nextAttackAt + lag }
    if (enemy.stunUntil > now) enemy = { ...enemy, stunUntil: enemy.stunUntil + lag }
  }
  x = Math.max(Math.max(WORLD_VISUAL_LEFT + 0.8, session.lockedLeft), Math.min(Math.min(WORLD_VISUAL_RIGHT - 0.8, session.lockedRight), x))
  const moved = { ...enemy, x, vx }

  if (enemy.variant === 'giant' && now - enemy.spawnedAt < GIANT_RISE_MS) return { ...moved, animation: 'idle' }
  if (enemy.stunUntil > now) return { ...moved, animation: 'idle', windupUntil: 0 }

  const targetId = nearestPlayerFrom(x, livingIds, positions)
  if (!targetId) return { ...moved, animation: 'idle', windupUntil: 0 }
  const targetX = positions[targetId][0]
  const distance = Math.abs(targetX - x)
  const direction: -1 | 1 = targetX >= x ? 1 : -1
  // Between their specials, bosses fight with plain telegraphed sword strikes.
  const ability = enemy.boss ? 'dash' : ENEMIES[enemy.kind].ability
  const ranged = ability === 'stone' || ability === 'dark-orb'
  const reach = getEffectiveAttackRange(enemy.attackRange, enemy.scale, ranged)
  const shieldActive = isShieldActive(now)

  const damage = Math.round(enemy.damage * (session.currentBiome === 0 && !enemy.boss ? TUTORIAL_DAMAGE : 1))
  if (enemy.windupUntil > 0) {
    if (now < enemy.windupUntil) return { ...moved, animation: 'attack' }
    // The telegraphed strike lands now.
    if (ranged) {
      session.addEnemyProjectile({
        id: nextShotId('enemy-shot'),
        kind: ability === 'stone' ? 'stone' : 'dark-orb',
        sourceId: enemy.id,
        x,
        y: ability === 'stone' ? 1.25 : 1.55,
        targetX,
        damage,
        travelled: 0,
      })
      gameEvents.emit({ type: 'enemy-shot', kind: ability === 'stone' ? 'stone' : 'dark-orb', x })
      enemyImpact(enemy.kind, x, now)
    } else if (ability === 'quake' || isHeavyVariant(enemy.variant)) {
      enemyImpact(3, x + enemy.direction * 1.2, now, isHeavyVariant(enemy.variant))
      for (const id of livingIds) {
        if (Math.abs(positions[id][0] - x) <= enemy.attackRange + 0.3 && positions[id][1] <= 0.8) strikePlayer(id, damage, now, positions, shieldActive)
      }
    } else if (distance <= reach + 0.45) {
      const result = strikePlayer(targetId, damage, now, positions, shieldActive)
      enemyImpact(enemy.kind, targetX, now)
      if (result === 'shielded') session.addImpact({ kind: 'frost', x: targetX, y: 1.1, createdAt: now, duration: 520, lethal: false })
    }
    const cooldown = enemy.attackCooldown * 1_000 * (session.currentBiome === 0 && !enemy.boss ? TUTORIAL_COOLDOWN : 1)
    return { ...moved, animation: 'attack', windupUntil: 0, attackUntil: now + RECOVERY_MS, nextAttackAt: now + cooldown }
  }

  if (shouldEnemyApproach(distance, enemy.attackRange, enemy.scale, ranged)) {
    const ground = groundModifiers(x, now)
    const catchUp = enemyCatchUpMultiplier(distance, enemy.boss)
    let nextX = x + direction * enemy.speed * catchUp * ground.speed * timeScale * step + ground.windX * 0.45 * step
    if (shieldActive) {
      const jackX = positions.jack[0]
      const side = x < jackX ? -1 : 1
      if (Math.abs(nextX - jackX) < SHIELD_RADIUS) nextX = jackX + side * SHIELD_RADIUS
    }
    return { ...moved, x: nextX, direction, animation: 'walk' }
  }
  if (attacksAllowed && now >= enemy.nextAttackAt && !enemy.boss && (tokens.get(targetId) ?? 0) >= MAX_ATTACKERS_PER_HERO) {
    return { ...moved, direction, animation: 'idle', nextAttackAt: now + 380 }
  }
  if (attacksAllowed && now >= enemy.nextAttackAt) {
    if (!enemy.boss) tokens.set(targetId, (tokens.get(targetId) ?? 0) + 1)
    gameEvents.emit({ type: 'enemy-windup', enemyId: enemy.id, x })
    return { ...moved, direction, animation: 'attack', windupUntil: now + windupMs(enemy, rules.telegraphScale, session.currentBiome) }
  }
  return { ...moved, direction, animation: now < enemy.attackUntil ? 'attack' : 'idle' }
}

/**
 * Crowd spacing: creatures in the same lane keep a body-width apart, and
 * nobody is ever shoved into a hero's body.
 */
function separate(enemies: EnemyState[], heroes: readonly number[]) {
  const regular = enemies
    .map((enemy, index) => ({ enemy, index }))
    .filter(({ enemy }) => !enemy.boss && enemy.animation !== 'dead')
    .sort((left, right) => left.enemy.x - right.enemy.x)
  for (let pass = 0; pass < 2; pass += 1) {
    for (let index = 1; index < regular.length; index += 1) {
      const left = regular[index - 1]!
      const right = regular[index]!
      const sameLane = Math.abs(left.enemy.z - right.enemy.z) < 0.3
      const minimum = (sameLane ? 0.66 : 0.42) * (left.enemy.scale + right.enemy.scale) * 0.5
      const gap = right.enemy.x - left.enemy.x
      if (gap >= minimum) continue
      const push = (minimum - gap) * 0.5
      left.enemy = { ...left.enemy, x: left.enemy.x - push }
      right.enemy = { ...right.enemy, x: right.enemy.x + push }
    }
  }
  const result = [...enemies]
  regular.forEach(({ enemy, index }) => {
    let x = enemy.x
    for (const heroX of heroes) {
      const gap = heroGap(enemy.scale)
      if (Math.abs(x - heroX) < gap) x = heroX + (x >= heroX ? gap : -gap)
    }
    result[index] = x === enemy.x ? enemy : { ...enemy, x }
  })
  return result
}

function stepEnemies(step: number, now: number, livingIds: readonly CharacterId[], positions: Positions) {
  const session = useSessionStore.getState()
  const attacksAllowed = session.elapsedSeconds >= OPENING_GRACE_SECONDS || session.currentBiome > 0
  const tokens = countTokens(session.enemies, now, livingIds, positions)
  const updated = session.enemies
    .filter((enemy) => enemy.animation !== 'dead' || now - enemy.deadAt < 1_500 || enemy.bossType === 'aku')
    .map((enemy) => {
      if (enemy.animation === 'dead') return enemy
      if (enemy.bossType === 'shadow') return runShadowBoss(enemy, now, positions) ?? stepRegularEnemy(enemy, step, now, livingIds, positions, true)
      if (enemy.bossType === 'aku') return runAkuBoss(enemy, now, positions) ?? stepRegularEnemy(enemy, step, now, livingIds, positions, true)
      return stepRegularEnemy(enemy, step, now, livingIds, positions, attacksAllowed, tokens)
    })
  session.updateEnemies(separate(updated, livingIds.map((id) => positions[id][0])))
}

function stepFireballs(step: number, now: number) {
  const session = useSessionStore.getState()
  const rules = DIFFICULTIES[session.difficulty]
  const fireballs: ProjectileState[] = []
  for (const projectile of session.projectiles) {
    const travel = FIREBALL_SPEED * step
    const moved = { ...projectile, x: projectile.x + projectile.directionX * travel, z: projectile.z + projectile.directionZ * travel, travelled: projectile.travelled + travel }
    let consumed = false
    for (const enemy of useSessionStore.getState().enemies) {
      if (enemy.animation !== 'dead' && Math.abs(enemy.x - moved.x) < (enemy.boss ? 1.5 : 0.9) && Math.abs(moved.z) < 1.4) {
        hitEnemy(enemy.id, 58 * rules.abilityDamage, 'ali', now, 'fireball', Math.sign(projectile.directionX) * 2.6)
        consumed = true
        break
      }
    }
    if (!consumed && strikeProps('ali', moved.x, 0.7, now, hitEnemy)) consumed = true
    if (!consumed && moved.travelled < FIREBALL_RANGE) fireballs.push(moved)
  }
  useSessionStore.getState().updateProjectiles(fireballs)
}

function stepEnemyShots(step: number, now: number, livingIds: readonly CharacterId[], positions: Positions) {
  const session = useSessionStore.getState()
  const shieldActive = isShieldActive(now)
  const jackX = positions.jack[0]
  const shots: EnemyProjectileState[] = []
  for (const shot of session.enemyProjectiles) {
    if (shot.reflectedBy) {
      // A parried shot flies home and bursts on the first creature it meets.
      const direction = shot.targetX >= shot.x ? 1 : -1
      const moved = { ...shot, x: shot.x + direction * 12 * step, travelled: shot.travelled + 12 * step }
      const victim = useSessionStore.getState().enemies.find((enemy) => enemy.animation !== 'dead' && Math.abs(enemy.x - moved.x) < (enemy.boss ? 1.4 : 0.9))
      if (victim) {
        hitEnemy(victim.id, shot.damage, shot.reflectedBy, now, 'melee', victim.boss ? 0 : direction * 4)
        session.addImpact({ kind: shot.kind === 'stone' ? 'stone' : shot.kind === 'aku-fire' ? 'ember' : 'void', x: moved.x, y: 1.1, createdAt: now, duration: 700, lethal: true })
      } else if (moved.travelled < 16) shots.push(moved)
      continue
    }
    if (shot.kind === 'time-portal') {
      const live = useSessionStore.getState()
      if (!isActiveAkuFight(live, live.enemies.find((enemy) => enemy.id === shot.sourceId))) continue
    }
    const direction = shot.targetX >= shot.x ? 1 : -1
    const speed = shot.kind === 'stone' ? 7.6 : shot.kind === 'time-portal' ? 6.2 : shot.kind === 'aku-fire' ? 8.8 : 9.3
    const travel = speed * step
    const moved = { ...shot, x: shot.x + direction * travel, travelled: shot.travelled + travel }
    const reachedTarget = Math.abs(moved.x - shot.targetX) <= travel + 0.22
    if (shieldActive && Math.abs(moved.x - jackX) <= SHIELD_RADIUS) {
      session.addImpact({ kind: 'frost', x: moved.x, y: 1.1, createdAt: now, duration: 620, lethal: false })
      continue
    }
    if (!reachedTarget && moved.travelled <= 13) {
      shots.push(moved)
      continue
    }
    const targetId = nearestPlayerFrom(moved.x, livingIds, positions)
    const feetY = targetId ? positions[targetId][1] : 0
    const heightHit = shot.y >= feetY + 0.15 && shot.y <= feetY + 2.25
    if (targetId && heightHit && Math.abs(positions[targetId][0] - moved.x) < 1.25) {
      const result = strikePlayer(targetId, shot.damage, now, positions, shieldActive)
      if (shot.kind === 'time-portal' && (result === 'hit' || result === 'blocked')) {
        session.freezePlayer(targetId, now)
        teleportPlayersThroughAkuPortal(now)
      }
    }
    session.addImpact({ kind: shot.kind === 'stone' ? 'stone' : shot.kind === 'time-portal' ? 'portal' : shot.kind === 'aku-fire' ? 'ember' : 'void', x: moved.x, y: shot.kind === 'time-portal' ? 0.08 : 0.45, createdAt: now, duration: shot.kind === 'time-portal' ? 1_350 : 900, lethal: false })
  }
  useSessionStore.getState().updateEnemyProjectiles(shots)
}

function stepMeteors(now: number, livingIds: readonly CharacterId[], positions: Positions) {
  const session = useSessionStore.getState()
  const shieldActive = isShieldActive(now)
  const meteors: MeteorState[] = session.meteors.map((meteor) => {
    if (meteor.landedAt !== 0 || now < meteor.impactAt) return meteor
    for (const id of livingIds) {
      if (Math.abs(positions[id][0] - meteor.x) < 1.35 && positions[id][1] <= 0.9) strikePlayer(id, meteor.damage, now, positions, shieldActive)
    }
    session.addImpact({ kind: meteor.kind === 'fire' ? 'ember' : 'boss', x: meteor.x, y: 0.08, createdAt: now, duration: 1_050, lethal: false })
    return { ...meteor, landedAt: now }
  })
  useSessionStore.getState().updateMeteors(meteors)
}

function stepPickups(now: number, livingIds: readonly CharacterId[], positions: Positions) {
  for (const pickup of useSessionStore.getState().pickups) {
    const collector = livingIds.find((id) => Math.abs(positions[id][0] - pickup.x) < 0.95)
    if (collector) useSessionStore.getState().collectPickup(pickup.id, collector, now)
  }
}

/** One fixed combat step of the whole run. Called by SimulationLoop only. */
export function stepDirector(step: number, now: number) {
  const session = useSessionStore.getState()
  if (session.sessionToken !== lastToken) resetForSession(session.sessionToken)
  if (session.phase !== 'playing') return

  const game = useGameStore.getState()
  const livingIds = livingPlayers()
  const positions = game.positions
  const midpoint = livingIds.length > 0
    ? livingIds.reduce((sum, id) => sum + positions[id][0], 0) / livingIds.length
    : (positions.ali[0] + positions.jack[0]) / 2
  const progressionX = livingIds.length > 0 ? Math.min(...livingIds.map((id) => positions[id][0])) : midpoint

  stepProgression(now, progressionX)
  spawnWaves(now, midpoint)
  stepPlayerAttacks(now)
  stepEnemies(step, now, livingIds, positions)
  stepFireballs(step, now)
  stepEnemyShots(step, now, livingIds, positions)
  stepMeteors(now, livingIds, positions)
  stepPickups(now, livingIds, positions)
  stepMechanics(now, hitEnemy)
}
