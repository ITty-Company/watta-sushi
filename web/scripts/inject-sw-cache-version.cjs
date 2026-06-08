#!/usr/bin/env node
/**
 * Підставляє унікальну версію кешу SW перед production build —
 * старі кеші браузера скидаються після деплою.
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const swPath = path.join(__dirname, '..', 'public', 'sw.js')
if (!fs.existsSync(swPath)) {
  console.warn('[watta] sw.js not found — skip version inject')
  process.exit(0)
}

let buildId = String(Date.now())
try {
  const hash = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim()
  if (hash) buildId = hash
} catch {
  /* ignore — не git repo або git недоступний */
}

const version = `watta-${buildId}`
let src = fs.readFileSync(swPath, 'utf8')
const next = src.replace(/const CACHE_VERSION = '[^']+';/, `const CACHE_VERSION = '${version}';`)
  .replace(/const CACHE_VERSION = '__WATTA_BUILD__';/, `const CACHE_VERSION = '${version}';`)

if (next === src) {
  console.warn('[watta] CACHE_VERSION placeholder not found in sw.js')
  process.exit(0)
}

fs.writeFileSync(swPath, next, 'utf8')
console.log(`[watta] SW cache version → ${version}`)
