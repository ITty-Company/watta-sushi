#!/usr/bin/env node
const fs = require('fs');
const { spawn } = require('child_process');
const url = 'http://127.0.0.1:3000';
if (process.platform === 'darwin') {
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const chromium = '/Applications/Chromium.app/Contents/MacOS/Chromium';
  if (fs.existsSync(chrome)) {
    spawn(chrome, [url], { detached: true, stdio: 'ignore' }).unref();
  } else if (fs.existsSync(chromium)) {
    spawn(chromium, [url], { detached: true, stdio: 'ignore' }).unref();
  } else {
    spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
  }
} else if (process.platform === 'win32') {
  spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
} else {
  spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
}
console.log('Відкрито:', url);
