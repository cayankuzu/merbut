import type { BiomeId } from '../config/biomes'
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
