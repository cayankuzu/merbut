import { useEffect, useMemo, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Vector3 } from 'three'
import { createVfxPools, emitInto, type VfxPools } from '../game/vfx/particles'
import { SlashMarks } from '../game/vfx/slashMarks'

/**
 * The menu stage speaks the same effect language as the game: the same GPU
 * particle presets, anime cut lines and sword trails. Each fighter owns a small
 * set of pools living in its own frame, so presets written for the game world
 * (floor at y = 0, facing +x) work unchanged on the showcase stage.
 */
export interface StageVfx {
  pools: VfxPools
  slashes: SlashMarks
  /** Runs effect presets into this fighter's pools. */
  emit: (run: () => void) => void
  /** Converts a world position into the fighter's frame, in place. */
  toLocal: (point: Vector3) => Vector3
}

export function useStageVfx(root: RefObject<Group | null>): StageVfx {
  const vfx = useMemo<StageVfx>(() => {
    const pools = createVfxPools(420, 220)
    return {
      pools,
      slashes: new SlashMarks(6),
      emit: (run) => emitInto(pools, run),
      toLocal: (point) => (root.current ? root.current.worldToLocal(point) : point),
    }
  }, [root])

  useEffect(() => () => {
    vfx.pools.light.dispose()
    vfx.pools.matter.dispose()
    vfx.slashes.dispose()
  }, [vfx])

  useFrame((_, delta) => {
    const step = Math.min(delta, 0.1)
    vfx.pools.light.advance(step)
    vfx.pools.matter.advance(step)
    vfx.slashes.update()
  })

  return vfx
}
