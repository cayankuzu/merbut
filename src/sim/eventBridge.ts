import { useSessionStore } from '../store/sessionStore'
import { gameEvents } from './events'

/**
 * Turns flow changes in the session (phase, boss timeline, biome) into events,
 * so listeners never need to watch the store themselves.
 */
export function startEventBridge() {
  return useSessionStore.subscribe((state, previous) => {
    if (state.phase !== previous.phase) {
      gameEvents.emit({ type: 'phase', phase: state.phase, previous: previous.phase })
      const runStarted = previous.phase === 'countdown' && state.phase === 'playing' && state.elapsedSeconds === 0
      if (runStarted) gameEvents.emit({ type: 'biome-enter', biome: state.currentBiome })
    }
    if (state.bossPhase !== previous.bossPhase) {
      gameEvents.emit({ type: 'boss-phase', phase: state.bossPhase, previous: previous.bossPhase })
    }
    if (state.currentBiome > previous.currentBiome && state.sessionToken === previous.sessionToken) {
      gameEvents.emit({ type: 'biome-enter', biome: state.currentBiome })
    }
  })
}
