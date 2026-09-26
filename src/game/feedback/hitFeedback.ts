import { gamepads } from '../../input/gamepadManager'
import { simClock } from '../../sim/clock'
import { gameEvents } from '../../sim/events'
import { useSettingsStore } from '../../store/settingsStore'
import type { CharacterId } from '../../types/character'

/**
 * Game feel in one place. Hitstop gives every blow weight, a perfect dodge
 * slows the world for a heartbeat, and pads rumble with the action.
 * Camera shake is exposed as a decaying "trauma" value the camera reads.
 */
let trauma = 0
let traumaUpdatedAt = 0

function addTrauma(amount: number) {
  trauma = Math.min(1, currentTrauma() + amount * useSettingsStore.getState().screenShake)
  traumaUpdatedAt = performance.now()
}

/** 0..1, decays over ~0.6 s of real time. */
export function currentTrauma() {
  const elapsed = (performance.now() - traumaUpdatedAt) / 1_000
  return Math.max(0, trauma - elapsed * 1.7)
}

function rumble(id: CharacterId, strength: number, ms: number) {
  gamepads.vibrate(useSettingsStore.getState().gamepadSlots[id], strength, ms)
}

export function startHitFeedback() {
  return gameEvents.on((event) => {
    switch (event.type) {
      case 'enemy-hit': {
        if (event.source === 'hazard') {
          addTrauma(0.12)
          return
        }
        // Finishers and team strikes land big numbers: they get a longer freeze.
        const crushing = event.amount >= 60
        const heavy = event.killed || event.boss !== null || crushing
        simClock.hitstop(event.killed ? 95 : crushing ? 90 : event.boss ? 45 : 58)
        addTrauma(event.killed ? (event.boss ? 0.6 : 0.22) : event.boss ? 0.12 : 0.07)
        rumble(event.attacker, heavy ? 0.55 : 0.28, heavy ? 140 : 70)
        break
      }
      case 'player-hit':
        simClock.hitstop(event.down ? 140 : 70)
        addTrauma(event.down ? 0.45 : 0.2)
        rumble(event.id, event.down ? 1 : 0.6, event.down ? 380 : 160)
        break
      case 'player-dash':
        if (event.perfect) {
          simClock.slow(0.28, 520)
          rumble(event.id, 0.3, 90)
        }
        break
      case 'hazard':
        if (event.stage === 'strike') addTrauma(0.3)
        break
      case 'mechanic':
        if (event.name === 'neon' || event.name === 'resonance') addTrauma(0.35)
        if (event.name === 'team') {
          simClock.hitstop(120)
          addTrauma(0.4)
        }
        if (event.name === 'parry' && event.id) {
          simClock.hitstop(70)
          rumble(event.id, 0.45, 90)
        }
        break
      case 'player-attack':
        if (event.step === 3) addTrauma(0.1)
        break
      case 'boss-form':
        addTrauma(0.5)
        break
      default:
        break
    }
  })
}
