import fs from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve('public/assets/models/bosses/evil-jack')
const files = [
  'walk.glb',
  'run.glb',
  'left-slash.glb',
  'double-combo.glb',
  'triple-combo.glb',
  'cast.glb',
  'hit.glb',
  'high-kick.glb',
  'turn-kick.glb',
]

function round(value) {
  return Number.isFinite(value) ? Number(value.toFixed(3)) : 0
}

async function inspect(file) {
  const bytes = await fs.readFile(path.join(root, file))
  const jsonLength = bytes.readUInt32LE(12)
  const document = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength).trimEnd())
  const positions = (document.meshes ?? []).flatMap((mesh) =>
    mesh.primitives?.map((primitive) => document.accessors?.[primitive.attributes?.POSITION]).filter(Boolean) ?? [],
  )
  const minimum = [Infinity, Infinity, Infinity]
  const maximum = [-Infinity, -Infinity, -Infinity]
  for (const accessor of positions) {
    for (let axis = 0; axis < 3; axis += 1) {
      if (accessor.min) minimum[axis] = Math.min(minimum[axis], accessor.min[axis])
      if (accessor.max) maximum[axis] = Math.max(maximum[axis], accessor.max[axis])
    }
  }
  const animations = (document.animations ?? []).map((animation) => {
    const duration = Math.max(0, ...(animation.samplers ?? []).map((sampler) => {
      const accessor = document.accessors?.[sampler.input]
      return accessor?.max?.[0] ?? 0
    }))
    return { name: animation.name, duration: round(duration), channels: animation.channels?.length ?? 0 }
  })
  return {
    file,
    bounds: { min: minimum.map(round), max: maximum.map(round) },
    size: maximum.map((value, axis) => round(value - minimum[axis])),
    meshes: (document.meshes ?? []).map((mesh) => mesh.name).filter(Boolean).slice(0, 12),
    nodes: (document.nodes ?? []).map((node) => node.name).filter(Boolean).slice(0, 28),
    animations,
  }
}

for (const file of files) console.log(JSON.stringify(await inspect(file)))
