import { create } from 'zustand'
import {
  ALI_FIREBALL_COOLDOWN_MS,
  ALI_FIREBALL_MAX_SHOTS,
  ALI_FIREBALL_WINDOW_MS,
  JACK_SHIELD_DURATION_MS,
} from '../config/abilities'
import { BIOME_INDEX, WORLD_VISUAL_RIGHT } from '../config/biomes'
import { isHeavyVariant } from '../config/enemies'
import { DIFFICULTIES, type Difficulty } from '../config/difficulty'
import { WAVES } from '../config/waves'
import { getClosedBiomeLeftLimit, getClosedBiomeRightLimit } from '../sim/biomeProgress'
import { simClock } from '../sim/clock'
import { gameEvents } from '../sim/events'
import {
  ABILITY_MAX_CHARGE,
  bossCheckpoint,
  COMBO_WINDOW_MS,
  createPlayer,
  HERO_NAMES,
  mapPlayers,
  recoverPlayer,
  type PlayerRunStatus,
} from '../sim/players'
import type { CharacterId } from '../types/character'
import type {
  BossPhase,
  CombatImpactState,
  EnemyProjectileState,
  EnemyState,
  FeedItem,
  GamePhase,
  ImpactKind,
  MeteorState,
  PickupState,
  PortalAlertState,
  ProjectileState,
} from '../types/session'
import { currentRuntimeImpactBudget } from './performanceStore'

const WORLD_START = -4.8
export const ACTIVE_PHASES: readonly GamePhase[] = ['countdown', 'boss-intro', 'final-intro', 'playing', 'ending']
type PauseablePhase = 'countdown' | 'boss-intro' | 'final-intro' | 'playing' | 'ending'
export type DamageSource = 'melee' | 'fireball' | 'hazard'

interface SessionState {
  phase: GamePhase
  pausedPhase: PauseablePhase | null
  difficulty: Difficulty
  countdown: number
  elapsedSeconds: number
  currentBiome: number
  biomeBannerUntil: number
  lockedLeft: number
  lockedRight: number
  players: Record<CharacterId, PlayerRunStatus>
  enemies: EnemyState[]
  projectiles: ProjectileState[]
  enemyProjectiles: EnemyProjectileState[]
  impacts: CombatImpactState[]
  meteors: MeteorState[]
  pickups: PickupState[]
  feed: FeedItem[]
  portalAlert: PortalAlertState | null
  spawnedWaves: string[]
  sessionToken: number
  bossPhase: BossPhase
  bossPhaseStartedAt: number
  bossCountdown: number
  activeBossId: string | null
  endingPortalX: number
  /** Biome the run started in (0 for a new game, higher for chapter select). */
  startBiome: number
  setPhase: (phase: GamePhase) => void
  setDifficulty: (difficulty: Difficulty) => void
  showControls: () => void
  startPrologue: () => void
  startCountdown: () => void
  startAtBiome: (biome: number) => void
  pause: () => void
  resume: () => void
  returnToMenu: () => void
  restart: () => void
  tick: (delta: number, now: number) => void
  setCurrentBiome: (index: number, lockedRight: number, now?: number) => void
  setBiomeRightLimit: (lockedRight: number) => void
  markWaveSpawned: (id: string) => void
  spawnEnemies: (enemies: EnemyState[]) => void
  updateEnemies: (enemies: EnemyState[]) => void
  updateEnemy: (id: string, patch: Partial<EnemyState>) => void
  damageEnemy: (id: string, amount: number, attacker: CharacterId, now: number, source?: DamageSource) => boolean
  damagePlayer: (id: CharacterId, amount: number, now: number) => 'hit' | 'down' | 'blocked'
  freezePlayer: (id: CharacterId, now: number) => void
  startDodge: (id: CharacterId, now: number) => boolean
  notePerfectDodge: (id: CharacterId, now: number) => void
  breakCombo: (id: CharacterId) => void
  grantAbilityCharge: (id: CharacterId, amount: number, now?: number) => void
  activateShield: (now: number) => boolean
  launchFireball: (now: number, x: number, y: number, rotation: number) => boolean
  updateProjectiles: (projectiles: ProjectileState[]) => void
  updateEnemyProjectiles: (projectiles: EnemyProjectileState[]) => void
  addEnemyProjectile: (projectile: EnemyProjectileState) => void
  addImpact: (impact: Omit<CombatImpactState, 'id'>) => void
  addMeteors: (meteors: MeteorState[]) => void
  updateMeteors: (meteors: MeteorState[]) => void
  addPickup: (pickup: PickupState) => void
  collectPickup: (pickupId: string, playerId: CharacterId, now: number) => void
  addFeed: (text: string, tone: FeedItem['tone'], now: number) => void
  showPortalAlert: (title: string, detail: string, now: number) => void
  startBossEncounter: (bossId: string, now: number) => void
  startFinalEncounter: (bossId: string, now: number) => void
  finishBossEncounter: (now: number) => void
  startEnding: (bossId: string, now: number) => void
  finishVictory: () => void
}

function freshState(difficulty: Difficulty = 'normal') {
  return {
    phase: 'menu' as GamePhase,
    pausedPhase: null as PauseablePhase | null,
    difficulty,
    countdown: 3,
    elapsedSeconds: 0,
    currentBiome: 0,
    biomeBannerUntil: 0,
    lockedLeft: WORLD_START,
    lockedRight: getClosedBiomeRightLimit(0),
    players: { ali: createPlayer(difficulty), jack: createPlayer(difficulty) },
    enemies: [] as EnemyState[],
    projectiles: [] as ProjectileState[],
    enemyProjectiles: [] as EnemyProjectileState[],
    impacts: [] as CombatImpactState[],
    meteors: [] as MeteorState[],
    pickups: [] as PickupState[],
    feed: [] as FeedItem[],
    portalAlert: null as PortalAlertState | null,
    spawnedWaves: [] as string[],
    bossPhase: 'none' as BossPhase,
    bossPhaseStartedAt: 0,
    bossCountdown: 3,
    activeBossId: null as string | null,
    endingPortalX: 0,
    startBiome: 0,
  }
}

let sequence = 0
const nextId = (prefix: string) => `${prefix}-${++sequence}`

function impactForEnemy(enemy: EnemyState): ImpactKind {
  if (enemy.bossType) return 'boss'
  return ({ 1: 'ember', 2: 'void', 3: 'quake', 4: 'stone', 5: 'frost' } as const)[enemy.kind]
}

function appendImpact(impacts: CombatImpactState[], impact: CombatImpactState) {
  const budget = currentRuntimeImpactBudget()
  return [...impacts.slice(-(budget - 1)), impact]
}

function toast(text: string, tone: FeedItem['tone'], now: number, lifetime = 4_500): FeedItem {
  return { id: nextId('feed'), text, tone, expiresAt: now + lifetime }
}

/** A countdown into a given biome with every earlier biome already conquered. */
function biomeStartState(state: SessionState, biome: number) {
  const now = simClock.now()
  return {
    ...freshState(state.difficulty),
    phase: 'countdown' as GamePhase,
    currentBiome: biome,
    startBiome: biome,
    lockedLeft: getClosedBiomeLeftLimit(biome),
    lockedRight: getClosedBiomeRightLimit(biome),
    spawnedWaves: WAVES.filter((wave) => wave.biome < biome).map((wave) => wave.id),
    // Chapters after the swamp start with the Shadow already beaten.
    bossPhase: (biome > BIOME_INDEX['golden-swamp'] ? 'complete' : 'none') as BossPhase,
    biomeBannerUntil: now + 6_500,
    sessionToken: state.sessionToken + 1,
  }
}

export const useSessionStore = create<SessionState>((set, get) => ({
  ...freshState(),
  sessionToken: 0,
  setPhase: (phase) => set({ phase }),
  setDifficulty: (difficulty) => set((state) => {
    if (state.phase !== 'menu' && state.phase !== 'controls') return state
    return { difficulty, players: { ali: createPlayer(difficulty), jack: createPlayer(difficulty) } }
  }),
  showControls: () => set({ phase: 'controls' }),
  startPrologue: () => set((state) => ({ ...freshState(state.difficulty), phase: 'prologue', sessionToken: state.sessionToken + 1 })),
  startCountdown: () => set((state) => ({
    phase: 'countdown',
    countdown: 3,
    players: { ali: createPlayer(state.difficulty), jack: createPlayer(state.difficulty) },
    // The chapter card stays up through the 3 s countdown and 4 s of play.
    biomeBannerUntil: simClock.now() + 6_500,
  })),
  startAtBiome: (biome) => set((state) => biomeStartState(state, biome)),
  pause: () => set((state) => {
    if (!ACTIVE_PHASES.includes(state.phase)) return state
    return { phase: 'paused', pausedPhase: state.phase as PauseablePhase }
  }),
  // The gameplay clock stops while paused, so resuming never has to move timers.
  resume: () => set((state) => {
    if (state.phase !== 'paused' || !state.pausedPhase) return state
    return { phase: state.pausedPhase, pausedPhase: null }
  }),
  returnToMenu: () => set((state) => ({ ...freshState(state.difficulty), sessionToken: state.sessionToken + 1 })),
  restart: () => set((state) => state.startBiome > 0
    ? biomeStartState(state, state.startBiome)
    : {
        ...freshState(state.difficulty),
        phase: 'countdown',
        countdown: 3,
        biomeBannerUntil: simClock.now() + 6_500,
        sessionToken: state.sessionToken + 1,
      }),
  tick: (delta, now) => set((state) => {
    let phase = state.phase
    let countdown = state.countdown
    let elapsedSeconds = state.elapsedSeconds
    let bossPhase = state.bossPhase
    let bossCountdown = state.bossCountdown
    let players = state.players
    let enemies = state.enemies
    const rules = DIFFICULTIES[state.difficulty]

    if (phase === 'countdown') {
      countdown = Math.max(0, countdown - delta)
      if (countdown <= 0) phase = 'playing'
    } else if (phase === 'playing') {
      elapsedSeconds += delta
    } else if (phase === 'boss-intro') {
      const introElapsed = now - state.bossPhaseStartedAt
      if (introElapsed < 1_350) bossPhase = 'offering'
      else if (introElapsed < 3_650) {
        bossPhase = 'drinking'
        if (state.bossPhase !== 'drinking') players = mapPlayers(state.players, (player) => bossCheckpoint(player, rules.bossPlayerHealth, now))
      } else if (introElapsed < 5_650) bossPhase = 'arrival'
      else if (introElapsed < 8_650) {
        bossPhase = 'countdown'
        bossCountdown = Math.max(1, Math.ceil((8_650 - introElapsed) / 1_000))
      } else {
        bossPhase = 'fight'
        bossCountdown = 0
        phase = 'playing'
      }
    } else if (phase === 'final-intro') {
      const introElapsed = now - state.bossPhaseStartedAt
      if (introElapsed < 2_200) bossPhase = 'prayer'
      else if (introElapsed < 4_600) bossPhase = 'aku-arrival'
      else if (introElapsed < 7_600) {
        bossPhase = 'countdown'
        bossCountdown = Math.max(1, Math.ceil((7_600 - introElapsed) / 1_000))
      } else {
        bossPhase = 'fight'
        bossCountdown = 0
        phase = 'playing'
      }
    } else if (phase === 'ending') {
      const endingElapsed = now - state.bossPhaseStartedAt
      if (endingElapsed < 1_700) bossPhase = 'defeated'
      else if (endingElapsed < 5_200) bossPhase = 'portal'
      else if (endingElapsed < 7_400) bossPhase = 'falling'
      else bossPhase = 'continued'
    }

    if (phase === 'playing') {
      const akuAlive = bossPhase === 'fight' && enemies.some((enemy) => enemy.bossType === 'aku' && enemy.animation !== 'dead')
      players = mapPlayers(players, (player) => {
        let next = player
        if (player.healOverTime > 0) {
          const healTick = Math.min(player.healOverTime, rules.healAmount / rules.healDuration * delta)
          next = { ...recoverPlayer(next, healTick), healOverTime: Math.max(0, player.healOverTime - healTick) }
        }
        if (akuAlive) next = recoverPlayer(next, rules.prayerPlayerRegen * delta)
        if (next.combo > 0 && next.comboUntil <= now) next = { ...next, combo: 0 }
        return next
      })
      if (akuAlive && rules.bossRegenPerSecond > 0) {
        enemies = enemies.map((enemy) => enemy.bossType === 'aku' && enemy.animation !== 'dead'
          ? { ...enemy, health: Math.min(enemy.maxHealth, enemy.health + enemy.maxHealth * rules.bossRegenPerSecond * delta) }
          : enemy)
      }
    }

    const revived: CharacterId[] = []
    players = mapPlayers(players, (player, id) => {
      if (!player.dead || player.lives <= 0 || player.respawnAt > now) return player
      revived.push(id)
      return { ...player, dead: false, health: player.maxHealth, invulnerableUntil: now + 1_500 }
    })
    if (players.ali.lives === 0 && players.jack.lives === 0 && phase !== 'ending') phase = 'defeat'
    const samePlayers = players.ali === state.players.ali && players.jack === state.players.jack
    queueMicrotask(() => revived.forEach((id) => gameEvents.emit({ type: 'player-revived', id })))

    return {
      phase,
      countdown,
      elapsedSeconds,
      players: samePlayers ? state.players : players,
      enemies,
      bossPhase,
      bossCountdown,
      feed: state.feed.some((item) => item.expiresAt <= now) ? state.feed.filter((item) => item.expiresAt > now) : state.feed,
      impacts: state.impacts.some((impact) => now - impact.createdAt >= impact.duration) ? state.impacts.filter((impact) => now - impact.createdAt < impact.duration) : state.impacts,
      meteors: state.meteors.some((meteor) => meteor.landedAt > 0 && now - meteor.landedAt > 800) ? state.meteors.filter((meteor) => meteor.landedAt === 0 || now - meteor.landedAt <= 800) : state.meteors,
      portalAlert: state.portalAlert && state.portalAlert.expiresAt <= now ? null : state.portalAlert,
    }
  }),
  setCurrentBiome: (currentBiome, lockedRight, now = simClock.now()) => set((state) => {
    const advanced = currentBiome > state.currentBiome
    return {
      currentBiome: Math.max(state.currentBiome, currentBiome),
      lockedLeft: advanced ? getClosedBiomeLeftLimit(currentBiome) : state.lockedLeft,
      lockedRight,
      biomeBannerUntil: advanced ? now + 6_500 : state.biomeBannerUntil,
      players: advanced
        ? mapPlayers(state.players, (player) => ({
          ...player,
          health: player.dead ? 0 : Math.min(player.maxHealth, Math.max(player.health, 0) + player.maxHealth * 0.3),
          invulnerableUntil: player.dead ? player.invulnerableUntil : Math.max(player.invulnerableUntil, now + 1_000),
        }))
        : state.players,
    }
  }),
  setBiomeRightLimit: (lockedRight) => set((state) => state.lockedRight === lockedRight ? state : { lockedRight }),
  markWaveSpawned: (id) => set((state) => state.spawnedWaves.includes(id) ? state : { spawnedWaves: [...state.spawnedWaves, id] }),
  spawnEnemies: (enemies) => set((state) => ({ enemies: [...state.enemies, ...enemies] })),
  updateEnemies: (enemies) => set({ enemies }),
  updateEnemy: (id, patch) => set((state) => ({ enemies: state.enemies.map((enemy) => enemy.id === id ? { ...enemy, ...patch } : enemy) })),
  damageEnemy: (id, amount, attacker, now, source = 'melee') => {
    let killed = false
    let dealt = 0
    let target: EnemyState | undefined
    set((state) => {
      const targetBefore = state.enemies.find((enemy) => enemy.id === id)
      if (!targetBefore || targetBefore.animation === 'dead') return state
      const rules = DIFFICULTIES[state.difficulty]
      const mitigatedAmount = targetBefore.boss ? amount * rules.bossDamageTaken : amount
      const actualDamage = Math.min(targetBefore.health, Math.max(0, mitigatedAmount))
      if (actualDamage <= 0) return state
      target = targetBefore
      dealt = actualDamage
      const health = Math.max(0, targetBefore.health - actualDamage)
      killed = health === 0
      const enemies = state.enemies.map((enemy) => enemy.id === id ? {
        ...enemy,
        health,
        animation: killed ? 'dead' as const : enemy.animation,
        deadAt: killed ? now : enemy.deadAt,
        lastHitBy: attacker,
      } : enemy)
      const player = state.players[attacker]
      const chained = source !== 'hazard' && player.comboUntil > now
      const combo = source === 'hazard' ? player.combo : chained ? player.combo + 1 : 1
      const comboBonus = 1 + Math.min(combo, 40) * 0.025
      const hitScore = Math.round(Math.max(12, actualDamage * 1.25) * comboBonus)
      const chargeGain = Math.round((16 + actualDamage * 0.16 + (killed ? 15 : 0)) * rules.chargeGain)
      const canGainCharge = source === 'melee'
        && !player.dead
        && player.abilityActiveUntil <= now
        && player.frozenUntil <= now
      const prayerHeal = targetBefore.bossType === 'aku' && state.bossPhase === 'fight' ? actualDamage * rules.prayerLifesteal : 0
      const players = {
        ...state.players,
        [attacker]: {
          ...player,
          health: Math.min(player.maxHealth, player.health + prayerHeal),
          score: player.score + hitScore + (killed ? Math.round(targetBefore.score * comboBonus) : 0),
          kills: player.kills + (killed ? 1 : 0),
          combo,
          comboUntil: source === 'hazard' ? player.comboUntil : now + COMBO_WINDOW_MS,
          bestCombo: Math.max(player.bestCombo, combo),
          abilityCharge: canGainCharge
            ? Math.min(ABILITY_MAX_CHARGE, player.abilityCharge + chargeGain)
            : player.abilityCharge,
        },
      }
      const impact: CombatImpactState = {
        id: nextId('impact'), kind: impactForEnemy(targetBefore), x: targetBefore.x, y: targetBefore.boss ? 1.45 : 1.05,
        createdAt: now, duration: killed ? 900 : 620, lethal: killed,
      }
      return { enemies, players, impacts: appendImpact(state.impacts, impact) }
    })
    if (target) {
      gameEvents.emit({
        type: 'enemy-hit',
        enemyId: id,
        x: target.x,
        y: target.boss ? target.scale * 1.2 : target.scale * 0.95,
        amount: dealt,
        killed,
        attacker,
        source,
        boss: target.bossType ?? (isHeavyVariant(target.variant) ? 'mini' : null),
        kind: target.kind,
        variant: target.variant,
        impact: impactForEnemy(target),
      })
      // Every killing blow passes here, whatever dealt it: bosses always close their encounter.
      if (killed && target.bossType === 'shadow') get().finishBossEncounter(now)
      if (killed && target.bossType === 'aku') get().startEnding(target.id, now)
    }
    return killed
  },
  damagePlayer: (id, amount, now) => {
    const player = get().players[id]
    if (player.dead || player.invulnerableUntil > now) return 'blocked'
    let result = 'hit' as 'hit' | 'down'
    let eliminated = false
    set((state) => {
      const current = state.players[id]
      const rules = DIFFICULTIES[state.difficulty]
      const health = Math.max(0, current.health - Math.max(0, amount))
      if (health > 0) return { players: { ...state.players, [id]: { ...current, health, healOverTime: 0, combo: 0, invulnerableUntil: now + rules.invulnerabilityMs } } }
      result = 'down'
      const catastrophic = amount >= current.maxHealth * 3
      const lives = catastrophic ? 0 : Math.max(0, current.lives - 1)
      eliminated = lives === 0
      return {
        players: { ...state.players, [id]: {
          ...current,
          health: 0,
          lives,
          dead: true,
          healOverTime: 0,
          combo: 0,
          respawnAt: lives > 0 ? now + rules.respawnSeconds * 1_000 : Infinity,
          abilityActiveUntil: 0,
          abilityCharge: 0,
          abilityShots: 0,
          lastAbilityShotAt: -Infinity,
          frozenUntil: 0,
          dodgeUntil: 0,
        } },
        feed: [...state.feed, toast(lives > 0 ? `${HERO_NAMES[id]} düştü · ${rules.respawnSeconds.toFixed(1)} sn sonra kalkacak` : `${HERO_NAMES[id]} savaş dışı`, 'damage', now)],
      }
    })
    gameEvents.emit({ type: 'player-hit', id, amount, down: result === 'down', eliminated })
    return result
  },
  freezePlayer: (id, now) => set((state) => {
    const player = state.players[id]
    if (player.dead) return state
    return {
      players: { ...state.players, [id]: { ...player, frozenUntil: Math.max(player.frozenUntil, now + 3_000) } },
      feed: [...state.feed, toast(`${HERO_NAMES[id]} zaman portalında 3 sn dondu`, 'damage', now, 3_800)],
    }
  }),
  startDodge: (id, now) => {
    const player = get().players[id]
    if (get().phase !== 'playing' || player.dead || player.frozenUntil > now) return false
    set((state) => ({ players: { ...state.players, [id]: { ...state.players[id], dodgeUntil: now + 260 } } }))
    gameEvents.emit({ type: 'player-dash', id, perfect: false })
    return true
  },
  notePerfectDodge: (id, now) => {
    const player = get().players[id]
    set((state) => ({
      players: { ...state.players, [id]: {
        ...player,
        abilityCharge: player.abilityActiveUntil > now ? player.abilityCharge : Math.min(ABILITY_MAX_CHARGE, player.abilityCharge + 18),
        invulnerableUntil: Math.max(player.invulnerableUntil, now + 350),
      } },
    }))
    gameEvents.emit({ type: 'player-dash', id, perfect: true })
  },
  breakCombo: (id) => set((state) => state.players[id].combo === 0 ? state : { players: { ...state.players, [id]: { ...state.players[id], combo: 0 } } }),
  grantAbilityCharge: (id, amount, now = simClock.now()) => set((state) => {
    const player = state.players[id]
    if (amount <= 0 || player.dead || player.abilityActiveUntil > now || player.frozenUntil > now) return state
    return {
      players: { ...state.players, [id]: { ...player, abilityCharge: Math.min(ABILITY_MAX_CHARGE, player.abilityCharge + amount) } },
    }
  }),
  activateShield: (now) => {
    const state = get()
    const jack = state.players.jack
    if (state.phase !== 'playing' || jack.dead || jack.frozenUntil > now || jack.abilityActiveUntil > now || jack.abilityCharge < ABILITY_MAX_CHARGE) return false
    set((current) => ({ players: { ...current.players, jack: { ...current.players.jack, abilityActiveUntil: now + JACK_SHIELD_DURATION_MS, abilityCharge: 0 } } }))
    gameEvents.emit({ type: 'ability', id: 'jack', ability: 'shield' })
    return true
  },
  launchFireball: (now, x, y, rotation) => {
    const state = get()
    const ali = state.players.ali
    if (state.phase !== 'playing' || ali.dead || ali.frozenUntil > now) return false
    const openingWindow = ali.abilityActiveUntil <= now
    if (openingWindow && ali.abilityCharge < ABILITY_MAX_CHARGE) return false
    const activeUntil = openingWindow ? now + ALI_FIREBALL_WINDOW_MS : ali.abilityActiveUntil
    const shots = openingWindow ? 0 : ali.abilityShots
    if (activeUntil <= now || shots >= ALI_FIREBALL_MAX_SHOTS || now - ali.lastAbilityShotAt < ALI_FIREBALL_COOLDOWN_MS) return false
    const directionX = Math.cos(rotation)
    const directionZ = -Math.sin(rotation)
    const projectile: ProjectileState = { id: nextId('fireball'), owner: 'ali', x: x + directionX * 1.15, y: y + 1.35, z: directionZ * 1.15, directionX, directionZ, travelled: 0 }
    set((current) => ({
      projectiles: [...current.projectiles, projectile],
      players: { ...current.players, ali: {
        ...current.players.ali,
        abilityActiveUntil: activeUntil,
        abilityCharge: openingWindow ? 0 : current.players.ali.abilityCharge,
        abilityShots: shots + 1,
        lastAbilityShotAt: now,
      } },
    }))
    gameEvents.emit({ type: 'ability', id: 'ali', ability: 'fireball' })
    return true
  },
  updateProjectiles: (projectiles) => set((state) => state.projectiles.length === 0 && projectiles.length === 0 ? state : { projectiles }),
  updateEnemyProjectiles: (enemyProjectiles) => set((state) => state.enemyProjectiles.length === 0 && enemyProjectiles.length === 0 ? state : { enemyProjectiles }),
  addEnemyProjectile: (projectile) => set((state) => ({ enemyProjectiles: [...state.enemyProjectiles, projectile] })),
  addImpact: (impact) => set((state) => ({ impacts: appendImpact(state.impacts, { ...impact, id: nextId('impact') }) })),
  addMeteors: (meteors) => set((state) => ({ meteors: [...state.meteors, ...meteors] })),
  updateMeteors: (meteors) => set((state) => state.meteors.length === 0 && meteors.length === 0 ? state : { meteors }),
  addPickup: (pickup) => set((state) => ({ pickups: [...state.pickups, pickup] })),
  collectPickup: (pickupId, playerId, now) => {
    let collected = false
    set((state) => {
      const pickup = state.pickups.find((candidate) => candidate.id === pickupId)
      if (!pickup) return state
      const player = state.players[playerId]
      const canHeal = player.health < player.maxHealth
      const canGainCharge = player.abilityActiveUntil <= now && player.frozenUntil <= now && player.abilityCharge < ABILITY_MAX_CHARGE
      if (player.dead || (!canHeal && !canGainCharge)) return state
      collected = true
      const rules = DIFFICULTIES[state.difficulty]
      return {
        pickups: state.pickups.filter((candidate) => candidate.id !== pickupId),
        players: { ...state.players, [playerId]: {
          ...player,
          healOverTime: Math.min(rules.healAmount * 2, player.healOverTime + rules.healAmount),
          abilityCharge: canGainCharge
            ? Math.min(ABILITY_MAX_CHARGE, player.abilityCharge + 12 * rules.chargeGain)
            : player.abilityCharge,
        } },
        impacts: appendImpact(state.impacts, { id: nextId('impact'), kind: 'holy', x: pickup.x, y: 1.15, createdAt: now, duration: 1_250, lethal: false }),
      }
    })
    if (collected) gameEvents.emit({ type: 'pickup', id: playerId })
  },
  addFeed: (text, tone, now) => set((state) => ({ feed: [...state.feed, toast(text, tone, now)] })),
  showPortalAlert: (title, detail, now) => set({ portalAlert: { title, detail, expiresAt: now + 4_200 } }),
  startBossEncounter: (bossId, now) => set((state) => state.activeBossId ? state : {
    phase: 'boss-intro', bossPhase: 'offering', bossPhaseStartedAt: now, bossCountdown: 3, activeBossId: bossId,
    enemies: state.enemies.filter((enemy) => enemy.id === bossId || enemy.animation === 'dead'),
    projectiles: [], enemyProjectiles: [], meteors: [],
  }),
  startFinalEncounter: (bossId, now) => set((state) => {
    if (state.activeBossId) return state
    const rules = DIFFICULTIES[state.difficulty]
    return {
      phase: 'final-intro', bossPhase: 'prayer', bossPhaseStartedAt: now, bossCountdown: 3, activeBossId: bossId,
      lockedLeft: WORLD_START,
      lockedRight: WORLD_VISUAL_RIGHT,
      enemies: state.enemies.filter((enemy) => enemy.id === bossId || enemy.animation === 'dead'),
      projectiles: [], enemyProjectiles: [], meteors: [],
      players: mapPlayers(state.players, (player) => bossCheckpoint(player, rules.bossPlayerHealth, now)),
    }
  }),
  finishBossEncounter: (now) => set((state) => {
    const rules = DIFFICULTIES[state.difficulty]
    return {
      bossPhase: 'complete', activeBossId: null, meteors: [], enemyProjectiles: [],
      players: mapPlayers(state.players, (player) => ({
        ...player,
        maxHealth: rules.playerHealth,
        health: player.dead ? 0 : Math.min(rules.playerHealth, Math.max(rules.playerHealth * 0.55, player.health)),
        abilityActiveUntil: 0,
        abilityShots: 0,
        lastAbilityShotAt: -Infinity,
      })),
      feed: [...state.feed, toast('Gölge dağıldı · Zemzem kontrol noktası canları tazeledi', 'system', now, 5_000)],
    }
  }),
  startEnding: (bossId, now) => set((state) => {
    const boss = state.enemies.find((enemy) => enemy.id === bossId)
    return {
      phase: 'ending', bossPhase: 'defeated', bossPhaseStartedAt: now, endingPortalX: boss?.x ?? 0,
      projectiles: [], enemyProjectiles: [], meteors: [], activeBossId: bossId,
    }
  }),
  finishVictory: () => set({ phase: 'victory' }),
}))
