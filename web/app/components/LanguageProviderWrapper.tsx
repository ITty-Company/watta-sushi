'use client'

import { LanguageProvider } from '../context/LanguageContext'
import type { WattaLanguage } from '@/lib/i18n/language'

export default function LanguageProviderWrapper({
  children,
  initialLocale,
}: {
  children: React.ReactNode
  initialLocale: WattaLanguage
}) {
  return <LanguageProvider initialLocale={initialLocale}>{children}</LanguageProvider>
}

