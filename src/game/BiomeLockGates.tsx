import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, DoubleSide, Group, MathUtils, MeshBasicMaterial } from 'three'
import { BIOMES, type BiomeId } from '../config/biomes'
import { getBiomeGateX } from '../sim/biomeProgress'
import { useSessionStore } from '../store/sessionStore'
import { Kit, seeded } from '../world/kit'
import { SURFACES } from '../world/materials'

/**
 * Each biome is sealed by a gate in its own language. It sinks into the ground
 * when the biome is cleared (and every gate opens for the final Aku duel).
 */
type GateBuilder = (kit: Kit, random: () => number) => void
const range = (count: number) => Array.from({ length: count }, (_, index) => index)

const GATES: Partial<Record<BiomeId, GateBuilder>> = {
  // Neon pylons of the Metropolis
  'aku-city': (kit) => {
    ;[-2.6, 2.6].forEach((z) => {
      kit.box('metal', [0.5, 4.8, 0.5], { at: [0, 2.4, z], color: '#231419' })
      range(4).forEach((ring) => kit.box('glow', [0.56, 0.06, 0.56], { at: [0, 0.8 + ring * 1.1, z], color: '#ff2a70' }))
    })
    kit.box('metal', [0.4, 0.4, 5.6], { at: [0, 4.7, 0], color: '#231419' })
  },
  // Chain curtain of the harbor
  'sunset-harbor': (kit) => {
    kit.box('wood', [0.4, 0.5, 5.8], { at: [0, 4.4, 0], color: '#3b2a20' })
    range(9).forEach((column) => range(14).forEach((link) => kit.torus('metal', 0.12, 0.035, { at: [0, 4.1 - link * 0.28, -2.4 + column * 0.6], rotate: [0, link % 2 ? Math.PI / 2 : 0, 0], color: '#4a3d33' }, Math.PI * 2, 10)))
  },
  // Sun door of the desert: sandstone slabs under a golden sun disk
  'hourglass-desert': (kit) => {
    ;[-2.5, 2.5].forEach((z) => {
      kit.box('stone', [0.7, 5, 0.7], { at: [0, 2.5, z], color: '#a06c47' })
      kit.box('stone', [0.9, 0.3, 0.9], { at: [0, 5.1, z], color: '#8f5d3f' })
    })
    kit.box('stone', [0.6, 0.6, 6], { at: [0, 5.2, 0], color: '#946442' })
    range(5).forEach((slab) => kit.box('stone', [0.3, 4.4, 0.9], { at: [0, 2.2, -1.9 + slab * 0.95], color: slab % 2 ? '#b98256' : '#a9744c' }))
    kit.torus('metal', 0.8, 0.09, { at: [0.25, 5.9, 0], rotate: [0, Math.PI / 2, 0], color: '#d6a84a' })
    kit.cylinder('glow', 0.6, 0.6, 0.06, { at: [0.28, 5.9, 0], rotate: [0, 0, Math.PI / 2], color: '#ffcf5a' }, 24)
  },
  // Root wall of the swamp
  'golden-swamp': (kit, random) => {
    range(14).forEach(() => {
      const z = -2.6 + random() * 5.2
      kit.tube('wood', [[0, 0, z], [random() - 0.5, 1.6, z + random() - 0.5], [random() - 0.5, 3.2, z], [0, 4.6, z + random() - 0.5]], 0.12 + random() * 0.1, { color: '#2a2a16' }, 14)
    })
    range(10).forEach(() => kit.sphere('glow', 0.07, { at: [0.2, 0.5 + random() * 3.6, -2.4 + random() * 4.8], color: '#e8ff7a' }))
  },
  // Blast door of the foundry with hazard stripes and warning lamps
  'beetle-foundry': (kit) => {
    ;[-2.7, 2.7].forEach((z) => {
      kit.box('metal', [0.6, 5.2, 0.5], { at: [0, 2.6, z], color: '#2c2826' })
      kit.sphere('glow', 0.16, { at: [0.35, 4.8, z * 0.92], color: '#ff4a1a' })
    })
    kit.box('metal', [0.7, 0.7, 6], { at: [0, 5.2, 0], color: '#24201e' })
    range(9).forEach((slat) => kit.box('metal', [0.3, 0.46, 4.9], { at: [0, 0.3 + slat * 0.52, 0], color: slat % 2 ? '#3a3431' : '#443d39' }))
    range(10).forEach((stripe) => kit.box(stripe % 2 ? 'metal' : 'glow', [0.05, 0.3, 0.5], { at: [0.18, 2.4, -2.25 + stripe * 0.5], rotate: [0.6, 0, 0], color: stripe % 2 ? '#141212' : '#ffb000' }))
  },
  // Bone portcullis of Skull Island
  'skull-island': (kit) => {
    range(9).forEach((column) => kit.cylinder('stone', 0.08, 0.1, 4.4, { at: [0, 2.2, -2.4 + column * 0.6], color: '#d2d4bd' }))
    kit.cylinder('stone', 0.12, 0.12, 5.8, { at: [0, 4.4, 0], rotate: [Math.PI / 2, 0, 0], color: '#c2c4ad' })
    kit.rock('stone', 0.8, { at: [0, 4.9, 0], color: '#cfd2b8' }, 1)
    kit.sphere('glow', 0.12, { at: [0.6, 5, -0.28], color: '#9cff5a' })
    kit.sphere('glow', 0.12, { at: [0.6, 5, 0.28], color: '#9cff5a' })
  },
  // Sealed torii of the Jade Ruins
  'jade-ruins': (kit) => {
    ;[-2.3, 2.3].forEach((z) => kit.cylinder('stone', 0.2, 0.24, 4.6, { at: [0, 2.3, z], color: '#1d5a45' }, 10))
    kit.box('stone', [0.4, 0.3, 6.2], { at: [0, 4.6, 0], color: '#16493a' })
    kit.box('stone', [0.3, 0.2, 5], { at: [0, 3.9, 0], color: '#1d5a45' })
    range(5).forEach((talisman) => kit.box('glow', [0.04, 0.9, 0.34], { at: [0.1, 2.6, -1.6 + talisman * 0.8], color: '#ffe9a8' }))
  },
  // Storm gate: two split rocks bound by chains around a lightning sigil
  'storm-peak': (kit, random) => {
    ;[-2.5, 2.5].forEach((z) => kit.cone('stone', 0.75, 5.6, { at: [0, 2.8, z], rotate: [0, random() * Math.PI, z > 0 ? -0.06 : 0.06], color: '#2d3350' }, 5))
    range(7).forEach((link) => kit.torus('metal', 0.14, 0.04, { at: [0, 4.4 - Math.sin((link / 6) * Math.PI) * 0.5, -1.8 + link * 0.6], rotate: [0, link % 2 ? Math.PI / 2 : 0, 0], color: '#5a5f78' }, Math.PI * 2, 10))
    ;[[0, 3.2, -0.3, 0.5], [0, 2.6, 0.2, -0.5], [0, 2, -0.2, 0.5]].forEach(([x, y, z, tilt]) => kit.box('glow', [0.06, 0.8, 0.12], { at: [x! + 0.2, y!, z!], rotate: [tilt!, 0, 0], color: '#a9c2ff' }))
  },
  // Ice wall of the Bone Plain
  'skull-field': (kit, random) => {
    range(12).forEach(() => kit.cone('ice', 0.35 + random() * 0.35, 2.4 + random() * 2.4, { at: [random() * 0.4 - 0.2, 1.2 + random() * 0.6, -2.7 + random() * 5.4], rotate: [0, 0, random() * 0.3 - 0.15], color: '#bfe9ff' }, 5))
  },
}

/** A gate stands at the right edge of every biome except the last. */
const GATE_BIOMES = BIOMES.slice(0, -1)

function SealVeil({ color }: { color: string }) {
  const material = useMemo(() => new MeshBasicMaterial({ color, transparent: true, opacity: 0.18, depthWrite: false, blending: AdditiveBlending, side: DoubleSide, toneMapped: false }), [color])
  useFrame(({ clock }) => { material.opacity = 0.12 + Math.sin(clock.elapsedTime * 2.4) * 0.06 })
  return <mesh position={[0, 2.2, 0]} rotation={[0, Math.PI / 2, 0]} material={material}><planeGeometry args={[5.6, 4.4]} /></mesh>
}

export function BiomeLockGates() {
  const gates = useRef<Group[]>([])
  const built = useMemo(() => GATE_BIOMES.map((biome, index) => {
    const kit = new Kit()
    GATES[biome.id]?.(kit, seeded(401 + index * 17))
    return [...kit.build().entries()]
  }), [])

  useFrame((_, delta) => {
    const session = useSessionStore.getState()
    const finalArenaOpen = session.phase === 'final-intro' || session.enemies.some((enemy) => enemy.bossType === 'aku' && enemy.animation !== 'dead')
    gates.current.forEach((gate, index) => {
      if (!gate) return
      // Gates behind the heroes stay sealed; the next one opens once the biome is clear.
      const opened = finalArenaOpen || (session.currentBiome === index && session.lockedRight >= getBiomeGateX(index))
      gate.position.y = MathUtils.damp(gate.position.y, opened ? -5.2 : 0, opened ? 2.6 : 7.5, Math.min(delta, 0.1))
      gate.visible = gate.position.y > -5.1
    })
  })

  return (
    <group name="sealed-biome-gates">
      {built.map((parts, index) => (
        <group
          key={BIOMES[index]!.id}
          position={[getBiomeGateX(index), 0, 0]}
          name={`diyar-kapisi-${index + 1}`}
          ref={(group) => { if (group) gates.current[index] = group }}
        >
          {parts.map(([surface, geometry]) => <mesh key={surface} geometry={geometry} material={SURFACES[surface]} />)}
          <SealVeil color={BIOMES[index + 1]!.accentColor} />
        </group>
      ))}
    </group>
  )
}
