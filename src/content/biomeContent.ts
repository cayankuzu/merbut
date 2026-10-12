import type { BiomeId } from '../config/biomes'
import { pick, type Locale } from '../i18n/locale'
import type { EnemyKind, EnemyVariant } from '../config/enemies'

/**
 * Everything that makes a biome feel like its own place, as plain data.
 * Adding or re-tuning a biome should only ever touch this file (and art).
 */
export type BiomeMechanic = 'neon' | 'tide' | 'hourglass' | 'marsh' | 'foundry' | 'lava' | 'bells' | 'storm' | 'blizzard' | 'throne'

export interface ContentSpawn {
  kind: EnemyKind
  side: -1 | 1
  variant?: EnemyVariant
  boss?: 'swamp' | 'final'
}

export interface ContentWave {
  /** Distance from the biome's left edge that triggers the wave. */
  trigger: number
  spawns: readonly ContentSpawn[]
}

export interface BiomeContent {
  id: BiomeId
  chapter: string
  tagline: string
  mechanic: BiomeMechanic
  /** One sentence the title card uses to teach the biome's signature mechanic. */
  mechanicHint: string
  /** Biome-relative x positions of interactive props (signs, bells, hourglasses, presses, rods). */
  props: readonly number[]
  /**
   * Biome-relative [start, end] ranges of special ground: marsh water, ice,
   * or foundry conveyor belts (even belts run left, odd belts run right).
   */
  zones: readonly (readonly [number, number])[]
  /** Two or three waves: entry, an optional middle beat, and the depth wave (bosses live there). */
  waves: readonly ContentWave[]
}

export const BIOME_CONTENT: readonly BiomeContent[] = [
  {
    id: 'aku-city',
    chapter: 'DİYAR I',
    tagline: 'Neon altında ilk adım',
    mechanic: 'neon',
    mechanicHint: 'Neon tabelaları kır: elektrik yakındaki düşmanları sersemletir.',
    props: [9.5, 19, 28.5],
    zones: [],
    waves: [
      { trigger: 6, spawns: [{ kind: 1, side: 1 }, { kind: 2, side: 1 }] },
      { trigger: 14.5, spawns: [{ kind: 1, side: -1 }, { kind: 2, side: 1 }] },
      { trigger: 23, spawns: [{ kind: 1, side: 1 }, { kind: 2, side: -1 }, { kind: 1, side: 1 }] },
    ],
  },
  {
    id: 'sunset-harbor',
    chapter: 'DİYAR II',
    tagline: 'Dalga ve şimşek',
    mechanic: 'tide',
    mechanicHint: 'Dalga uyarısını görünce zıpla. Gelgit düşmanları da sürükler.',
    props: [],
    zones: [],
    waves: [
      { trigger: 6, spawns: [{ kind: 2, side: 1 }, { kind: 1, side: -1 }, { kind: 2, side: 1 }] },
      { trigger: 14.5, spawns: [{ kind: 1, side: 1 }, { kind: 4, side: -1 }, { kind: 2, side: 1, variant: 'elite' }] },
      { trigger: 23, spawns: [{ kind: 4, side: 1 }, { kind: 1, side: -1 }, { kind: 2, side: 1 }] },
    ],
  },
  {
    id: 'hourglass-desert',
    chapter: 'DİYAR III',
    tagline: 'Kum akar, zaman bekler',
    mechanic: 'hourglass',
    mechanicHint: 'Kum saatine vur: çevresindeki zaman yavaşlar. Titreyenler seraptır, tek darbede kuma döner.',
    props: [8, 18.5, 29],
    zones: [],
    waves: [
      { trigger: 6, spawns: [{ kind: 2, side: 1 }, { kind: 1, side: 1, variant: 'mirage' }, { kind: 1, side: -1 }, { kind: 2, side: -1, variant: 'mirage' }] },
      { trigger: 14.5, spawns: [{ kind: 5, side: 1 }, { kind: 1, side: -1, variant: 'mirage' }, { kind: 1, side: 1, variant: 'mirage' }, { kind: 2, side: -1 }] },
      { trigger: 23, spawns: [{ kind: 4, side: 1 }, { kind: 1, side: 1, variant: 'mirage' }, { kind: 3, side: -1 }, { kind: 2, side: 1, variant: 'mirage' }, { kind: 2, side: -1, variant: 'elite' }] },
    ],
  },
  {
    id: 'golden-swamp',
    chapter: 'DİYAR IV',
    tagline: 'Yansımanı oku',
    mechanic: 'marsh',
    mechanicHint: 'Su seni yavaşlatır, zıplayarak geç. Ateş böcekleri yeteneğini doldurur.',
    props: [9, 16, 27],
    zones: [[5.5, 10.5], [15.5, 20], [25, 29.5]],
    waves: [
      { trigger: 6, spawns: [{ kind: 3, side: 1 }, { kind: 1, side: -1 }, { kind: 1, side: 1 }] },
      { trigger: 23, spawns: [{ kind: 4, side: 1, boss: 'swamp' }] },
    ],
  },
  {
    id: 'beetle-foundry',
    chapter: 'DİYAR V',
    tagline: 'Demirin kovanında',
    mechanic: 'foundry',
    mechanicHint: 'Bantlar seni ve düşmanı taşır. Presin gölgesinden çekil; altında kalan dron hurdaya döner.',
    props: [7.5, 15, 22.5, 30],
    zones: [[3.2, 11.8], [18.2, 26.8]],
    waves: [
      { trigger: 6, spawns: [{ kind: 1, side: 1, variant: 'drone' }, { kind: 2, side: -1, variant: 'drone' }, { kind: 1, side: 1, variant: 'drone' }, { kind: 2, side: 1 }] },
      { trigger: 14.5, spawns: [{ kind: 4, side: 1, variant: 'drone' }, { kind: 1, side: -1, variant: 'drone' }, { kind: 1, side: 1, variant: 'drone' }] },
      { trigger: 23, spawns: [{ kind: 3, side: 1, variant: 'queen' }, { kind: 1, side: -1, variant: 'drone' }, { kind: 4, side: 1, variant: 'drone' }, { kind: 2, side: -1, variant: 'drone' }] },
    ],
  },
  {
    id: 'skull-island',
    chapter: 'DİYAR VI',
    tagline: 'Yer ayağının altından kayıyor',
    mechanic: 'lava',
    mechanicHint: 'Kızaran çatlaktan uzaklaş. Lav, içine çektiğin düşmanı da yakar.',
    props: [],
    zones: [],
    waves: [
      { trigger: 6, spawns: [{ kind: 4, side: 1 }, { kind: 3, side: -1 }, { kind: 2, side: 1, variant: 'elite' }] },
      { trigger: 14.5, spawns: [{ kind: 5, side: 1 }, { kind: 1, side: -1, variant: 'elite' }, { kind: 3, side: 1 }] },
      { trigger: 23, spawns: [{ kind: 5, side: 1 }, { kind: 1, side: -1 }, { kind: 3, side: 1 }, { kind: 2, side: -1 }] },
    ],
  },
  {
    id: 'jade-ruins',
    chapter: 'DİYAR VII',
    tagline: 'İki çan, iki kahraman',
    mechanic: 'bells',
    mechanicHint: 'Sisteki hayaletler yarım hasar alır. İki çana aynı anda vurun, sis dağılsın.',
    props: [13, 22],
    zones: [],
    waves: [
      { trigger: 6, spawns: [{ kind: 1, side: 1, variant: 'ghost' }, { kind: 2, side: -1, variant: 'ghost' }, { kind: 5, side: 1 }] },
      { trigger: 14.5, spawns: [{ kind: 5, side: 1 }, { kind: 1, side: -1, variant: 'elite' }, { kind: 3, side: 1 }] },
      { trigger: 23, spawns: [{ kind: 3, side: 1, variant: 'ghost' }, { kind: 4, side: -1, variant: 'ghost' }, { kind: 2, side: 1, variant: 'ghost' }, { kind: 1, side: -1, variant: 'elite' }] },
    ],
  },
  {
    id: 'storm-peak',
    chapter: 'DİYAR VIII',
    tagline: 'Gök gürlerken susan kılıç',
    mechanic: 'storm',
    mechanicHint: 'Parlayan paratonere vur: kılıcın şimşek taşır ve darbeler zincirlenir. Yerde halka belirirse kaç.',
    props: [9, 26],
    zones: [],
    waves: [
      { trigger: 6, spawns: [{ kind: 5, side: 1 }, { kind: 2, side: -1 }, { kind: 1, side: 1, variant: 'elite' }, { kind: 4, side: -1 }] },
      { trigger: 14.5, spawns: [{ kind: 2, side: 1, variant: 'elite' }, { kind: 4, side: -1 }, { kind: 1, side: 1 }, { kind: 5, side: -1 }] },
      { trigger: 23, spawns: [{ kind: 3, side: 1, variant: 'elite' }, { kind: 5, side: -1, variant: 'elite' }, { kind: 2, side: 1 }, { kind: 1, side: -1 }, { kind: 4, side: 1 }] },
    ],
  },
  {
    id: 'skull-field',
    chapter: 'DİYAR IX',
    tagline: 'Sessizlik de bir düşman',
    mechanic: 'blizzard',
    mechanicHint: 'Tipi seni geri iter, buz zeminde kayarsın. Kar kabarırsa altından biri çıkıyor.',
    props: [],
    zones: [[4.5, 10], [19.5, 25]],
    waves: [
      { trigger: 6, spawns: [{ kind: 5, side: 1 }, { kind: 2, side: -1 }, { kind: 4, side: 1 }] },
      { trigger: 14.5, spawns: [{ kind: 2, side: 1 }, { kind: 4, side: -1 }, { kind: 5, side: 1, variant: 'elite' }] },
      { trigger: 23, spawns: [{ kind: 3, side: 1, variant: 'giant' }, { kind: 1, side: -1 }, { kind: 1, side: 1 }] },
    ],
  },
  {
    id: 'inferno-throne',
    chapter: 'DİYAR X',
    tagline: 'Zamanın kırıldığı yer',
    mechanic: 'throne',
    mechanicHint: 'Alev bacaları sırayla patlar. Aku zayıfladıkça zaman kırılır.',
    props: [8, 14, 22, 28],
    zones: [],
    waves: [
      { trigger: 6, spawns: [{ kind: 5, side: 1, variant: 'elite' }, { kind: 3, side: -1, variant: 'elite' }, { kind: 2, side: 1 }, { kind: 4, side: -1 }] },
      { trigger: 23, spawns: [{ kind: 5, side: 1, boss: 'final' }] },
    ],
  },
]

export const contentFor = (id: BiomeId) => BIOME_CONTENT.find((content) => content.id === id)!

export interface BiomeText {
  chapter: string
  tagline: string
  mechanicHint: string
}

/** English chapter card text per realm ("DİYAR I" → "REALM I"). */
const BIOME_TEXT_EN: Record<BiomeId, BiomeText> = {
  'aku-city': {
    chapter: 'REALM I',
    tagline: 'First steps under the neon',
    mechanicHint: 'Smash the neon signs: the electricity stuns nearby enemies.',
  },
  'sunset-harbor': {
    chapter: 'REALM II',
    tagline: 'Waves and lightning',
    mechanicHint: 'Jump when you see the wave warning. The tide drags enemies along too.',
  },
  'hourglass-desert': {
    chapter: 'REALM III',
    tagline: 'Sand flows, time waits',
    mechanicHint: 'Strike an hourglass: time slows around it. Flickering enemies are mirages; one hit turns them back to sand.',
  },
  'golden-swamp': {
    chapter: 'REALM IV',
    tagline: 'Read your reflection',
    mechanicHint: 'Water slows you down, so jump across it. Fireflies charge your special ability.',
  },
  'beetle-foundry': {
    chapter: 'REALM V',
    tagline: 'In the hive of iron',
    mechanicHint: 'The belts carry you and your enemies alike. Step out of the press’s shadow; any drone caught beneath it is scrap.',
  },
  'skull-island': {
    chapter: 'REALM VI',
    tagline: 'The ground slips from under your feet',
    mechanicHint: 'Back away from a glowing crack. The lava also burns any enemy you lure into it.',
  },
  'jade-ruins': {
    chapter: 'REALM VII',
    tagline: 'Two bells, two heroes',
    mechanicHint: 'Ghosts in the mist take half damage. Strike both bells at the same moment to clear it.',
  },
  'storm-peak': {
    chapter: 'REALM VIII',
    tagline: 'A silent sword beneath the thunder',
    mechanicHint: 'Strike a glowing lightning rod: your blade carries the lightning and your hits chain. If a ring appears on the ground, get clear.',
  },
  'skull-field': {
    chapter: 'REALM IX',
    tagline: 'Silence is an enemy too',
    mechanicHint: 'The blizzard pushes you back and the ice sends you sliding. If the snow swells, something is about to climb out.',
  },
  'inferno-throne': {
    chapter: 'REALM X',
    tagline: 'Where time breaks',
    mechanicHint: 'The flame vents erupt in turn. As Aku weakens, time begins to fracture.',
  },
}

/** The realm's chapter label, tagline and mechanic hint in the player's language. */
export function biomeText(index: number, locale: Locale): BiomeText {
  const content = BIOME_CONTENT[index] ?? BIOME_CONTENT[0]!
  return pick(locale, { chapter: content.chapter, tagline: content.tagline, mechanicHint: content.mechanicHint }, BIOME_TEXT_EN[content.id])
}
