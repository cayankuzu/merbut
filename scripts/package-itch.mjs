// Packs dist/ into an itch.io-ready HTML5 zip (index.html at the zip root).
// Usage: npm run build && node scripts/package-itch.mjs
// No dependencies: a small ZIP writer on top of node:zlib (deflate + crc32).
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const { version } = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'))
const target = path.join(root, 'release', `merbut-itch-v${version}.zip`)

async function walk(directory, prefix = '') {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(directory, entry.name)
    const name = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) files.push(...await walk(full, name))
    else files.push({ full, name })
  }
  return files
}

/** DOS date/time for the local and central headers. */
function dosTime(date) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2)
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  return { time, day }
}

const files = await walk(dist)
if (!files.some((file) => file.name === 'index.html')) throw new Error('dist/index.html missing: run `npm run build` first.')
// itch.io serves the game from a sub-folder: absolute "/assets" URLs would break.
const html = await fs.readFile(path.join(dist, 'index.html'), 'utf8')
if (/(src|href)="\/(?!\/)/.test(html)) throw new Error('index.html still has root-absolute URLs; build with base "./".')

const chunks = []
const central = []
let offset = 0
const now = dosTime(new Date())
for (const file of files) {
  const data = await fs.readFile(file.full)
  // Images, models and audio are already compressed; storing them is faster and as small.
  const store = /\.(webp|png|jpe?g|glb|mp3|ogg|woff2?)$/i.test(file.name)
  const body = store ? data : zlib.deflateRawSync(data, { level: 9 })
  const method = store ? 0 : 8
  const crc = zlib.crc32(data)
  const name = Buffer.from(file.name, 'utf8')
  const local = Buffer.alloc(30)
  local.writeUInt32LE(0x04034b50, 0)
  local.writeUInt16LE(20, 4)
  local.writeUInt16LE(0x0800, 6)
  local.writeUInt16LE(method, 8)
  local.writeUInt16LE(now.time, 10)
  local.writeUInt16LE(now.day, 12)
  local.writeUInt32LE(crc, 14)
  local.writeUInt32LE(body.length, 18)
  local.writeUInt32LE(data.length, 22)
  local.writeUInt16LE(name.length, 26)
  local.writeUInt16LE(0, 28)
  chunks.push(local, name, body)
  const header = Buffer.alloc(46)
  header.writeUInt32LE(0x02014b50, 0)
  header.writeUInt16LE(20, 4)
  header.writeUInt16LE(20, 6)
  header.writeUInt16LE(0x0800, 8)
  header.writeUInt16LE(method, 10)
  header.writeUInt16LE(now.time, 12)
  header.writeUInt16LE(now.day, 14)
  header.writeUInt32LE(crc, 16)
  header.writeUInt32LE(body.length, 20)
  header.writeUInt32LE(data.length, 24)
  header.writeUInt16LE(name.length, 28)
  header.writeUInt32LE(offset, 42)
  central.push(header, name)
  offset += local.length + name.length + body.length
}
const centralSize = central.reduce((sum, part) => sum + part.length, 0)
const end = Buffer.alloc(22)
end.writeUInt32LE(0x06054b50, 0)
end.writeUInt16LE(files.length, 8)
end.writeUInt16LE(files.length, 10)
end.writeUInt32LE(centralSize, 12)
end.writeUInt32LE(offset, 16)
await fs.mkdir(path.dirname(target), { recursive: true })
await fs.writeFile(target, Buffer.concat([...chunks, ...central, end]))
const size = (await fs.stat(target)).size
console.log(`${path.relative(root, target)} · ${files.length} files · ${(size / 1_048_576).toFixed(1)} MB`)
if (files.length > 1_000) console.warn('itch.io allows at most 1000 files in an HTML5 zip.')
