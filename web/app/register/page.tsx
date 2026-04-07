import { Suspense } from 'react'
import type { Metadata } from 'next'
import { AuthPageLoader } from '../components/auth/AuthPageLoader'

export const metadata: Metadata = {
  title: 'Реєстрація',
  description: 'Створіть акаунт Watta Sushi.',
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-[#f6f8f7]" aria-hidden />}>
      <AuthPageLoader mode="register" />
    </Suspense>
  )
}
