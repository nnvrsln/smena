import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const projectRoot = process.cwd()
const graphicsRoot = path.join(projectRoot, 'public', 'graphics')
const svgRoot = path.join(graphicsRoot, 'svg')
const pngRoot = path.join(graphicsRoot, 'png')
const manifest = JSON.parse(await readFile(path.join(graphicsRoot, 'graphics-manifest.json'), 'utf8'))

await mkdir(pngRoot, { recursive: true })

const report = {
  pack: manifest.pack,
  generatedAt: new Date().toISOString(),
  rule: 'Every exported PNG must contain real transparent pixels and an alpha channel.',
  passed: true,
  assets: [],
}

for (const asset of manifest.assets) {
  const sourceName = path.basename(asset.file)
  const baseName = path.basename(sourceName, '.svg')
  const svgPath = path.join(svgRoot, sourceName)
  const pngPath = path.join(pngRoot, `${baseName}.png`)
  const svg = await readFile(svgPath)

  await sharp(svg, { density: 144 })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(pngPath)

  const image = sharp(pngPath)
  const metadata = await image.metadata()
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let fullyTransparentPixels = 0
  let translucentPixels = 0

  for (let index = 3; index < data.length; index += info.channels) {
    const alpha = data[index]
    if (alpha === 0) fullyTransparentPixels += 1
    if (alpha < 255) translucentPixels += 1
  }

  const pixelCount = info.width * info.height
  const fullyTransparentRatio = Number((fullyTransparentPixels / pixelCount).toFixed(4))
  const translucentRatio = Number((translucentPixels / pixelCount).toFixed(4))
  const passed = metadata.hasAlpha === true && fullyTransparentPixels > 0 && translucentPixels > 0

  report.passed &&= passed
  report.assets.push({
    source: asset.file,
    export: `png/${baseName}.png`,
    width: metadata.width,
    height: metadata.height,
    hasAlpha: metadata.hasAlpha,
    fullyTransparentPixels,
    fullyTransparentRatio,
    translucentPixels,
    translucentRatio,
    passed,
  })
}

await writeFile(
  path.join(graphicsRoot, 'transparency-report.json'),
  `${JSON.stringify(report, null, 2)}\n`,
  'utf8',
)

if (!report.passed) {
  throw new Error('Transparency validation failed. See public/graphics/transparency-report.json')
}

console.log(`Exported and validated ${report.assets.length} transparent PNG assets.`)

