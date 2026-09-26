import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ACTIVE_PHASES, useSessionStore } from '../store/sessionStore'
import { simClock } from './clock'
import { COMBAT_STEP, stepDirector } from './director'

/**
 * The only place gameplay time moves. It runs before every other frame
 * callback, advances the gameplay clock (which stands still while paused or
 * hidden) and steps the whole simulation at a fixed 30 Hz.
 */
export function SimulationLoop() {
  const accumulator = useRef(0)

  useFrame((_, rawDelta) => {
    const phase = useSessionStore.getState().phase
    if (!ACTIVE_PHASES.includes(phase)) {
      accumulator.current = 0
      return
    }
    accumulator.current += simClock.advance(Math.min(rawDelta, 0.1))
    if (accumulator.current < COMBAT_STEP) return
    const step = Math.min(accumulator.current, COMBAT_STEP * 3)
    accumulator.current = 0
    const now = simClock.now()
    useSessionStore.getState().tick(step, now)
    stepDirector(step, now)
  }, -1)

  return null
}
