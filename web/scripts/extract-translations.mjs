#!/usr/bin/env node
/**
 * One-off: split LanguageContext translations into per-locale chunks.
 * Run from web/: node scripts/extract-translations.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.join(__dirname, '..')
const ctxPath = path.join(webRoot, 'app/context/LanguageContext.tsx')
const outDir = path.join(webRoot, 'lib/i18n/translations')
const typesOut = path.join(outDir, 'types.ts')

const src = fs.readFileSync(ctxPath, 'utf8')
const lines = src.split('\n')

const ifaceStart = lines.findIndex((l) => l.startsWith('export interface Translations'))
const ifaceEnd = lines.findIndex((l, i) => i > ifaceStart && l === '}')
const translationsStart = lines.findIndex((l) => l.startsWith('const translations: Record'))
const translationsEnd = lines.findIndex((l, i) => i > translationsStart && l === '}')

if (ifaceStart < 0 || translationsStart < 0 || translationsEnd < 0) {
  console.error('Could not locate Translations block in LanguageContext.tsx')
  process.exit(1)
}

// Extend interface block to include closing brace of Translations (find matching end)
let depth = 0
let translationsIfaceEnd = ifaceEnd
for (let i = ifaceStart; i < lines.length; i++) {
  for (const ch of lines[i]) {
    if (ch === '{') depth++
    if (ch === '}') depth--
  }
  if (depth === 0 && i > ifaceStart) {
    translationsIfaceEnd = i
    break
  }
}

const interfaceBlock = lines.slice(ifaceStart, translationsIfaceEnd + 1).join('\n')
const typesHeader = `/** Generated types for site translations — edit LanguageContext or re-run extract script. */\n${interfaceBlock.replace('export interface Translations', 'export interface SiteTranslations')}\n\nexport type Translations = SiteTranslations\n`

fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(typesOut, typesHeader)

const langStarts = {
  uk: lines.findIndex((l) => l === '  uk: {'),
  ru: lines.findIndex((l) => l === '  ru: {'),
  en: lines.findIndex((l) => l === '  en: {'),
  nl: lines.findIndex((l) => l === '  nl: {'),
}

const langOrder = ['uk', 'ru', 'en', 'nl']
for (let i = 0; i < langOrder.length; i++) {
  const lang = langOrder[i]
  const start = langStarts[lang]
  const nextLang = langOrder[i + 1]
  const end = nextLang ? langStarts[nextLang] - 1 : translationsEnd - 1
  let body = lines.slice(start, end + 1).join('\n')
  // `  uk: {` → object literal content
  body = body.replace(/^  \w+: \{\n/, '').replace(/\n  \}$/, '')
  const file = `import type { SiteTranslations } from './types'\n\nconst ${lang}: SiteTranslations = {\n${body}\n}\n\nexport default ${lang}\n`
  fs.writeFileSync(path.join(outDir, `${lang}.ts`), file)
  console.log('Wrote', lang, `${end - start + 1} lines`)
}

console.log('Done. Update LanguageContext to use dynamic imports from lib/i18n/translations/')
