'use client'

import Link from 'next/link'
import { useLanguage } from '@/app/context/LanguageContext'

export default function BlogBackToIndex() {
  const { t } = useLanguage()
  return (
    <Link
      href="/blog"
      className="inline-flex items-center gap-2 text-sm font-bold transition hover:opacity-80"
      style={{ color: '#27AE60' }}
    >
      ← {t.blogPublic.backToBlog}
    </Link>
  )
}
