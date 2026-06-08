/**
 * Видаляє білий фон у PNG для /favorites-empty (прозорий alpha).
 * Запуск: node scripts/remove-favorites-empty-white-bg.mjs
 */
import sharp from 'sharp'
import { readdir } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dir = path.join(__dirname, '../public/favorites-empty')

/** Поріг білого (0–255). М’який край — partial alpha. */
const HARD_WHITE = 248
const SOFT_FROM = 228

function alphaForPixel(r, g, b) {
  const min = Math.min(r, g, b)
  const max = Math.max(r, g, b)
  if (max < SOFT_FROM) return 255
  if (min >= HARD_WHITE) return 0
  const lum = (r + g + b) / 3
  if (lum >= HARD_WHITE) return 0
  if (lum <= SOFT_FROM) return 255
  const t = (lum - SOFT_FROM) / (HARD_WHITE - SOFT_FROM)
  return Math.round(255 * (1 - t))
}

async function processFile(file) {
  if (!file.endsWith('.png')) return
  const input = path.join(dir, file)
  const base = file.replace(/\.png$/i, '')
  const outPng = path.join(dir, `${base}.png`)
  const outWebp = path.join(dir, `${base}.webp`)

  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  if (channels !== 4) throw new Error(`${file}: expected RGBA`)

  for (let i = 0; i < data.length; i += 4) {
    data[i + 3] = alphaForPixel(data[i], data[i + 1], data[i + 2])
  }

  const pipeline = sharp(data, { raw: { width, height, channels: 4 } })

  await pipeline.clone().png({ compressionLevel: 9 }).toFile(outPng)
  await pipeline.clone().webp({ quality: 88, alphaQuality: 100 }).toFile(outWebp)
  console.log(`OK ${base} → png + webp (transparent)`)
}

const files = await readdir(dir)
for (const f of files) {
  if (f.endsWith('.png') && !f.includes('.bak')) await processFile(f)
}
