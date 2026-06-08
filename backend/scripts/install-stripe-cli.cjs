#!/usr/bin/env node
/**
 * Downloads Stripe CLI into backend/.bin (macOS arm64 / x86_64).
 * Run: npm run stripe:setup
 */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const https = require('https')

const VERSION = '1.42.1'
const root = path.join(__dirname, '..')
const binDir = path.join(root, '.bin')
const binPath = path.join(binDir, 'stripe')

const arch = process.arch === 'arm64' ? 'arm64' : 'x86_64'
const file = `stripe_${VERSION}_mac-os_${arch}.tar.gz`
const url = `https://github.com/stripe/stripe-cli/releases/download/v${VERSION}/${file}`

function download(dest) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          https.get(res.headers.location, (r2) => {
            const chunks = []
            r2.on('data', (c) => chunks.push(c))
            r2.on('end', () => resolve(Buffer.concat(chunks)))
            r2.on('error', reject)
          }).on('error', reject)
          return
        }
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => resolve(Buffer.concat(chunks)))
        res.on('error', reject)
      })
      .on('error', reject)
  })
}

async function main() {
  if (process.platform !== 'darwin') {
    console.error('stripe:setup supports macOS only. Install CLI: https://docs.stripe.com/stripe-cli/install')
    process.exit(1)
  }
  fs.mkdirSync(binDir, { recursive: true })
  const tarPath = path.join(binDir, file)
  console.log(`Downloading Stripe CLI ${VERSION} (${arch})…`)
  const buf = await download(tarPath)
  fs.writeFileSync(tarPath, buf)
  execSync(`tar -xzf "${file}" stripe`, { cwd: binDir, stdio: 'inherit' })
  fs.unlinkSync(tarPath)
  fs.chmodSync(binPath, 0o755)
  const version = execSync(`"${binPath}" version`, { encoding: 'utf8' }).trim()
  console.log(`✅ ${version} → backend/.bin/stripe`)
  console.log('Next: stripe login (once), then npm run stripe:listen')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
