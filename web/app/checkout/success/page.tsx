'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import LogoBackground from '../../components/LogoBackground'
import WattaLink from '../../components/WattaLink'

function clearClientCart() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem('cart')
    window.dispatchEvent(new CustomEvent('cartUpdated'))
  } catch {
    /* ignore */
  }
}

function CheckoutSuccessContent() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  useEffect(() => {
    clearClientCart()
  }, [])

  return (
    <div className="watta-public-page-shell watta-page-bg relative flex min-h-screen flex-1 flex-col items-center justify-center px-6 py-16 font-sans">
      <LogoBackground />
      <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center rounded-[28px] bg-white/95 backdrop-blur-md border border-[#145142]/10 shadow-[0_20px_60px_rgba(20,81,66,0.12)] px-8 py-12">
        <div
          className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#145142] to-[#1a6b58] text-white shadow-lg shadow-[#145142]/35 ring-4 ring-[#ff6b35]/25"
          aria-hidden
        >
          <CheckCircle2 className="h-14 w-14" strokeWidth={2.2} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#145142] tracking-tight mb-3">
          {t.cartSection.checkoutSuccessTitle}
        </h1>
        <p className="text-gray-600 text-base leading-relaxed mb-8">
          {t.cartSection.checkoutSuccessSubtitle}
        </p>
        {orderId ? (
          <p className="text-lg font-bold text-[#194A38] mb-8 px-4 py-3 rounded-2xl bg-[#145142]/[0.08] border border-[#145142]/15 w-full">
            {t.cartSection.checkoutOrderNumber}{' '}
            <span className="text-[#ff6b35]">{orderId}</span>
          </p>
        ) : null}
        <WattaLink
          href="/menu"
          onClick={clearClientCart}
          className="inline-flex items-center justify-center min-h-[52px] w-full sm:w-auto px-10 rounded-2xl font-bold text-white bg-gradient-to-r from-[#145142] via-[#1a6b58] to-[#145142] shadow-lg shadow-[#145142]/25 border border-white/20 ring-1 ring-[#ff6b35]/30 hover:brightness-105 active:scale-[0.98] transition"
        >
          {t.cartSection.checkoutBackToMenu}
        </WattaLink>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
