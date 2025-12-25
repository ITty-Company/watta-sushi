'use client'

import { LanguageProvider } from '../context/LanguageContext'

export default function LanguageProviderWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <LanguageProvider>{children}</LanguageProvider>
}

