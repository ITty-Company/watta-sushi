/**
 * Прибирає білий/чорний фон з hero-фото ролів → webp з alpha.
 */
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const DIR = path.join(__dirname, '../public/watta-hero-rolls')

function alphaForPixel(r, g, b) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const spread = max - min

  // Чистий білий / світло-сірий студійний фон
  if (r > 248 && g > 248 && b > 248) return 0
  if (r > 235 && g > 235 && b > 235 && spread < 18) {
    const lum = (r + g + b) / 3
    return Math.max(0, Math.min(255, Math.round((255 - lum) * 4.2)))
  }

  // Чорний студійний фон
  if (r < 12 && g < 12 && b < 12) return 0
  if (r < 28 && g < 28 && b < 28 && spread < 12) {
    const lum = (r + g + b) / 3
    return Math.max(0, Math.min(255, Math.round(lum * 9)))
  }

  return 255
}

async function processFile(file) {
  if (!file.endsWith('.png') || !file.startsWith('roll-')) return
  const input = path.join(DIR, file)
  const output = path.join(DIR, file.replace(/\.png$/, '.webp'))

  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })

  for (let i = 0; i < data.length; i += 4) {
    const a = alphaForPixel(data[i], data[i + 1], data[i + 2])
    data[i + 3] = Math.min(data[i + 3], a)
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .webp({ quality: 90, alphaQuality: 100, effort: 4 })
    .toFile(output)

  console.log('ok', path.basename(output))
}

async function main() {
  const files = fs.readdirSync(DIR)
  for (const file of files) {
    await processFile(file)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
