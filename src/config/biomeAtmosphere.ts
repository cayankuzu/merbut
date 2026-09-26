import type { BiomeDefinition, Weather } from './biomes'

export interface BiomeAtmosphereProfile {
  fogNear: number
  fogFar: number
  hazeOpacity: number
  hazeScale: number
  driftSpeed: number
  motifLift: number
  motifSpin: number
}


/**
 * Deliberately numeric-only art direction. These values let the renderer give
 * each biome a distinct air density and movement language without loading any
 * more textures or models.
 */
export const BIOME_ATMOSPHERES: Record<Weather, BiomeAtmosphereProfile> = {
  embers: { fogNear: 16, fogFar: 36, hazeOpacity: 0.24, hazeScale: 1.08, driftSpeed: 0.82, motifLift: 0.28, motifSpin: 0.88 },
  sand: { fogNear: 13, fogFar: 34, hazeOpacity: 0.26, hazeScale: 1.14, driftSpeed: 1.1, motifLift: 0.1, motifSpin: 0.4 },
  sparks: { fogNear: 12, fogFar: 30, hazeOpacity: 0.3, hazeScale: 1.18, driftSpeed: 0.7, motifLift: 0.5, motifSpin: 0.9 },
  storm: { fogNear: 10, fogFar: 27, hazeOpacity: 0.34, hazeScale: 1.26, driftSpeed: 1.4, motifLift: -0.5, motifSpin: 0.2 },
  rain: { fogNear: 13, fogFar: 31, hazeOpacity: 0.18, hazeScale: 1.16, driftSpeed: 1.25, motifLift: -0.72, motifSpin: 0.16 },
  fireflies: { fogNear: 12, fogFar: 32, hazeOpacity: 0.2, hazeScale: 1.06, driftSpeed: 0.46, motifLift: 0.18, motifSpin: 1.16 },
  ash: { fogNear: 11, fogFar: 28, hazeOpacity: 0.3, hazeScale: 1.2, driftSpeed: 0.64, motifLift: 0.34, motifSpin: 0.52 },
  mist: { fogNear: 9, fogFar: 24, hazeOpacity: 0.38, hazeScale: 1.32, driftSpeed: 0.32, motifLift: 0.08, motifSpin: 0.24 },
  snow: { fogNear: 10, fogFar: 29, hazeOpacity: 0.28, hazeScale: 1.24, driftSpeed: 0.56, motifLift: -0.28, motifSpin: 0.3 },
  firestorm: { fogNear: 10, fogFar: 26, hazeOpacity: 0.36, hazeScale: 1.28, driftSpeed: 1.38, motifLift: 0.62, motifSpin: 1.52 },
}

export function biomeAtmosphere(biome: BiomeDefinition): BiomeAtmosphereProfile {
  return BIOME_ATMOSPHERES[biome.weather]
}
