import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BIOMES, BIOME_WORLD_WIDTH, WORLD_VISUAL_LEFT, WORLD_VISUAL_RIGHT } from '../config/biomes'
import { DIFFICULTIES } from '../config/difficulty'
import { BOSS_MODEL_SCALES } from '../config/characterTransforms'
import { BOSS_DEFINITIONS, ENEMIES, ENEMY_NAMES, type EnemyKind } from '../config/enemies'
import { expandWaveSpawns, shouldTriggerWave, WAVES, type WaveDefinition } from '../config/waves'
import { areBiomeEnemiesCleared, arePriorBiomeWavesCleared, BIOME_GATE_PADDING, getBiomeGateX, getClosedBiomeRightLimit } from './biomeProgress'
import { enemyCatchUpMultiplier, shouldEnemyApproach } from './enemyAI'
import { useGameStore } from '../store/gameStore'
import { useSessionStore } from '../store/sessionStore'
import type { CharacterId } from '../types/character'
import type { EnemyProjectileState, EnemySpecial, EnemyState, ImpactKind, MeteorState, PlayerAttackSource, ProjectileState } from '../types/session'
import {
  AKU_FIRE_SPIKE_DAMAGE_COOLDOWN_MS,
  AKU_FIRE_SPIKE_DAMAGE_MULTIPLIER,
  isActiveAkuFight,
  isInsideAkuFireSpikeField,
} from './akuCombat'
import { buildAkuPortalAmbush } from './akuPortalAmbush'
import { getMiniAkuMotion, MINI_AKU_ATTACK_TIMES } from './akuMiniSwarm'
import { chooseShadowAttack, getShadowStrikeThresholds } from './shadowCombat'

const COMBAT_STEP = 1 / 30
const MELEE_RANGE = { ali: 2.35, jack: 2.25 } as const
const MELEE_DAMAGE = { ali: 42, jack: 36 } as const
const FIREBALL_SPEED = 11.5
const FIREBALL_RANGE = 13.5
const SHIELD_RADIUS = 2.22

let enemySequence = 0
let pickupSequence = 0
let projectileSequence = 0
let meteorSequence = 0

const IMPACTS: Record<number, ImpactKind> = { 1: 'ember', 2: 'void', 3: 'quake', 4: 'stone', 5: 'frost' }
const AKU_SPECIAL_DURATION: Record<Exclude<EnemySpecial, 'none' | 'shadow-slash' | 'combo-double' | 'combo-triple' | 'meteor'>, number> = {
  'aku-melee': 1_900,
  'aku-heavy': 2_700,
  'aku-ranged': 2_500,
  'aku-fire-rain': 5_300,
  'aku-time-portal': 3_200,
  'aku-split': 4_500,
  'aku-shapeshift': 4_200,
  'aku-spin': 3_100,
}

function randomBetween(minimum: number, maximum: number) {
  return minimum + Math.random() * (maximum - minimum)
}

function buildWave(wave: WaveDefinition, midpoint: number): EnemyState[] {
  const session = useSessionStore.getState()
  const difficulty = DIFFICULTIES[session.difficulty]
  return expandWaveSpawns(wave, difficulty.extraEnemies).map((spawn, index) => {
    const base = ENEMIES[spawn.kind]
    const boss = spawn.boss ? BOSS_DEFINITIONS[spawn.boss] : null
    const offset = 6.4 + index * 1.15
    const x = Math.min(WORLD_VISUAL_RIGHT - 2, Math.max(WORLD_VISUAL_LEFT + 2, midpoint + spawn.side * offset))
    const maxHealth = Math.round(boss ? boss.health * difficulty.bossHealth : base.health)
    const bossSpeed = boss?.bossType === 'shadow' ? 4.8 : boss?.bossType === 'aku' ? 3.1 : base.speed
    return {
      id: `enemy-${++enemySequence}`,
      biome: wave.biome,
      kind: spawn.kind,
      title: boss?.title ?? ENEMY_NAMES[(enemySequence + wave.biome * 2) % ENEMY_NAMES.length],
      x,
      health: maxHealth,
      maxHealth,
      damage: Math.round(boss ? boss.damage * difficulty.bossDamage : base.damage),
      speed: boss ? bossSpeed * difficulty.bossSpeed : base.speed,
      attackRange: boss?.bossType === 'shadow' ? 3.7 : boss?.bossType === 'aku' ? 4.25 : base.attackRange,
      attackCooldown: boss ? base.attackCooldown * difficulty.bossCooldown * 0.86 : base.attackCooldown,
      score: boss?.score ?? base.score,
      scale: boss?.bossType === 'shadow' ? BOSS_MODEL_SCALES.shadow : boss?.bossType === 'aku' ? BOSS_MODEL_SCALES.aku : boss ? base.scale * 1.55 : base.scale,
      accent: boss?.bossType === 'shadow' ? '#ff244f' : boss?.bossType === 'aku' ? '#74f05b' : base.accent,
      direction: spawn.side === 1 ? -1 : 1,
      animation: 'walk',
      attackUntil: 0,
      nextAttackAt: 0,
      deadAt: 0,
      lastHitBy: null,
      boss: Boolean(boss),
      finalBoss: spawn.boss === 'final',
      bossType: boss?.bossType ?? null,
      bossForm: 'normal',
      mimicKind: null,
      special: 'none',
      specialStartedAt: 0,
      specialUntil: 0,
      nextSpecialAt: performance.now() + randomBetween(2_800, 4_800),
      specialHitMask: 0,
      nextAuraAt: 0,
    }
  })
}

function livingPlayers() {
  const session = useSessionStore.getState()
  return (['ali', 'jack'] as CharacterId[]).filter((id) => !session.players[id].dead)
}

function nearestLivingPlayer(enemyX: number) {
  const game = useGameStore.getState()
  const candidates = livingPlayers()
  if (candidates.length === 0) return null
  return candidates.reduce((nearest, id) =>
    Math.abs(game.positions[id][0] - enemyX) < Math.abs(game.positions[nearest][0] - enemyX) ? id : nearest,
  )
}

function nearestPlayerFrom(
  enemyX: number,
  ids: readonly CharacterId[],
  positions: ReturnType<typeof useGameStore.getState>['positions'],
) {
  if (ids.length === 0) return null
  if (ids.length === 1) return ids[0]!
  return Math.abs(positions.ali[0] - enemyX) <= Math.abs(positions.jack[0] - enemyX) ? 'ali' : 'jack'
}

function dropZemzem(x: number, now: number) {
  const state = useSessionStore.getState()
  if (Math.random() >= DIFFICULTIES[state.difficulty].healDropChance) return
  state.addPickup({ id: `zemzem-${++pickupSequence}`, x, type: 'zemzem' })
  state.addFeed('Yerde Zemzem şişesi belirdi', 'system', now)
}

function hitEnemy(id: string, amount: number, attacker: CharacterId, now: number, source: PlayerAttackSource = 'melee') {
  const state = useSessionStore.getState()
  const before = state.enemies.find((enemy) => enemy.id === id)
  if (!before) return
  const killed = state.damageEnemy(id, amount, attacker, now, source)
  if (!killed) return
  if (!before.boss) dropZemzem(before.x, now)
  if (before.bossType === 'shadow') useSessionStore.getState().finishBossEncounter(now)
  if (before.bossType === 'aku') useSessionStore.getState().startEnding(before.id, now)
}

function clampAgainstShield(enemyX: number, nextX: number, jackX: number, active: boolean) {
  if (!active) return nextX
  const wasSide = enemyX < jackX ? -1 : 1
  const nextDistance = Math.abs(nextX - jackX)
  if (nextDistance >= SHIELD_RADIUS) return nextX
  return jackX + wasSide * SHIELD_RADIUS
}

function enemyImpact(kind: number, x: number, now: number, lethal = false) {
  useSessionStore.getState().addImpact({
    kind: IMPACTS[kind] ?? 'ember', x, y: 0.08, createdAt: now, duration: kind === 3 ? 1_100 : 760, lethal,
  })
}

function isShielded(playerId: CharacterId, positions: ReturnType<typeof useGameStore.getState>['positions'], shieldActive: boolean) {
  return shieldActive && Math.abs(positions[playerId][0] - positions.jack[0]) <= SHIELD_RADIUS + 0.2
}

function startMeteorRain(enemy: EnemyState, now: number, kind: MeteorState['kind']) {
  const state = useSessionStore.getState()
  const game = useGameStore.getState()
  const difficulty = DIFFICULTIES[state.difficulty]
  const ids = livingPlayers()
  const targets = ids.length > 0 ? ids.map((id) => game.positions[id][0]) : [enemy.x - 2, enemy.x + 2]
  const count = kind === 'fire' && enemy.bossForm === 'monster' ? difficulty.meteorCount + 2 : difficulty.meteorCount
  const meteors: MeteorState[] = Array.from({ length: count }, (_, index) => {
    const base = targets[index % targets.length] ?? enemy.x
    const offset = randomBetween(-2.7, 2.7)
    const createdAt = now + index * randomBetween(150, 280)
    return {
      id: `meteor-${++meteorSequence}`,
      x: Math.max(WORLD_VISUAL_LEFT + 1, Math.min(WORLD_VISUAL_RIGHT - 1, base + offset)),
      createdAt,
      impactAt: createdAt + difficulty.meteorWarning * 1_000,
      landedAt: 0,
      damage: Math.round(enemy.damage * (kind === 'fire' ? 0.7 : 0.82)),
      kind,
    }
  })
  state.addMeteors(meteors)
}

function runShadowBoss(enemy: EnemyState, now: number, positions: ReturnType<typeof useGameStore.getState>['positions']) {
  const session = useSessionStore.getState()
  if (session.bossPhase !== 'fight') return enemy
  const rules = DIFFICULTIES[session.difficulty]
  if (enemy.special !== 'none') {
    if (now >= enemy.specialUntil) {
      return { ...enemy, special: 'none' as const, specialHitMask: 0, animation: 'idle' as const, nextSpecialAt: now + randomBetween(4_200, 6_400) * rules.bossCooldown }
    }
    if (enemy.special === 'meteor') {
      let nextAuraAt = enemy.nextAuraAt
      if (now >= nextAuraAt) {
        const shieldActive = session.players.jack.abilityActiveUntil > now && !session.players.jack.dead
        for (const id of livingPlayers()) {
          if (Math.abs(positions[id][0] - enemy.x) < 3.05 && !isShielded(id, positions, shieldActive)) session.damagePlayer(id, Math.round(enemy.damage * 0.38), now)
        }
        nextAuraAt = now + 720
      }
      return { ...enemy, animation: 'attack' as const, nextAuraAt }
    }
    const elapsed = now - enemy.specialStartedAt
    const thresholds = getShadowStrikeThresholds(enemy.special)
    let mask = enemy.specialHitMask
    const shieldActive = session.players.jack.abilityActiveUntil > now && !session.players.jack.dead
    thresholds.forEach((threshold, index) => {
      const bit = 1 << index
      if (elapsed >= threshold && (mask & bit) === 0) {
        mask |= bit
        for (const id of livingPlayers()) {
          if (Math.abs(positions[id][0] - enemy.x) <= 2.65 && !isShielded(id, positions, shieldActive)) {
            const multiplier = enemy.special === 'shadow-slash' ? 0.72 : 0.58
            session.damagePlayer(id, Math.round(enemy.damage * multiplier), now)
          }
        }
        session.addImpact({ kind: 'boss', x: enemy.x + enemy.direction * 1.4, y: 1.1, createdAt: now, duration: 700, lethal: false })
      }
    })
    return { ...enemy, animation: 'attack' as const, specialHitMask: mask }
  }
  if (now < enemy.nextSpecialAt) return null
  const roll = Math.random()
  const closestDistance = Math.min(...livingPlayers().map((id) => Math.abs(positions[id][0] - enemy.x)))
  const choice = chooseShadowAttack(roll, closestDistance, enemy.attackRange)
  if (choice === 'approach') {
    return { ...enemy, animation: 'walk' as const, nextSpecialAt: now + 900 }
  }
  if (choice === 'meteor') {
    startMeteorRain(enemy, now, 'shadow')
    return { ...enemy, special: 'meteor' as const, specialStartedAt: now, specialUntil: now + 6_400, nextAuraAt: now, animation: 'attack' as const }
  }
  if (choice === 'slash') {
    return {
      ...enemy,
      special: 'shadow-slash' as const,
      specialStartedAt: now,
      specialUntil: now + 1_250,
      specialHitMask: 0,
      animation: 'attack' as const,
    }
  }
  const triple = choice === 'triple'
  return {
    ...enemy,
    special: triple ? 'combo-triple' as const : 'combo-double' as const,
    specialStartedAt: now,
    specialUntil: now + (triple ? 4_350 : 2_850),
    specialHitMask: 0,
    animation: 'attack' as const,
  }
}

function addAkuProjectile(enemy: EnemyState, kind: EnemyProjectileState['kind'], targetX: number) {
  const session = useSessionStore.getState()
  if (kind === 'time-portal' && !isActiveAkuFight(session, enemy)) return
  session.addEnemyProjectile({
    id: `aku-shot-${++projectileSequence}`,
    kind,
    sourceId: enemy.id,
    x: enemy.x,
    y: kind === 'time-portal' ? 1.6 : 2.2,
    targetX,
    damage: Math.round(enemy.damage * (kind === 'time-portal' ? 0.88 : 0.72)),
    travelled: 0,
  })
}

function teleportPlayersThroughAkuPortal(now: number) {
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
    nextId: () => `portal-enemy-${++enemySequence}`,
  })
  session.spawnEnemies(ambush)
  game.teleportPlayer('ali', destinationX - 1.05)
  game.teleportPlayer('jack', destinationX + 1.05)
  session.showPortalAlert('ZAMAN PUSUSU', `${BIOMES[destination].title} biyomunda ${ambush.length} düşman sizi bekliyor`, now)
  session.addFeed(`Zaman portalı ${ambush.length} rastgele düşman çağırdı`, 'system', now)
}

function chooseAkuSpecial(form: EnemyState['bossForm']): EnemySpecial {
  const normal: EnemySpecial[] = ['aku-melee', 'aku-heavy', 'aku-ranged', 'aku-time-portal', 'aku-fire-rain']
  const monster: EnemySpecial[] = ['aku-heavy', 'aku-ranged', 'aku-fire-rain', 'aku-time-portal', 'aku-split', 'aku-shapeshift', 'aku-spin', 'combo-triple']
  const pool = form === 'monster' ? monster : normal
  return pool[Math.floor(Math.random() * pool.length)] ?? 'aku-melee'
}

function hitAkuArea(enemy: EnemyState, positions: ReturnType<typeof useGameStore.getState>['positions'], now: number, radius: number, multiplier: number) {
  const session = useSessionStore.getState()
  const shieldActive = session.players.jack.abilityActiveUntil > now && !session.players.jack.dead
  for (const id of livingPlayers()) {
    if (Math.abs(positions[id][0] - enemy.x) <= radius && !isShielded(id, positions, shieldActive)) session.damagePlayer(id, Math.round(enemy.damage * multiplier), now)
  }
  session.addImpact({ kind: enemy.special === 'aku-time-portal' ? 'portal' : 'boss', x: enemy.x, y: 1.1, createdAt: now, duration: 820, lethal: false })
}

function hitMiniAku(enemy: EnemyState, index: number, positions: ReturnType<typeof useGameStore.getState>['positions'], now: number) {
  const session = useSessionStore.getState()
  const preferred: CharacterId = index % 2 === 0 ? 'ali' : 'jack'
  const targetId = session.players[preferred].dead ? nearestLivingPlayer(enemy.x) : preferred
  if (!targetId) return
  const motion = getMiniAkuMotion(index, now - enemy.specialStartedAt, enemy.x, positions[targetId][0])
  const shieldActive = session.players.jack.abilityActiveUntil > now && !session.players.jack.dead
  for (const id of livingPlayers()) {
    if (Math.abs(positions[id][0] - motion.x) <= 1.65 && positions[id][1] <= 1.05 && !isShielded(id, positions, shieldActive)) {
      session.damagePlayer(id, Math.round(enemy.damage * 0.34), now)
    }
  }
  session.addImpact({ kind: 'boss', x: motion.x, y: 0.72, createdAt: now, duration: 680, lethal: false })
}

function runAkuBoss(enemy: EnemyState, now: number, positions: ReturnType<typeof useGameStore.getState>['positions']) {
  const session = useSessionStore.getState()
  if (!isActiveAkuFight(session, enemy)) return enemy
  const ratio = enemy.maxHealth > 0 ? enemy.health / enemy.maxHealth : 0
  const nextForm = enemy.bossForm === 'normal' && ratio <= 0.46
    ? 'monster'
    : enemy.bossForm === 'monster' && ratio >= 0.52
      ? 'normal'
      : enemy.bossForm
  if (nextForm !== enemy.bossForm) {
    session.addFeed(nextForm === 'monster' ? 'Aku öfkeyle canavar formuna dönüştü' : 'Aku yenilenen canıyla normal formuna döndü', 'system', now)
    session.addImpact({ kind: 'portal', x: enemy.x, y: 1.4, createdAt: now, duration: 1_300, lethal: false })
    return { ...enemy, bossForm: nextForm, mimicKind: null, special: 'none' as const, specialHitMask: 0, nextSpecialAt: now + 900, animation: 'walk' as const }
  }
  const rules = DIFFICULTIES[session.difficulty]
  if (enemy.special === 'none') {
    if (now < enemy.nextSpecialAt) return null
    const special = chooseAkuSpecial(enemy.bossForm)
    if (special === 'aku-fire-rain') startMeteorRain(enemy, now, 'fire')
    const duration = special === 'combo-triple' ? 4_350 : AKU_SPECIAL_DURATION[special as keyof typeof AKU_SPECIAL_DURATION]
    return {
      ...enemy,
      special,
      specialStartedAt: now,
      specialUntil: now + duration,
      specialHitMask: 0,
      nextAuraAt: special === 'aku-fire-rain' ? now : enemy.nextAuraAt,
      mimicKind: special === 'aku-shapeshift' ? (Math.floor(Math.random() * 5) + 1) as EnemyKind : null,
      animation: 'attack' as const,
    }
  }
  if (now >= enemy.specialUntil) {
    const [minimum, maximum] = rules.akuSpecialCooldown
    return { ...enemy, special: 'none' as const, mimicKind: null, specialHitMask: 0, nextAuraAt: 0, animation: 'walk' as const, nextSpecialAt: now + randomBetween(minimum, maximum) * 1_000 }
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
      const shieldActive = session.players.jack.abilityActiveUntil > now && !session.players.jack.dead
      let playerInside = false
      for (const id of livingPlayers()) {
        if (!isInsideAkuFireSpikeField(enemy.x, positions[id][0], positions[id][1])) continue
        playerInside = true
        if (!isShielded(id, positions, shieldActive)) {
          session.damagePlayer(id, Math.round(enemy.damage * AKU_FIRE_SPIKE_DAMAGE_MULTIPLIER), now)
        }
      }
      if (playerInside) {
        nextAuraAt = now + AKU_FIRE_SPIKE_DAMAGE_COOLDOWN_MS
        session.addImpact({ kind: 'ember', x: enemy.x, y: 0.08, createdAt: now, duration: 520, lethal: false })
      }
    }
    return { ...enemy, animation: 'attack' as const, specialHitMask: mask, nextAuraAt }
  } else if (enemy.special === 'aku-time-portal') {
    trigger(0, 1_020, () => {
      session.showPortalAlert('ZAMAN PORTALI AÇILDI', 'Temastan kaçın — Aku sizi başka bir biyoma savurabilir', now)
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
  return { ...enemy, animation: 'attack' as const, specialHitMask: mask }
}

export function GameDirector() {
  const accumulator = useRef(0)
  const previousAttackSequences = useRef({ ali: 0, jack: 0 })

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1)
    const now = performance.now()
    const session = useSessionStore.getState()
    if (!['countdown', 'boss-intro', 'final-intro', 'playing', 'ending'].includes(session.phase)) return
    if (session.phase !== 'playing') return

    accumulator.current += delta
    if (accumulator.current < COMBAT_STEP) return
    const step = accumulator.current
    accumulator.current = 0

    const game = useGameStore.getState()
    const livingIds = livingPlayers()
    const midpoint = livingIds.length > 0
      ? livingIds.reduce((sum, id) => sum + game.positions[id][0], 0) / livingIds.length
      : (game.positions.ali[0] + game.positions.jack[0]) / 2
    const progressionX = livingIds.length > 0 ? Math.min(...livingIds.map((id) => game.positions[id][0])) : midpoint
    const finalArenaOpen = session.enemies.some((enemy) => enemy.bossType === 'aku' && enemy.animation !== 'dead')
    const biomeClear = areBiomeEnemiesCleared(session.currentBiome, session.spawnedWaves, session.enemies)
    const gateX = getBiomeGateX(session.currentBiome)
    const desiredRightLimit = finalArenaOpen || session.currentBiome === BIOMES.length - 1
      ? WORLD_VISUAL_RIGHT
      : gateX + (biomeClear ? BIOME_GATE_PADDING : -BIOME_GATE_PADDING)
    session.setBiomeRightLimit(desiredRightLimit)
    if (biomeClear && session.currentBiome < BIOMES.length - 1 && progressionX >= gateX + 0.2) {
      const nextBiome = session.currentBiome + 1
      session.setCurrentBiome(nextBiome, getClosedBiomeRightLimit(nextBiome), now)
      session.addFeed(`${BIOMES[nextBiome].title} başladı — arka geçit mühürlendi`, 'system', now)
    }

    for (const wave of WAVES) {
      const current = useSessionStore.getState()
      if (shouldTriggerWave(wave, current.currentBiome, current.spawnedWaves, current.elapsedSeconds, midpoint)
        && arePriorBiomeWavesCleared(wave, current.spawnedWaves, current.enemies)) {
        current.markWaveSpawned(wave.id)
        const waveEnemies = buildWave(wave, midpoint)
        current.spawnEnemies(waveEnemies)
        const shadow = waveEnemies.find((enemy) => enemy.bossType === 'shadow')
        const aku = waveEnemies.find((enemy) => enemy.bossType === 'aku')
        if (shadow) current.startBossEncounter(shadow.id, now)
        if (aku) current.startFinalEncounter(aku.id, now)
      }
    }

    const rules = DIFFICULTIES[session.difficulty]
    for (const id of ['ali', 'jack'] as CharacterId[]) {
      const sequence = game.attackSequences[id]
      const newAttack = sequence > previousAttackSequences.current[id]
      if (newAttack && !session.players[id].dead) {
        const playerX = game.positions[id][0]
        const facingX = Math.cos(game.rotations[id])
        for (const enemy of useSessionStore.getState().enemies) {
          const offset = enemy.x - playerX
          if (enemy.animation !== 'dead' && Math.abs(offset) <= MELEE_RANGE[id] && offset * facingX >= -0.15) {
            hitEnemy(enemy.id, MELEE_DAMAGE[id] * rules.playerDamage, id, now)
          }
        }
      }
      previousAttackSequences.current[id] = sequence
    }

    const current = useSessionStore.getState()
    const currentGame = useGameStore.getState()
    const shieldActive = current.players.jack.abilityActiveUntil > now && !current.players.jack.dead
    const jackX = currentGame.positions.jack[0]

    const updatedEnemies = current.enemies
      .filter((enemy) => enemy.animation !== 'dead' || now - enemy.deadAt < 1_500 || enemy.bossType === 'aku')
      .map((enemy) => {
        if (enemy.animation === 'dead') return enemy
        if (enemy.bossType === 'shadow') {
          const bossState = runShadowBoss(enemy, now, currentGame.positions)
          if (bossState) return bossState
        }
        if (enemy.bossType === 'aku') {
          const bossState = runAkuBoss(enemy, now, currentGame.positions)
          if (bossState) return bossState
        }
        const targetId = nearestPlayerFrom(enemy.x, livingIds, currentGame.positions)
        if (!targetId) return enemy
        const targetX = currentGame.positions[targetId][0]
        const distance = Math.abs(targetX - enemy.x)
        const direction = targetX >= enemy.x ? 1 : -1
        const definition = ENEMIES[enemy.kind]
        const ability = enemy.bossType ? 'dash' : definition.ability
        const ranged = ability === 'stone' || ability === 'dark-orb'
        const shouldApproach = shouldEnemyApproach(distance, enemy.attackRange, enemy.scale, ranged)
        if (shouldApproach) {
          const catchUp = enemyCatchUpMultiplier(distance, enemy.boss)
          const rawX = enemy.x + direction * enemy.speed * catchUp * step
          const x = clampAgainstShield(enemy.x, rawX, jackX, shieldActive)
          return { ...enemy, x, direction: direction as -1 | 1, animation: 'walk' as const }
        }
        if (now >= enemy.nextAttackAt) {
          const protectedByShield = isShielded(targetId, currentGame.positions, shieldActive)
          if (ranged) {
            current.addEnemyProjectile({
              id: `enemy-shot-${++projectileSequence}`,
              kind: ability === 'stone' ? 'stone' : 'dark-orb',
              sourceId: enemy.id,
              x: enemy.x,
              y: ability === 'stone' ? 1.25 : 1.55,
              targetX,
              damage: enemy.damage,
              travelled: 0,
            })
            enemyImpact(enemy.kind, enemy.x, now)
          } else if (ability === 'quake') {
            enemyImpact(enemy.kind, enemy.x + direction * 1.2, now)
            for (const id of livingPlayers()) {
              if (Math.abs(currentGame.positions[id][0] - enemy.x) <= enemy.attackRange && currentGame.positions[id][1] <= 0.8 && !isShielded(id, currentGame.positions, shieldActive)) current.damagePlayer(id, enemy.damage, now)
            }
          } else if (!protectedByShield) {
            current.damagePlayer(targetId, enemy.damage, now)
            if (enemy.bossType) current.addImpact({ kind: 'boss', x: targetX, y: 1.05, createdAt: now, duration: 720, lethal: false })
            else enemyImpact(enemy.kind, targetX, now)
          }
          return { ...enemy, direction: direction as -1 | 1, animation: 'attack' as const, attackUntil: now + 820, nextAttackAt: now + enemy.attackCooldown * 1_000 }
        }
        return { ...enemy, direction: direction as -1 | 1, animation: now < enemy.attackUntil ? 'attack' as const : 'idle' as const }
      })
    current.updateEnemies(updatedEnemies)

    const fireballs: ProjectileState[] = []
    const activeFireballs = useSessionStore.getState().projectiles
    let collisionEnemies = useSessionStore.getState().enemies
    for (const projectile of activeFireballs) {
      const travel = FIREBALL_SPEED * step
      const moved = { ...projectile, x: projectile.x + projectile.directionX * travel, z: projectile.z + projectile.directionZ * travel, travelled: projectile.travelled + travel }
      let consumed = false
      for (const enemy of collisionEnemies) {
        if (enemy.animation !== 'dead' && Math.abs(enemy.x - moved.x) < (enemy.boss ? 1.5 : 0.9) && Math.abs(moved.z) < 1.4) {
          hitEnemy(enemy.id, 58 * rules.abilityDamage, 'ali', now, 'fireball')
          collisionEnemies = useSessionStore.getState().enemies
          consumed = true
          break
        }
      }
      if (!consumed && moved.travelled < FIREBALL_RANGE) fireballs.push(moved)
    }
    current.updateProjectiles(fireballs)

    const enemyShots: EnemyProjectileState[] = []
    const activeEnemyShots = useSessionStore.getState().enemyProjectiles
    for (const shot of activeEnemyShots) {
      if (shot.kind === 'time-portal') {
        const liveSession = useSessionStore.getState()
        const source = liveSession.enemies.find((enemy) => enemy.id === shot.sourceId)
        if (!isActiveAkuFight(liveSession, source)) continue
      }
      const direction = shot.targetX >= shot.x ? 1 : -1
      const speed = shot.kind === 'stone' ? 7.6 : shot.kind === 'time-portal' ? 6.2 : shot.kind === 'aku-fire' ? 8.8 : 9.3
      const travel = speed * step
      const moved = { ...shot, x: shot.x + direction * travel, travelled: shot.travelled + travel }
      const shieldBlocked = shieldActive && Math.abs(moved.x - jackX) <= SHIELD_RADIUS
      const reachedTarget = Math.abs(moved.x - shot.targetX) <= travel + 0.22
      if (shieldBlocked) {
        current.addImpact({ kind: 'frost', x: moved.x, y: 1.1, createdAt: now, duration: 620, lethal: false })
      } else if (reachedTarget || moved.travelled > 13) {
        const targetId = nearestPlayerFrom(moved.x, livingIds, currentGame.positions)
        const targetFeetY = targetId ? currentGame.positions[targetId][1] : 0
        const intersectsPlayerHeight = shot.y >= targetFeetY + 0.15 && shot.y <= targetFeetY + 2.25
        if (targetId && intersectsPlayerHeight && Math.abs(currentGame.positions[targetId][0] - moved.x) < 1.25) {
          if (shot.kind === 'time-portal') {
            current.freezePlayer(targetId, now)
            teleportPlayersThroughAkuPortal(now)
          }
          current.damagePlayer(targetId, shot.damage, now)
        }
        current.addImpact({ kind: shot.kind === 'stone' ? 'stone' : shot.kind === 'time-portal' ? 'portal' : shot.kind === 'aku-fire' ? 'ember' : 'void', x: moved.x, y: shot.kind === 'time-portal' ? 0.08 : 0.45, createdAt: now, duration: shot.kind === 'time-portal' ? 1_350 : 900, lethal: false })
      } else enemyShots.push(moved)
    }
    current.updateEnemyProjectiles(enemyShots)

    const meteors: MeteorState[] = []
    const activeMeteors = useSessionStore.getState().meteors
    for (const meteor of activeMeteors) {
      if (meteor.landedAt === 0 && now >= meteor.impactAt) {
        for (const id of livingIds) {
          if (Math.abs(currentGame.positions[id][0] - meteor.x) < 1.35 && currentGame.positions[id][1] <= 0.9 && !isShielded(id, currentGame.positions, shieldActive)) current.damagePlayer(id, meteor.damage, now)
        }
        current.addImpact({ kind: meteor.kind === 'fire' ? 'ember' : 'boss', x: meteor.x, y: 0.08, createdAt: now, duration: 1_050, lethal: false })
        meteors.push({ ...meteor, landedAt: now })
      } else meteors.push(meteor)
    }
    current.updateMeteors(meteors)

    const activePickups = useSessionStore.getState().pickups
    for (const pickup of activePickups) {
      for (const id of livingIds) {
        if (Math.abs(currentGame.positions[id][0] - pickup.x) < 0.95) {
          current.collectPickup(pickup.id, id, now)
          break
        }
      }
    }
  })

  return null
}
