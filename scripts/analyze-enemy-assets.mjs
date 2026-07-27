import fs from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve('public/assets/models')

async function inspect(label, file) {
  const bytes = await fs.readFile(file)
  const jsonLength = bytes.readUInt32LE(12)
  const jsonType = bytes.toString('ascii', 16, 20)
  if (jsonType !== 'JSON') throw new Error(`${label}: GLB JSON chunk bulunamadı`)
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
    return { name: animation.name, duration: Number(duration.toFixed(3)), channels: animation.channels?.length ?? 0 }
  })
  console.log(JSON.stringify({
    label,
    bounds: { min: minimum.map(round), max: maximum.map(round) },
    size: maximum.map((value, axis) => round(value - minimum[axis])),
    meshes: (document.meshes ?? []).map((mesh) => mesh.name).slice(0, 10),
    nodes: (document.nodes ?? []).map((node) => node.name).filter(Boolean).slice(0, 18),
    animations,
  }))
}

function round(value) {
  return Number.isFinite(value) ? Number(value.toFixed(3)) : 0
}

for (let index = 1; index <= 5; index += 1) {
  await inspect(`monster-${index}-walk`, path.join(root, 'enemies', `monster-${index}`, 'walk.glb'))
  await inspect(`monster-${index}-attack`, path.join(root, 'enemies', `monster-${index}`, 'attack.glb'))
}

await inspect('zemzem', path.join(root, 'items', 'zemzem.glb'))
