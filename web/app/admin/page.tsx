'use client'

import { useEffect, useState } from 'react'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import dynamic from 'next/dynamic'
import { useLanguage } from '../context/LanguageContext'
import { readIsSiteAdminFromStorage } from '@/lib/isAdminRole'

/**
 * AdminView — найбільший компонент (~6000+ рядків + recharts/stripe). Тягнемо лише після
 * перевірки ролі, інакше будь-який вхід на /admin (включно з редиректами на /login)
 * грузив сотні КБ JS, які ніколи не виконуються.
 */
const AdminView = dynamic(() => import('../components/AdminView'), { ssr: false })

function readIsAdmin(): boolean {
  return readIsSiteAdminFromStorage()
}

export default function AdminPage() {
  const { t } = useLanguage()
  const router = useInstantRouter()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const admin = readIsAdmin()
    if (!admin) {
      const token = localStorage.getItem('token')
      if (!token) {
        router.replace(`/login?return=${encodeURIComponent('/admin')}`)
        return
      }
      router.replace('/')
      return
    }
    setAllowed(true)
  }, [router])

  if (!allowed) {
    return (
      <div
        className="flex min-h-[100dvh] w-full items-center justify-center watta-page-bg"
        aria-busy="true"
        aria-label={t.siteAria.loading}
      >
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-watta-action/20 border-t-[var(--watta-brand-action)]" />
      </div>
    )
  }

  return (
    <div className="admin-page-root watta-page-bg flex w-full max-w-[100vw] min-h-0 flex-1 flex-col">
      <AdminView onBack={() => router.push('/')} />
    </div>
  )
}
