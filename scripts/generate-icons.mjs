import sharp from 'sharp'
import { mkdirSync } from 'fs'

mkdirSync('public/icons', { recursive: true })

const svgPath = 'scripts/icon-source.svg'

const targets = [
  { name: 'public/icons/icon-192.png', size: 192 },
  { name: 'public/icons/icon-512.png', size: 512 },
  { name: 'public/icons/apple-touch-icon.png', size: 180 },
]

for (const t of targets) {
  await sharp(svgPath).resize(t.size, t.size).png().toFile(t.name)
  console.log('wrote', t.name)
}

// Maskable icon: same art but with extra safe-area padding (feather scaled down within the square)
await sharp(svgPath)
  .resize(410, 410)
  .extend({ top: 51, bottom: 51, left: 51, right: 51, background: { r: 27, g: 18, b: 15, alpha: 1 } })
  .png()
  .toFile('public/icons/icon-maskable-512.png')
console.log('wrote public/icons/icon-maskable-512.png')
