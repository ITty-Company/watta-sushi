'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminView from '../components/AdminView'

function readIsAdmin(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem('currentUser')
    if (!raw) return false
    const p = JSON.parse(raw) as { role?: string }
    return p?.role === 'ADMIN'
  } catch {
    return false
  }
}

export default function AdminPage() {
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const admin = readIsAdmin()
    if (!token) {
      router.replace(`/login?return=${encodeURIComponent('/admin')}`)
      return
    }
    if (!admin) {
      router.replace('/')
      return
    }
    setAllowed(true)
  }, [router])

  if (!allowed) {
    return (
      <div
        className="flex min-h-[100dvh] w-full items-center justify-center bg-[#f2f5f3]"
        aria-busy="true"
        aria-label="Loading"
      >
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#145142]/20 border-t-[#145142]" />
      </div>
    )
  }

  return (
    <div className="flex w-full max-w-[100vw] flex-1 flex-col bg-[#f5f7f6]">
      <AdminView onBack={() => router.push('/')} onSiteMenuClick={() => router.push('/')} />
    </div>
  )
}
