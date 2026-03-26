'use client'

import { ReactNode } from 'react'
import LanguageProviderWrapper from './components/LanguageProviderWrapper'
import FloatingContactButtons from './components/FloatingContactButtons'

export default function AppClient({ children }: { children: ReactNode }) {
  return (
    <LanguageProviderWrapper>
      <div className="app-container">
        {children}
        <FloatingContactButtons />
      </div>
    </LanguageProviderWrapper>
  )
}
