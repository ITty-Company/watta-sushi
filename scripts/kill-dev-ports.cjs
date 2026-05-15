#!/usr/bin/env node
/** Звільняє порти Next (3000) і API (5000/5050) перед local:all — macOS / Linux. */
const { execSync } = require('child_process');
const { platform } = require('os');

const ports = [3000, 5000, 5050];

if (platform() === 'win32') {
  console.warn('kill-dev-ports: на Windows закрийте процеси на 3000/5050 вручну або використайте dev:reset у web.');
  process.exit(0);
}

for (const port of ports) {
  try {
    execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, { stdio: 'ignore', shell: '/bin/sh' });
  } catch (_) {
    /* ignore */
  }
}

try {
  execSync('sleep 1', { stdio: 'ignore', shell: '/bin/sh' })
} catch (_) {
  /* ignore */
}
