'use client'

import { ReactNode } from 'react'
import LanguageProviderWrapper from './components/LanguageProviderWrapper'
import { Toaster } from 'sonner'

export default function AppClient({ children }: { children: ReactNode }) {
  return (
    <LanguageProviderWrapper>
      {children}
      <Toaster position="top-center" richColors />
    </LanguageProviderWrapper>
  )
}
