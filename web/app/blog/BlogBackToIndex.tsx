'use client'

import Link from 'next/link'
import { ArrowLeft } from '@/lib/wattaInlineIcons'
import { useLanguage } from '@/app/context/LanguageContext'

export default function BlogBackToIndex() {
  const { t } = useLanguage()
  return (
    <Link
      href="/blog"
      className="auth-watta-back-fab watta-blog-back watta-blog-back--inline"
    >
      <span className="auth-watta-back-fab__icon" aria-hidden>
        <ArrowLeft className="auth-watta-back-fab__arrow" strokeWidth={2.5} />
      </span>
      <span className="auth-watta-back-fab__text">{t.blogPublic.backToBlog}</span>
    </Link>
  )
}
