/**
 * Original adaptive score, written as data. Two musical worlds meet here:
 * the Hijaz maqam (Hz. Ali) and Japanese pentatonic modes (Samurai Jack).
 * Patterns are 16 steps per bar; degrees index into the theme's scale.
 */
import { BIOMES, type BiomeId } from '../config/biomes'

export type ThemeId =
  | 'menu' | 'prologue'
  | BiomeId
  | 'boss-shadow' | 'boss-aku' | 'fracture' | 'ending' | 'defeat'

export type LeadVoice = 'ney' | 'shakuhachi' | 'koto' | 'synth'
export type PadVoice = 'warm' | 'dark' | 'glass' | 'choir'

export interface MusicTheme {
  tempo: number
  /** MIDI note of the tonic. */
  root: number
  scale: readonly number[]
  /** Scale degree of the chord root for each two-bar block. */
  progression: readonly number[]
  pad: PadVoice
  lead: LeadVoice
  /** Two bars (32 steps) of lead degrees; null is a rest. Played every other cycle. */
  motif: readonly (number | null)[]
  bass: string
  kick: string
  tom: string
  hat: string
  /** Base loudness of the drum layer outside combat (0..1). */
  calmDrums: number
  brightness: number
}

const HIJAZ = [0, 1, 4, 5, 7, 8, 10]
const HIRAJOSHI = [0, 2, 3, 7, 8]
const IN_SEN = [0, 1, 5, 7, 10]
const DORIAN = [0, 2, 3, 5, 7, 9, 10]
const MINOR_PENTATONIC = [0, 3, 5, 7, 10]
const PHRYGIAN = [0, 1, 3, 5, 7, 8, 10]
const KUMOI = [0, 2, 3, 7, 9]

const _ = null

export const THEMES: Record<ThemeId, MusicTheme> = {
  menu: {
    tempo: 70, root: 50, scale: HIJAZ, progression: [0, 5, 6, 0], pad: 'warm', lead: 'ney',
    motif: [4, _, _, _, 3, _, 2, _, 1, _, _, _, 2, _, _, _, 4, _, 5, _, 4, _, _, 2, 1, _, _, _, 0, _, _, _],
    bass: 'x.......x.......', kick: '................', tom: '................', hat: '................', calmDrums: 0, brightness: 900,
  },
  prologue: {
    tempo: 62, root: 45, scale: IN_SEN, progression: [0, 3, 0, 4], pad: 'dark', lead: 'shakuhachi',
    motif: [2, _, _, _, _, _, 3, _, 4, _, _, _, _, _, _, _, 3, _, 2, _, _, _, 1, _, 0, _, _, _, _, _, _, _],
    bass: 'x...............', kick: 'x...............', tom: '................', hat: '................', calmDrums: 0.3, brightness: 700,
  },
  'aku-city': {
    tempo: 96, root: 40, scale: HIJAZ, progression: [0, 0, 5, 6], pad: 'dark', lead: 'synth',
    motif: [0, _, 1, _, 2, _, 1, _, 0, _, _, _, 4, _, 3, _, 2, _, 1, _, 2, _, 4, _, 5, _, 4, _, _, _, _, _],
    bass: 'x.x...x.x.x...x.', kick: 'x.......x.......', tom: '..........x.....', hat: '..x...x...x...x.', calmDrums: 0.35, brightness: 1_300,
  },
  'sunset-harbor': {
    tempo: 88, root: 43, scale: DORIAN, progression: [0, 3, 6, 4], pad: 'warm', lead: 'shakuhachi',
    motif: [4, _, _, 3, 4, _, _, _, 6, _, 5, _, 4, _, _, _, 2, _, _, 3, 4, _, 2, _, 1, _, _, _, 0, _, _, _],
    bass: 'x.....x...x.....', kick: 'x.......x.......', tom: '......x.......x.', hat: '....x.......x...', calmDrums: 0.25, brightness: 1_100,
  },
  // A caravan in no hurry: ney over hand drums, a clock that ticks off-beat.
  'hourglass-desert': {
    tempo: 84, root: 44, scale: HIJAZ, progression: [0, 1, 0, 5], pad: 'warm', lead: 'ney',
    motif: [0, _, _, 1, 2, _, 1, _, 0, _, _, _, 4, _, _, _, 5, _, 4, _, 2, _, 1, 2, 1, _, 0, _, _, _, _, _],
    bass: 'x..x....x..x....', kick: 'x.....x.x.......', tom: '...x......x..x..', hat: '.x...x...x...x..', calmDrums: 0.3, brightness: 1_150,
  },
  'golden-swamp': {
    tempo: 76, root: 48, scale: HIRAJOSHI, progression: [0, 3, 1, 0], pad: 'glass', lead: 'koto',
    motif: [0, 1, 2, _, 3, _, 2, _, 4, _, 3, 2, _, _, _, _, 2, 3, 4, _, 5, _, 4, _, 3, _, 2, 1, 0, _, _, _],
    bass: 'x.......x...x...', kick: 'x...............', tom: '........x.......', hat: '................', calmDrums: 0.15, brightness: 1_000,
  },
  // The factory keeps time with its hammers: a relentless machine groove.
  'beetle-foundry': {
    tempo: 116, root: 36, scale: PHRYGIAN, progression: [0, 1, 0, 6], pad: 'dark', lead: 'synth',
    motif: [0, _, 0, 1, _, _, 0, _, 3, _, 1, _, 0, _, _, _, 0, _, 0, 1, 3, _, 4, _, 3, _, 1, _, 0, _, _, _],
    bass: 'x.x.xx.xx.x.xx.x', kick: 'x...x...x...x.x.', tom: '..x...x...x...x.', hat: 'xxx.xxx.xxx.xxx.', calmDrums: 0.5, brightness: 1_400,
  },
  'skull-island': {
    tempo: 100, root: 41, scale: HIJAZ, progression: [0, 1, 0, 6], pad: 'dark', lead: 'ney',
    motif: [0, _, _, 1, 2, _, _, _, 1, _, 0, _, _, _, _, _, 4, _, 5, _, 4, 2, 1, _, 2, _, _, _, 1, _, 0, _],
    bass: 'x..x..x.x..x..x.', kick: 'x..x....x..x....', tom: '....x.......x...', hat: '..x...x...x...x.', calmDrums: 0.35, brightness: 900,
  },
  'jade-ruins': {
    tempo: 68, root: 45, scale: IN_SEN, progression: [0, 2, 3, 0], pad: 'glass', lead: 'shakuhachi',
    motif: [3, _, _, _, 4, _, 3, _, 2, _, _, _, _, _, _, _, 1, _, 2, _, 3, _, _, _, 2, _, 1, _, 0, _, _, _],
    bass: 'x...............', kick: 'x...............', tom: '........x.......', hat: '................', calmDrums: 0.1, brightness: 1_200,
  },
  // Wind on the peak: shakuhachi and choir over taiko that answers the thunder.
  'storm-peak': {
    tempo: 92, root: 41, scale: KUMOI, progression: [0, 3, 1, 4], pad: 'choir', lead: 'shakuhachi',
    motif: [4, _, _, _, 3, _, 4, _, 2, _, _, _, 1, _, _, _, 2, _, 3, _, 4, _, _, 3, 2, _, 1, _, 0, _, _, _],
    bass: 'x.......x..x....', kick: 'x.......x.......', tom: 'x..x..x.....x.x.', hat: '....x.......x...', calmDrums: 0.4, brightness: 1_250,
  },
  'skull-field': {
    tempo: 58, root: 35, scale: MINOR_PENTATONIC, progression: [0, 0, 3, 4], pad: 'choir', lead: 'shakuhachi',
    motif: [_, _, _, _, 4, _, _, _, _, _, 3, _, _, _, _, _, _, _, _, _, 2, _, _, _, 1, _, _, _, 0, _, _, _],
    bass: 'x...............', kick: '................', tom: '................', hat: '................', calmDrums: 0, brightness: 600,
  },
  'inferno-throne': {
    tempo: 110, root: 38, scale: HIJAZ, progression: [0, 6, 5, 1], pad: 'choir', lead: 'ney',
    motif: [0, 1, 2, 1, 0, _, 4, _, 5, _, 4, _, 2, _, _, _, 0, 1, 2, 4, 5, _, 4, 2, 1, _, 2, _, 0, _, _, _],
    bass: 'x.xx..x.x.xx..x.', kick: 'x...x...x...x...', tom: '..x.....x.x.....', hat: 'x.x.x.x.x.x.x.x.', calmDrums: 0.45, brightness: 1_200,
  },
  'boss-shadow': {
    tempo: 126, root: 36, scale: HIJAZ, progression: [0, 1, 0, 5], pad: 'dark', lead: 'shakuhachi',
    motif: [0, _, 0, 1, 2, _, 1, 0, _, _, 4, _, 5, 4, 2, 1, 0, _, 0, 1, 2, 4, 5, 6, 5, _, 4, _, 2, _, 1, _],
    bass: 'x.x.x.xxx.x.x.xx', kick: 'x..xx...x..xx...', tom: '....x..x....x.xx', hat: 'x.x.x.x.x.x.x.x.', calmDrums: 0.9, brightness: 1_500,
  },
  'boss-aku': {
    tempo: 132, root: 38, scale: HIJAZ, progression: [0, 1, 6, 5], pad: 'choir', lead: 'ney',
    motif: [4, _, 5, 4, 2, _, 1, _, 0, _, 1, 2, 4, _, _, _, 5, 6, 5, 4, 2, 1, 2, _, 1, 0, _, 1, 0, _, _, _],
    bass: 'xx.x.xx.xx.x.xxx', kick: 'x.xx..x.x.xx..x.', tom: '...x...x...x.x.x', hat: 'xxx.xxx.xxx.xxx.', calmDrums: 1, brightness: 1_700,
  },
  fracture: {
    tempo: 142, root: 39, scale: HIJAZ, progression: [0, 1, 0, 1], pad: 'choir', lead: 'synth',
    motif: [0, 1, 0, 1, 4, 5, 4, 5, 6, _, 5, _, 4, _, 1, _, 0, 1, 0, 1, 4, 5, 4, 5, 6, 5, 4, 2, 1, 0, 1, _],
    bass: 'xxxxxxxxxxxxxxxx', kick: 'x.x.x.x.x.x.x.xx', tom: '.x.x.x.x.x.x.xxx', hat: 'xxxxxxxxxxxxxxxx', calmDrums: 1, brightness: 2_000,
  },
  ending: {
    tempo: 74, root: 50, scale: HIJAZ, progression: [0, 5, 3, 0], pad: 'warm', lead: 'ney',
    motif: [0, _, 2, _, 4, _, _, _, 5, _, 4, _, 2, _, _, _, 4, _, 5, _, 6, _, 5, 4, 2, _, 1, _, 0, _, _, _],
    bass: 'x.......x.......', kick: 'x...............', tom: '................', hat: '................', calmDrums: 0.2, brightness: 1_000,
  },
  defeat: {
    tempo: 54, root: 45, scale: MINOR_PENTATONIC, progression: [0, 3, 2, 0], pad: 'dark', lead: 'shakuhachi',
    motif: [2, _, _, _, 1, _, _, _, 0, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    bass: 'x...............', kick: '................', tom: '................', hat: '................', calmDrums: 0, brightness: 600,
  },
}

export function biomeTheme(biome: number): ThemeId {
  return BIOMES[Math.max(0, Math.min(BIOMES.length - 1, biome))]!.id
}
