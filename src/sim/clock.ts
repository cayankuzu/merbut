/**
 * The single gameplay clock. Every gameplay timestamp (cooldowns, invulnerability,
 * boss timelines, impacts) is measured in these milliseconds. Pausing simply stops
 * advancing it, so no stored timer ever needs to be shifted.
 *
 * Time starts well above zero because several fields use 0 as "not set".
 */
const START_MS = 10_000
const HITSTOP_SCALE = 0.04

let time = START_MS
let slowUntilRealMs = 0
let slowScale = 1

function realNow() {
  return typeof performance === 'undefined' ? Date.now() : performance.now()
}

export const simClock = {
  now: () => time,
  /** Current gameplay speed: 1 normally, near 0 during hitstop. */
  scale() {
    return realNow() < slowUntilRealMs ? slowScale : 1
  },
  /** Advances gameplay time by a real-time delta (seconds) and returns the scaled delta. */
  advance(realDeltaSeconds: number) {
    const scaled = Math.max(0, realDeltaSeconds) * this.scale()
    time += scaled * 1_000
    return scaled
  },
  /** Freezes the action for a few real milliseconds so a hit lands with weight. */
  hitstop(durationMs: number) {
    this.slow(HITSTOP_SCALE, durationMs)
  },
  /** Slows gameplay (0..1) for a real-time duration; the strongest active effect wins. */
  slow(scale: number, durationMs: number) {
    const now = realNow()
    if (now < slowUntilRealMs && slowScale <= scale) {
      slowUntilRealMs = Math.max(slowUntilRealMs, now + durationMs * 0.5)
      return
    }
    slowScale = Math.max(0, Math.min(1, scale))
    slowUntilRealMs = now + durationMs
  },
  reset() {
    time = START_MS
    slowUntilRealMs = 0
    slowScale = 1
  },
  /** Test helper: jump the clock to an absolute time. */
  set(value: number) {
    time = value
  },
}
