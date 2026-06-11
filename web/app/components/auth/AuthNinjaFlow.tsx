'use client'

import { useCallback, useEffect, useState } from 'react'
import WattaLink from '../WattaLink'
import { X } from '@/lib/wattaInlineIcons'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import { useLanguage } from '../../context/LanguageContext'
import AuthPhoneField, { buildAuthPhoneE164 } from './AuthPhoneField'
import AuthGoogleButton from './AuthGoogleButton'
import { completeAuthSession } from '@/lib/authCompleteSession'
import { isValidCheckoutPhone } from '@/lib/checkoutPhone'
import { DEFAULT_PHONE_COUNTRY_ISO, findPhoneCountryByIso } from '@/lib/phoneCountries'
import toast from 'react-hot-toast'
import type { AuthScreenProps } from './AuthScreen'

type Step = 'form' | 'code'

async function authFetch(path: string, body: object) {
  return fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

type AuthNinjaFlowProps = AuthScreenProps & { returnUrl: string }

export default function AuthNinjaFlow({
  initialRegister = false,
  onSuccess,
  onDismiss,
  returnUrl,
  overlayOnCurrentPage = false,
}: AuthNinjaFlowProps) {
  const { t } = useLanguage()
  const router = useInstantRouter()
  const a = t.auth
  const sf = t.siteFooter

  const [isRegister, setIsRegister] = useState(initialRegister)
  const [step, setStep] = useState<Step>('form')
  const [isLoading, setIsLoading] = useState(false)
  const [phoneLocal, setPhoneLocal] = useState('')
  const [phoneCountryIso, setPhoneCountryIso] = useState(DEFAULT_PHONE_COUNTRY_ISO)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [fullPhone, setFullPhone] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsRegister(initialRegister)
    setStep('form')
    setCode('')
  }, [initialRegister])

  const finishAuthUi = useCallback(() => {
    onDismiss?.()
    onSuccess?.()
  }, [onDismiss, onSuccess])

  const goAfterAuth = useCallback((options?: { skipClose?: boolean }) => {
    if (!options?.skipClose) finishAuthUi()
    const dest =
      returnUrl.startsWith('/') && returnUrl !== '/login' && returnUrl !== '/register'
        ? returnUrl
        : '/'
    if (overlayOnCurrentPage) {
      if (typeof window !== 'undefined') {
        const current = window.location.pathname + window.location.search
        if (dest !== current && dest !== '/') {
          router.push(dest)
        }
      }
      router.refresh()
      return
    }
    router.push(dest)
    router.refresh()
  }, [finishAuthUi, returnUrl, router, overlayOnCurrentPage])

  const stayOnPage = overlayOnCurrentPage || Boolean(onDismiss)

  const closeTo = useCallback(() => {
    if (onDismiss) {
      onDismiss()
      return
    }
    if (stayOnPage) return
    const dest = returnUrl.startsWith('/') && returnUrl !== '/login' && returnUrl !== '/register' ? returnUrl : '/'
    router.push(dest)
  }, [onDismiss, returnUrl, router, stayOnPage])

  /** Юридичні посилання в модалці: закриваємо overlay, далі WattaLink веде на /offer|/privacy. */
  const openLegalDoc = useCallback(() => {
    onDismiss?.()
  }, [onDismiss])

  const switchMode = useCallback((register: boolean) => {
    setIsRegister(register)
    setStep('form')
    setCode('')
    setError(null)
  }, [])

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    const dial = findPhoneCountryByIso(phoneCountryIso)?.dial ?? '380'
    const phone = buildAuthPhoneE164(phoneLocal, dial)
    if (!isValidCheckoutPhone(phone)) {
      toast.error(a.errors.phoneInvalid)
      return
    }
    if (isRegister) {
      if (!name.trim()) {
        toast.error(a.errors.required)
        return
      }
      if (!termsAccepted) {
        toast.error(a.ninjaTermsRequired)
        return
      }
    }

    setIsLoading(true)
    setError(null)
    try {
      const path = isRegister ? '/api/auth/register/send-code' : '/api/auth/login/send-code'
      const body = isRegister ? { name: name.trim(), phone } : { phone }
      const res = await authFetch(path, body)
      const data = await res.json()
      if (!res.ok) {
        throw new Error((data.message as string) || a.errors.generic)
      }
      setFullPhone(phone)
      setStep('code')
      setCode('')
      toast.success(a.ninjaCodeSent)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : a.errors.generic
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length < 4) {
      toast.error(a.wrongVerificationCode)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const res = await authFetch('/api/auth/verify', { phone: fullPhone, code })
      const data = await res.json()
      if (!res.ok) throw new Error((data.message as string) || a.wrongVerificationCode)
      await completeAuthSession(data)
      toast.success(isRegister ? a.welcomeAfterVerify : a.signedInToast)
      goAfterAuth()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : a.errors.generic
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleCredential = async (idToken: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await authFetch('/api/auth/google', { idToken })
      const data = await res.json()
      if (!res.ok) throw new Error((data.message as string) || a.errors.generic)
      await completeAuthSession(data)
      const isNewUser = data.isNewUser === true
      finishAuthUi()
      toast.success(isNewUser ? a.welcomeAfterVerify : a.signedInToast)
      goAfterAuth({ skipClose: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : a.errors.generic
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!fullPhone) return
    setIsLoading(true)
    try {
      const path = isRegister ? '/api/auth/register/send-code' : '/api/auth/login/send-code'
      const body = isRegister ? { name: name.trim(), phone: fullPhone } : { phone: fullPhone }
      const res = await authFetch(path, body)
      const data = await res.json()
      if (!res.ok) throw new Error((data.message as string) || a.errors.generic)
      toast.success(a.forgotCodeResent)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : a.errors.generic)
    } finally {
      setIsLoading(false)
    }
  }

  const title = isRegister
    ? a.registerTitle
    : step === 'code'
      ? a.verifyTitle
      : a.ninjaLoginTitle

  const subtitle =
    step === 'code'
      ? a.verifyHint
      : isRegister
        ? a.registerDescription
        : a.ninjaLoginPhoneHint

  return (
    <div className="auth-ninja-overlay">
      <button type="button" className="auth-ninja-overlay__backdrop" aria-label={a.ninjaCloseAria} onClick={closeTo} />
      <div className="auth-ninja-modal" role="dialog" aria-modal="true" aria-labelledby="auth-ninja-title">
        <button type="button" className="auth-ninja-modal__close" onClick={closeTo} aria-label={a.ninjaCloseAria}>
          <X size={22} strokeWidth={2} aria-hidden />
        </button>

        <h1 id="auth-ninja-title" className="auth-ninja-modal__title">
          {title}
        </h1>
        <p className="auth-ninja-modal__subtitle">{subtitle}</p>

        {error ? (
          <div role="alert" className="auth-ninja-modal__error">
            {error}
          </div>
        ) : null}

        {step === 'form' ? (
          <form onSubmit={handleSendCode} className="auth-ninja-modal__form">
            <AuthGoogleButton
              disabled={isLoading}
              isRegister={isRegister}
              onCredential={handleGoogleCredential}
            />

            <div className="auth-ninja-divider" aria-hidden>
              <span>{a.ninjaOrDivider}</span>
            </div>

            {isRegister ? (
              <label className="auth-ninja-field">
                <span className="auth-ninja-field__label">{a.name}</span>
                <input
                  type="text"
                  required
                  maxLength={50}
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="auth-ninja-field__input"
                  placeholder={a.name}
                />
              </label>
            ) : null}

            <div className="auth-ninja-field auth-ninja-field--phone">
              {isRegister ? <span className="auth-ninja-field__label">{a.phone}</span> : null}
              <AuthPhoneField
                value={phoneLocal}
                onChange={setPhoneLocal}
                countryIso={phoneCountryIso}
                onCountryIsoChange={setPhoneCountryIso}
                autoFocus={false}
                aria-label={a.phone}
              />
            </div>

            {isRegister ? (
              <div className="auth-ninja-terms">
                <input
                  id="auth-ninja-terms-check"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="auth-ninja-terms__check"
                />
                <p className="auth-ninja-terms__text">
                  <label htmlFor="auth-ninja-terms-check" className="auth-ninja-terms__affirm">
                    {a.ninjaTermsPrefix}{' '}
                  </label>
                  <WattaLink href="/offer" className="auth-ninja-terms__link" onClick={openLegalDoc}>
                    {sf.publicOffer}
                  </WattaLink>{' '}
                  <label htmlFor="auth-ninja-terms-check" className="auth-ninja-terms__affirm">
                    {a.ninjaTermsAnd}{' '}
                  </label>
                  <WattaLink href="/privacy" className="auth-ninja-terms__link" onClick={openLegalDoc}>
                    {sf.privacy}
                  </WattaLink>
                </p>
              </div>
            ) : null}

            <button type="submit" disabled={isLoading} className="auth-ninja-btn-primary">
              {isLoading ? '…' : isRegister ? a.ninjaContinue : a.ninjaLoginByPhone}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="auth-ninja-modal__form">
            <input
              type="text"
              inputMode="numeric"
              placeholder="0000"
              value={code}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '')
                if (v.length <= 4) setCode(v)
              }}
              className="auth-ninja-code-input"
              required
              maxLength={4}
              autoComplete="one-time-code"
              autoFocus
            />
            <button type="submit" disabled={isLoading || code.length < 4} className="auth-ninja-btn-primary">
              {isLoading ? '…' : a.confirmPhone}
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => void handleResendCode()}
              className="auth-ninja-btn-secondary"
            >
              {a.forgotPasswordResend}
            </button>
            <button
              type="button"
              className="auth-ninja-link-back"
              onClick={() => {
                setStep('form')
                setCode('')
                setError(null)
              }}
            >
              {a.back}
            </button>
          </form>
        )}

        {step === 'form' ? (
          <p className="auth-ninja-modal__switch">
            {isRegister ? (
              <>
                {a.haveAccount}{' '}
                <button type="button" onClick={() => switchMode(false)} className="auth-ninja-modal__switch-btn">
                  {a.login}
                </button>
              </>
            ) : (
              <>
                {a.noAccount}{' '}
                <button type="button" onClick={() => switchMode(true)} className="auth-ninja-modal__switch-btn">
                  {a.register}
                </button>
              </>
            )}
          </p>
        ) : null}
      </div>
    </div>
  )
}
