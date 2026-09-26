// Converts the painted backdrops to WebP and renders the social preview image.
// Usage: node scripts/optimize-backgrounds.mjs
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve('.')
const sources = path.join(root, 'assets-src', 'backgrounds')
const backgrounds = path.join(root, 'public', 'assets', 'backgrounds')
const SOURCES = [
  'scene-01-master.jpg',
  'scene-02-harbor-hd.jpg',
  'scene-03-swamp-hd.jpg',
  'scene-04-skull-island-hd.jpg',
  'scene-05-ruins-hd.jpg',
  'scene-06-skull-field-hd.jpg',
  'scene-07-final-boss-hd.jpg',
]

for (const file of SOURCES) {
  const input = path.join(sources, file)
  const output = path.join(backgrounds, file.replace(/\.jpe?g$/, '.webp'))
  await sharp(input).webp({ quality: 84, effort: 6 }).toFile(output)
  const [before, after] = await Promise.all([fs.stat(input), fs.stat(output)])
  console.log(`${file}: ${(before.size / 1024).toFixed(0)} KB → ${(after.size / 1024).toFixed(0)} KB`)
}

const title = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#070204" stop-opacity="0.92"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <text x="600" y="430" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="128" font-weight="700" letter-spacing="10" fill="#fff4e2">MERBUT</text>
  <text x="600" y="492" text-anchor="middle" font-family="Georgia, serif" font-size="34" font-style="italic" fill="#f7c65f">Yedi Diyar · Tek Kader</text>
  <text x="600" y="560" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="22" letter-spacing="6" fill="#dcc9b1">HZ. ALİ · SAMURAY JACK · AKU</text>
</svg>`)
await sharp(path.join(sources, 'scene-07-final-boss-hd.jpg'))
  .resize(1200, 630, { fit: 'cover' })
  .composite([{ input: title }])
  .jpeg({ quality: 86 })
  .toFile(path.join(root, 'public', 'og-image.jpg'))
console.log('public/og-image.jpg yazıldı')
