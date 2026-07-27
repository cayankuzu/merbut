import fs from 'node:fs/promises'
import path from 'node:path'

const projectRoot = path.resolve('.')
const outputRoot = path.join(projectRoot, 'public', 'assets', 'models', 'bosses', 'aku')

const sources = {
  normal: {
    root: 'C:/Users/Cayan/Desktop/1.aku',
    base: ['Walking', 'walk'],
    clips: [
      ['Running', 'run'],
      ['Attack', 'attack'],
      ['Heavy_Hammer_Swing', 'heavy'],
      ['Simple_Kick', 'kick'],
      ['Triple_Combo_Attack', 'triple'],
      ['Archery_Shot_1', 'ranged'],
      ['falling_down', 'dead'],
    ],
  },
  monster: {
    root: 'C:/Users/Cayan/Desktop/2.aku',
    base: ['Idle_03', 'idle'],
    clips: [
      ['Walking', 'walk'],
      ['Running', 'run'],
      ['Left_Slash', 'slash'],
      ['Double_Combo_Attack', 'double'],
      ['Triple_Combo_Attack', 'triple'],
      ['Axe_Spin_Attack', 'spin'],
      ['Double_Blade_Spin', 'blade-spin'],
      ['Draw_and_Shoot_from_Back', 'ranged'],
      ['Heavy_Hammer_Swing', 'heavy'],
      ['falling_down', 'dead'],
    ],
  },
}

function pad4(value) {
  return (value + 3) & ~3
}

function findSource(root, token) {
  return fs.readdir(root).then((files) => {
    const match = files.find((file) => file.includes(`Animation_${token}_withSkin.glb`))
    if (!match) throw new Error(`${root}: ${token} animasyonu bulunamadı`)
    return path.join(root, match)
  })
}

function readGlb(bytes) {
  const jsonLength = bytes.readUInt32LE(12)
  const json = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength).trimEnd())
  const binaryHeader = 20 + pad4(jsonLength)
  const binaryLength = bytes.readUInt32LE(binaryHeader)
  const binary = bytes.subarray(binaryHeader + 8, binaryHeader + 8 + binaryLength)
  return { json, binary }
}

function makeGlb(json, binary) {
  const jsonBytes = Buffer.from(JSON.stringify(json), 'utf8')
  const paddedJsonLength = pad4(jsonBytes.length)
  const paddedBinaryLength = pad4(binary.length)
  const totalLength = 12 + 8 + paddedJsonLength + 8 + paddedBinaryLength
  const output = Buffer.alloc(totalLength, 0)
  output.writeUInt32LE(0x46546c67, 0)
  output.writeUInt32LE(2, 4)
  output.writeUInt32LE(totalLength, 8)
  output.writeUInt32LE(paddedJsonLength, 12)
  output.write('JSON', 16, 'ascii')
  jsonBytes.copy(output, 20)
  output.fill(0x20, 20 + jsonBytes.length, 20 + paddedJsonLength)
  const binaryHeader = 20 + paddedJsonLength
  output.writeUInt32LE(paddedBinaryLength, binaryHeader)
  output.write('BIN\0', binaryHeader + 4, 'ascii')
  binary.copy(output, binaryHeader + 8)
  return output
}

function animationOnly(sourceBytes) {
  const { json, binary } = readGlb(sourceBytes)
  const accessorIds = new Set()
  for (const animation of json.animations ?? []) {
    for (const sampler of animation.samplers ?? []) {
      accessorIds.add(sampler.input)
      accessorIds.add(sampler.output)
    }
  }

  const accessorMap = new Map()
  const accessors = [...accessorIds].sort((a, b) => a - b).map((oldId, newId) => {
    accessorMap.set(oldId, newId)
    return { ...json.accessors[oldId] }
  })
  const viewIds = [...new Set(accessors.map((accessor) => accessor.bufferView))].sort((a, b) => a - b)
  const viewMap = new Map()
  const chunks = []
  let byteOffset = 0
  const bufferViews = viewIds.map((oldId, newId) => {
    viewMap.set(oldId, newId)
    const view = json.bufferViews[oldId]
    const chunk = binary.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength)
    chunks.push({ byteOffset, chunk })
    const next = { ...view, buffer: 0, byteOffset }
    byteOffset = pad4(byteOffset + chunk.length)
    return next
  })
  for (const accessor of accessors) accessor.bufferView = viewMap.get(accessor.bufferView)
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

for (const [form, definition] of Object.entries(sources)) {
  const destination = path.join(outputRoot, form)
  await fs.mkdir(destination, { recursive: true })
  const [baseToken, baseName] = definition.base
  const baseSource = await findSource(definition.root, baseToken)
  await fs.copyFile(baseSource, path.join(destination, `${baseName}.glb`))
  for (const [token, name] of definition.clips) {
    const source = await findSource(definition.root, token)
    const slim = animationOnly(await fs.readFile(source))
    await fs.writeFile(path.join(destination, `${name}.glb`), slim)
  }
}

console.log(`Aku varlıkları hazırlandı: ${outputRoot}`)
