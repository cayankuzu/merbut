import { ASSET_PATHS } from './assetPaths'

export const PANEL_WORLD_WIDTH = 18
export const PANELS_PER_BIOME = 2
export const BIOME_WORLD_WIDTH = PANEL_WORLD_WIDTH * PANELS_PER_BIOME
export const BIOME_TRANSITION_HALF_WIDTH = PANEL_WORLD_WIDTH * 0.5

export type BiomeId =
  | 'aku-city' | 'sunset-harbor' | 'hourglass-desert' | 'golden-swamp' | 'beetle-foundry'
  | 'skull-island' | 'jade-ruins' | 'storm-peak' | 'skull-field' | 'inferno-throne'

export type Weather = 'embers' | 'rain' | 'sand' | 'fireflies' | 'sparks' | 'ash' | 'mist' | 'storm' | 'snow' | 'firestorm'

export interface BiomeArt {
  back: string
  front: string
  cover: string
}

export interface BiomeDefinition {
  id: BiomeId
  /** Original paintings: slow back layer, mid front layer and a square album cover. */
  art: BiomeArt
  /** Colour above the painting (tall screens) and below it (behind the floor). */
  skyTop: string
  floorColor: string
  panelColor: string
  fogColor: string
  skyColor: string
  groundDark: string
  groundLight: string
  horizonColor: string
  accentColor: string
  title: string
  weather: Weather
  bossPanel?: boolean
}

export const BIOMES: readonly BiomeDefinition[] = [
  {
    id: 'aku-city',
    art: ASSET_PATHS.realms['aku-city'],
    skyTop: '#12040c',
    floorColor: '#2a0818',
    panelColor: '#3a2229',
    fogColor: '#56342f',
    skyColor: '#ffe0bb',
    groundDark: '#3d242e',
    groundLight: '#a65d58',
    horizonColor: '#24131f',
    accentColor: '#ff286f',
    title: 'Aku Metropolü',
    weather: 'embers',
  },
  {
    id: 'sunset-harbor',
    art: ASSET_PATHS.realms['sunset-harbor'],
    skyTop: '#231733',
    floorColor: '#241a30',
    panelColor: '#726766',
    fogColor: '#756c69',
    skyColor: '#ffebc6',
    groundDark: '#3e3437',
    groundLight: '#a57c66',
    horizonColor: '#28232b',
    accentColor: '#ff8b43',
    title: 'Günbatımı Limanı',
    weather: 'rain',
  },
  {
    id: 'hourglass-desert',
    art: ASSET_PATHS.realms['hourglass-desert'],
    skyTop: '#5fb3ad',
    floorColor: '#c98a55',
    panelColor: '#b8844f',
    fogColor: '#c9975e',
    skyColor: '#fff1cf',
    groundDark: '#6b4128',
    groundLight: '#d69a5c',
    horizonColor: '#3a2027',
    accentColor: '#ffc94d',
    title: 'Kum Saati Çölü',
    weather: 'sand',
  },
  {
    id: 'golden-swamp',
    art: ASSET_PATHS.realms['golden-swamp'],
    skyTop: '#2f3814',
    floorColor: '#4c5222',
    panelColor: '#78752c',
    fogColor: '#77763d',
    skyColor: '#fff19d',
    groundDark: '#30351e',
    groundLight: '#73793a',
    horizonColor: '#1c2214',
    accentColor: '#ddeb46',
    title: 'Altın Bataklık',
    weather: 'fireflies',
    bossPanel: true,
  },
  {
    id: 'beetle-foundry',
    art: ASSET_PATHS.realms['beetle-foundry'],
    skyTop: '#0b0808',
    floorColor: '#1a0d0a',
    panelColor: '#2b2a2c',
    fogColor: '#3a2e2a',
    skyColor: '#ffcf8a',
    groundDark: '#1b1a1c',
    groundLight: '#4f4a46',
    horizonColor: '#0f0c0d',
    accentColor: '#ff8a1f',
    title: 'Böcek Dökümhanesi',
    weather: 'sparks',
  },
  {
    id: 'skull-island',
    art: ASSET_PATHS.realms['skull-island'],
    skyTop: '#0f180c',
    floorColor: '#1d2a15',
    panelColor: '#42532a',
    fogColor: '#596238',
    skyColor: '#d8ed8c',
    groundDark: '#26351f',
    groundLight: '#61783b',
    horizonColor: '#172015',
    accentColor: '#78ff43',
    title: 'Kafatası Adası',
    weather: 'ash',
  },
  {
    id: 'jade-ruins',
    art: ASSET_PATHS.realms['jade-ruins'],
    skyTop: '#07141a',
    floorColor: '#1d4a42',
    panelColor: '#214742',
    fogColor: '#28524f',
    skyColor: '#b7f3d8',
    groundDark: '#17332f',
    groundLight: '#40715e',
    horizonColor: '#0d2220',
    accentColor: '#39ff91',
    title: 'Yeşim Harabeleri',
    weather: 'mist',
  },
  {
    id: 'storm-peak',
    art: ASSET_PATHS.realms['storm-peak'],
    skyTop: '#06070f',
    floorColor: '#161a36',
    panelColor: '#262a4a',
    fogColor: '#343a63',
    skyColor: '#d9e2ff',
    groundDark: '#1c1f33',
    groundLight: '#4a5078',
    horizonColor: '#0e1020',
    accentColor: '#8fb4ff',
    title: 'Şimşek Zirvesi',
    weather: 'storm',
  },
  {
    id: 'skull-field',
    art: ASSET_PATHS.realms['skull-field'],
    skyTop: '#070d16',
    floorColor: '#b8d2de',
    panelColor: '#34434d',
    fogColor: '#3c4851',
    skyColor: '#b8e7f5',
    groundDark: '#222e38',
    groundLight: '#4d6471',
    horizonColor: '#141b22',
    accentColor: '#54d9ff',
    title: 'Sessiz Kemik Ovası',
    weather: 'snow',
  },
  {
    id: 'inferno-throne',
    art: ASSET_PATHS.realms['inferno-throne'],
    skyTop: '#140302',
    floorColor: '#2a0806',
    panelColor: '#6f210f',
    fogColor: '#54180f',
    skyColor: '#ffb044',
    groundDark: '#24100d',
    groundLight: '#8a2b16',
    horizonColor: '#170806',
    accentColor: '#ff4a12',
    title: 'Alev Tahtı',
    weather: 'firestorm',
    bossPanel: true,
  },
]

export const BIOME_INDEX = Object.fromEntries(BIOMES.map((biome, index) => [biome.id, index])) as Record<BiomeId, number>

export const biomeIndexOf = (id: BiomeId) => BIOME_INDEX[id]

export const BACKDROP_PANELS = BIOMES.flatMap((biome) =>
  Array.from({ length: PANELS_PER_BIOME }, (_, repeatIndex) => ({
    ...biome,
    repeatIndex,
    panelId: `${biome.id}-${repeatIndex + 1}`,
  })),
)

export const BACKDROP_PANEL_COUNT = BACKDROP_PANELS.length
export const WORLD_VISUAL_LEFT = -PANEL_WORLD_WIDTH * 0.5
export const WORLD_VISUAL_RIGHT =
  WORLD_VISUAL_LEFT + BACKDROP_PANEL_COUNT * PANEL_WORLD_WIDTH
export const CAMERA_MIN_X = 0
export const CAMERA_MAX_X = (BACKDROP_PANEL_COUNT - 1) * PANEL_WORLD_WIDTH

export interface BiomeBlend {
  from: BiomeDefinition
  to: BiomeDefinition
  mix: number
}

const smoothstep = (value: number) => value * value * (3 - 2 * value)

export function getBiomeBlend(worldX: number): BiomeBlend {
  for (let index = 1; index < BIOMES.length; index += 1) {
    const boundary = WORLD_VISUAL_LEFT + index * BIOME_WORLD_WIDTH
    const start = boundary - BIOME_TRANSITION_HALF_WIDTH
    const end = boundary + BIOME_TRANSITION_HALF_WIDTH
    if (worldX >= start && worldX <= end) {
      const progress = Math.min(1, Math.max(0, (worldX - start) / (end - start)))
      return { from: BIOMES[index - 1], to: BIOMES[index], mix: smoothstep(progress) }
    }
  }

  const biomeIndex = Math.min(
    BIOMES.length - 1,
    Math.max(0, Math.floor((worldX - WORLD_VISUAL_LEFT) / BIOME_WORLD_WIDTH)),
  )
  return { from: BIOMES[biomeIndex], to: BIOMES[biomeIndex], mix: 0 }
}
