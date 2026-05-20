import fs from 'fs'
import path from 'path'
import { getUploadsDir } from './uploadsDir.js'

/** Знімок для /health/storage — перевірка Persistent Disk на Render. */
export function getStorageHealthSnapshot() {
  const uploadDir = getUploadsDir()
  const uploadDirEnv = process.env.UPLOAD_DIR?.trim() || null

  let exists = false
  let writable = false
  let fileCount = 0
  let heroVideoCount = 0

  try {
    exists = fs.existsSync(uploadDir)
    if (exists) {
      const names = fs.readdirSync(uploadDir)
      fileCount = names.length
      heroVideoCount = names.filter(
        (n) => n.startsWith('hero-') && /\.(mp4|webm|mov)$/i.test(n),
      ).length
    }
    const probe = path.join(uploadDir, `.write-probe-${process.pid}`)
    fs.writeFileSync(probe, String(Date.now()))
    fs.unlinkSync(probe)
    writable = true
  } catch {
    writable = false
  }

  const persistentDiskLikely = Boolean(
    uploadDirEnv &&
      (uploadDirEnv.startsWith('/var/data') || uploadDirEnv.startsWith('/opt/render')),
  )

  let hintUk = ''
  if (!uploadDirEnv) {
    hintUk =
      'UPLOAD_DIR не задано — файли в тимчасовій ФС контейнера; після redeploy на Render зникають.'
  } else if (!persistentDiskLikely) {
    hintUk =
      'UPLOAD_DIR задано, але не на /var/data — перевірте Persistent Disk (Mount Path) у Render.'
  } else if (!exists || !writable) {
    hintUk = 'Каталог uploads недоступний або не записується — перевірте mount і права.'
  } else {
    hintUk = 'Схоже на постійний диск — завантаження мають переживати redeploy.'
  }

  return {
    ok: exists && writable,
    uploads: {
      path: uploadDir,
      uploadDirEnv,
      mode: uploadDirEnv ? 'UPLOAD_DIR' : 'default_backend_uploads',
      persistentDiskLikely,
      exists,
      writable,
      fileCount,
      heroVideoCount,
    },
    hintUk,
  }
}
