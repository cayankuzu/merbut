import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

const run = promisify(execFile)
const projectRoot = path.resolve('.')
const modelRoot = path.join(projectRoot, 'public', 'assets', 'models')
const cli = path.join(projectRoot, 'node_modules', '@gltf-transform', 'cli', 'bin', 'cli.js')

const animationFiles = [
  'ali/ali-walk.glb',
  'ali/ali-jump.glb',
  'ali/ali-attack.glb',
  'jack/jack-walk.glb',
  'jack/jack-jump.glb',
  'jack/jack-attack.glb',
  ...Array.from({ length: 5 }, (_, index) => `enemies/monster-${index + 1}/attack.glb`),
  'bosses/evil-jack/run.glb',
  'bosses/evil-jack/left-slash.glb',
  'bosses/evil-jack/double-combo.glb',
  'bosses/evil-jack/triple-combo.glb',
  'bosses/evil-jack/cast.glb',
  'bosses/evil-jack/hit.glb',
  'bosses/evil-jack/high-kick.glb',
  'bosses/evil-jack/turn-kick.glb',
]

const baseModels = [
  'ali/ali-idle.glb',
  'ali/ali-sword.glb',
  'jack/jack-idle.glb',
  'jack/jack-sword.glb',
  ...Array.from({ length: 5 }, (_, index) => `enemies/monster-${index + 1}/walk.glb`),
  'bosses/evil-jack/walk.glb',
  'bosses/aku/normal/walk.glb',
  'bosses/aku/monster/idle.glb',
  'items/zemzem.glb',
]

const align4 = (value) => (value + 3) & ~3

function readGlb(bytes) {
  const jsonLength = bytes.readUInt32LE(12)
  const json = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength).trimEnd())
  const binaryHeader = 20 + align4(jsonLength)
  const binaryLength = bytes.readUInt32LE(binaryHeader)
  const binary = bytes.subarray(binaryHeader + 8, binaryHeader + 8 + binaryLength)
  return { binary, json }
}

function makeGlb(json, binary) {
  const jsonBytes = Buffer.from(JSON.stringify(json), 'utf8')
  const jsonLength = align4(jsonBytes.length)
  const binaryLength = align4(binary.length)
  const totalLength = 12 + 8 + jsonLength + 8 + binaryLength
  const output = Buffer.alloc(totalLength, 0)
  output.writeUInt32LE(0x46546c67, 0)
  output.writeUInt32LE(2, 4)
  output.writeUInt32LE(totalLength, 8)
  output.writeUInt32LE(jsonLength, 12)
  output.write('JSON', 16, 'ascii')
  jsonBytes.copy(output, 20)
  output.fill(0x20, 20 + jsonBytes.length, 20 + jsonLength)
  const binaryHeader = 20 + jsonLength
  output.writeUInt32LE(binaryLength, binaryHeader)
  output.write('BIN\0', binaryHeader + 4, 'ascii')
  binary.copy(output, binaryHeader + 8)
  return output
}

function toAnimationOnly(source) {
  const { binary, json } = readGlb(source)
  const accessorIds = new Set()
  for (const animation of json.animations ?? []) {
    for (const sampler of animation.samplers ?? []) {
      accessorIds.add(sampler.input)
      accessorIds.add(sampler.output)
    }
  }
  if (accessorIds.size === 0) throw new Error('Animasyon verisi bulunamadı')

  const accessorMap = new Map()
  const accessors = [...accessorIds].sort((a, b) => a - b).map((oldId, newId) => {
    accessorMap.set(oldId, newId)
    return { ...json.accessors[oldId] }
  })
  const viewIds = [...new Set(accessors.flatMap((accessor) => {
    const ids = [accessor.bufferView]
    if (accessor.sparse) {
      ids.push(accessor.sparse.indices.bufferView, accessor.sparse.values.bufferView)
    }
    return ids.filter((id) => id !== undefined)
  }))].sort((a, b) => a - b)
  const viewMap = new Map()
  const chunks = []
  let byteOffset = 0
  const bufferViews = viewIds.map((oldId, newId) => {
    viewMap.set(oldId, newId)
    const view = json.bufferViews[oldId]
    const chunk = binary.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength)
    chunks.push({ byteOffset, chunk })
    const next = { ...view, buffer: 0, byteOffset }
    byteOffset = align4(byteOffset + chunk.length)
    return next
  })
  for (const accessor of accessors) {
    if (accessor.bufferView !== undefined) accessor.bufferView = viewMap.get(accessor.bufferView)
    if (accessor.sparse) {
      accessor.sparse = {
        ...accessor.sparse,
        indices: { ...accessor.sparse.indices, bufferView: viewMap.get(accessor.sparse.indices.bufferView) },
        values: { ...accessor.sparse.values, bufferView: viewMap.get(accessor.sparse.values.bufferView) },
      }
    }
  }
  const packed = Buffer.alloc(byteOffset, 0)
  for (const chunk of chunks) chunk.chunk.copy(packed, chunk.byteOffset)

  const animations = (json.animations ?? []).map((animation) => ({
    ...animation,
    samplers: animation.samplers.map((sampler) => ({
      ...sampler,
      input: accessorMap.get(sampler.input),
      output: accessorMap.get(sampler.output),
    })),
  }))
  const nodes = (json.nodes ?? []).map((node) => {
    const { mesh: _mesh, skin: _skin, ...animationNode } = node
    return animationNode
  })
  const slimJson = {
    asset: json.asset,
    scene: json.scene ?? 0,
    scenes: json.scenes,
    nodes,
    animations,
    accessors,
    bufferViews,
    buffers: [{ byteLength: packed.length }],
  }
  return makeGlb(slimJson, packed)
}

function megabytes(bytes) {
  return `${(bytes / 1_048_576).toFixed(2)} MB`
}

for (const relativePath of animationFiles) {
  const file = path.join(modelRoot, relativePath)
  const source = await fs.readFile(file)
  const optimized = toAnimationOnly(source)
  await fs.writeFile(file, optimized)
  console.log(`Animasyon: ${relativePath} · ${megabytes(source.length)} → ${megabytes(optimized.length)}`)
}

for (const relativePath of baseModels) {
  const file = path.join(modelRoot, relativePath)
  const temporary = `${file}.web.glb`
  const before = (await fs.stat(file)).size
  const textureSize = relativePath === 'items/zemzem.glb' ? '1024' : '2048'
  await run(process.execPath, [
    cli,
    'optimize',
    file,
    temporary,
    '--compress', 'meshopt',
    '--texture-compress', 'webp',
    '--texture-size', textureSize,
    '--simplify', 'false',
    '--flatten', 'false',
    '--join', 'false',
    '--instance', 'false',
    '--palette', 'false',
  ], { maxBuffer: 10 * 1_048_576 })
  const after = (await fs.stat(temporary)).size
  await fs.copyFile(temporary, file)
  await fs.unlink(temporary)
  console.log(`Model: ${relativePath} · ${megabytes(before)} → ${megabytes(after)}`)
}

console.log('Web GLB optimizasyonu tamamlandı.')
