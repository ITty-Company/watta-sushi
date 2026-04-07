#!/usr/bin/env node
/**
 * Один запуск повного стеку: Docker (опційно) → Postgres → migrate → веб + API.
 * Перший раз після клону: npm run local:prepare (сіды). Далі: npm run local:stack
 */
const path = require('path');
const { execSync, spawn } = require('child_process');
const net = require('net');
const { ensureDockerReady } = require('./ensure-docker.cjs');

const root = path.resolve(__dirname, '..');
const DOCKER_PG_PORT = 55432;

function waitPort(host, port, timeoutMs = 90000) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const tryOnce = () => {
      const s = net.createConnection({ host, port, timeout: 2000 }, () => {
        s.end();
        resolve();
      });
      s.on('error', () => {
        s.destroy();
        if (Date.now() - t0 > timeoutMs) {
          reject(new Error(`Таймаут очікування ${host}:${port}`));
        } else {
          setTimeout(tryOnce, 800);
        }
      });
    };
    tryOnce();
  });
}

async function main() {
  const skipDocker = process.env.SKIP_DOCKER === '1';

  if (!skipDocker) {
    const ok = await ensureDockerReady();
    if (!ok) {
      console.error('\n❌ Docker недоступний.');
      console.error('   Увімкніть Docker Desktop або: SKIP_DOCKER=1 npm run local:stack (свій Postgres у backend/.env)\n');
      process.exit(1);
    }
    console.log('📦 Postgres (docker compose up -d)…');
    execSync('docker-compose up -d 2>/dev/null || docker compose up -d', {
      cwd: root,
      stdio: 'inherit',
      shell: true,
    });
    console.log(`⏳ Очікування 127.0.0.1:${DOCKER_PG_PORT}…`);
    try {
      await waitPort('127.0.0.1', DOCKER_PG_PORT);
    } catch (e) {
      console.error('❌', e.message);
      process.exit(1);
    }
  } else {
    console.log('⏭️  SKIP_DOCKER=1 — пропускаю docker compose (переконайтесь, що Postgres доступний за DATABASE_URL)\n');
  }

  console.log('🗄️  prisma migrate deploy…');
  try {
    execSync('npx prisma migrate deploy', {
      cwd: path.join(root, 'backend'),
      stdio: 'inherit',
      env: { ...process.env },
    });
  } catch {
    console.error('\n❌ migrate deploy не вдався. Спробуйте: npm run local:prepare\n');
    process.exit(1);
  }

  execSync('node scripts/kill-dev-ports.cjs', { cwd: root, stdio: 'inherit' });

  console.log('\n🚀 Веб http://localhost:3000 + API http://localhost:5050');
  console.log('   Зупинка: Ctrl+C\n');

  const child = spawn(
    'npx',
    [
      '--yes',
      'concurrently',
      '--kill-others-on-fail',
      '-c',
      'blue,magenta',
      '-n',
      'web,api',
      'npm run local:web',
      'npm run local:backend',
    ],
    {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env },
    }
  );
  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else process.exit(code ?? 0);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
