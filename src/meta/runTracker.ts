import { create } from 'zustand'
import { BIOMES } from '../config/biomes'
import { gameEvents } from '../sim/events'
import { useSessionStore } from '../store/sessionStore'
import { achievementById } from './achievements'
import { computeRank, useProgressStore, type Rank } from './progressStore'

/**
 * Per-run bookkeeping driven only by game events: achievements, checkpoints,
 * lifetime stats and the end-of-run rank.
 */
interface RunState {
  token: number
  falls: number
  neonBroken: number
  tideHits: number
  hazardKills: number
  perfectDodges: number
  hourglassFlips: number
  mirages: number
  pressKills: number
  chainHits: number
  zemzemBiomes: number[]
  unlockedThisRun: string[]
  result: { rank: Rank; points: number } | null
  toasts: { id: string; title: string; description: string; at: number }[]
}

const fresh = (token: number): RunState => ({
  token, falls: 0, neonBroken: 0, tideHits: 0, hazardKills: 0, perfectDodges: 0, hourglassFlips: 0, mirages: 0, pressKills: 0, chainHits: 0, zemzemBiomes: [], unlockedThisRun: [], result: null, toasts: [],
})

export const useRunStore = create<RunState>(() => fresh(-1))

function run() {
  const token = useSessionStore.getState().sessionToken
  if (useRunStore.getState().token !== token) useRunStore.setState(fresh(token))
  return useRunStore.getState()
}

function unlock(id: string) {
  if (!useProgressStore.getState().unlock(id)) return
  const definition = achievementById(id)
  if (!definition) return
  useRunStore.setState((state) => ({
    unlockedThisRun: [...state.unlockedThisRun, id],
    toasts: [...state.toasts, { id, title: definition.title, description: definition.description, at: performance.now() }],
  }))
  gameEvents.emit({ type: 'achievement', id })
}

export function dismissAchievementToast(id: string) {
  useRunStore.setState((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }))
}

function finishRun(victory: boolean) {
  const session = useSessionStore.getState()
  const state = run()
  const { ali, jack } = session.players
  const bestCombo = Math.max(ali.bestCombo, jack.bestCombo)
  useProgressStore.getState().addStats({
    runs: 1,
    victories: victory ? 1 : 0,
    kills: ali.kills + jack.kills,
    falls: state.falls,
    perfectDodges: state.perfectDodges,
    bestCombo,
    playSeconds: Math.round(session.elapsedSeconds),
  })
  if (!victory) return
  const result = computeRank(session.difficulty, session.elapsedSeconds, state.falls, bestCombo)
  useRunStore.setState({ result })
  if (session.startBiome === 0) useProgressStore.getState().recordVictory(session.difficulty, session.elapsedSeconds, result.rank)
  unlock('master-of-nothing')
  if (session.difficulty === 'soulslike') unlock('merciless')
  if (session.startBiome === 0 && session.elapsedSeconds < 22 * 60) unlock('beyond-time')
  if (state.falls === 0 && session.startBiome === 0) unlock('unbroken')
}

let finishedToken = -1

export function startRunTracker() {
  return gameEvents.on((event) => {
    const state = run()
    const session = useSessionStore.getState()
    switch (event.type) {
      case 'enemy-hit':
        if (!event.killed) break
        unlock('first-blood')
        if (event.boss === 'shadow') unlock('shadowless')
        if (event.boss === 'mini' && event.variant === 'giant') unlock('giant-slayer')
        if (event.boss === 'mini' && event.variant === 'queen') unlock('queen-slayer')
        if (event.variant === 'mirage') {
          useRunStore.setState({ mirages: state.mirages + 1 })
          if (state.mirages + 1 >= 6) unlock('mirage-hunter')
        }
        if (event.source === 'hazard' && session.currentBiome !== 0) {
          useRunStore.setState({ hazardKills: state.hazardKills + 1 })
          if (state.hazardKills + 1 >= 5) unlock('warm-welcome')
        }
        if (Math.max(session.players.ali.combo, session.players.jack.combo) >= 25) unlock('sword-storm')
        break
      case 'player-hit':
        if (event.down) useRunStore.setState({ falls: state.falls + 1 })
        break
      case 'player-dash':
        if (!event.perfect) break
        useRunStore.setState({ perfectDodges: state.perfectDodges + 1 })
        if (state.perfectDodges + 1 >= 10) unlock('like-the-wind')
        break
      case 'mechanic':
        if (event.name === 'neon') {
          useRunStore.setState({ neonBroken: state.neonBroken + 1 })
          if (state.neonBroken + 1 >= 3) unlock('electric-bill')
        }
        if (event.name === 'resonance') unlock('twin-bells')
        if (event.name === 'tide-hit') useRunStore.setState({ tideHits: state.tideHits + 1 })
        if (event.name === 'hourglass') {
          useRunStore.setState({ hourglassFlips: state.hourglassFlips + 1 })
          if (state.hourglassFlips + 1 >= 3) unlock('time-bender')
        }
        if (event.name === 'press-kill') {
          useRunStore.setState({ pressKills: state.pressKills + 1 })
          if (state.pressKills + 1 >= 3) unlock('scrap-press')
        }
        if (event.name === 'chain') {
          useRunStore.setState({ chainHits: state.chainHits + 1 })
          if (state.chainHits + 1 >= 10) unlock('storm-bearer')
        }
        break
      case 'pickup':
        if (!state.zemzemBiomes.includes(session.currentBiome)) useRunStore.setState({ zemzemBiomes: [...state.zemzemBiomes, session.currentBiome] })
        break
      case 'biome-enter': {
        const cleared = event.biome - 1
        if (cleared >= 3 && cleared >= session.startBiome && !state.zemzemBiomes.includes(cleared)) unlock('thirstless')
        const harbor = BIOMES.findIndex((biome) => biome.id === 'sunset-harbor')
        if (event.biome === harbor + 1 && session.startBiome <= harbor && state.tideHits === 0) unlock('dry-feet')
        useProgressStore.getState().reachBiome(event.biome, session.difficulty)
        break
      }
      case 'phase':
        if (event.phase === 'defeat' && finishedToken !== session.sessionToken) {
          finishedToken = session.sessionToken
          finishRun(false)
        }
        break
      case 'boss-phase':
        if (event.phase === 'continued' && finishedToken !== session.sessionToken) {
          finishedToken = session.sessionToken
          finishRun(true)
        }
        break
      default:
        break
    }
  })
}
