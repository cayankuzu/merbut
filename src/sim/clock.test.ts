import { afterEach, describe, expect, it, vi } from 'vitest'
import { simClock } from './clock'
import { gameEvents } from './events'

describe('gameplay clock', () => {
  afterEach(() => {
    simClock.reset()
    vi.restoreAllMocks()
  })

  it('advances only by the real time it is given', () => {
    const start = simClock.now()
    expect(simClock.advance(0.5)).toBeCloseTo(0.5)
    expect(simClock.now() - start).toBeCloseTo(500)
  })

  it('nearly stops during hitstop and recovers afterwards', () => {
    const real = vi.spyOn(performance, 'now').mockReturnValue(1_000)
    simClock.hitstop(80)
    expect(simClock.scale()).toBeLessThan(0.1)
    expect(simClock.advance(1)).toBeLessThan(0.1)
    real.mockReturnValue(1_100)
    expect(simClock.scale()).toBe(1)
  })

  it('keeps the strongest slow-motion when effects overlap', () => {
    vi.spyOn(performance, 'now').mockReturnValue(5_000)
    simClock.hitstop(100)
    simClock.slow(0.3, 500)
    expect(simClock.scale()).toBeLessThan(0.1)
  })
})

describe('game events', () => {
  it('delivers events to every listener and survives a failing one', () => {
    const received: string[] = []
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const offBroken = gameEvents.on(() => { throw new Error('broken listener') })
    const off = gameEvents.on((event) => received.push(event.type))
    gameEvents.emit({ type: 'wave', biome: 0, boss: false })
    expect(received).toEqual(['wave'])
    expect(error).toHaveBeenCalled()
    off()
    offBroken()
    gameEvents.emit({ type: 'wave', biome: 0, boss: false })
    expect(received).toEqual(['wave'])
  })
})
