'use client'

import { ReactNode } from 'react'
import LanguageProviderWrapper from './components/LanguageProviderWrapper'
import FloatingContactButtons from './components/FloatingContactButtons'
import { Toaster } from 'sonner'

export default function AppClient({ children }: { children: ReactNode }) {
  return (
    <LanguageProviderWrapper>
      {children}
      <FloatingContactButtons />
      <Toaster position="top-center" richColors />
    </LanguageProviderWrapper>
  )
}
