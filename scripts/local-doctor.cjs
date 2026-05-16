#!/usr/bin/env node
/**
 * Діагностика локального стеку: Postgres, порти, HTTP API/Next.
 */
const fs = require('fs');
const path = require('path');
const net = require('net');
const http = require('http');

const root = path.resolve(__dirname, '..');

function checkPort(host, port) {
  return new Promise((resolve) => {
    const s = net.createConnection({ host, port, timeout: 2000 }, () => {
      s.end();
      resolve(true);
    });
    s.on('error', () => resolve(false));
  });
}

function httpGet(url, timeoutMs = 4000) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      let body = '';
      res.on('data', (c) => {
        body += c;
      });
      res.on('end', () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode, body }));
    });
    req.on('error', () => resolve({ ok: false, status: 0, body: '' }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, status: 0, body: '' });
    });
  });
}

async function main() {
  console.log('🔎 Watta local-doctor\n');

  const envPath = path.join(root, 'backend', '.env');
  const webDevEnv = path.join(root, 'web', '.env.development');
  console.log(fs.existsSync(envPath) ? '✅ backend/.env' : '❌ Немає backend/.env — npm run local:prepare');
  console.log(
    fs.existsSync(webDevEnv)
      ? '✅ web/.env.development'
      : '⚠️  Немає web/.env.development — npm run local:prepare створить з .env.example'
  );

  const pg = await checkPort('127.0.0.1', 55432);
  console.log(
    pg
      ? '✅ PostgreSQL (Docker) на 127.0.0.1:55432'
      : '❌ Postgres недоступний — Docker Desktop + npm run docker:db   або   npm run local:prepare'
  );

  const p3000 = await checkPort('127.0.0.1', 3000);
  const p5050 = await checkPort('127.0.0.1', 5050);
  console.log(p3000 ? '✅ Порт 3000 (Next)' : 'ℹ️  Порт 3000 вільний — запустіть: npm run local');
  console.log(p5050 ? '✅ Порт 5050 (API)' : 'ℹ️  Порт 5050 вільний — запустіть: npm run local');

  if (p5050) {
    const api = await httpGet('http://127.0.0.1:5050/');
    console.log(
      api.ok && api.body.includes('API')
        ? '✅ API відповідає: http://127.0.0.1:5050'
        : '⚠️  API на :5050 є, але відповідь незвична'
    );
  }

  if (p3000) {
    const web = await httpGet('http://127.0.0.1:3000/');
    console.log(web.ok ? '✅ Сайт: http://127.0.0.1:3000' : '⚠️  Next на :3000, але головна не 200');
  }

  console.log('\n📋 Перший раз після клону:');
  console.log('   npm run local:setup    # install + Postgres + migrate + seed');
  console.log('   npm run local          # веб + API (відкриє браузер)');
  console.log('\n📋 Щодня:');
  console.log('   npm run local');
  console.log('\n📋 Тільки фронт без бекенда (моки):');
  console.log('   npm run local:web:mock');
  console.log('\n📋 Перевірити сплеш знову в браузері (Console):');
  console.log("   sessionStorage.removeItem('watta_boot_splash_done')");
  console.log('\n📋 Якщо Next падає з Cannot find module ./NNN.js:');
  console.log('   npm run local:all:clean\n');

  if (!pg) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
