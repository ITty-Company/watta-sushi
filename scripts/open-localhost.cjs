#!/usr/bin/env node
const { spawn } = require('child_process');
const url = 'http://127.0.0.1:3000';
if (process.platform === 'darwin') {
  spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
} else if (process.platform === 'win32') {
  spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
} else {
  spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
}
console.log('Відкрито:', url);
