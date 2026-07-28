import { create } from 'zustand'
import { WORLD_VISUAL_RIGHT } from '../config/biomes'
import { DIFFICULTIES, type Difficulty } from '../config/difficulty'
import { getClosedBiomeLeftLimit, getClosedBiomeRightLimit } from '../game/biomeProgress'
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
  PlayerStatus,
  PortalAlertState,
  ProjectileState,
} from '../types/session'
import { currentPerformanceProfile } from './performanceStore'

const FIREBALL_WINDOW_DURATION = 6_000
const SHIELD_DURATION = 4_000
const ABILITY_MAX_CHARGE = 100
const WORLD_START = -4.8
type PauseablePhase = 'countdown' | 'boss-intro' | 'final-intro' | 'playing' | 'ending'

const createPlayer = (difficulty: Difficulty): PlayerStatus => {
  const rules = DIFFICULTIES[difficulty]
  return {
    health: rules.playerHealth,
    maxHealth: rules.playerHealth,
    lives: rules.playerLives,
    score: 0,
    kills: 0,
    dead: false,
    respawnAt: 0,
    invulnerableUntil: 0,
    abilityActiveUntil: 0,
    abilityCharge: 0,
    abilityShots: 0,
    lastAbilityShotAt: -Infinity,
    healOverTime: 0,
    frozenUntil: 0,
  }
}

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
  players: Record<CharacterId, PlayerStatus>
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
  pausedAt: number
  bossPhase: BossPhase
  bossPhaseStartedAt: number
  bossCountdown: number
  activeBossId: string | null
  endingPortalX: number
  setPhase: (phase: GamePhase) => void
  setDifficulty: (difficulty: Difficulty) => void
  showControls: () => void
  startCountdown: () => void
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
  damageEnemy: (id: string, amount: number, attacker: CharacterId, now: number) => boolean
  damagePlayer: (id: CharacterId, amount: number, now: number) => 'hit' | 'down' | 'blocked'
  freezePlayer: (id: CharacterId, now: number) => void
  grantAbilityCharge: (id: CharacterId, amount: number) => void
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
    pausedAt: 0,
    bossPhase: 'none' as BossPhase,
    bossPhaseStartedAt: 0,
    bossCountdown: 3,
    activeBossId: null as string | null,
    endingPortalX: 0,
  }
}

let sequence = 0
const nextId = (prefix: string) => `${prefix}-${++sequence}`

function impactForEnemy(enemy: EnemyState): ImpactKind {
  if (enemy.bossType) return 'boss'
  return ({ 1: 'ember', 2: 'void', 3: 'quake', 4: 'stone', 5: 'frost' } as const)[enemy.kind]
}

function shiftPlayerTimers(player: PlayerStatus, delay: number): PlayerStatus {
  const shift = (value: number) => Number.isFinite(value) && value > 0 ? value + delay : value
  return {
    ...player,
    respawnAt: shift(player.respawnAt),
    invulnerableUntil: shift(player.invulnerableUntil),
    abilityActiveUntil: shift(player.abilityActiveUntil),
    lastAbilityShotAt: shift(player.lastAbilityShotAt),
    frozenUntil: shift(player.frozenUntil),
  }
}

function recoverPlayer(player: PlayerStatus, amount: number): PlayerStatus {
  if (player.dead || amount <= 0 || player.health >= player.maxHealth) return player
  return { ...player, health: Math.min(player.maxHealth, player.health + amount) }
}

function appendImpact(impacts: CombatImpactState[], impact: CombatImpactState) {
  const budget = currentPerformanceProfile().impactBudget
  return [...impacts.slice(-(budget - 1)), impact]
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
  startCountdown: () => set((state) => ({
    phase: 'countdown',
    countdown: 3,
    players: { ali: createPlayer(state.difficulty), jack: createPlayer(state.difficulty) },
    biomeBannerUntil: performance.now() + 3_500,
  })),
  pause: () => set((state) => {
    if (!(['countdown', 'boss-intro', 'final-intro', 'playing', 'ending'] as GamePhase[]).includes(state.phase)) return state
    return { phase: 'paused', pausedPhase: state.phase as PauseablePhase, pausedAt: performance.now() }
  }),
  resume: () => set((state) => {
    if (state.phase !== 'paused' || !state.pausedPhase) return state
    const delay = Math.max(0, performance.now() - state.pausedAt)
    const shift = (value: number) => Number.isFinite(value) && value > 0 ? value + delay : value
    return {
      phase: state.pausedPhase,
      pausedPhase: null,
      pausedAt: 0,
      bossPhaseStartedAt: shift(state.bossPhaseStartedAt),
      biomeBannerUntil: shift(state.biomeBannerUntil),
      players: Object.fromEntries(Object.entries(state.players).map(([id, player]) => [id, shiftPlayerTimers(player, delay)])) as Record<CharacterId, PlayerStatus>,
      enemies: state.enemies.map((enemy) => ({
        ...enemy,
        attackUntil: shift(enemy.attackUntil), nextAttackAt: shift(enemy.nextAttackAt), deadAt: shift(enemy.deadAt),
        specialStartedAt: shift(enemy.specialStartedAt), specialUntil: shift(enemy.specialUntil), nextSpecialAt: shift(enemy.nextSpecialAt), nextAuraAt: shift(enemy.nextAuraAt),
      })),
      feed: state.feed.map((item) => ({ ...item, expiresAt: shift(item.expiresAt) })),
      portalAlert: state.portalAlert ? { ...state.portalAlert, expiresAt: shift(state.portalAlert.expiresAt) } : null,
      impacts: state.impacts.map((impact) => ({ ...impact, createdAt: shift(impact.createdAt) })),
      meteors: state.meteors.map((meteor) => ({ ...meteor, createdAt: shift(meteor.createdAt), impactAt: shift(meteor.impactAt), landedAt: shift(meteor.landedAt) })),
    }
  }),
  returnToMenu: () => set((state) => ({ ...freshState(state.difficulty), sessionToken: state.sessionToken + 1 })),
  restart: () => set((state) => ({
    ...freshState(state.difficulty),
    phase: 'countdown',
    countdown: 3,
    biomeBannerUntil: performance.now() + 3_500,
    sessionToken: state.sessionToken + 1,
  })),
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
        if (state.bossPhase !== 'drinking') {
          players = Object.fromEntries(Object.entries(state.players).map(([id, player]) => {
            return [id, {
              ...player,
              lives: rules.playerLives,
              maxHealth: rules.bossPlayerHealth,
              health: rules.bossPlayerHealth,
              dead: false,
              respawnAt: 0,
              abilityCharge: ABILITY_MAX_CHARGE,
              invulnerableUntil: now + 2_000,
            }]
          })) as Record<CharacterId, PlayerStatus>
        }
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
      let changedPlayers = false
      const akuAlive = enemies.some((enemy) => enemy.bossType === 'aku' && enemy.animation !== 'dead') && bossPhase === 'fight'
      for (const id of ['ali', 'jack'] as CharacterId[]) {
        const player = players[id]
        let next = player
        if (player.healOverTime > 0) {
          const healTick = Math.min(player.healOverTime, rules.healAmount / rules.healDuration * delta)
          next = recoverPlayer(next, healTick)
          next = { ...next, healOverTime: Math.max(0, player.healOverTime - healTick) }
        }
        if (akuAlive) next = recoverPlayer(next, rules.prayerPlayerRegen * delta)
        if (next !== player) {
          if (!changedPlayers) players = { ...players }
          changedPlayers = true
          players[id] = next
        }
      }
      if (akuAlive && rules.bossRegenPerSecond > 0) {
        enemies = enemies.map((enemy) => enemy.bossType === 'aku' && enemy.animation !== 'dead'
          ? { ...enemy, health: Math.min(enemy.maxHealth, enemy.health + enemy.maxHealth * rules.bossRegenPerSecond * delta) }
          : enemy)
      }
    }

    for (const id of ['ali', 'jack'] as CharacterId[]) {
      const player = players[id]
      if (player.dead && player.lives > 0 && player.respawnAt <= now) {
        if (players === state.players) players = { ...state.players }
        players[id] = { ...player, dead: false, health: player.maxHealth, invulnerableUntil: now + 1_500 }
      }
    }
    if (players.ali.lives === 0 && players.jack.lives === 0 && phase !== 'ending') phase = 'defeat'

    return {
      phase,
      countdown,
      elapsedSeconds,
      players,
      enemies,
      bossPhase,
      bossCountdown,
      feed: state.feed.some((item) => item.expiresAt <= now) ? state.feed.filter((item) => item.expiresAt > now) : state.feed,
      impacts: state.impacts.some((impact) => now - impact.createdAt >= impact.duration) ? state.impacts.filter((impact) => now - impact.createdAt < impact.duration) : state.impacts,
      meteors: state.meteors.some((meteor) => meteor.landedAt > 0 && now - meteor.landedAt > 800) ? state.meteors.filter((meteor) => meteor.landedAt === 0 || now - meteor.landedAt <= 800) : state.meteors,
      portalAlert: state.portalAlert && state.portalAlert.expiresAt <= now ? null : state.portalAlert,
    }
  }),
  setCurrentBiome: (currentBiome, lockedRight, now = performance.now()) => set((state) => {
    const advanced = currentBiome > state.currentBiome
    const maxLives = DIFFICULTIES[state.difficulty].playerLives
    return {
      currentBiome: Math.max(state.currentBiome, currentBiome),
      lockedLeft: advanced ? getClosedBiomeLeftLimit(currentBiome) : state.lockedLeft,
      lockedRight,
      biomeBannerUntil: advanced ? now + 3_800 : state.biomeBannerUntil,
      players: advanced
        ? Object.fromEntries(Object.entries(state.players).map(([id, player]) => [id, {
          ...player,
          lives: Math.min(maxLives, player.lives + 1),
          dead: false,
          respawnAt: 0,
          health: player.dead
            ? player.maxHealth
            : Math.min(player.maxHealth, Math.max(player.health, 0) + player.maxHealth * 0.3),
          invulnerableUntil: Math.max(player.invulnerableUntil, now + 1_000),
        }])) as Record<CharacterId, PlayerStatus>
        : state.players,
    }
  }),
  setBiomeRightLimit: (lockedRight) => set((state) => state.lockedRight === lockedRight ? state : { lockedRight }),
  markWaveSpawned: (id) => set((state) => state.spawnedWaves.includes(id) ? state : { spawnedWaves: [...state.spawnedWaves, id] }),
  spawnEnemies: (enemies) => set((state) => ({ enemies: [...state.enemies, ...enemies] })),
  updateEnemies: (enemies) => set({ enemies }),
  damageEnemy: (id, amount, attacker, now) => {
    let killed = false
    set((state) => {
      const targetBefore = state.enemies.find((enemy) => enemy.id === id)
      if (!targetBefore || targetBefore.animation === 'dead') return state
      const rules = DIFFICULTIES[state.difficulty]
      const mitigatedAmount = targetBefore.boss ? amount * rules.bossDamageTaken : amount
      const actualDamage = Math.min(targetBefore.health, Math.max(0, mitigatedAmount))
      if (actualDamage <= 0) return state
      const health = Math.max(0, targetBefore.health - actualDamage)
      killed = health === 0
      const enemies = state.enemies.map((enemy) => enemy.id === id ? {
        ...enemy,
        health,
        animation: killed ? 'dead' as const : enemy.animation,
        deadAt: killed ? now : enemy.deadAt,
        lastHitBy: attacker,
      } : enemy)
      const hitScore = Math.max(12, Math.round(actualDamage * 1.25))
      const chargeGain = Math.round((16 + actualDamage * 0.16 + (killed ? 15 : 0)) * rules.chargeGain)
      const player = state.players[attacker]
      const prayerHeal = targetBefore.bossType === 'aku' && state.bossPhase === 'fight' ? actualDamage * rules.prayerLifesteal : 0
      const players = {
        ...state.players,
        [attacker]: {
          ...player,
          health: Math.min(player.maxHealth, player.health + prayerHeal),
          score: player.score + hitScore + (killed ? targetBefore.score : 0),
          kills: player.kills + (killed ? 1 : 0),
          abilityCharge: Math.min(ABILITY_MAX_CHARGE, player.abilityCharge + chargeGain),
        },
      }
      const feed = killed
        ? [...state.feed, { id: nextId('feed'), text: `${attacker === 'ali' ? 'Hz. Ali' : 'Samuray Jack'} ⚔ ${targetBefore.title}`, tone: 'kill' as const, expiresAt: now + 4_500 }]
        : state.feed
      const impact: CombatImpactState = {
        id: nextId('impact'), kind: impactForEnemy(targetBefore), x: targetBefore.x, y: targetBefore.boss ? 1.45 : 1.05,
        createdAt: now, duration: killed ? 900 : 620, lethal: killed,
      }
      return { enemies, players, feed, impacts: appendImpact(state.impacts, impact) }
    })
    return killed
  },
  damagePlayer: (id, amount, now) => {
    const player = get().players[id]
    if (player.dead || player.invulnerableUntil > now) return 'blocked'
    let result: 'hit' | 'down' = 'hit'
    set((state) => {
      const current = state.players[id]
      const rules = DIFFICULTIES[state.difficulty]
      const health = Math.max(0, current.health - Math.max(0, amount))
      if (health > 0) return { players: { ...state.players, [id]: { ...current, health, healOverTime: 0, invulnerableUntil: now + rules.invulnerabilityMs } } }
      result = 'down'
      const catastrophic = amount >= current.maxHealth * 3
      const lives = catastrophic ? 0 : Math.max(0, current.lives - 1)
      const name = id === 'ali' ? 'Hz. Ali' : 'Samuray Jack'
      return {
        players: { ...state.players, [id]: { ...current, health: 0, lives, dead: true, healOverTime: 0, respawnAt: lives > 0 ? now + rules.respawnSeconds * 1_000 : Infinity } },
        feed: [...state.feed, { id: nextId('feed'), text: lives > 0 ? `${name} düştü — ${rules.respawnSeconds.toFixed(1)} sn sonra dirilecek` : `${name} savaş dışı`, tone: 'damage' as const, expiresAt: now + 4_500 }],
      }
    })
    return result
  },
  freezePlayer: (id, now) => set((state) => {
    const player = state.players[id]
    if (player.dead) return state
    const frozenUntil = Math.max(player.frozenUntil, now + 3_000)
    const name = id === 'ali' ? 'Hz. Ali' : 'Samuray Jack'
    return {
      players: { ...state.players, [id]: { ...player, frozenUntil } },
      feed: [...state.feed, { id: nextId('feed'), text: `${name} zaman portalında 3 sn dondu`, tone: 'damage' as const, expiresAt: now + 3_800 }],
    }
  }),
  grantAbilityCharge: (id, amount) => set((state) => ({
    players: { ...state.players, [id]: { ...state.players[id], abilityCharge: Math.min(ABILITY_MAX_CHARGE, state.players[id].abilityCharge + amount) } },
  })),
  activateShield: (now) => {
    const state = get()
    const jack = state.players.jack
    if (state.phase !== 'playing' || jack.dead || jack.abilityActiveUntil > now || jack.abilityCharge < ABILITY_MAX_CHARGE) return false
    set((current) => ({ players: { ...current.players, jack: { ...current.players.jack, abilityActiveUntil: now + SHIELD_DURATION, abilityCharge: 0 } } }))
    return true
  },
  launchFireball: (now, x, y, rotation) => {
    const state = get()
    const ali = state.players.ali
    if (state.phase !== 'playing' || ali.dead) return false
    const openingWindow = ali.abilityActiveUntil <= now
    if (openingWindow && ali.abilityCharge < ABILITY_MAX_CHARGE) return false
    const activeUntil = openingWindow ? now + FIREBALL_WINDOW_DURATION : ali.abilityActiveUntil
    const shots = openingWindow ? 0 : ali.abilityShots
    if (activeUntil <= now || now - ali.lastAbilityShotAt < 270) return false
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
    return true
  },
  updateProjectiles: (projectiles) => set((state) => state.projectiles.length === 0 && projectiles.length === 0 ? state : { projectiles }),
  updateEnemyProjectiles: (enemyProjectiles) => set((state) => state.enemyProjectiles.length === 0 && enemyProjectiles.length === 0 ? state : { enemyProjectiles }),
  addEnemyProjectile: (projectile) => set((state) => ({ enemyProjectiles: [...state.enemyProjectiles, projectile] })),
  addImpact: (impact) => set((state) => ({ impacts: appendImpact(state.impacts, { ...impact, id: nextId('impact') }) })),
  addMeteors: (meteors) => set((state) => ({ meteors: [...state.meteors, ...meteors] })),
  updateMeteors: (meteors) => set((state) => state.meteors.length === 0 && meteors.length === 0 ? state : { meteors }),
  addPickup: (pickup) => set((state) => ({ pickups: [...state.pickups, pickup] })),
  collectPickup: (pickupId, playerId, now) => set((state) => {
    const pickup = state.pickups.find((candidate) => candidate.id === pickupId)
    if (!pickup) return state
    const player = state.players[playerId]
    if (player.dead || (player.health >= player.maxHealth && player.abilityCharge >= ABILITY_MAX_CHARGE)) return state
    const rules = DIFFICULTIES[state.difficulty]
    const name = playerId === 'ali' ? 'Hz. Ali' : 'Samuray Jack'
    return {
      pickups: state.pickups.filter((candidate) => candidate.id !== pickupId),
      players: { ...state.players, [playerId]: {
        ...player,
        healOverTime: Math.min(rules.healAmount * 2, player.healOverTime + rules.healAmount),
        abilityCharge: Math.min(ABILITY_MAX_CHARGE, player.abilityCharge + 12 * rules.chargeGain),
      } },
      impacts: appendImpact(state.impacts, { id: nextId('impact'), kind: 'holy', x: pickup.x, y: 1.15, createdAt: now, duration: 1_250, lethal: false }),
      feed: [...state.feed, { id: nextId('feed'), text: `${name} Zemzem suyu içti — iyileşme başladı`, tone: 'pickup' as const, expiresAt: now + 5_000 }],
    }
  }),
  addFeed: (text, tone, now) => set((state) => ({ feed: [...state.feed, { id: nextId('feed'), text, tone, expiresAt: now + 4_500 }] })),
  showPortalAlert: (title, detail, now) => set((state) => ({
    portalAlert: { title, detail, expiresAt: now + 4_200 },
    feed: [...state.feed, { id: nextId('feed'), text: `${title} — ${detail}`, tone: 'system' as const, expiresAt: now + 5_200 }],
  })),
  startBossEncounter: (bossId, now) => set((state) => state.activeBossId ? state : {
    phase: 'boss-intro', bossPhase: 'offering', bossPhaseStartedAt: now, bossCountdown: 3, activeBossId: bossId,
    enemies: state.enemies.filter((enemy) => enemy.id === bossId || enemy.animation === 'dead'),
    projectiles: [], enemyProjectiles: [], meteors: [],
    feed: [...state.feed, { id: nextId('feed'), text: 'Mor Zemzem kudreti kahramanları boss savaşına hazırlıyor', tone: 'system' as const, expiresAt: now + 6_000 }],
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
      players: Object.fromEntries(Object.entries(state.players).map(([id, player]) => [id, {
        ...player,
        lives: rules.playerLives,
        maxHealth: rules.bossPlayerHealth,
        health: rules.bossPlayerHealth,
        dead: false,
        respawnAt: 0,
        abilityCharge: ABILITY_MAX_CHARGE,
        invulnerableUntil: now + 2_000,
      }])) as Record<CharacterId, PlayerStatus>,
      feed: [...state.feed, { id: nextId('feed'), text: 'Samuray Jack duaya durdu — ilahi halkalar canı ve tüm son savaş yaşamlarını uyandırdı', tone: 'system' as const, expiresAt: now + 7_000 }],
    }
  }),
  finishBossEncounter: (now) => set((state) => {
    const rules = DIFFICULTIES[state.difficulty]
    return {
      bossPhase: 'complete', activeBossId: null, meteors: [], enemyProjectiles: [],
      players: Object.fromEntries(Object.entries(state.players).map(([id, player]) => {
        const lives = rules.playerLives
        return [id, {
          ...player,
          lives,
          dead: lives > 0 ? false : player.dead,
          respawnAt: lives > 0 ? 0 : player.respawnAt,
          maxHealth: rules.playerHealth,
          health: lives > 0 ? Math.min(rules.playerHealth, Math.max(rules.playerHealth * 0.55, player.health)) : 0,
          abilityActiveUntil: 0,
        }]
      })) as Record<CharacterId, PlayerStatus>,
      feed: [...state.feed, { id: nextId('feed'), text: 'Gölgenin kudreti dağıldı — Zemzem kontrol noktası tüm yaşamları yeniledi', tone: 'system' as const, expiresAt: now + 5_000 }],
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
