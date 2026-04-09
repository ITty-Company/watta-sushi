#!/usr/bin/env node
/**
 * Один запуск повного стеку: Docker (опційно) → Postgres → migrate → веб + API.
 * Перший раз після клону: npm run local:prepare (сіды). Далі: npm run local:stack
 */
const fs = require('fs');
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

/** Після появи слухача на :3000 відкриваємо сайт (macOS / Windows / Linux). SKIP_OPEN_BROWSER=1 — вимкнути. */
function scheduleOpenBrowserWhenWebReady() {
  if (process.env.SKIP_OPEN_BROWSER === '1') {
    console.log('   (Автовідкриття браузера вимкнено: SKIP_OPEN_BROWSER=1)\n');
    return;
  }
  const url = 'http://127.0.0.1:3000';
  const maxAttempts = 80;
  let attempt = 0;
  let didOpen = false;
  const tick = () => {
    attempt += 1;
    const s = net.createConnection({ host: '127.0.0.1', port: 3000, timeout: 1200 }, () => {
      s.end();
      if (didOpen) return;
      didOpen = true;
      try {
        if (process.platform === 'darwin') {
          spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
        } else if (process.platform === 'win32') {
          spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
        } else {
          spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
        }
        console.log(`\n🌐 Відкрито в браузері: ${url}\n`);
      } catch {
        /* ignore */
      }
    });
    s.on('error', () => {
      s.destroy();
      if (attempt < maxAttempts) setTimeout(tick, 400);
      else {
        console.log(`\n⚠️  Автовідкриття не вдалося — відкрийте вручну: ${url}\n`);
      }
    });
  };
  setTimeout(tick, 600);
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

  if (process.env.SKIP_CLEAN_NEXT !== '1') {
    const nextDir = path.join(root, 'web', '.next');
    const webCache = path.join(root, 'web', 'node_modules', '.cache');
    console.log('🧹 Очищення web/.next (запобігання помилкам на кшталт Cannot find module \'./682.js\')…');
    try {
      fs.rmSync(nextDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    try {
      fs.rmSync(webCache, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }

  console.log('\n🚀 Веб:  http://127.0.0.1:3000   (або http://localhost:3000)');
  console.log('   API:  http://127.0.0.1:5050');
  console.log('   Якщо в браузері 404 на /_next/static/… — зачекайте 5–15 с після старту або Cmd+Shift+R (після очищення .next кеш сторінки застарілий).');
  console.log('   Відкрийте посилання вручну в браузері, якщо воно не відкрилось само.');
  console.log('   Зупинка: Ctrl+C');
  console.log('   Один екземпляр: не запускайте `npm run local` у двох терміналах — другий збиває порти 3000/5050.');
  if (process.env.SKIP_CLEAN_NEXT !== '1') {
    console.log('   (Щоб не чистити web/.next кожного разу: SKIP_CLEAN_NEXT=1 npm run local)\n');
  } else {
    console.log('');
  }

  scheduleOpenBrowserWhenWebReady();

  const child = spawn(
    'npx',
    [
      '--yes',
      'concurrently',
      '--kill-others-on-fail',
      '--restart-tries',
      '-1',
      '--restart-after',
      '1500',
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
