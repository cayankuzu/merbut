// Paints every original MERBUT illustration in headless Chrome and writes web
// assets: realm parallax layers, album covers, prologue panels, portraits and
// store art. Usage: node scripts/art/generate-art.mjs [only-prefix]
import fs from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { chromium } from 'playwright'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..')
const only = process.argv[2] ?? ''
const out = (...parts) => path.join(root, ...parts)

/** Layers keep only the top of the painting; the 3D floor covers the rest. */
const LAYER_CROP = 780
const BACK_WIDTH = 3600
const FRONT_WIDTH = 3200

const server = http.createServer(async (request, response) => {
  const file = path.join(here, decodeURIComponent(new URL(request.url, 'http://x').pathname))
  try {
    const body = await fs.readFile(file)
    response.writeHead(200, { 'content-type': file.endsWith('.js') ? 'text/javascript' : 'text/html' })
    response.end(body)
  } catch {
    response.writeHead(404)
    response.end()
  }
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const { port } = server.address()

const launchOptions = { headless: true, args: ['--disable-gpu-sandbox'] }
const browser = await chromium.launch({ ...launchOptions, channel: 'chrome' }).catch(() => chromium.launch(launchOptions))
const page = await browser.newPage()
page.on('pageerror', (error) => console.error('studio error:', error.message))
await page.goto(`http://127.0.0.1:${port}/studio.html`)
await page.waitForFunction(() => window.studioReady === true)

const decode = (dataUrl) => Buffer.from(dataUrl.split(',')[1], 'base64')
const wanted = (name) => !only || name.startsWith(only)
await Promise.all(['public/assets/realms', 'public/assets/covers', 'public/assets/story', 'public/assets/ui', 'assets-src/store'].map((dir) => fs.mkdir(out(dir), { recursive: true })))

const { realms, story, portraits } = await page.evaluate(() => window.studio.list())
for (const id of realms) {
  if (!wanted(id)) continue
  const layers = await page.evaluate((realm) => window.studio.realm(realm), id)
  // Realms crossfade through alpha baked into their edges, so the page needs no
  // CSS masks (masks cost an offscreen surface per realm every frame).
  const fades = { left: id !== realms[0], right: id !== realms[realms.length - 1] }
  const back = await fadeEdges(sharp(decode(layers.back)).extract({ left: 0, top: 0, width: await width(layers.back), height: LAYER_CROP }).resize({ width: BACK_WIDTH }), 0.16, fades)
  await back.webp({ quality: 82, alphaQuality: 80, effort: 6 }).toFile(out('public/assets/realms', `${id}-back.webp`))
  const front = await fadeEdges(sharp(decode(layers.front)).extract({ left: 0, top: 0, width: await width(layers.front), height: LAYER_CROP }).resize({ width: FRONT_WIDTH }), 0.1, fades)
  await front.webp({ quality: 84, alphaQuality: 90, effort: 6 }).toFile(out('public/assets/realms', `${id}-front.webp`))
  const coverData = await page.evaluate((realm) => window.studio.cover(realm), id)
  await sharp(decode(coverData)).resize(640, 640).webp({ quality: 84, effort: 6 }).toFile(out('public/assets/covers', `${id}.webp`))
  console.log('realm', id)
}
for (const name of story) {
  if (!wanted(name)) continue
  const data = await page.evaluate((panel) => window.studio.story(panel), name)
  await sharp(decode(data)).webp({ quality: 84, effort: 6 }).toFile(out('public/assets/story', `${name}.webp`))
  console.log('story', name)
}
for (const name of portraits) {
  if (!wanted(`portrait-${name}`) && only) continue
  const data = await page.evaluate((speaker) => window.studio.portrait(speaker), name)
  await sharp(decode(data)).resize(192, 192).webp({ quality: 86 }).toFile(out('public/assets/ui', `portrait-${name}.webp`))
  console.log('portrait', name)
}
if (!only || only === 'store') {
  const cover = await page.evaluate(() => window.studio.keyArt(630, 500))
  await sharp(decode(cover)).png().toFile(out('assets-src/store', 'itch-cover-630x500.png'))
  const banner = await page.evaluate(() => window.studio.keyArt(1920, 1080))
  await sharp(decode(banner)).jpeg({ quality: 88 }).toFile(out('assets-src/store', 'key-art-1920x1080.jpg'))
  const social = await page.evaluate(() => window.studio.keyArt(1200, 630))
  await sharp(decode(social)).jpeg({ quality: 86 }).toFile(out('public', 'og-image.jpg'))
  console.log('store art')
}

/** Multiplies alpha by a smooth ramp over `fraction` of the width at the chosen edges. */
async function fadeEdges(image, fraction, { left, right }) {
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const ramp = Math.max(1, Math.round(info.width * fraction))
  for (let x = 0; x < info.width; x += 1) {
    let factor = 1
    if (left && x < ramp) factor = x / ramp
    if (right && x >= info.width - ramp) factor = Math.min(factor, (info.width - 1 - x) / ramp)
    if (factor >= 1) continue
    const eased = factor * factor * (3 - 2 * factor)
    for (let y = 0; y < info.height; y += 1) {
      const index = (y * info.width + x) * 4 + 3
      data[index] = Math.round(data[index] * eased)
    }
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
}

async function width(dataUrl) {
  return (await sharp(decode(dataUrl)).metadata()).width
}

await browser.close()
server.close()
