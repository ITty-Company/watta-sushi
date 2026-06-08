'use client'

import { ArrowLeft } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import { useCanGoBack } from '@/hooks/useCanGoBack'

/** «Назад» у compact-chrome: лише якщо є попередня сторінка в історії. */
export default function WattaChromeCompactBack() {
  const { t } = useLanguage()
  const router = useInstantRouter()
  const canGoBack = useCanGoBack()

  if (!canGoBack) return null

  return (
    <button
      type="button"
      className="watta-chrome-compact-back-web"
      onClick={() => router.back()}
      aria-label={t.auth.back}
    >
      <ArrowLeft size={20} className="watta-chrome-compact-back-ico" strokeWidth={2.25} aria-hidden />
      <span className="watta-chrome-compact-back-label">{t.auth.back}</span>
    </button>
  )
}
