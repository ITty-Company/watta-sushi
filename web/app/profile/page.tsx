'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Heart, LogOut, ShoppingBag, User, UtensilsCrossed } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { mergeServerFavoritesIntoLocal } from '@/lib/favoritesStorage'

export default function ProfilePage() {
  const router = useRouter()
  const { t } = useLanguage()
  const pp = t.profilePage
  const cp = t.clientProfile
  const [user, setUser] = useState<{ name?: string; email?: string; phone?: string; id?: number } | null>(
    null,
  )

  useEffect(() => {
    const savedUser = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null
    if (!savedUser) {
      router.replace('/login?return=' + encodeURIComponent('/profile'))
      return
    }
    try {
      setUser(JSON.parse(savedUser))
      void mergeServerFavoritesIntoLocal()
    } catch {
      router.replace('/login?return=' + encodeURIComponent('/profile'))
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('currentUser')
    localStorage.removeItem('userId')
    localStorage.removeItem('userOrders')
    window.dispatchEvent(new Event('userChanged'))
    router.push('/')
  }

  if (!user) {
    return (
      <div className="flex min-h-[100dvh] flex-1 items-center justify-center bg-[#f6f8f7] text-[#145142]">
        {cp.loading}
      </div>
    )
  }

  return (
    <div className="watta-public-page-shell flex min-h-[100dvh] flex-1 flex-col overflow-x-hidden bg-[#f2f5f3] p-4 pb-16 pt-8">
      <div className="mx-auto w-full max-w-md">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#145142]/80 transition hover:text-[#145142]"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.auth.back}
        </button>

        <div className="overflow-hidden rounded-3xl border border-[#145142]/10 bg-white shadow-[0_20px_50px_-24px_rgba(20,81,66,0.25)]">
          <div className="bg-gradient-to-br from-[#145142] via-[#1a6b58] to-[#0f3d32] px-6 pb-8 pt-8 text-center text-white">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/30">
              <User className="h-12 w-12 text-white" strokeWidth={1.75} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{user?.name || '—'}</h1>
            <p className="mt-1 text-sm text-white/85">{user?.email || user?.phone || '—'}</p>
          </div>

          <div className="space-y-2 p-4">
            <p className="px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#145142]/50">
              {cp.brandSubtitle}
            </p>
            <Link
              href="/menu"
              className="flex items-center gap-3 rounded-2xl border border-[#145142]/10 bg-[#f8faf9] px-4 py-3.5 text-sm font-bold text-[#0f241e] transition hover:border-[#145142]/25 hover:bg-[#145142]/[0.06]"
            >
              <UtensilsCrossed className="h-5 w-5 shrink-0 text-[#145142]" strokeWidth={2.2} />
              {cp.goMenu}
            </Link>
            <Link
              href="/favorites"
              className="flex items-center gap-3 rounded-2xl border border-[#145142]/10 bg-[#f8faf9] px-4 py-3.5 text-sm font-bold text-[#0f241e] transition hover:border-[#145142]/25 hover:bg-[#145142]/[0.06]"
            >
              <Heart className="h-5 w-5 shrink-0 text-[#145142]" />
              {cp.tabFavorites}
            </Link>
            <Link
              href="/cart"
              className="flex items-center gap-3 rounded-2xl border border-[#145142]/10 bg-[#f8faf9] px-4 py-3.5 text-sm font-bold text-[#0f241e] transition hover:border-[#145142]/25 hover:bg-[#145142]/[0.06]"
            >
              <ShoppingBag className="h-5 w-5 shrink-0 text-[#ff6b35]" />
              {t.cart}
            </Link>
          </div>

          <div className="border-t border-[#145142]/08 p-4">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-3.5 text-sm font-bold text-red-600 transition hover:bg-red-100"
            >
              <LogOut className="h-5 w-5" />
              {pp.logout}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
