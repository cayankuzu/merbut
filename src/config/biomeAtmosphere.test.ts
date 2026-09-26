import { describe, expect, it } from 'vitest'
import { BIOMES, biomeIndexOf } from './biomes'
import { biomeAtmosphere } from './biomeAtmosphere'

describe('biome atmosphere art direction', () => {
  it('makes the jade mist more enclosed than the open city', () => {
    const city = biomeAtmosphere(BIOMES[0])
    const jade = biomeAtmosphere(BIOMES[biomeIndexOf('jade-ruins')]!)

    expect(jade.fogNear).toBeLessThan(city.fogNear)
    expect(jade.fogFar).toBeLessThan(city.fogFar)
    expect(jade.hazeOpacity).toBeGreaterThan(city.hazeOpacity)
  })

  it('gives the final firestorm a faster, denser motion language', () => {
    const field = biomeAtmosphere(BIOMES[biomeIndexOf('skull-field')]!)
    const inferno = biomeAtmosphere(BIOMES[biomeIndexOf('inferno-throne')]!)

    expect(inferno.driftSpeed).toBeGreaterThan(field.driftSpeed)
    expect(inferno.motifSpin).toBeGreaterThan(field.motifSpin)
  })
})
