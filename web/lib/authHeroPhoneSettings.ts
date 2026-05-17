import type { Language } from '@/app/context/LanguageContext'

export type AuthHeroPhoneCopyLang = {
  title: string
  subtitle: string
  benefits: [string, string, string]
}

export type AuthHeroPhoneCopyMap = Partial<Record<Language, AuthHeroPhoneCopyLang>>

const LANGS: Language[] = ['uk', 'ru', 'en', 'nl']
const MAX_FIELD = 280
const MAX_BENEFIT = 80

function trimField(s: unknown, max: number): string {
  if (typeof s !== 'string') return ''
  return s.trim().slice(0, max)
}

function parseBenefits(raw: unknown): [string, string, string] {
  if (Array.isArray(raw)) {
    return [
      trimField(raw[0], MAX_BENEFIT),
      trimField(raw[1], MAX_BENEFIT),
      trimField(raw[2], MAX_BENEFIT),
    ]
  }
  return ['', '', '']
}

export function parseAuthHeroPhoneCopyFromApi(raw: unknown): AuthHeroPhoneCopyMap {
  if (!raw || typeof raw !== 'object') return {}
  const out: AuthHeroPhoneCopyMap = {}
  for (const lang of LANGS) {
    const block = (raw as Record<string, unknown>)[lang]
    if (!block || typeof block !== 'object') continue
    const b = block as Record<string, unknown>
    const title = trimField(b.title, MAX_FIELD)
    const subtitle = trimField(b.subtitle, MAX_FIELD)
    const benefits = parseBenefits(b.benefits)
    if (!title && !subtitle && benefits.every((x) => !x)) continue
    out[lang] = { title, subtitle, benefits }
  }
  return out
}

export function serializeAuthHeroPhoneCopy(copy: AuthHeroPhoneCopyMap): string {
  const payload: Record<string, AuthHeroPhoneCopyLang> = {}
  for (const lang of LANGS) {
    const block = copy[lang]
    if (!block) continue
    payload[lang] = {
      title: trimField(block.title, MAX_FIELD),
      subtitle: trimField(block.subtitle, MAX_FIELD),
      benefits: parseBenefits(block.benefits),
    }
  }
  return JSON.stringify(payload)
}

export function parseAuthHeroPhone2VideoUrlsFromApi(data: {
  authHeroPhone2VideoUrls?: unknown
}): string[] {
  if (!Array.isArray(data.authHeroPhone2VideoUrls)) return []
  return data.authHeroPhone2VideoUrls
    .filter((x): x is string => typeof x === 'string')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

const CITY_PLACEHOLDER = /\{\{\s*city\s*\}\}/gi

export function applyCityPlaceholdersToAuthHeroCopy(
  copy: AuthHeroPhoneCopyLang,
  cityName: string,
): AuthHeroPhoneCopyLang {
  if (!cityName.trim()) return copy
  const sub = (s: string) => s.replace(CITY_PLACEHOLDER, cityName.trim())
  return {
    title: sub(copy.title),
    subtitle: sub(copy.subtitle),
    benefits: copy.benefits.map(sub) as [string, string, string],
  }
}

export function applyCityPlaceholdersToText(text: string, cityName: string): string {
  if (!cityName.trim()) return text
  return text.replace(CITY_PLACEHOLDER, cityName.trim())
}

export function resolveAuthHeroPhoneCopy(
  stored: AuthHeroPhoneCopyMap,
  language: Language,
  fallback: AuthHeroPhoneCopyLang,
): AuthHeroPhoneCopyLang {
  const order: Language[] = [language, 'uk', 'ru', 'en', 'nl']
  for (const lang of order) {
    const block = stored[lang]
    if (block?.title?.trim()) {
      return {
        title: block.title.trim(),
        subtitle: block.subtitle?.trim() || fallback.subtitle,
        benefits: block.benefits.map((b, i) => b.trim() || fallback.benefits[i]) as [
          string,
          string,
          string,
        ],
      }
    }
  }
  return fallback
}

export type AuthHeroPhoneCopyFormLang = {
  title: string
  subtitle: string
  benefit1: string
  benefit2: string
  benefit3: string
}

export type AuthHeroPhoneCopyForm = Record<Language, AuthHeroPhoneCopyFormLang>

export function emptyAuthHeroCopyForm(): AuthHeroPhoneCopyForm {
  return {
    uk: { title: '', subtitle: '', benefit1: '', benefit2: '', benefit3: '' },
    ru: { title: '', subtitle: '', benefit1: '', benefit2: '', benefit3: '' },
    en: { title: '', subtitle: '', benefit1: '', benefit2: '', benefit3: '' },
    nl: { title: '', subtitle: '', benefit1: '', benefit2: '', benefit3: '' },
  }
}

export function copyFormFromStored(stored: AuthHeroPhoneCopyMap): AuthHeroPhoneCopyForm {
  const form = emptyAuthHeroCopyForm()
  for (const lang of LANGS) {
    const block = stored[lang]
    if (!block) continue
    form[lang] = {
      title: block.title,
      subtitle: block.subtitle,
      benefit1: block.benefits[0],
      benefit2: block.benefits[1],
      benefit3: block.benefits[2],
    }
  }
  return form
}

export function copyFormToStored(form: AuthHeroPhoneCopyForm): AuthHeroPhoneCopyMap {
  const out: AuthHeroPhoneCopyMap = {}
  for (const lang of LANGS) {
    const f = form[lang]
    if (!f.title.trim() && !f.subtitle.trim() && !f.benefit1.trim() && !f.benefit2.trim() && !f.benefit3.trim()) {
      continue
    }
    out[lang] = {
      title: f.title.trim(),
      subtitle: f.subtitle.trim(),
      benefits: [f.benefit1.trim(), f.benefit2.trim(), f.benefit3.trim()],
    }
  }
  return out
}
