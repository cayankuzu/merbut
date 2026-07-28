import { readFile } from 'node:fs/promises'

const rootUrl = new URL('../', import.meta.url)
const [packageSource, lockSource, versionSource] = await Promise.all([
  readFile(new URL('package.json', rootUrl), 'utf8'),
  readFile(new URL('package-lock.json', rootUrl), 'utf8'),
  readFile(new URL('src/config/version.ts', rootUrl), 'utf8'),
])

const packageJson = JSON.parse(packageSource)
const packageLock = JSON.parse(lockSource)
const appVersion = versionSource.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/)?.[1]
const versions = new Map([
  ['package.json', packageJson.version],
  ['package-lock.json', packageLock.version],
  ['package-lock root', packageLock.packages?.['']?.version],
  ['src/config/version.ts', appVersion],
])
const mismatches = [...versions].filter(([, version]) => version !== packageJson.version)

if (mismatches.length > 0) {
  const details = [...versions].map(([source, version]) => `${source}: ${version ?? 'eksik'}`).join('\n')
  throw new Error(`Merbut sürüm alanları eşleşmiyor:\n${details}`)
}

console.log(`Merbut sürüm alanları senkron: v${packageJson.version}`)
