#!/usr/bin/node
/**
 * На macOS пробує відкрити Docker Desktop і чекає на socket, якщо daemon ще не слухає.
 * Використання: require('./ensure-docker.cjs').ensureDockerReady() або node scripts/ensure-docker.cjs
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const { platform } = require('os');

const home = process.env.HOME || process.env.USERPROFILE || '';
const SOCK_CANDIDATES = [
  process.env.DOCKER_HOST?.replace('unix://', '') || null,
  home ? `${home}/.docker/run/docker.sock` : null,
  '/var/run/docker.sock',
].filter(Boolean);

function socketExists() {
  return SOCK_CANDIDATES.some((p) => {
    try {
      return fs.existsSync(p);
    } catch {
      return false;
    }
  });
}

function dockerInfoOk() {
  const r = spawnSync('docker', ['info'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  return r.status === 0;
}

function tryOpenDockerDesktop() {
  if (platform() !== 'darwin') return;
  spawnSync('open', ['-a', 'Docker'], { stdio: 'ignore' });
}

/**
 * @param {{ timeoutMs?: number, openDesktop?: boolean }} [opts]
 * @returns {Promise<boolean>}
 */
async function ensureDockerReady(opts = {}) {
  const timeoutMs = opts.timeoutMs ?? 120000;
  const openDesktop = opts.openDesktop !== false;

  if (dockerInfoOk()) return true;

  if (openDesktop && platform() === 'darwin') {
    console.log('🐳 Docker не відповідає — відкриваю Docker Desktop (macOS)…');
    tryOpenDockerDesktop();
  }

  const t0 = Date.now();
  let lastLog = 0;
  while (Date.now() - t0 < timeoutMs) {
    if (socketExists() && dockerInfoOk()) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 2000));
    const now = Date.now();
    if (now - lastLog > 10000) {
      lastLog = now;
      process.stdout.write('   …чекаю Docker\n');
    }
  }

  return false;
}

module.exports = { ensureDockerReady, dockerInfoOk, tryOpenDockerDesktop };

if (require.main === module) {
  ensureDockerReady().then((ok) => {
    if (!ok) {
      console.error('❌ Docker недоступний. Запустіть Docker Desktop і повторіть.');
      process.exit(1);
    }
    console.log('✅ Docker готовий.');
  });
}
