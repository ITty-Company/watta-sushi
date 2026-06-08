#!/usr/bin/env node
/**
 * Повне очищення dev/build кешів (Next, webpack, turbo, SW-артефакти).
 * Не чіпає node_modules — лише кеші збірки.
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { platform } = require('os')

const root = path.join(__dirname, '..')
const webRoot = path.join(root, 'web')

function rmSafe(p) {
  try {
    fs.rmSync(p, { recursive: true, force: true })
    console.log(`  ✓ ${path.relative(root, p)}`)
  } catch {
    /* ignore */
  }
}

function killPort(port) {
  if (platform() === 'win32') return
  try {
    execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, { stdio: 'ignore', shell: '/bin/sh' })
  } catch {
    /* ignore */
  }
}

console.log('[watta] Зупиняємо dev-сервери…')
killPort(3000)
killPort(5050)

console.log('[watta] Очищення кешів…')
;[
  path.join(webRoot, '.next'),
  path.join(webRoot, 'node_modules', '.cache'),
  path.join(webRoot, '.turbo'),
  path.join(root, 'backend', 'node_modules', '.cache'),
].forEach(rmSafe)

console.log('[watta] Готово. Запустіть npm run local і зробіть Cmd+Shift+R у браузері.')
