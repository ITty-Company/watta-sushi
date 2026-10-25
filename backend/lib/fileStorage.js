import fs from 'fs'
import path from 'path'
import { getUploadsDir } from './uploadsDir.js'
import { isWorkersRuntime } from './runtime.js'

/**
 * Сховище файлів з адмінки (`/uploads/<name>`).
 * Node: каталог getUploadsDir() (як і раніше).
 * Cloudflare Workers: KV-namespace `UPLOADS` (диска між запитами там немає).
 */

const CONTENT_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
}

export function contentTypeForUpload(name) {
  return CONTENT_TYPES[path.extname(String(name)).toLowerCase()] || 'application/octet-stream'
}

function safeName(name) {
  const base = path.basename(String(name || '').trim())
  if (!base || base.startsWith('.')) throw new Error('Invalid upload name')
  return base
}

async function workersBindings() {
  const mod = await import('cloudflare:workers')
  const kv = mod.env?.UPLOADS
  if (!kv) throw new Error('KV binding UPLOADS is not configured')
  return { kv, waitUntil: mod.waitUntil }
}

/**
 * Зберегти файл. Синхронний інтерфейс, бо так написані виклики в роутах:
 * у Workers запис у KV стартує одразу й утримується через waitUntil до кінця запиту.
 */
export function saveUploadSync(name, buf) {
  const base = safeName(name)
  if (!isWorkersRuntime) {
    fs.writeFileSync(path.join(getUploadsDir(), base), buf)
    return
  }
  workersBindings()
    .then(({ kv, waitUntil }) => {
      const write = kv.put(base, buf, { metadata: { contentType: contentTypeForUpload(base) } })
      waitUntil(write)
      return write
    })
    .catch((e) => console.error('KV upload write failed:', base, e))
}

/** Прочитати файл для віддачі через /uploads/:name. */
export async function readUpload(name) {
  const base = safeName(name)
  if (!isWorkersRuntime) {
    const fp = path.join(getUploadsDir(), base)
    if (!fs.existsSync(fp)) return null
    return { body: fs.readFileSync(fp), contentType: contentTypeForUpload(base) }
  }
  const { kv } = await workersBindings()
  const body = await kv.get(base, 'arrayBuffer')
  if (!body) return null
  return { body: Buffer.from(body), contentType: contentTypeForUpload(base) }
}

export async function deleteUpload(name) {
  const base = safeName(name)
  if (!isWorkersRuntime) {
    try {
      fs.unlinkSync(path.join(getUploadsDir(), base))
    } catch {
      /* ignore */
    }
    return
  }
  const { kv } = await workersBindings()
  await kv.delete(base)
}

/**
 * multer storage engine: Node — звичайний diskStorage; Workers — буфер у пам'яті → KV.
 * Опції ті самі, що в multer.diskStorage({ destination, filename }), тож req.file.filename
 * у роутах не змінюється.
 */
export function uploadStorage(multer, { destination, filename }) {
  if (!isWorkersRuntime) return multer.diskStorage({ destination, filename })
  return {
    _handleFile(req, file, cb) {
      filename(req, file, (err, name) => {
        if (err) return cb(err)
        const chunks = []
        file.stream.on('data', (c) => chunks.push(c))
        file.stream.on('error', cb)
        file.stream.on('end', () => {
          try {
            const buf = Buffer.concat(chunks)
            saveUploadSync(name, buf)
            cb(null, { filename: name, path: `/uploads/${name}`, size: buf.length, destination: '' })
          } catch (e) {
            cb(e)
          }
        })
      })
    },
    _removeFile(_req, file, cb) {
      deleteUpload(file.filename).then(() => cb(null), cb)
    },
  }
}
