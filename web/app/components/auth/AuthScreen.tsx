'use client'

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import {
  ArrowLeft,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Phone,
  ShieldCheck,
} from 'lucide-react'
import LogoBackground from '../LogoBackground'
import WattaAppRouteLoading from '../WattaAppRouteLoading'
import AuthCinemaPanel from './AuthCinemaPanel'
import { mergeAuthHeroVideoUrls } from '@/lib/authHeroVideoSettings'
import {
  applyCityPlaceholdersToAuthHeroCopy,
  applyCityPlaceholdersToText,
  resolveAuthHeroPhoneCopy,
} from '@/lib/authHeroPhoneSettings'
import { useAuthHeroDeliveryCity } from '@/hooks/useAuthHeroDeliveryCity'
import { useAuthHeroVideos } from '@/hooks/useAuthHeroVideos'
import { useLanguage } from '../../context/LanguageContext'
import toast from 'react-hot-toast'
import { syncFavoritesAfterAuth } from '@/lib/favoritesStorage'

export type AuthScreenVariant = 'page' | 'modal'

export type AuthScreenProps = {
  variant?: AuthScreenVariant
  /** modal: стартова вкладка; page: з /login або /register */
  initialRegister?: boolean
  onBack?: () => void
  onSuccess?: () => void
}

type AuthScreenBodyProps = AuthScreenProps & { returnUrl: string }

function AuthScreenPageSuspended(props: AuthScreenProps) {
  const searchParams = useSearchParams()
  const raw = searchParams.get('return') || searchParams.get('next') || '/'
  const returnUrl = raw.startsWith('/') ? raw : '/'
  return <AuthScreenBody {...props} returnUrl={returnUrl} />
}

export default function AuthScreen(props: AuthScreenProps) {
  if (props.variant === 'modal') {
    return <AuthScreenBody {...props} returnUrl="/" />
  }
  return (
    <Suspense fallback={<WattaAppRouteLoading />}>
      <AuthScreenPageSuspended {...props} />
    </Suspense>
  )
}

/** Усі запити через /api/* — Next проксує на бекенд (той самий домен, без CORS на проді). */
async function authFetch(path: string, body: object) {
  return fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function AuthScreenBody({
  variant = 'page',
  initialRegister = false,
  onBack,
  onSuccess,
  returnUrl,
}: AuthScreenBodyProps) {
  const { t, language } = useLanguage()
  const router = useInstantRouter()
  const deliveryCityName = useAuthHeroDeliveryCity(language, variant === 'page')

  const [isRegister, setIsRegister] = useState(initialRegister)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  })

  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')

  /** 0 — звичайний вхід; 1 — телефон; 2 — код SMS; 3 — новий пароль */
  const [forgotStep, setForgotStep] = useState(0)
  const [forgotPhone, setForgotPhone] = useState('')
  const [forgotCode, setForgotCode] = useState('')
  const [forgotNewPassword, setForgotNewPassword] = useState('')
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('')

  const {
    phone1Urls: authHeroPhone1Urls,
    phone2Urls: authHeroPhone2Urls,
    phone1Copy: authHeroPhone1Copy,
    phone2Copy: authHeroPhone2Copy,
  } = useAuthHeroVideos({ enabled: true })

  useEffect(() => {
    setIsRegister(initialRegister)
  }, [initialRegister])

  const buildAuthPath = useCallback(
    (register: boolean) => {
      const base = register ? '/register' : '/login'
      if (returnUrl !== '/') return `${base}?return=${encodeURIComponent(returnUrl)}`
      return base
    },
    [returnUrl],
  )

  /** Вхід ↔ реєстрація без remount — відео на телефонах не зупиняються. */
  const switchAuthMode = useCallback(
    (register: boolean) => {
      setIsRegister(register)
      setError(null)
      if (variant !== 'page' || typeof window === 'undefined') return
      window.history.replaceState(window.history.state, '', buildAuthPath(register))
    },
    [variant, buildAuthPath],
  )

  useEffect(() => {
    if (variant !== 'modal') return
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [variant])

  const goAfterAuth = () => {
    if (onSuccess) {
      onSuccess()
      return
    }
    const dest = returnUrl.startsWith('/') ? returnUrl : '/'
    router.push(dest)
    router.refresh()
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    const { email, password, confirmPassword, name, phone } = formData
    if (password !== confirmPassword) {
      toast.error(t.auth.passwordMismatch)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const res = await authFetch('/api/auth/register', { email, password, name, phone })
      const data = await res.json()
      if (res.ok) {
        setIsVerifying(true)
      } else {
        toast.error((data.message as string) || t.auth.errors.generic)
      }
    } catch {
      toast.error(t.auth.errors.timeout)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.phone) {
      toast.error(t.auth.phoneLost)
      setIsVerifying(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const res = await authFetch('/api/auth/verify', {
        phone: formData.phone,
        code: verificationCode,
      })
      const data = await res.json()
      if (res.ok) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', data.token as string)
          localStorage.setItem('currentUser', JSON.stringify(data.user))
          if (data.user?.id != null) {
            localStorage.setItem('userId', String(data.user.id))
          }
        }
        window.dispatchEvent(new Event('userChanged'))
        await syncFavoritesAfterAuth()
        toast.success(t.auth.welcomeAfterVerify)
        goAfterAuth()
      } else {
        toast.error((data.message as string) || t.auth.wrongVerificationCode)
        setVerificationCode('')
      }
    } catch {
      toast.error(t.auth.errors.generic)
      setVerificationCode('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const res = await authFetch('/api/auth/login', {
        email: formData.email,
        password: formData.password,
      })
      const data = await res.json()
      if (!res.ok) throw new Error((data.message as string) || t.auth.errors.invalidCredentials)
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', data.token as string)
        localStorage.setItem('currentUser', JSON.stringify(data.user))
        if (data.user?.id != null) {
          localStorage.setItem('userId', String(data.user.id))
        }
      }
      window.dispatchEvent(new Event('userChanged'))
      await syncFavoritesAfterAuth()
      toast.success(t.auth.signedInToast)
      goAfterAuth()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.auth.errors.generic)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    if (isRegister) handleRegister(e)
    else handleLogin(e)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length > 0 && !val.startsWith('380')) val = '380' + val
    if (val.length > 12) val = val.slice(0, 12)
    setFormData({ ...formData, phone: val ? `+${val}` : '' })
  }

  const handleForgotPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length > 0 && !val.startsWith('380')) val = '380' + val
    if (val.length > 12) val = val.slice(0, 12)
    setForgotPhone(val ? `+${val}` : '')
  }

  const exitForgotFlow = () => {
    setForgotStep(0)
    setForgotPhone('')
    setForgotCode('')
    setForgotNewPassword('')
    setForgotConfirmPassword('')
    setError(null)
  }

  const persistAuthSession = async (data: { token?: string; user?: { id?: number } }) => {
    if (typeof window !== 'undefined' && data.token) {
      localStorage.setItem('token', data.token)
      localStorage.setItem('currentUser', JSON.stringify(data.user))
      if (data.user?.id != null) {
        localStorage.setItem('userId', String(data.user.id))
      }
    }
    window.dispatchEvent(new Event('userChanged'))
    await syncFavoritesAfterAuth()
  }

  const handleForgotSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotPhone || forgotPhone.replace(/\D/g, '').length < 12) {
      toast.error(t.auth.errors.phoneInvalid)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const res = await authFetch('/api/auth/forgot-password', { phone: forgotPhone })
      const data = await res.json()
      if (!res.ok) throw new Error((data.message as string) || t.auth.errors.generic)
      toast.success(
        language === 'uk'
          ? 'Код надіслано'
          : language === 'en'
            ? 'Code sent'
            : 'Код отправлен',
      )
      setForgotStep(2)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.auth.errors.generic
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotResendCode = async () => {
    if (!forgotPhone) return
    setIsLoading(true)
    try {
      const res = await authFetch('/api/auth/forgot-password', { phone: forgotPhone })
      const data = await res.json()
      if (!res.ok) throw new Error((data.message as string) || t.auth.errors.generic)
      toast.success(
        language === 'uk'
          ? 'Код надіслано знову'
          : language === 'en'
            ? 'Code resent'
            : 'Код отправлен снова',
      )
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.auth.errors.generic)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (forgotCode.length < 4) {
      toast.error(t.auth.wrongVerificationCode)
      return
    }
    setForgotStep(3)
    setError(null)
  }

  const handleForgotResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (forgotNewPassword.length < 6) {
      toast.error(t.auth.errors.passwordMin)
      return
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      toast.error(t.auth.passwordMismatch)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const res = await authFetch('/api/auth/reset-password', {
        phone: forgotPhone,
        code: forgotCode,
        password: forgotNewPassword,
      })
      const data = await res.json()
      if (!res.ok) throw new Error((data.message as string) || t.auth.errors.generic)
      await persistAuthSession(data)
      toast.success(t.auth.forgotPasswordSuccess)
      exitForgotFlow()
      goAfterAuth()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.auth.errors.generic
      setError(msg)
      toast.error(msg)
      if (msg.toLowerCase().includes('код') || msg.toLowerCase().includes('code')) {
        setForgotCode('')
        setForgotStep(2)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const verifyCopy = {
    title:
      language === 'uk'
        ? 'Підтвердження номера'
        : language === 'en'
          ? 'Verify your number'
          : 'Подтверждение номера',
    hint:
      language === 'uk'
        ? 'Ми надіслали SMS з кодом. У dev режимі код у консолі сервера.'
        : language === 'en'
          ? 'We sent an SMS code. In dev, check the server console.'
          : 'Мы отправили SMS с кодом. В dev код в консоли сервера.',
    back:
      language === 'uk'
        ? 'Назад'
        : language === 'en'
          ? 'Back'
          : 'Назад',
  }

  const cinemaFallbackPrimary = useMemo(
    () => ({
      title: t.auth.desktopHeroTitle,
      subtitle: t.auth.desktopHeroSub,
      benefits: [t.auth.benefitHistory, t.auth.benefitBonuses, t.auth.benefitFast] as [
        string,
        string,
        string,
      ],
    }),
    [t],
  )

  const cinemaFallbackSecondary = useMemo(
    () => ({
      title: applyCityPlaceholdersToText(t.auth.desktopHero2Title, deliveryCityName),
      subtitle: t.auth.desktopHero2Sub,
      benefits: [t.auth.benefitHistory, t.auth.benefitBonuses, t.auth.benefitFast] as [
        string,
        string,
        string,
      ],
    }),
    [t, deliveryCityName],
  )

  const cinemaPrimary = useMemo(() => {
    const copy = applyCityPlaceholdersToAuthHeroCopy(
      resolveAuthHeroPhoneCopy(authHeroPhone1Copy, language, cinemaFallbackPrimary),
      deliveryCityName,
    )
    return {
      title: copy.title,
      subtitle: copy.subtitle,
      benefits: copy.benefits.map((label) => ({ label })) as [
        { label: string },
        { label: string },
        { label: string },
      ],
      videoUrls: authHeroPhone1Urls,
    }
  }, [authHeroPhone1Copy, authHeroPhone1Urls, language, cinemaFallbackPrimary, deliveryCityName])

  const cinemaSecondary = useMemo(() => {
    const copy = applyCityPlaceholdersToAuthHeroCopy(
      resolveAuthHeroPhoneCopy(authHeroPhone2Copy, language, cinemaFallbackSecondary),
      deliveryCityName,
    )
    return {
      title: copy.title,
      subtitle: copy.subtitle,
      benefits: copy.benefits.map((label) => ({ label })) as [
        { label: string },
        { label: string },
        { label: string },
      ],
      videoUrls: authHeroPhone2Urls,
    }
  }, [authHeroPhone2Copy, authHeroPhone2Urls, language, cinemaFallbackSecondary, deliveryCityName])

  const cinemaEmbeddedPrimary = useMemo(
    () => ({
      ...cinemaPrimary,
      videoUrls: mergeAuthHeroVideoUrls(authHeroPhone1Urls, authHeroPhone2Urls),
    }),
    [cinemaPrimary, authHeroPhone1Urls, authHeroPhone2Urls],
  )

  const pageBackLink = (
    <Link href="/" className="auth-watta-back-link">
      <ArrowLeft className="auth-watta-back-link__icon" strokeWidth={2.25} aria-hidden />
      <span>{t.auth.back}</span>
    </Link>
  )

  const modalBackFab = (
    <button type="button" onClick={onBack} className="auth-watta-back-fab auth-watta-back-fab--modal">
      <span className="auth-watta-back-fab__icon" aria-hidden>
        <ArrowLeft className="auth-watta-back-fab__arrow" strokeWidth={2.5} />
      </span>
      <span className="auth-watta-back-fab__text">{t.auth.back}</span>
    </button>
  )

  if (forgotStep > 0) {
    const forgotHint =
      forgotStep === 1
        ? t.auth.forgotPasswordPhoneHint
        : forgotStep === 2
          ? t.auth.forgotPasswordCodeHint
          : t.auth.forgotPasswordNewHint

    return (
      <div className="auth-watta-root auth-watta-page-shell flex flex-col relative">
        <LogoBackground variant="auth" />
        <div className="auth-watta-page-top auth-watta-page-top--centered relative z-10 shrink-0 px-3 pt-2 sm:px-4">
          {pageBackLink}
        </div>
        <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-3 py-2 sm:px-4 sm:py-4">
          <div className="auth-watta-verify-card w-full max-w-md shrink-0 p-4 sm:p-6">
            <div className="mb-2 flex justify-center text-[#145142]">
              <ShieldCheck className="h-11 w-11 sm:h-12 sm:w-12" strokeWidth={1.25} />
            </div>
            <h2 className="mb-1 text-center text-lg font-bold text-[#0f3d32] sm:text-xl">
              {t.auth.forgotPasswordTitle}
            </h2>
            <p className="auth-watta-form-desc mb-4 text-center text-xs leading-snug text-gray-600 sm:mb-5 sm:text-sm">
              {forgotHint}
            </p>

            {error && (
              <div
                role="alert"
                className="mb-3 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] leading-snug text-red-800 sm:text-xs"
              >
                {error}
              </div>
            )}

            {forgotStep === 1 && (
              <form onSubmit={handleForgotSendCode} className="flex flex-col gap-2.5">
                <span className="auth-watta-input-wrap">
                  <Phone className="auth-watta-input-icon" />
                  <input
                    type="tel"
                    required
                    maxLength={13}
                    autoComplete="tel"
                    value={forgotPhone}
                    onChange={handleForgotPhoneChange}
                    className="auth-watta-input w-full"
                    placeholder="+380…"
                    autoFocus
                  />
                </span>
                <button type="submit" disabled={isLoading} className="auth-watta-btn-primary">
                  {isLoading ? '…' : t.auth.forgotPasswordSendCode}
                </button>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleForgotCodeSubmit} className="flex flex-col gap-2.5">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0000"
                  value={forgotCode}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '')
                    if (v.length <= 4) setForgotCode(v)
                  }}
                  className="rounded-xl border-2 border-gray-200 px-3 py-3 text-center text-2xl font-bold tracking-[0.35em] text-[#145142] outline-none transition-all focus:border-[#145142] focus:ring-2 focus:ring-[#145142]/15 sm:text-3xl sm:tracking-[0.4em]"
                  required
                  maxLength={4}
                  autoComplete="one-time-code"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={forgotCode.length < 4}
                  className="auth-watta-btn-primary"
                >
                  {t.auth.forgotPasswordContinue}
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleForgotResendCode}
                  className="text-center text-xs text-[#145142] transition-colors hover:underline sm:text-sm"
                >
                  {t.auth.forgotPasswordResend}
                </button>
              </form>
            )}

            {forgotStep === 3 && (
              <form onSubmit={handleForgotResetPassword} className="flex flex-col gap-2.5">
                <span className="auth-watta-input-wrap">
                  <Lock className="auth-watta-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="auth-watta-input w-full pr-10"
                    placeholder={t.auth.password}
                    autoFocus
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-[#145142]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
                <span className="auth-watta-input-wrap">
                  <Lock className="auth-watta-input-icon" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    className="auth-watta-input w-full"
                    placeholder={
                      language === 'uk'
                        ? 'Підтвердження пароля'
                        : language === 'en'
                          ? 'Confirm password'
                          : 'Подтверждение пароля'
                    }
                  />
                </span>
                <button type="submit" disabled={isLoading} className="auth-watta-btn-primary">
                  {isLoading ? '…' : t.auth.forgotPasswordSave}
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={exitForgotFlow}
              className="mt-3 w-full text-center text-xs text-gray-500 transition-colors hover:text-[#145142] sm:text-sm"
            >
              {verifyCopy.back}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isVerifying) {
    return (
      <div className="auth-watta-root auth-watta-page-shell flex flex-col relative">
        <LogoBackground variant="auth" />
        <div className="auth-watta-page-top auth-watta-page-top--centered relative z-10 shrink-0 px-3 pt-2 sm:px-4">
          {pageBackLink}
        </div>
        <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-3 py-2 sm:px-4 sm:py-4">
          <div className="auth-watta-verify-card w-full max-w-md shrink-0 p-4 sm:p-6">
            <div className="mb-2 flex justify-center text-[#145142]">
              <ShieldCheck className="h-11 w-11 sm:h-12 sm:w-12" strokeWidth={1.25} />
            </div>
            <h2 className="mb-1 text-center text-lg font-bold text-[#0f3d32] sm:text-xl">{verifyCopy.title}</h2>
            <p className="auth-watta-form-desc mb-4 text-center text-xs leading-snug text-gray-600 sm:mb-5 sm:text-sm">
              {verifyCopy.hint}
            </p>
            <form onSubmit={handleVerify} className="flex flex-col gap-2.5">
              <input
                type="text"
                inputMode="numeric"
                placeholder="0000"
                value={verificationCode}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '')
                  if (v.length <= 4) setVerificationCode(v)
                }}
                className="rounded-xl border-2 border-gray-200 px-3 py-3 text-center text-2xl font-bold tracking-[0.35em] text-[#145142] outline-none transition-all focus:border-[#145142] focus:ring-2 focus:ring-[#145142]/15 sm:text-3xl sm:tracking-[0.4em]"
                required
                maxLength={4}
                autoComplete="one-time-code"
                autoFocus
              />
              <button
                type="submit"
                disabled={isLoading || verificationCode.length < 4}
                className="auth-watta-btn-primary"
              >
                {isLoading ? '…' : language === 'uk' ? 'Підтвердити' : language === 'en' ? 'Confirm' : 'Подтвердить'}
              </button>
              <button
                type="button"
                onClick={() => setIsVerifying(false)}
                className="text-center text-xs text-gray-500 transition-colors hover:text-[#145142] sm:text-sm"
              >
                {verifyCopy.back}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  const shellClass =
    variant === 'page'
      ? 'auth-watta-root auth-watta-page-shell flex w-full flex-1 flex-col relative min-h-0'
      : 'auth-watta-root min-h-[100dvh] h-[100dvh] flex flex-col relative overflow-hidden'

  return (
    <div className={shellClass}>
      <LogoBackground variant="auth" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-white/22 via-white/5 to-[#145142]/[0.06]" aria-hidden />

      {variant === 'modal' && modalBackFab}

      <div
        className={
          variant === 'page'
            ? `auth-watta-page-grid auth-watta-page-grid--phone relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-1.5 px-3 pb-3 max-md:h-auto max-md:min-h-0 max-md:flex-none max-md:items-center max-md:gap-0.25 sm:px-4 sm:pb-6 md:h-full md:min-h-0 md:flex-1 md:grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:items-start md:gap-4 md:px-5 md:pb-6 lg:max-w-6xl lg:gap-5 lg:px-6 lg:pb-8${isRegister ? ' auth-watta-page-grid--register' : ''}`
            : 'relative z-10 mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col justify-center px-2.5 pt-12 sm:px-4 sm:pt-14'
        }
      >
        {variant === 'page' && <div className="auth-watta-page-top shrink-0 md:col-span-2">{pageBackLink}</div>}

        {variant === 'page' && (
          <div className="auth-watta-mobile-hero shrink-0 md:hidden w-full max-w-[min(100%,20.25rem)]">
            <AuthCinemaPanel
              compact
              embedded
              brandName={t.common.brandName}
              primary={cinemaEmbeddedPrimary}
              secondary={cinemaSecondary}
            />
          </div>
        )}

        {variant === 'page' && (
          <AuthCinemaPanel brandName={t.common.brandName} primary={cinemaPrimary} secondary={cinemaSecondary} />
        )}

        <div className="auth-watta-form-panel flex min-h-0 flex-col justify-stretch py-0 max-md:w-full max-md:max-w-[min(100%,20.25rem)] max-md:flex-none max-md:shrink-0 max-md:justify-start max-md:py-0 md:flex-none md:justify-center md:py-0 lg:pl-0.5">
          <div
            className={
              variant === 'page'
                ? `auth-watta-form-card auth-watta-form-card--page auth-watta-form-card--elevated auth-watta-form-card--mobile-fit auth-watta-form-card--premium-mobile mx-auto flex w-full max-w-[min(100%,20.25rem)] min-h-0 flex-col overflow-hidden max-md:h-auto max-md:flex-none max-md:shrink-0 md:max-w-[22.5rem] md:h-auto md:flex-none lg:max-w-[23.5rem]${isRegister ? ' auth-watta-form-card--register' : ' auth-watta-form-card--login'}`
                : 'auth-watta-form-card auth-watta-form-card--elevated mx-auto flex w-full min-h-0 flex-1 flex-col overflow-hidden sm:max-h-none sm:flex-none sm:p-5'
            }
          >
            <div className="auth-watta-form-head shrink-0 p-3 pb-0 pt-2.5 max-md:px-3 max-md:pt-2 md:p-4 md:pb-0 md:pt-3.5">
            <div className="auth-watta-tabs relative mb-2 flex rounded-[0.85rem] bg-[#e8f0ec]/95 p-0.5 max-md:mb-2 md:mb-2.5 md:rounded-[0.75rem] md:p-0.5">
              {variant === 'page' && (
                <span
                  className="auth-watta-tabs__indicator"
                  style={{ transform: isRegister ? 'translateX(100%)' : 'translateX(0)' }}
                  aria-hidden
                />
              )}
              <button
                type="button"
                onClick={() => switchAuthMode(false)}
                className={
                  variant === 'page'
                    ? `auth-watta-tabs__btn relative z-[1] flex-1 rounded-lg py-1.5 text-center text-xs font-bold transition-colors md:rounded-[0.65rem] md:py-2 md:text-[0.8125rem] ${
                        !isRegister ? 'text-[#0f3d32]' : 'text-gray-600 hover:text-[#145142]'
                      }`
                    : `flex-1 rounded-lg py-2 text-center text-xs font-bold transition-all sm:rounded-xl sm:py-2.5 sm:text-sm ${
                        !isRegister ? 'bg-white text-[#0f3d32] shadow-sm' : 'text-gray-600 hover:text-[#145142]'
                      }`
                }
              >
                {t.auth.login}
              </button>
              <button
                type="button"
                onClick={() => switchAuthMode(true)}
                className={
                  variant === 'page'
                    ? `auth-watta-tabs__btn relative z-[1] flex-1 rounded-lg py-1.5 text-center text-xs font-bold transition-colors md:rounded-[0.65rem] md:py-2 md:text-[0.8125rem] ${
                        isRegister ? 'text-[#0f3d32]' : 'text-gray-600 hover:text-[#145142]'
                      }`
                    : `flex-1 rounded-lg py-2 text-center text-xs font-bold transition-all sm:rounded-xl sm:py-2.5 sm:text-sm ${
                        isRegister ? 'bg-white text-[#0f3d32] shadow-sm' : 'text-gray-600 hover:text-[#145142]'
                      }`
                }
              >
                {t.auth.register}
              </button>
            </div>

            <div className="auth-watta-form-intro">
              <h1 className="auth-watta-form-title mb-0 text-base leading-tight md:mb-0.5 md:text-xl lg:text-[1.375rem]">
                <span className="auth-watta-form-title__text">
                  {isRegister ? t.auth.registerTitle : t.auth.loginTitle}
                </span>
              </h1>
              <p className={`auth-watta-form-desc mt-1 text-[11px] leading-snug text-gray-600 max-md:line-clamp-1 md:mt-0.5 md:mb-2.5 md:text-xs md:leading-snug lg:mb-3${isRegister ? ' max-md:hidden md:line-clamp-1' : ' md:line-clamp-2'}`}>
                {isRegister ? t.auth.registerDescription : t.auth.loginDescription}
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-2 max-h-[3.5rem] overflow-y-auto rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[11px] leading-snug text-red-800 sm:mb-2 sm:max-h-[4.25rem] sm:rounded-xl sm:px-3 sm:py-2 sm:text-[13px]"
              >
                {error}
              </div>
            )}
            </div>

            <div className="auth-watta-form-scroll min-h-0 max-md:flex-none max-md:overflow-visible flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3 pb-0 max-md:px-3 md:flex-none md:overflow-visible md:px-4 md:pb-2">
            <form onSubmit={handleSubmit} className="auth-watta-form-fields auth-watta-form-fields--stack flex flex-col gap-2 max-md:gap-1.5 md:gap-1.5">
              <div
                className={`auth-watta-register-block${isRegister ? ' grid grid-cols-1 gap-1.5 md:grid-cols-2 md:gap-1.5' : ' auth-watta-register-block--hidden'}`}
                aria-hidden={!isRegister}
              >
                  <label className="auth-watta-label min-w-0">
                    <span className="auth-watta-label-text">{t.auth.name}</span>
                    <span className="auth-watta-input-wrap">
                      <User className="auth-watta-input-icon" />
                      <input
                        type="text"
                        required={isRegister}
                        maxLength={50}
                        tabIndex={isRegister ? 0 : -1}
                        autoComplete="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="auth-watta-input"
                        placeholder={t.auth.name}
                      />
                    </span>
                  </label>
                  <label className="auth-watta-label min-w-0">
                    <span className="auth-watta-label-text">{t.auth.phone}</span>
                    <span className="auth-watta-input-wrap">
                      <Phone className="auth-watta-input-icon" />
                      <input
                        type="tel"
                        required={isRegister}
                        tabIndex={isRegister ? 0 : -1}
                        maxLength={13}
                        autoComplete="tel"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        className="auth-watta-input"
                        placeholder="+380…"
                      />
                    </span>
                  </label>
              </div>

              <label className="auth-watta-label">
                <span className="auth-watta-label-text">{t.auth.email}</span>
                <span className="auth-watta-input-wrap">
                  <Mail className="auth-watta-input-icon" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="auth-watta-input"
                    placeholder="email@…"
                  />
                </span>
              </label>

              <label className="auth-watta-label">
                <span className="auth-watta-label-text">{t.auth.password}</span>
                <span className="auth-watta-input-wrap">
                  <Lock className="auth-watta-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="auth-watta-input pr-10 sm:pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-[#145142] sm:right-3"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                  </button>
                </span>
              </label>

              {!isRegister && (
                <div className="-mt-0.5 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(1)
                      setForgotPhone(formData.phone)
                      setError(null)
                    }}
                    className="text-[11px] font-medium text-[#145142] hover:underline sm:text-xs"
                  >
                    {t.auth.forgotPassword}
                  </button>
                </div>
              )}

              <label
                className={`auth-watta-label auth-watta-register-block${isRegister ? '' : ' auth-watta-register-block--hidden'}`}
                aria-hidden={!isRegister}
              >
                <span className="auth-watta-label-text">
                  {language === 'uk' ? 'Підтвердження пароля' : language === 'en' ? 'Confirm password' : 'Подтверждение'}
                </span>
                <span className="auth-watta-input-wrap">
                  <Lock className="auth-watta-input-icon" />
                  <input
                    type="password"
                    required={isRegister}
                    tabIndex={isRegister ? 0 : -1}
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="auth-watta-input"
                    placeholder="••••••••"
                  />
                </span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="auth-watta-btn-primary auth-watta-btn-primary--shine mt-0.5 sm:mt-1"
              >
                {isLoading
                  ? '…'
                  : isRegister
                    ? t.auth.createAccount
                    : t.auth.submit}
              </button>
            </form>
            </div>

            {variant === 'page' && (
              <p className="auth-watta-mobile-switch shrink-0 px-3 pb-2 pt-1.5 text-center text-[10px] leading-snug text-gray-600 md:hidden">
                {isRegister ? (
                  <>
                    {t.auth.haveAccount}{' '}
                    <button
                      type="button"
                      onClick={() => switchAuthMode(false)}
                      className="font-semibold text-[#145142] hover:underline"
                    >
                      {t.auth.login}
                    </button>
                  </>
                ) : (
                  <>
                    {t.auth.noAccount}{' '}
                    <button
                      type="button"
                      onClick={() => switchAuthMode(true)}
                      className="font-semibold text-[#145142] hover:underline"
                    >
                      {t.auth.register}
                    </button>
                  </>
                )}
              </p>
            )}

            {variant === 'page' && (
              <p className="auth-watta-desktop-switch hidden shrink-0 px-3 py-2.5 text-center text-[11px] leading-snug text-gray-600 sm:mt-3 sm:block sm:px-5 sm:py-3 sm:text-xs">
                {isRegister ? (
                  <>
                    {t.auth.haveAccount}{' '}
                    <button
                      type="button"
                      onClick={() => switchAuthMode(false)}
                      className="font-semibold text-[#145142] hover:underline"
                    >
                      {t.auth.login}
                    </button>
                  </>
                ) : (
                  <>
                    {t.auth.noAccount}{' '}
                    <button
                      type="button"
                      onClick={() => switchAuthMode(true)}
                      className="font-semibold text-[#145142] hover:underline"
                    >
                      {t.auth.register}
                    </button>
                  </>
                )}
              </p>
            )}

            {variant === 'modal' && (
              <button
                type="button"
                onClick={() => switchAuthMode(!isRegister)}
                className="mt-4 w-full shrink-0 text-center text-sm font-medium text-[#145142] hover:underline sm:mt-6"
              >
                {isRegister ? t.auth.haveAccount : t.auth.noAccount}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
