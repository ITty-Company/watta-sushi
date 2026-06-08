'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'
import AuthNinjaFlow from '@/app/components/auth/AuthNinjaFlow'
import { registerWattaAuthModalOpener, type OpenWattaAuthOptions } from '@/lib/openWattaAuth'
import { useWattaNavDrawerOpenSync } from '@/hooks/useWattaNavDrawerOpenSync'

export type AuthModalContextValue = {
  open: (options?: OpenWattaAuthOptions) => void
  close: () => void
  isOpen: boolean
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null)

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const [returnUrl, setReturnUrl] = useState('/')
  const [register, setRegister] = useState(false)
  const [onSuccessExtra, setOnSuccessExtra] = useState<(() => void) | undefined>()

  const open = useCallback((options: OpenWattaAuthOptions = {}) => {
    setReturnUrl(options.returnUrl ?? '/')
    setRegister(options.register ?? false)
    setOnSuccessExtra(options.onSuccess)
    setOpen(true)
  }, [])

  const close = useCallback(() => setOpen(false), [])

  useLayoutEffect(() => {
    registerWattaAuthModalOpener(open)
    return () => registerWattaAuthModalOpener(null)
  }, [open])

  useWattaNavDrawerOpenSync(isOpen)

  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    const body = document.body
    if (isOpen) {
      root.setAttribute('data-watta-auth-modal-open', '')
      body.classList.add('watta-auth-modal-open')
      const prev = body.style.overflow
      body.style.overflow = 'hidden'
      return () => {
        root.removeAttribute('data-watta-auth-modal-open')
        body.classList.remove('watta-auth-modal-open')
        body.style.overflow = prev
      }
    }
    root.removeAttribute('data-watta-auth-modal-open')
    body.classList.remove('watta-auth-modal-open')
    return undefined
  }, [isOpen])

  const value = useMemo<AuthModalContextValue>(
    () => ({ open, close, isOpen }),
    [open, close, isOpen],
  )

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      {isOpen ? (
        <AuthModalPortal
          returnUrl={returnUrl}
          initialRegister={register}
          onClose={close}
          onSuccessExtra={onSuccessExtra}
        />
      ) : null}
    </AuthModalContext.Provider>
  )
}

function AuthModalPortal({
  returnUrl,
  initialRegister,
  onClose,
  onSuccessExtra,
}: {
  returnUrl: string
  initialRegister: boolean
  onClose: () => void
  onSuccessExtra?: () => void
}) {
  return (
    <AuthNinjaFlow
      key={`${returnUrl}:${initialRegister ? 'r' : 'l'}`}
      returnUrl={returnUrl}
      initialRegister={initialRegister}
      overlayOnCurrentPage
      onDismiss={onClose}
      onSuccess={() => {
        onSuccessExtra?.()
      }}
    />
  )
}

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext)
  if (!ctx) {
    throw new Error('useAuthModal must be used within AuthModalProvider')
  }
  return ctx
}

export function useOptionalAuthModal(): AuthModalContextValue | null {
  return useContext(AuthModalContext)
}
