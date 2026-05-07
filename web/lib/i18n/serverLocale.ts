import { cookies } from 'next/headers'
import { parseWattaLanguage, type WattaLanguage, WATTA_LANG_COOKIE } from './language'

/** Мова з cookie (SSR / generateMetadata). Без cookie — українська. */
export async function getRequestLocale(): Promise<WattaLanguage> {
  const store = await cookies()
  return parseWattaLanguage(store.get(WATTA_LANG_COOKIE)?.value)
}
