#!/usr/bin/env node
/**
 * Порожній `.next` + кеш збирача перед `next dev` — інакше інколи зникають чанки (`Cannot find module './380.js'`)
 * і 404 на `/_next/static/*` після Fast Refresh.
 *
 * Зберегти кеш для швидших перезапусків: WATTA_KEEP_NEXT_CACHE=1
 */
const fs = require('fs')
const path = require('path')

if (process.env.WATTA_KEEP_NEXT_CACHE === '1') {
  process.exit(0)
}

const webRoot = path.join(__dirname, '..', 'web')
const pathsToRemove = [
  path.join(webRoot, '.next'),
  path.join(webRoot, 'node_modules', '.cache'),
]

for (const p of pathsToRemove) {
  try {
    fs.rmSync(p, { recursive: true, force: true })
  } catch (_) {
    /* ignore */
  }
}
