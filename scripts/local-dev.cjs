#!/usr/bin/env node
/**
 * Паралельний запуск Next (local:web) і Express (local:backend) без concurrently.
 * Уникає поламаного парсингу shell/npm, коли в термінал випадково потрапляє текст після #.
 */
const { spawn } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const shell = process.platform === 'win32';

function start(script) {
  return spawn('npm', ['run', script], {
    cwd: root,
    stdio: 'inherit',
    shell,
    env: { ...process.env },
  });
}

const web = start('local:web');
const api = start('local:backend');

let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const p of [web, api]) {
    try {
      if (p && !p.killed) p.kill('SIGTERM');
    } catch (_) {
      /* ignore */
    }
  }
  setTimeout(() => process.exit(code), 500);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

function onExit(label, code, signal) {
  if (shuttingDown) return;
  const bad = signal || (code !== 0 && code !== null);
  if (bad) {
    console.error(`\n[local-dev] Процес «${label}» зупинився (code=${code}, signal=${signal || '—'}). Зупиняю інший.\n`);
    shutdown(typeof code === 'number' ? code : 1);
  }
}

web.on('exit', (code, signal) => onExit('web (Next)', code, signal));
api.on('exit', (code, signal) => onExit('api (Express)', code, signal));
