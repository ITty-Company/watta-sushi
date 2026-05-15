import { cookies } from 'next/headers'
import {
  type WattaLanguage,
  WATTA_LANG_COOKIE,
  WATTA_LANG_EXPLICIT_COOKIE,
  resolveWattaSiteLanguage,
} from './language'

/** Мова з cookie (SSR / generateMetadata). Без cookie — `WATTA_DEFAULT_SITE_LANGUAGE` (див. `language.ts`). */
export async function getRequestLocale(): Promise<WattaLanguage> {
  const store = await cookies()
  return resolveWattaSiteLanguage(
    store.get(WATTA_LANG_COOKIE)?.value,
    store.get(WATTA_LANG_EXPLICIT_COOKIE)?.value,
  )
}
