import type { StageVfx } from './stageVfx'

/** Draws one fighter's particle pools and cut lines inside its own frame. */
export function StageVfxLayer({ vfx }: { vfx: StageVfx }) {
  return (
    <group name="menu-vfx">
      <primitive object={vfx.pools.matter.mesh} />
      <primitive object={vfx.pools.light.mesh} />
      {vfx.slashes.meshes.map((mesh, index) => <primitive key={index} object={mesh} />)}
    </group>
  )
}
