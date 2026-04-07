#!/usr/bin/env node
/** Звільняє один TCP-порт (за замовчуванням 3000). macOS / Linux. */
const { execSync } = require('child_process');
const { platform } = require('os');

const port = process.argv[2] || '3000';

if (platform() === 'win32') {
  console.warn(`kill-port: на Windows закрийте процес на порту ${port} вручну.`);
  process.exit(0);
}

try {
  execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, { stdio: 'ignore', shell: '/bin/sh' });
} catch (_) {
  /* ignore */
}
