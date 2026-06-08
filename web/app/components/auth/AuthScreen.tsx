'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import WattaAppRouteLoading from '../WattaAppRouteLoading'
import AuthNinjaFlow from './AuthNinjaFlow'

export type AuthScreenVariant = 'page' | 'modal'

export type AuthScreenProps = {
  variant?: AuthScreenVariant
  initialRegister?: boolean
  onBack?: () => void
  onSuccess?: () => void
  /** Inline modal (checkout): закрити без навігації */
  onDismiss?: () => void
  /** Модалка поверх поточної сторінки — без зміни URL і без router.push при закритті */
  overlayOnCurrentPage?: boolean
}

type AuthScreenBodyProps = AuthScreenProps & { returnUrl: string }

function AuthScreenPageSuspended(props: AuthScreenProps) {
  const searchParams = useSearchParams()
  const raw = searchParams.get('return') || searchParams.get('next') || '/'
  const returnUrl = raw.startsWith('/') ? raw : '/'
  return <AuthNinjaFlow {...props} returnUrl={returnUrl} />
}

export default function AuthScreen(props: AuthScreenProps) {
  if (props.variant === 'modal') {
    return <AuthNinjaFlow {...props} returnUrl="/" />
  }
  return (
    <Suspense fallback={<WattaAppRouteLoading />}>
      <AuthScreenPageSuspended {...props} />
    </Suspense>
  )
}
