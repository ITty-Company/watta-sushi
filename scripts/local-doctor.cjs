#!/usr/bin/env node
/**
 * Швидка діагностика локального стеку: Postgres (55432), порти 3000/5050.
 */
const net = require('net');

function checkPort(host, port, label) {
  return new Promise((resolve) => {
    const s = net.createConnection({ host, port, timeout: 2000 }, () => {
      s.end();
      resolve(true);
    });
    s.on('error', () => resolve(false));
  });
}

async function main() {
  console.log('🔎 Watta local-doctor\n');

  const pg = await checkPort('127.0.0.1', 55432, 'Postgres');
  console.log(pg ? '✅ PostgreSQL (Docker) відповідає на 127.0.0.1:55432' : '❌ Немає з’єднання з 127.0.0.1:55432 — запустіть Docker і: npm run docker:db   або   npm run local:prepare');

  const p3000 = await checkPort('127.0.0.1', 3000, 'Next');
  const p5050 = await checkPort('127.0.0.1', 5050, 'API');
  console.log(p3000 ? 'ℹ️  Порт 3000 зайнятий (ймовірно Next уже запущений)' : 'ℹ️  Порт 3000 вільний');
  console.log(p5050 ? 'ℹ️  Порт 5050 зайнятий (ймовірно API вже запущений)' : 'ℹ️  Порт 5050 вільний');

  console.log('\nЯкщо Next падає з Cannot find module ./NNN.js у .next — виконайте:');
  console.log('   rm -rf web/.next web/node_modules/.cache && npm run local:all:clean\n');

  if (!pg) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
