#!/usr/bin/env node
/**
 * Локальний Next + API з Render (HTTPS). Читає web/.env.render.local або NEXT_PUBLIC_API_URL з shell.
 */
const { spawnSync, spawn } = require('child_process');
const fs = require('fs');
const https = require('https');
const path = require('path');

const webDir = path.join(__dirname, '../web');
const envFile = path.join(webDir, '.env.render.local');
const exampleFile = path.join(webDir, '.env.render.example');

function parseEnvFile(content) {
  const out = {};
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

let apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || '';
if (!apiUrl && fs.existsSync(envFile)) {
  const parsed = parseEnvFile(fs.readFileSync(envFile, 'utf8'));
  apiUrl = (parsed.NEXT_PUBLIC_API_URL || '').trim();
}

if (!apiUrl) {
  console.error('\n❌  Не задано NEXT_PUBLIC_API_URL для API на Render.\n');
  console.error('   Варіант A: створіть web/.env.render.local (див. web/.env.render.example)');
  console.error('   Варіант B: npm run dev:render з змінною:');
  console.error('   NEXT_PUBLIC_API_URL=https://<ваш-backend>.onrender.com npm run dev:render\n');
  if (fs.existsSync(exampleFile)) {
    console.error('   Приклад: cp web/.env.render.example web/.env.render.local\n');
  }
  process.exit(1);
}

/** Render повертає 404 + x-render-routing: no-server, якщо такого сервісу немає (типовий «фейковий» URL). */
function warnIfNoRenderService(apiBase) {
  let u;
  try {
    u = new URL(String(apiBase).replace(/\/$/, ''));
  } catch {
    return;
  }
  if (!u.hostname.endsWith('.onrender.com')) return;

  const req = https.request(
    {
      hostname: u.hostname,
      port: 443,
      path: '/',
      method: 'GET',
      timeout: 15000,
    },
    (res) => {
      res.resume();
      if (res.statusCode === 404 && res.headers['x-render-routing'] === 'no-server') {
        console.error(
          '\n⚠️  Render: за цією адресою немає живого сервісу (404, x-render-routing: no-server).',
        );
        console.error(
          '   Усі запити (/api/banners, POST тощо) дадуть 404 — це не баг фронта.',
        );
        console.error(
          '   Відкрийте https://dashboard.render.com → ваш backend Web Service → скопіюйте точний URL у web/.env.render.local',
        );
        console.error(
          '   (на кшталт https://ім’я-сервісу-xxxx.onrender.com). Або для адмінки локально: npm run local:all.\n',
        );
      }
    },
  );
  req.on('error', () => {});
  req.on('timeout', () => {
    req.destroy();
  });
  req.end();
}

try {
  spawnSync(process.execPath, [path.join(__dirname, 'kill-port.cjs'), '3000'], {
    stdio: 'inherit',
  });
} catch (_) {
  /* ignore */
}

const env = { ...process.env, NEXT_PUBLIC_API_URL: apiUrl };
const prevNo = process.env.NODE_OPTIONS || '';
if (!String(prevNo).includes('max-old-space-size')) {
  env.NODE_OPTIONS = `${prevNo} --max-old-space-size=8192`.trim();
}

const nextBin = path.join(webDir, 'node_modules', '.bin', 'next');
const useNextBin = fs.existsSync(nextBin);
const cmd = useNextBin ? nextBin : 'npx';
const args = useNextBin
  ? ['dev', '-H', '0.0.0.0', '-p', '3000']
  : ['next', 'dev', '-H', '0.0.0.0', '-p', '3000'];

const apiDisplay = apiUrl.replace(/\/$/, '');
console.log(`\n📡  API (проксі /api →): ${apiDisplay}\n`);
warnIfNoRenderService(apiUrl);

const proc = spawn(cmd, args, {
  cwd: webDir,
  env,
  stdio: 'inherit',
});
proc.on('exit', (code) => process.exit(code ?? 0));
