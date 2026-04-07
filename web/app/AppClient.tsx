'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import LanguageProviderWrapper from './components/LanguageProviderWrapper'
import FloatingContactButtons from './components/FloatingContactButtons'
import Footer from './components/Footer'

export default function AppClient({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isHomeRoute = pathname === '/'
  const isAuthRoute = pathname === '/login' || pathname === '/register'

  return (
    <LanguageProviderWrapper>
      {/* Главный контейнер на весь экран */}
      <div className="flex flex-col min-h-screen bg-[#f2f5f3] overflow-x-hidden">
        
        {/* Контент растягивается и выталкивает футер вниз */}
        <main className="flex-1 w-full max-w-[100vw]">
          {children}
        </main>
        
        {/* На главной футер рендерится внутри HomeClient (.content-web); на /login /register — повноекранна сторінка */}
        {!isHomeRoute && !isAuthRoute && <Footer />}
        
        {!isAuthRoute && <FloatingContactButtons />}
      </div>
    </LanguageProviderWrapper>
  )
}