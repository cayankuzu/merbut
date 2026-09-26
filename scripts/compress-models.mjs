// Shrinks every GLB for the web without touching rigs or animations:
//  1. static props (swords, Zemzem) are simplified to a sensible triangle count,
//  2. every file gets meshopt compression (decoded by drei's useGLTF).
// Usage: node scripts/compress-models.mjs [--dry]
import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

const run = promisify(execFile)
const root = path.resolve('.')
const modelRoot = path.join(root, 'public', 'assets', 'models')
const cli = path.join(root, 'node_modules', '@gltf-transform', 'cli', 'bin', 'cli.js')
const dry = process.argv.includes('--dry')
// Simplification must run once per source file; this ledger remembers it.
const ledgerPath = path.join(root, 'scripts', 'model-optimizations.json')
const ledger = JSON.parse(await fs.readFile(ledgerPath, 'utf8').catch(() => '{}'))

/** Static meshes seen small on screen; ratio of triangles to keep. */
const SIMPLIFY = {
  'items/zemzem.glb': 0.05,
  'ali/ali-sword.glb': 0.2,
  'jack/jack-sword.glb': 0.25,
}

async function* walk(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else if (entry.name.endsWith('.glb')) yield full
  }
}

const gltf = (...args) => run(process.execPath, [cli, ...args], { maxBuffer: 64 * 1024 * 1024 })
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'merbut-models-'))
let before = 0
let after = 0

for await (const file of walk(modelRoot)) {
  const relative = path.relative(modelRoot, file).replaceAll('\\', '/')
  const source = await fs.readFile(file)
  const pendingSimplify = SIMPLIFY[relative] && !ledger[relative]
  if (source.includes(Buffer.from('EXT_meshopt_compression')) && !pendingSimplify) {
    console.log(`= ${relative} (zaten sıkıştırılmış)`)
    continue
  }
  let current = file
  const ratio = pendingSimplify ? SIMPLIFY[relative] : undefined
  if (ratio) {
    const simplified = path.join(temp, `${relative.replaceAll('/', '_')}.simplified.glb`)
    await gltf('simplify', current, simplified, '--ratio', String(ratio), '--error', '0.0015')
    current = simplified
  }
  const compressed = path.join(temp, `${relative.replaceAll('/', '_')}.meshopt.glb`)
  await gltf('meshopt', current, compressed, '--level', 'medium')
  const size = (await fs.stat(compressed)).size
  before += source.length
  after += size
  console.log(`${relative}: ${(source.length / 1024).toFixed(0)} KB → ${(size / 1024).toFixed(0)} KB`)
  if (!dry) {
    await fs.copyFile(compressed, file)
    if (ratio) ledger[relative] = { simplifiedTo: ratio }
  }
}

if (!dry) await fs.writeFile(ledgerPath, `${JSON.stringify(ledger, null, 2)}
`)

await fs.rm(temp, { recursive: true, force: true })
console.log(`Toplam: ${(before / 1048576).toFixed(2)} MB → ${(after / 1048576).toFixed(2)} MB${dry ? ' (deneme, dosyalar değişmedi)' : ''}`)
