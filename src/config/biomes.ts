import { ASSET_PATHS } from './assetPaths'

export const PANEL_WORLD_WIDTH = 18
export const PANELS_PER_BIOME = 2
export const BIOME_WORLD_WIDTH = PANEL_WORLD_WIDTH * PANELS_PER_BIOME
export const BIOME_TRANSITION_HALF_WIDTH = PANEL_WORLD_WIDTH * 0.5

export interface BiomeDefinition {
  id: string
  image: string
  panelColor: string
  fogColor: string
  skyColor: string
  groundDark: string
  groundLight: string
  horizonColor: string
  accentColor: string
  title: string
  weather: 'embers' | 'rain' | 'fireflies' | 'ash' | 'mist' | 'snow' | 'firestorm'
  bossPanel?: boolean
}

export const BIOMES: readonly BiomeDefinition[] = [
  {
    id: 'aku-city',
    image: ASSET_PATHS.backgrounds.city,
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
    image: ASSET_PATHS.backgrounds.harbor,
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
    id: 'golden-swamp',
    image: ASSET_PATHS.backgrounds.swamp,
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
    id: 'skull-island',
    image: ASSET_PATHS.backgrounds.skullIsland,
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
    image: ASSET_PATHS.backgrounds.ruins,
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
    id: 'skull-field',
    image: ASSET_PATHS.backgrounds.skullField,
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
    image: ASSET_PATHS.backgrounds.finalBoss,
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
] as const

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
