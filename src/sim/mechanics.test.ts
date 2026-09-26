import { beforeEach, describe, expect, it } from 'vitest'
import { contentFor } from '../content/biomeContent'
import { biomeIndexOf } from '../config/biomes'
import { useSessionStore } from '../store/sessionStore'
import { createEnemy } from './enemyFactory'
import { beltVelocityAt, biomeLeft, chainLightning, creatureTimeScale, groundModifiers, isBladeCharged, isResonanceActive, resetMechanics, strikeProps, useMechanicsStore } from './mechanics'

const hits: { id: string; amount: number }[] = []
const hitEnemy = (id: string, amount: number) => {
  hits.push({ id, amount })
  return false
}

describe('signature biome mechanics', () => {
  beforeEach(() => {
    hits.length = 0
    useSessionStore.getState().returnToMenu()
    resetMechanics()
  })

  it('breaks a neon sign once and shocks nearby creatures', () => {
    useSessionStore.setState({ currentBiome: 0 })
    const sign = useMechanicsStore.getState().props.find((prop) => prop.kind === 'neon')!
    useSessionStore.getState().spawnEnemies([createEnemy({ id: 'near', biome: 0, kind: 1, x: sign.x + 2, now: 10_000 }), createEnemy({ id: 'far', biome: 0, kind: 1, x: sign.x + 9, now: 10_000 })])
    expect(strikeProps('ali', sign.x, 1.3, 10_000, hitEnemy)).toBe(true)
    expect(hits.map((hit) => hit.id)).toEqual(['near'])
    expect(useSessionStore.getState().enemies.find((enemy) => enemy.id === 'near')!.stunUntil).toBeGreaterThan(10_000)
    expect(strikeProps('ali', sign.x, 1.3, 10_500, hitEnemy)).toBe(false)
  })

  it('only resonates when both bells ring together', () => {
    useSessionStore.setState({ currentBiome: biomeIndexOf('jade-ruins') })
    const [first, second] = useMechanicsStore.getState().props.filter((prop) => prop.kind === 'bell')
    strikeProps('ali', first!.x, 1, 20_000, hitEnemy)
    strikeProps('jack', second!.x, 1, 21_500, hitEnemy)
    expect(isResonanceActive(21_600)).toBe(false)
    strikeProps('ali', first!.x, 1, 22_000, hitEnemy)
    expect(isResonanceActive(22_100)).toBe(true)
  })

  it('slows heroes in marsh water and makes blizzard ice slippery', () => {
    const swamp = biomeIndexOf('golden-swamp')
    const [start] = contentFor('golden-swamp').zones[0]!
    useSessionStore.setState({ currentBiome: swamp })
    expect(groundModifiers(biomeLeft(swamp) + start + 0.5, 0).speed).toBeLessThan(1)
    expect(groundModifiers(biomeLeft(swamp) + 1, 0).speed).toBe(1)
    const field = biomeIndexOf('skull-field')
    const [iceStart] = contentFor('skull-field').zones[0]!
    useSessionStore.setState({ currentBiome: field })
    expect(groundModifiers(biomeLeft(field) + iceStart + 0.5, 0).traction).toBeLessThan(0.5)
  })

  it('flips an hourglass into a slow field that only lasts its window', () => {
    const desert = biomeIndexOf('hourglass-desert')
    useSessionStore.setState({ currentBiome: desert })
    const glass = useMechanicsStore.getState().props.find((prop) => prop.kind === 'hourglass')!
    expect(strikeProps('jack', glass.x, 1, 30_000, hitEnemy)).toBe(true)
    expect(creatureTimeScale(desert, glass.x + 2, 31_000)).toBeLessThan(0.5)
    expect(creatureTimeScale(desert, glass.x + 9, 31_000)).toBe(1)
    expect(creatureTimeScale(desert, glass.x, 40_000)).toBe(1)
    // Cooling down: a second strike right away does nothing.
    expect(strikeProps('jack', glass.x, 1, 31_000, hitEnemy)).toBe(false)
  })

  it('runs foundry belts in alternating directions and carries heroes on them', () => {
    const foundry = biomeIndexOf('beetle-foundry')
    const [first, second] = contentFor('beetle-foundry').zones
    const left = biomeLeft(foundry)
    expect(beltVelocityAt(foundry, left + first![0] + 1)).toBeLessThan(0)
    expect(beltVelocityAt(foundry, left + second![0] + 1)).toBeGreaterThan(0)
    expect(beltVelocityAt(foundry, left + 15)).toBe(0)
    useSessionStore.setState({ currentBiome: foundry })
    expect(groundModifiers(left + first![0] + 1, 0).belt).toBeLessThan(0)
  })

  it('charges a blade at a lightning rod and chains to the nearest creatures', () => {
    const storm = biomeIndexOf('storm-peak')
    useSessionStore.setState({ currentBiome: storm })
    const rod = useMechanicsStore.getState().props.find((prop) => prop.kind === 'rod')!
    strikeProps('ali', rod.x, 1, 50_000, hitEnemy)
    expect(isBladeCharged('ali', 51_000)).toBe(true)
    expect(isBladeCharged('jack', 51_000)).toBe(false)
    useSessionStore.getState().spawnEnemies([0, 1.5, 3, 12].map((offset, index) => createEnemy({ id: `chain-${index}`, biome: storm, kind: 1, x: rod.x + offset, now: 50_000 })))
    hits.length = 0
    const reached = chainLightning('ali', ['chain-0'], 51_000, hitEnemy)
    expect(reached).toBe(2)
    expect(hits.map((hit) => hit.id).sort()).toEqual(['chain-1', 'chain-2'])
  })
})
