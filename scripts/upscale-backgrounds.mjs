import path from 'node:path'
import sharp from 'sharp'

// Source paintings live outside public/; optimize-backgrounds.mjs publishes WebP.
const directory = path.resolve('assets-src/backgrounds')
const jobs = [
  ['scene-01-hd.png', 'scene-01-master.jpg'],
  ['scene-02-harbor.jpg', 'scene-02-harbor-hd.jpg'],
  ['scene-03-swamp.jpg', 'scene-03-swamp-hd.jpg'],
  ['scene-04-skull-island.jpg', 'scene-04-skull-island-hd.jpg'],
  ['scene-05-ruins.jpg', 'scene-05-ruins-hd.jpg'],
  ['scene-06-skull-field.jpg', 'scene-06-skull-field-hd.jpg'],
  ['scene-07-final-boss.jpg', 'scene-07-final-boss-hd.jpg'],
]

for (const [source, target] of jobs) {
  const input = path.join(directory, source)
  const output = path.join(directory, target)
  await sharp(input)
    .resize({ width: 1920, withoutEnlargement: false, kernel: sharp.kernel.lanczos3 })
    .sharpen({ sigma: 0.55, m1: 0.45, m2: 0.8, x1: 2, y2: 10, y3: 20 })
    .jpeg({ quality: 94, chromaSubsampling: '4:4:4', mozjpeg: true })
    .toFile(output)
  const metadata = await sharp(output).metadata()
  console.log(`${target}: ${metadata.width}x${metadata.height}`)
}
