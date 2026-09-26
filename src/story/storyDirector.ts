import { BIOMES } from '../config/biomes'
import { gameEvents } from '../sim/events'
import { useSessionStore } from '../store/sessionStore'
import { useDialogueStore } from './dialogueStore'
import { BARKS, BIOME_SCENES, SCENES, type Line } from './script'

/**
 * Maps game events to story beats. Scenes play once per run; barks are
 * rate-limited so the characters talk like people, not like a ticker.
 */
const BARK_COOLDOWN_MS = 9_000
const TAUNT_INTERVAL_MS = 24_000

let token = -1
let played = new Set<string>()
let lastBarkAt = -Infinity
let lastTauntAt = 0

function freshRun() {
  const current = useSessionStore.getState().sessionToken
  if (current === token) return
  token = current
  played = new Set()
  lastBarkAt = -Infinity
  lastTauntAt = performance.now()
  useDialogueStore.getState().clear()
}

function say(id: string, lines: readonly Line[] | undefined) {
  if (played.has(id) || !lines) return
  played.add(id)
  useDialogueStore.getState().say(lines, 'scene')
}

const scene = (id: string) => say(id, SCENES[id])

function bark(id: string, chance = 1, speaker?: Line['speaker']) {
  const now = performance.now()
  if (now - lastBarkAt < BARK_COOLDOWN_MS || Math.random() > chance) return
  const pool = (BARKS[id] ?? []).filter((line) => !speaker || line.speaker === speaker)
  if (pool.length === 0) return
  lastBarkAt = now
  useDialogueStore.getState().say([pool[Math.floor(Math.random() * pool.length)]!], 'bark')
}

/** A warning bark plays the first time each hazard appears in a run. */
function warnOnce(name: string) {
  if (played.has(`${name}-warn`) || !BARKS[`${name}-warn`]) return
  played.add(`${name}-warn`)
  bark(`${name}-warn`)
}

const biomeId = (index: number) => BIOMES[index]?.id

export function startStoryDirector() {
  return gameEvents.on((event) => {
    freshRun()
    const session = useSessionStore.getState()
    switch (event.type) {
      case 'biome-enter': {
        const id = biomeId(event.biome)
        if (id) say(`biome-${id}`, BIOME_SCENES[id])
        break
      }
      case 'gate-open':
        bark('gate-open', 0.8)
        break
      case 'mechanic':
        if (event.name === 'neon') scene('neon-first')
        if (event.name === 'bell' && !played.has('resonance')) scene('bell-hint')
        if (event.name === 'resonance') scene('resonance')
        if (event.name === 'hourglass') scene('hourglass-first')
        if (event.name === 'rod') scene('rod-first')
        if (event.name === 'press-kill') scene('press-kill')
        if (event.name === 'team') bark('team', 0.6)
        break
      case 'hazard':
        if (event.stage === 'warn') warnOnce(event.name)
        break
      case 'wave': {
        if (event.boss) break
        const id = biomeId(event.biome)
        const depth = id ? session.spawnedWaves.includes(`${id}-depth`) : false
        if (id === 'skull-field' && depth) scene('giant')
        else if (id === 'beetle-foundry' && depth) scene('queen')
        else if (id === 'storm-peak' && depth) scene('monk')
        else if (id === 'beetle-foundry') bark('drone-wave', 0.8)
        else bark('wave', 0.4)
        break
      }
      case 'player-hit':
        if (event.down) bark(`${event.id}-down`, 0.85)
        break
      case 'player-revived':
        bark('revive', 0.5, event.id)
        break
      case 'player-dash':
        if (event.perfect) bark('perfect', 0.35, event.id)
        break
      case 'enemy-hit': {
        if (event.killed && event.boss === 'shadow') scene('shadow-defeated')
        if (event.killed && event.variant === 'mirage') scene('mirage-first')
        const combo = session.players[event.attacker].combo
        if (combo === 15) bark('combo', 1)
        const aku = session.enemies.find((enemy) => enemy.bossType === 'aku' && enemy.animation !== 'dead')
        if (session.bossPhase === 'fight' && aku) {
          if (event.boss === 'aku' && event.attacker === 'ali' && aku.health / aku.maxHealth < 0.82) scene('aku-wrath')
          const now = performance.now()
          if (now - lastTauntAt > TAUNT_INTERVAL_MS) {
            lastTauntAt = now
            bark('aku-taunt', 1)
          }
        }
        break
      }
      case 'portal-ambush':
        bark('portal-ambush', 1)
        break
      case 'boss-phase':
        if (event.phase === 'offering') scene('shadow-intro')
        if (event.phase === 'prayer') scene('aku-intro')
        if (event.phase === 'defeated') scene('aku-defeated')
        if (event.phase === 'portal') scene('portal')
        if (event.phase === 'continued') scene('teaser')
        break
      case 'boss-form':
        if (event.form === 'monster') scene('aku-monster')
        if (event.form === 'fracture') scene('aku-fracture')
        break
      case 'phase':
        if (event.phase === 'menu') useDialogueStore.getState().clear()
        break
      default:
        break
    }
  })
}
