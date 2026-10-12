/**
 * Which edition this build is. The public web version (Vercel) is built with
 * `--mode demo` and plays the first two realms; the itch.io HTML5 build and
 * the desktop builds are the full game.
 */
export const IS_DEMO = import.meta.env.VITE_EDITION === 'demo'

/** The last realm (index) the demo plays; walking through its gate ends the demo. */
export const DEMO_LAST_BIOME = 1

/** Where the full game is sold. */
export const FULL_GAME_URL = 'https://memode.itch.io/merbut'

/** Whether a realm can be played in this edition. */
export const isPlayableBiome = (biome: number, demo = IS_DEMO) => !demo || biome <= DEMO_LAST_BIOME

/** Whether leaving this realm through its gate ends the demo. */
export const demoEndsAfter = (biome: number, demo = IS_DEMO) => demo && biome >= DEMO_LAST_BIOME

/** Opens the store page in a new tab (the game keeps running in this one). */
export function openFullGame() {
  window.open(FULL_GAME_URL, '_blank', 'noopener,noreferrer')
}
