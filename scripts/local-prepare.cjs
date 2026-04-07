#!/usr/bin/env node
/**
 * Локальна підготовка: backend/.env → Docker Postgres → міграції → сид (меню + країни).
 * Потрібен запущений Docker Desktop (або інший PostgreSQL на DATABASE_URL).
 */
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

const root = path.resolve(__dirname, '..');
const backendDir = path.join(root, 'backend');
const envPath = path.join(backendDir, '.env');
const envExample = path.join(backendDir, '.env.docker.example');
/** Має збігатися з лівим портом у docker-compose (host → container 5432) */
const DOCKER_HOST_PG_PORT = 55432;

function ensureEnv() {
  if (!fs.existsSync(envExample)) {
    console.error('Немає backend/.env.docker.example');
    process.exit(1);
  }
  if (!fs.existsSync(envPath)) {
    fs.copyFileSync(envExample, envPath);
    console.log('✅ Створено backend/.env з .env.docker.example');
  } else {
    console.log('ℹ️  backend/.env вже існує');
  }
}

function dockerUp() {
  const run = (bin, args) => spawnSync(bin, args, { cwd: root, stdio: 'inherit' });

  const v1 = spawnSync('docker-compose', ['version'], { encoding: 'utf8' });
  if (v1.status === 0) {
    return run('docker-compose', ['up', '-d']).status === 0;
  }

  const v2 = spawnSync('docker', ['compose', 'version'], { encoding: 'utf8' });
  if (v2.status === 0) {
    return run('docker', ['compose', 'up', '-d']).status === 0;
  }

  console.error('Не знайдено docker-compose ні docker compose. Встановіть Docker Desktop.');
  return false;
}

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

function runBackend(cmd) {
  execSync(cmd, {
    cwd: backendDir,
    stdio: 'inherit',
    env: { ...process.env },
  });
}

async function main() {
  console.log('📦 Локальна підготовка Watta Sushi…\n');
  ensureEnv();

  const skipDocker = process.env.SKIP_DOCKER === '1';

  if (!skipDocker && fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf8');
    const m = raw.match(/DATABASE_URL\s*=\s*["']?([^"'\n]+)/);
    const url = m ? m[1] : '';
    if (url.includes('127.0.0.1') && !url.includes(`:${DOCKER_HOST_PG_PORT}/`)) {
      console.warn(
        `⚠️  Для Docker з цього репозиторію в DATABASE_URL очікується порт ${DOCKER_HOST_PG_PORT} (див. docker-compose.yml).`
      );
      console.warn('   Оновіть backend/.env: cp backend/.env.docker.example backend/.env\n');
    }
  }

  if (!skipDocker) {
    if (!dockerUp()) {
      console.error('\n❌ Не вдалося підняти Docker (docker-compose / docker compose).');
      console.error('   Запустіть Docker Desktop і повторіть: npm run local:prepare');
      console.error('   Якщо PostgreSQL уже працює локально: SKIP_DOCKER=1 npm run local:prepare\n');
      process.exit(1);
    }

    console.log(`⏳ Очікування PostgreSQL (Docker) на 127.0.0.1:${DOCKER_HOST_PG_PORT}…`);
    try {
      await waitPort('127.0.0.1', DOCKER_HOST_PG_PORT);
    } catch (e) {
      console.error('❌', e.message);
      process.exit(1);
    }
  } else {
    console.log('⏭️  SKIP_DOCKER=1 — очікуємо вже запущений PostgreSQL (DATABASE_URL з backend/.env)…');
    try {
      await waitPort('127.0.0.1', 5432, 15000);
    } catch (e) {
      console.warn('⚠️  Порт 5432 ще не відповідає — все одно пробуємо migrate…');
    }
  }

  console.log('🗄️  prisma migrate deploy…');
  try {
    runBackend('npx prisma migrate deploy');
  } catch (e) {
    console.error('\n❌ prisma migrate deploy не вдався.');
    console.error('   Помилка P1010: часто це звернення до НЕ того Postgres на localhost.');
    console.error(`   У docker-compose зовнішній порт PostgreSQL — ${DOCKER_HOST_PG_PORT} (див. файл). У backend/.env має бути той самий порт.`);
    console.error(`   DATABASE_URL=...127.0.0.1:${DOCKER_HOST_PG_PORT}/watta_sushi...`);
    console.error('   Якщо порт зайнятий — змініть обидва місця (compose + .env) на інший вільний.\n');
    console.error('   Що зробити:');
    console.error('   • cp backend/.env.docker.example backend/.env');
    console.error('   • npm run docker:db && npm run local:prepare');
    console.error('   • Або задайте DATABASE_URL під свій Postgres (SKIP_DOCKER=1).\n');
    console.error('     (користувач і БД мають існувати; Prisma створить таблиці міграціями).\n');
    process.exit(1);
  }

  console.log('🌱 prisma db seed (меню + країни/міста)…');
  runBackend('npx prisma db seed');

  console.log('\n✅ Готово. Далі в одному терміналі: npm run local:all');
  console.log('   (або окремо: npm run local:backend та npm run local:web)\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
