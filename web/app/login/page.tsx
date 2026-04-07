import { Suspense } from 'react'
import type { Metadata } from 'next'
import { AuthPageLoader } from '../components/auth/AuthPageLoader'

export const metadata: Metadata = {
  title: 'Вхід',
  description: 'Увійдіть у акаунт Watta Sushi — історія замовлень та бонуси.',
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-[#f6f8f7]" aria-hidden />}>
      <AuthPageLoader mode="login" />
    </Suspense>
  )
}
