/**
 * Стиснення hero mp4 після завантаження в адмінці (1080p30, faststart).
 * Якщо ffmpeg недоступний або файл уже малий — лишаємо як є.
 */
import { spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const SKIP_BELOW_BYTES = 5 * 1024 * 1024
const MAX_INPUT_BYTES = 120 * 1024 * 1024

function hasFfmpeg() {
  try {
    const r = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' })
    return r.status === 0
  } catch {
    return false
  }
}

/**
 * @param {string} filePath — абсолютний шлях до mp4/mov на диску
 * @returns {Promise<{ ok: boolean; skipped?: boolean; beforeBytes?: number; afterBytes?: number }>}
 */
export async function compressHeroVideoOnDisk(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return { ok: false }
  const ext = path.extname(filePath).toLowerCase()
  if (ext !== '.mp4' && ext !== '.mov') return { ok: true, skipped: true }

  const stat = fs.statSync(filePath)
  if (stat.size > MAX_INPUT_BYTES) return { ok: false }
  if (stat.size <= SKIP_BELOW_BYTES) return { ok: true, skipped: true, beforeBytes: stat.size }

  if (!hasFfmpeg()) {
    console.warn('[compressHeroVideo] ffmpeg not found — skipping', filePath)
    return { ok: true, skipped: true, beforeBytes: stat.size }
  }

  const dir = path.dirname(filePath)
  const base = path.basename(filePath, ext)
  const tmpPath = path.join(dir, `${base}.compressed.tmp.mp4`)

  const args = [
    '-y',
    '-i',
    filePath,
    '-c:v',
    'libx264',
    '-profile:v',
    'high',
    '-level',
    '4.1',
    '-crf',
    '26',
    '-preset',
    'medium',
    '-vf',
    'scale=1920:1080:force_original_aspect_ratio=decrease:flags=lanczos,fps=30,pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
    '-pix_fmt',
    'yuv420p',
    '-an',
    '-movflags',
    '+faststart',
    tmpPath,
  ]

  const r = spawnSync('ffmpeg', args, { stdio: 'ignore' })
  if (r.status !== 0 || !fs.existsSync(tmpPath)) {
    try {
      fs.unlinkSync(tmpPath)
    } catch {
      /* ignore */
    }
    return { ok: false, beforeBytes: stat.size }
  }

  const afterStat = fs.statSync(tmpPath)
  if (afterStat.size >= stat.size * 0.95) {
    try {
      fs.unlinkSync(tmpPath)
    } catch {
      /* ignore */
    }
    return { ok: true, skipped: true, beforeBytes: stat.size, afterBytes: stat.size }
  }

  try {
    fs.renameSync(tmpPath, filePath.endsWith('.mp4') ? filePath : filePath.replace(/\.mov$/i, '.mp4'))
    if (!filePath.endsWith('.mp4') && ext === '.mov') {
      try {
        fs.unlinkSync(filePath)
      } catch {
        /* ignore */
      }
    }
  } catch (e) {
    console.error('[compressHeroVideo] rename failed:', e)
    try {
      fs.unlinkSync(tmpPath)
    } catch {
      /* ignore */
    }
    return { ok: false, beforeBytes: stat.size }
  }

  const outPath = filePath.endsWith('.mp4') ? filePath : filePath.replace(/\.mov$/i, '.mp4')
  const finalSize = fs.existsSync(outPath) ? fs.statSync(outPath).size : afterStat.size
  return { ok: true, beforeBytes: stat.size, afterBytes: finalSize }
}
