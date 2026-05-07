'use client'

import { useEffect, useState } from 'react'
import {
  WATTA_LANG_COOKIE,
  parseWattaLanguage,
  wattaToHtmlLang,
  type WattaLanguage,
} from '@/lib/i18n/language'
import { getErrorPageForLanguage } from './context/LanguageContext'

function readLangFromCookie(): WattaLanguage {
  if (typeof document === 'undefined') return 'uk'
  const raw = document.cookie || ''
  const m = raw.match(
    new RegExp(`(?:^|; )${WATTA_LANG_COOKIE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`),
  )
  const v = m?.[1] ? decodeURIComponent(m[1]) : ''
  return parseWattaLanguage(v)
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [lang, setLang] = useState<WattaLanguage>('uk')
  useEffect(() => {
    setLang(readLangFromCookie())
  }, [])
  const e = getErrorPageForLanguage(lang)
  void error
  return (
    <html lang={wattaToHtmlLang(lang)}>
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#ffffff' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            color: '#333',
          }}
        >
          <h1 style={{ color: '#145142', marginBottom: 16 }}>{e.title}</h1>
          <p style={{ marginBottom: 24, textAlign: 'center' }}>{e.body}</p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: '12px 24px',
              background: '#145142',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            {e.retry}
          </button>
        </div>
      </body>
    </html>
  )
}
