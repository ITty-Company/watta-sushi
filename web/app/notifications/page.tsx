'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Bell, X } from 'lucide-react'
import { useLanguage } from '@/app/context/LanguageContext'

const ACCENT = '#FF5C00'

export default function NotificationsPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const n = t.notifications

  return (
    <div className="watta-public-page-shell min-h-screen flex-1 px-4 py-8 sm:py-10" style={{ backgroundColor: '#f5f5f7' }}>
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-gray-800 shadow-sm transition hover:bg-gray-50"
            aria-label={t.auth.back}
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">{n.title}</h1>
        </div>

        <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center sm:py-16">
            <div className="relative mb-8">
              <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-gray-100" aria-hidden>
                <Bell size={44} className="text-gray-500" strokeWidth={1.5} />
              </div>
              <div
                className="absolute -left-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-md"
                style={{ backgroundColor: ACCENT }}
                aria-hidden
              >
                <X size={16} className="text-white" strokeWidth={3} />
              </div>
            </div>
            <h2 className="mb-2 text-lg font-black text-gray-900 sm:text-xl">{n.empty}</h2>
            <p className="max-w-[280px] text-sm leading-relaxed text-gray-500 sm:text-[15px]">{n.emptySubtext}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
