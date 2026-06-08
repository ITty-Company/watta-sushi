#!/usr/bin/env node
/**
 * Запуск Stripe CLI з backend/.bin (не з PATH).
 * Якщо бінарника немає — підказка про npm run stripe:setup.
 */
const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const bin = path.join(__dirname, '..', '.bin', 'stripe')
const args = process.argv.slice(2)

if (!fs.existsSync(bin)) {
  console.error('❌ Stripe CLI не знайдено.')
  console.error('   З папки backend: npm run stripe:setup')
  console.error('   Потім:            npm run stripe:login')
  process.exit(1)
}

if (args.length === 0) {
  console.error('Usage: node scripts/stripe-cli.cjs <stripe-args…>')
  process.exit(1)
}

const r = spawnSync(bin, args, { stdio: 'inherit' })
process.exit(typeof r.status === 'number' ? r.status : 1)
