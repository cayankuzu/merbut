import type { CharacterId } from '../types/character'
import type { BossPhase, GamePhase, ImpactKind } from '../types/session'
import type { EnemyKind, EnemyVariant } from '../config/enemies'

/**
 * One typed event stream for everything that "happens" in a run. Audio, hit
 * feedback, dialogue and achievements subscribe here instead of guessing what
 * happened by diffing store snapshots.
 */
export type GameEvent =
  | { type: 'enemy-hit'; enemyId: string; x: number; y: number; amount: number; killed: boolean; attacker: CharacterId; source: 'melee' | 'fireball' | 'hazard'; boss: 'shadow' | 'aku' | 'mini' | null; kind: EnemyKind; variant: EnemyVariant; impact: ImpactKind }
  | { type: 'player-hit'; id: CharacterId; amount: number; down: boolean; eliminated: boolean }
  | { type: 'player-revived'; id: CharacterId }
  | { type: 'player-attack'; id: CharacterId; x: number; step: 1 | 2 | 3 }
  | { type: 'player-dash'; id: CharacterId; perfect: boolean }
  | { type: 'ability'; id: CharacterId; ability: 'fireball' | 'shield' }
  | { type: 'pickup'; id: CharacterId }
  | { type: 'pickup-spawned'; x: number }
  | { type: 'wave'; biome: number; boss: boolean }
  | { type: 'enemy-shot'; kind: 'stone' | 'dark-orb' | 'time-portal' | 'aku-fire'; x: number }
  | { type: 'meteor-warning'; x: number }
  | { type: 'biome-enter'; biome: number }
  | { type: 'gate-open'; biome: number; x: number }
  | { type: 'phase'; phase: GamePhase; previous: GamePhase }
  | { type: 'boss-phase'; phase: BossPhase; previous: BossPhase }
  | { type: 'boss-form'; form: 'normal' | 'monster' | 'fracture' }
  | { type: 'hazard'; biome: number; name: string; x: number; stage: 'warn' | 'strike' }
  | { type: 'mechanic'; biome: number; name: string; x: number; x2?: number; id?: CharacterId }
  | { type: 'enemy-windup'; enemyId: string; x: number }
  | { type: 'achievement'; id: string }
  | { type: 'portal-ambush'; biome: number; count: number }

type Listener = (event: GameEvent) => void

const listeners = new Set<Listener>()

export const gameEvents = {
  emit(event: GameEvent) {
    listeners.forEach((listener) => {
      try {
        listener(event)
      } catch (error) {
        // A broken presentation listener must never stop the simulation.
        console.error(error)
      }
    })
  },
  on(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  clear() {
    listeners.clear()
  },
}
