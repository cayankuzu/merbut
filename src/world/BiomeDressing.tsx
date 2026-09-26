import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import { BIOMES, BIOME_WORLD_WIDTH, WORLD_VISUAL_LEFT } from '../config/biomes'
import { useGameStore } from '../store/gameStore'
import { runtimeCrowdDetail } from '../store/performanceStore'
import { useSessionStore } from '../store/sessionStore'
import { dressBiome } from './dressing'
import { SURFACES } from './materials'

const VISIBLE_MARGIN = 26

/** Renders every biome's merged set dressing; far biomes are simply hidden. */
export function BiomeDressing() {
  const biomes = useMemo(() => BIOMES.map((_, index) => [...dressBiome(index).entries()]), [])
  const groups = useRef<(Group | null)[]>([])
  const foreground = useSessionStore((state) => runtimeCrowdDetail(state.enemies.length).foreground)

  useEffect(() => () => biomes.forEach((parts) => parts.forEach(([, geometry]) => geometry.dispose())), [biomes])

  useFrame(() => {
    const cameraX = useGameStore.getState().cameraX
    groups.current.forEach((group, index) => {
      if (!group) return
      const left = WORLD_VISUAL_LEFT + index * BIOME_WORLD_WIDTH
      group.visible = cameraX > left - VISIBLE_MARGIN && cameraX < left + BIOME_WORLD_WIDTH + VISIBLE_MARGIN
    })
  })

  return (
    <group name="biome-set-dressing">
      {biomes.map((parts, index) => (
        <group key={BIOMES[index]!.id} ref={(group) => { groups.current[index] = group }} name={`dressing-${BIOMES[index]!.id}`}>
          {parts.map(([surface, geometry]) => (
            <mesh key={surface} geometry={geometry} material={SURFACES[surface]} frustumCulled={false} renderOrder={surface === 'silhouette' ? 5 : -2} visible={surface !== 'silhouette' || foreground} />
          ))}
        </group>
      ))}
    </group>
  )
}
