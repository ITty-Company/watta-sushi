import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let cachedDir = null

/** Каталог для фото/відео з адмінки. На Render задайте UPLOAD_DIR на persistent disk. */
export function getUploadsDir() {
  if (cachedDir) return cachedDir
  const fromEnv = process.env.UPLOAD_DIR?.trim()
  const dir = fromEnv
    ? path.resolve(fromEnv)
    : path.resolve(__dirname, '../uploads')
  try {
    fs.mkdirSync(dir, { recursive: true })
  } catch {
    /* Cloudflare Workers: постійного диска немає, файли в KV (lib/fileStorage.js) */
  }
  cachedDir = dir
  return dir
}
