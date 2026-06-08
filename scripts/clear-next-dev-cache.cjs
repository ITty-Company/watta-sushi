#!/usr/bin/env node
/**
 * Зупиняє старий Next на :3000, потім порожній `.next` + кеш збирача.
 * Інакше зникають чанки (`Cannot find module './380.js'`) і 404 на `/_next/static/*`.
 *
 * Зберегти кеш: WATTA_KEEP_NEXT_CACHE=1
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { platform } = require('os')

if (process.env.WATTA_KEEP_NEXT_CACHE === '1') {
  process.exit(0)
}

function killPort(port) {
  if (platform() === 'win32') return
  try {
    execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, { stdio: 'ignore', shell: '/bin/sh' })
  } catch (_) {
    /* ignore */
  }
}

/** Спочатку звільнити порт — інакше rm `.next` і новий dev конфліктують зі старим процесом. */
killPort(3000)
try {
  execSync('sleep 1', { stdio: 'ignore', shell: '/bin/sh' })
} catch (_) {
  /* ignore */
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

console.log(
  '[watta] Очищено web/.next — після старту dev зробіть Cmd+Shift+R у браузері (інакше 404 на /_next/static/…).',
)
