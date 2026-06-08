#!/usr/bin/env node
/**
 * Одноразове стиснення hero-*.mp4 у uploads/ (для вже завантажених великих файлів).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { compressHeroVideoOnDisk } from '../lib/compressHeroVideo.js'
import { getUploadsDir } from '../lib/uploadsDir.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = getUploadsDir()

async function main() {
  if (!fs.existsSync(uploadsDir)) {
    console.log('No uploads dir')
    return
  }
  const files = fs
    .readdirSync(uploadsDir)
    .filter((f) => /^hero-.*\.(mp4|mov)$/i.test(f))
    .map((f) => path.join(uploadsDir, f))

  for (const fp of files) {
    const before = fs.statSync(fp).size
    if (before <= 5 * 1024 * 1024) {
      console.log(`skip (small): ${path.basename(fp)}`)
      continue
    }
    console.log(`compressing ${path.basename(fp)} (${Math.round(before / 1024 / 1024)}MB)…`)
    const r = await compressHeroVideoOnDisk(fp)
    if (r.afterBytes) {
      console.log(`  → ${Math.round(r.afterBytes / 1024 / 1024)}MB`)
    } else if (r.skipped) {
      console.log('  → skipped')
    } else {
      console.log('  → failed')
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
