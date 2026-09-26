import { create } from 'zustand'
import { BIOME_WORLD_WIDTH, WORLD_VISUAL_LEFT } from '../config/biomes'
import { DIFFICULTIES } from '../config/difficulty'
import { isMachineVariant } from '../config/enemies'
import { BIOME_CONTENT, type BiomeMechanic } from '../content/biomeContent'
import { useGameStore } from '../store/gameStore'
import { useSessionStore } from '../store/sessionStore'
import type { CharacterId } from '../types/character'
import { gameEvents } from './events'

/**
 * Signature biome mechanics. Each biome teaches one idea (breakable neon, tide,
 * hourglasses, marsh water, conveyor presses, lava, twin bells, lightning rods,
 * blizzard, fire vents) and all of them share three primitives: timed hazards,
 * strikeable props and special ground.
 */
export type HazardKind = 'tide' | 'lava' | 'vent' | 'press' | 'bolt'
export type PropKind = 'neon' | 'bell' | 'firefly' | 'hourglass' | 'rod'

export interface Hazard {
  id: string
  biome: number
  kind: HazardKind
  x: number
  width: number
  warnAt: number
  strikeAt: number
  endAt: number
  hitIds: string[]
}

export interface MechanicProp {
  id: string
  biome: number
  kind: PropKind
  x: number
  brokenAt: number
  struckAt: number
  readyAt: number
}

/** A bubble of slow time around a struck hourglass; only creatures are slowed. */
export interface SlowField {
  id: string
  biome: number
  x: number
  radius: number
  startedAt: number
  until: number
}

interface MechanicsState {
  token: number
  biome: number
  hazards: Hazard[]
  props: MechanicProp[]
  slowFields: SlowField[]
  /** Blade charged by a lightning rod, per hero (sim time it runs out). */
  charged: Record<CharacterId, number>
  nextHazardAt: number
  resonanceUntil: number
  gustStartedAt: number
  gustUntil: number
  nextGustAt: number
  fracture: boolean
}

export const HOURGLASS_RADIUS = 4.6
export const HOURGLASS_FIELD_MS = 6_500
export const HOURGLASS_COOLDOWN_MS = 15_000
export const SLOW_FIELD_SCALE = 0.3
export const ROD_CHARGE_MS = 9_000
export const ROD_COOLDOWN_MS = 13_000
export const CHAIN_RADIUS = 4.5
export const BELT_SPEED = 2.1

export const biomeLeft = (biome: number) => WORLD_VISUAL_LEFT + biome * BIOME_WORLD_WIDTH

/** Index of the first biome with this mechanic (every mechanic lives in one biome). */
export const mechanicBiome = (mechanic: BiomeMechanic) => BIOME_CONTENT.findIndex((content) => content.mechanic === mechanic)

const PROP_KINDS: Partial<Record<BiomeMechanic, PropKind>> = { neon: 'neon', bells: 'bell', marsh: 'firefly', hourglass: 'hourglass', storm: 'rod' }

function initialProps(): MechanicProp[] {
  return BIOME_CONTENT.flatMap((content, biome) => {
    const kind = PROP_KINDS[content.mechanic]
    if (!kind) return []
    return content.props.map((offset, index) => ({
      id: `${kind}-${biome}-${index}`,
      biome,
      kind,
      x: biomeLeft(biome) + offset,
      brokenAt: 0,
      struckAt: 0,
      readyAt: 0,
    }))
  })
}

function freshMechanics(token = -1): MechanicsState {
  return {
    token,
    biome: -1,
    hazards: [],
    props: initialProps(),
    slowFields: [],
    charged: { ali: 0, jack: 0 },
    nextHazardAt: Infinity,
    resonanceUntil: 0,
    gustStartedAt: 0,
    gustUntil: 0,
    nextGustAt: Infinity,
    fracture: false,
  }
}

export const useMechanicsStore = create<MechanicsState>(() => freshMechanics())

let hazardSequence = 0
let fieldSequence = 0
const random = (minimum: number, maximum: number) => minimum + Math.random() * (maximum - minimum)
const set = (patch: Partial<MechanicsState>) => useMechanicsStore.setState(patch)

export function resetMechanics(token = useSessionStore.getState().sessionToken) {
  useMechanicsStore.setState(freshMechanics(token))
}

export function isResonanceActive(now: number) {
  return useMechanicsStore.getState().resonanceUntil > now
}

export function setFracture(fracture: boolean) {
  if (useMechanicsStore.getState().fracture !== fracture) set({ fracture })
}

export function isBladeCharged(id: CharacterId, now: number) {
  return useMechanicsStore.getState().charged[id] > now
}

/** How fast a creature's clock runs at x: slowed inside an hourglass field. */
export function creatureTimeScale(biome: number, x: number, now: number) {
  const fields = useMechanicsStore.getState().slowFields
  for (const field of fields) {
    if (field.biome === biome && field.until > now && Math.abs(field.x - x) <= field.radius) return SLOW_FIELD_SCALE
  }
  return 1
}

function zoneIndexAt(biome: number, x: number) {
  const content = BIOME_CONTENT[biome]
  if (!content) return -1
  const local = x - biomeLeft(biome)
  return content.zones.findIndex(([start, end]) => local >= start && local <= end)
}

/** Conveyor velocity under x in the foundry (even belts run left, odd belts right). */
export function beltVelocityAt(biome: number, x: number) {
  if (BIOME_CONTENT[biome]?.mechanic !== 'foundry') return 0
  const zone = zoneIndexAt(biome, x)
  if (zone < 0) return 0
  return (zone % 2 === 0 ? -1 : 1) * BELT_SPEED
}

/** How special ground changes movement at a position: water, ice, wind and belts. */
export function groundModifiers(x: number, now: number) {
  const state = useMechanicsStore.getState()
  const biome = useSessionStore.getState().currentBiome
  const content = BIOME_CONTENT[biome]
  let speed = 1
  let traction = 1
  let windX = 0
  let belt = 0
  if (content) {
    const inZone = zoneIndexAt(biome, x) >= 0
    if (inZone && content.mechanic === 'marsh') speed = 0.58
    if (inZone && content.mechanic === 'blizzard') traction = 0.14
    if (content.mechanic === 'blizzard' && state.gustUntil > now && now >= state.gustStartedAt) windX = -1.7
    if (content.mechanic === 'foundry') belt = beltVelocityAt(biome, x)
  }
  return { speed, traction, windX, belt }
}

function livingEnemiesInBiome(biome: number) {
  return useSessionStore.getState().enemies.some((enemy) => enemy.biome === biome && enemy.animation !== 'dead' && !enemy.boss)
}

function addHazard(kind: HazardKind, x: number, width: number, now: number, warnMs: number, strikeMs: number) {
  const biome = useSessionStore.getState().currentBiome
  const hazard: Hazard = { id: `hazard-${++hazardSequence}`, biome, kind, x, width, warnAt: now, strikeAt: now + warnMs, endAt: now + warnMs + strikeMs, hitIds: [] }
  set({ hazards: [...useMechanicsStore.getState().hazards, hazard] })
  gameEvents.emit({ type: 'hazard', biome, name: kind, x, stage: 'warn' })
  return hazard
}

function nearestHero(x: number): CharacterId {
  const positions = useGameStore.getState().positions
  const session = useSessionStore.getState()
  if (session.players.ali.dead) return 'jack'
  if (session.players.jack.dead) return 'ali'
  return Math.abs(positions.ali[0] - x) <= Math.abs(positions.jack[0] - x) ? 'ali' : 'jack'
}

type HitEnemy = (id: string, amount: number, attacker: CharacterId, now: number, source: 'hazard' | 'melee', knockback?: number) => boolean

/** The tide sweeps from right to left; everyone its front touches on the ground is hit once. */
function tideFront(hazard: Hazard, now: number) {
  const progress = Math.min(1, Math.max(0, (now - hazard.strikeAt) / (hazard.endAt - hazard.strikeAt)))
  return hazard.x + hazard.width * 0.5 - progress * hazard.width
}

const HERO_HAZARD_DAMAGE: Record<HazardKind, number> = { tide: 10, lava: 16, vent: 14, press: 18, bolt: 16 }
const ENEMY_HAZARD_DAMAGE: Record<HazardKind, number> = { tide: 22, lava: 48, vent: 34, press: 70, bolt: 46 }
/** How high a hero must be to clear the hazard (tides are low, columns are tall). */
const HAZARD_HEIGHT: Record<HazardKind, number> = { tide: 0.45, lava: 1.1, vent: 1.1, press: 2.4, bolt: 3 }

function resolveHazards(now: number, hitEnemy: HitEnemy) {
  const state = useMechanicsStore.getState()
  if (state.hazards.length === 0) return
  const session = useSessionStore.getState()
  const positions = useGameStore.getState().positions
  const rules = DIFFICULTIES[session.difficulty]
  const shieldActive = session.players.jack.abilityActiveUntil > now && !session.players.jack.dead
  let changed = false
  const hazards = state.hazards.filter((hazard) => now < hazard.endAt + 400)
  if (hazards.length !== state.hazards.length) changed = true

  for (const hazard of hazards) {
    if (now < hazard.strikeAt || now > hazard.endAt) continue
    if (!hazard.hitIds.includes('__struck')) {
      hazard.hitIds.push('__struck')
      gameEvents.emit({ type: 'hazard', biome: hazard.biome, name: hazard.kind, x: hazard.x, stage: 'strike' })
      changed = true
    }
    const inside = (x: number) => hazard.kind === 'tide'
      ? Math.abs(x - tideFront(hazard, now)) < 0.95
      : Math.abs(x - hazard.x) < hazard.width * 0.5
    const playerDamage = Math.round(HERO_HAZARD_DAMAGE[hazard.kind] * Math.max(0.7, rules.bossDamage))
    for (const id of ['ali', 'jack'] as const) {
      const player = session.players[id]
      const [x, y] = positions[id]
      if (player.dead || hazard.hitIds.includes(id) || !inside(x) || y > HAZARD_HEIGHT[hazard.kind]) continue
      hazard.hitIds.push(id)
      changed = true
      if (shieldActive && Math.abs(x - positions.jack[0]) <= 2.4) continue
      if (player.dodgeUntil > now) continue
      session.damagePlayer(id, playerDamage, now)
      if (hazard.kind === 'tide') {
        useGameStore.getState().pushPlayer(id, -7.5, 0)
        gameEvents.emit({ type: 'mechanic', biome: hazard.biome, name: 'tide-hit', x })
      } else if (hazard.kind === 'press') useGameStore.getState().pushPlayer(id, x >= hazard.x ? 6 : -6, 3)
      else useGameStore.getState().pushPlayer(id, x >= hazard.x ? 4 : -4, 5.5)
    }
    for (const enemy of useSessionStore.getState().enemies) {
      if (enemy.animation === 'dead' || enemy.boss || hazard.hitIds.includes(enemy.id) || !inside(enemy.x)) continue
      hazard.hitIds.push(enemy.id)
      changed = true
      // Presses were built to stamp beetle shells: machines are flattened outright.
      const crushed = hazard.kind === 'press' && isMachineVariant(enemy.variant) && enemy.variant !== 'queen'
      const damage = crushed ? 999 : ENEMY_HAZARD_DAMAGE[hazard.kind]
      const push = hazard.kind === 'tide' ? -7 : hazard.kind === 'press' ? 0 : enemy.x >= hazard.x ? 5 : -5
      const killed = hitEnemy(enemy.id, damage, nearestHero(enemy.x), now, 'hazard', push)
      if (killed) gameEvents.emit({ type: 'mechanic', biome: hazard.biome, name: `${hazard.kind}-kill`, x: enemy.x })
      else if (hazard.kind === 'bolt') useSessionStore.getState().updateEnemy(enemy.id, { stunUntil: now + 1_100, windupUntil: 0 })
    }
  }
  if (changed) set({ hazards: [...hazards] })
}

function scheduleHazards(now: number) {
  const session = useSessionStore.getState()
  const state = useMechanicsStore.getState()
  const biome = session.currentBiome
  const content = BIOME_CONTENT[biome]
  const mechanic = content?.mechanic
  const positions = useGameStore.getState().positions
  const cameraX = useGameStore.getState().cameraX
  const enemiesAlive = livingEnemiesInBiome(biome)
  const throneActive = mechanic === 'throne' && (enemiesAlive || state.fracture)
  const heroes = (['ali', 'jack'] as const).filter((id) => !session.players[id].dead)
  if (now < state.nextHazardAt) return
  if (mechanic === 'tide' && enemiesAlive) {
    addHazard('tide', cameraX, 24, now, 1_700, 1_000)
    set({ nextHazardAt: now + random(11_000, 14_500) })
  } else if (mechanic === 'lava' && enemiesAlive) {
    heroes.forEach((id) => addHazard('lava', positions[id][0] + random(-2.2, 2.2), 1.5, now, 1_150, 750))
    set({ nextHazardAt: now + random(6_500, 9_500) })
  } else if (mechanic === 'foundry' && enemiesAlive && content) {
    // The press nearest a hero comes down; the busy line fires a second one.
    const presses = content.props.map((offset) => biomeLeft(biome) + offset)
    const target = heroes.length > 0 ? positions[heroes[Math.floor(Math.random() * heroes.length)]!][0] : cameraX
    const ordered = [...presses].sort((left, right) => Math.abs(left - target) - Math.abs(right - target))
    addHazard('press', ordered[0]!, 1.9, now, 1_150, 380)
    if (session.enemies.filter((enemy) => enemy.biome === biome && enemy.animation !== 'dead').length >= 4 && ordered[2] !== undefined) {
      addHazard('press', ordered[2], 1.9, now, 1_350, 380)
    }
    set({ nextHazardAt: now + random(3_600, 5_000) })
  } else if (mechanic === 'storm' && enemiesAlive) {
    heroes.forEach((id) => addHazard('bolt', positions[id][0] + random(-1.6, 1.6), 1.7, now, 1_250, 320))
    set({ nextHazardAt: now + random(6_800, 9_200) })
  } else if (throneActive && content) {
    const vents = content.props.map((offset) => biomeLeft(biome) + offset)
    const pair = Math.floor(now / 5_500) % 2
    vents.filter((_, index) => index % 2 === pair).forEach((x) => addHazard('vent', x, 1.6, now, 1_000, 850))
    set({ nextHazardAt: now + (state.fracture ? 4_200 : 5_500) })
  } else {
    set({ nextHazardAt: now + 1_000 })
  }
}

function stepBlizzard(now: number) {
  const state = useMechanicsStore.getState()
  const biome = useSessionStore.getState().currentBiome
  if (BIOME_CONTENT[biome]?.mechanic !== 'blizzard' || now < state.nextGustAt) return
  set({ gustStartedAt: now + 1_300, gustUntil: now + 6_300, nextGustAt: now + random(15_000, 19_000) })
  gameEvents.emit({ type: 'hazard', biome, name: 'gust', x: useGameStore.getState().cameraX, stage: 'warn' })
}

function stepFireflies(now: number) {
  const session = useSessionStore.getState()
  const positions = useGameStore.getState().positions
  const state = useMechanicsStore.getState()
  let changed = false
  const props = state.props.map((prop) => {
    if (prop.kind !== 'firefly' || prop.biome !== session.currentBiome || prop.readyAt > now) return prop
    const collector = (['ali', 'jack'] as const).find((id) => !session.players[id].dead && Math.abs(positions[id][0] - prop.x) < 0.95)
    if (!collector) return prop
    changed = true
    session.grantAbilityCharge(collector, 24, now)
    gameEvents.emit({ type: 'mechanic', biome: prop.biome, name: 'firefly', x: prop.x })
    return { ...prop, readyAt: now + 20_000, struckAt: now }
  })
  if (changed) set({ props })
}

function pruneFields(now: number) {
  const state = useMechanicsStore.getState()
  if (state.slowFields.some((field) => field.until + 600 < now)) set({ slowFields: state.slowFields.filter((field) => field.until + 600 >= now) })
}

/** Called once per combat step from the director. */
export function stepMechanics(now: number, hitEnemy: HitEnemy) {
  const session = useSessionStore.getState()
  if (useMechanicsStore.getState().token !== session.sessionToken) resetMechanics(session.sessionToken)
  const state = useMechanicsStore.getState()
  if (state.biome !== session.currentBiome) {
    set({ biome: session.currentBiome, hazards: [], slowFields: [], nextHazardAt: now + 5_000, nextGustAt: now + 7_000, gustUntil: 0 })
  }
  if (session.phase !== 'playing' || (session.activeBossId && session.bossPhase !== 'fight')) return
  scheduleHazards(now)
  stepBlizzard(now)
  stepFireflies(now)
  pruneFields(now)
  resolveHazards(now, hitEnemy)
}

function shock(prop: MechanicProp, attacker: CharacterId, now: number, hitEnemy: HitEnemy, radius: number, damage: number, stunMs: number) {
  const session = useSessionStore.getState()
  for (const enemy of session.enemies) {
    if (enemy.animation === 'dead' || enemy.biome !== prop.biome || Math.abs(enemy.x - prop.x) > radius) continue
    hitEnemy(enemy.id, damage, attacker, now, 'hazard', enemy.boss ? 0 : enemy.x >= prop.x ? 3.5 : -3.5)
    const current = useSessionStore.getState().enemies.find((candidate) => candidate.id === enemy.id)
    if (current && current.animation !== 'dead' && !current.boss) {
      useSessionStore.getState().updateEnemy(enemy.id, { stunUntil: now + stunMs, windupUntil: 0 })
    }
  }
}

/**
 * A charged blade arcs lightning from every creature it cuts to the two
 * nearest others. Returns how many creatures the chain reached.
 */
export function chainLightning(attacker: CharacterId, fromIds: readonly string[], now: number, hitEnemy: HitEnemy) {
  if (!isBladeCharged(attacker, now) || fromIds.length === 0) return 0
  const session = useSessionStore.getState()
  const reached = new Set(fromIds)
  let chained = 0
  for (const sourceId of fromIds) {
    const source = session.enemies.find((enemy) => enemy.id === sourceId)
    if (!source) continue
    const targets = useSessionStore.getState().enemies
      .filter((enemy) => enemy.animation !== 'dead' && !reached.has(enemy.id) && Math.abs(enemy.x - source.x) <= CHAIN_RADIUS)
      .sort((left, right) => Math.abs(left.x - source.x) - Math.abs(right.x - source.x))
      .slice(0, 2)
    for (const target of targets) {
      reached.add(target.id)
      chained += 1
      gameEvents.emit({ type: 'mechanic', biome: session.currentBiome, name: 'chain', x: source.x, x2: target.x, id: attacker })
      hitEnemy(target.id, 22, attacker, now, 'melee', target.boss ? 0 : target.x >= source.x ? 2.2 : -2.2)
      const current = useSessionStore.getState().enemies.find((candidate) => candidate.id === target.id)
      if (current && current.animation !== 'dead' && !current.boss) useSessionStore.getState().updateEnemy(target.id, { stunUntil: now + 650, windupUntil: 0 })
    }
  }
  return chained
}

/**
 * A hero's sword (or a fireball) touched the world at x. Breaks neon signs,
 * rings bells, flips hourglasses and grounds lightning rods. Returns true when
 * something was struck.
 */
export function strikeProps(attacker: CharacterId, x: number, reach: number, now: number, hitEnemy: HitEnemy) {
  const state = useMechanicsStore.getState()
  const biome = useSessionStore.getState().currentBiome
  let struck = false
  let resonance = false
  let fields = state.slowFields
  let charged = state.charged
  const props = state.props.map((prop) => {
    if (prop.biome !== biome || Math.abs(prop.x - x) > reach) return prop
    if (prop.kind === 'neon' && prop.brokenAt === 0) {
      struck = true
      shock(prop, attacker, now, hitEnemy, 4.4, 30, 2_300)
      useSessionStore.getState().addImpact({ kind: 'frost', x: prop.x, y: 1.4, createdAt: now, duration: 1_100, lethal: true })
      gameEvents.emit({ type: 'mechanic', biome, name: 'neon', x: prop.x })
      return { ...prop, brokenAt: now }
    }
    if (prop.kind === 'bell' && prop.readyAt <= now && now - prop.struckAt > 250) {
      struck = true
      gameEvents.emit({ type: 'mechanic', biome, name: 'bell', x: prop.x })
      return { ...prop, struckAt: now }
    }
    if (prop.kind === 'hourglass' && prop.readyAt <= now) {
      struck = true
      fields = [...fields, { id: `field-${++fieldSequence}`, biome, x: prop.x, radius: HOURGLASS_RADIUS, startedAt: now, until: now + HOURGLASS_FIELD_MS }]
      gameEvents.emit({ type: 'mechanic', biome, name: 'hourglass', x: prop.x, id: attacker })
      return { ...prop, struckAt: now, readyAt: now + HOURGLASS_COOLDOWN_MS }
    }
    if (prop.kind === 'rod' && prop.readyAt <= now) {
      struck = true
      charged = { ...charged, [attacker]: now + ROD_CHARGE_MS }
      gameEvents.emit({ type: 'mechanic', biome, name: 'rod', x: prop.x, id: attacker })
      return { ...prop, struckAt: now, readyAt: now + ROD_COOLDOWN_MS }
    }
    return prop
  })
  if (!struck) return false
  const bells = props.filter((prop) => prop.kind === 'bell' && prop.biome === biome)
  if (bells.length >= 2 && bells.every((bell) => now - bell.struckAt <= 800 && bell.readyAt <= now)) {
    resonance = true
    const locked = props.map((prop) => prop.kind === 'bell' && prop.biome === biome ? { ...prop, readyAt: now + 14_000 } : prop)
    set({ props: locked, resonanceUntil: now + 12_000, slowFields: fields, charged })
    const center = bells.reduce((sum, bell) => sum + bell.x, 0) / bells.length
    shock({ ...bells[0]!, x: center }, attacker, now, hitEnemy, 40, 35, 2_600)
    useSessionStore.getState().addImpact({ kind: 'holy', x: center, y: 2.4, createdAt: now, duration: 1_600, lethal: true })
    gameEvents.emit({ type: 'mechanic', biome, name: 'resonance', x: center })
  }
  if (!resonance) set({ props, slowFields: fields, charged })
  return true
}
