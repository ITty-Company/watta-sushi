'use client'

import React, { useState, useEffect, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { parseAuthHeroVideoUrlsFromApi } from '@/lib/authHeroVideoSettings'
import {
  applyCityPlaceholdersToAuthHeroCopy,
  applyCityPlaceholdersToText,
  parseAuthHeroPhone2VideoUrlsFromApi,
  parseAuthHeroPhoneCopyFromApi,
  resolveAuthHeroPhoneCopy,
  type AuthHeroPhoneCopyMap,
} from '@/lib/authHeroPhoneSettings'
import { useAuthHeroDeliveryCity } from '@/hooks/useAuthHeroDeliveryCity'
import { WATTA_AUTH_HERO_VIDEO_UPDATED_EVENT, type AuthHeroPhonesUpdatedDetail } from '@/lib/wattaAuthHeroVideo'
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
  const router = useRouter()
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
  const [authHeroPhone1Urls, setAuthHeroPhone1Urls] = useState<string[]>([])
  const [authHeroPhone2Urls, setAuthHeroPhone2Urls] = useState<string[]>([])
  const [authHeroPhone1Copy, setAuthHeroPhone1Copy] = useState<AuthHeroPhoneCopyMap>({})
  const [authHeroPhone2Copy, setAuthHeroPhone2Copy] = useState<AuthHeroPhoneCopyMap>({})

  useEffect(() => {
    if (variant !== 'page') return
    const applySettings = (data: Record<string, unknown>) => {
      const urls = parseAuthHeroVideoUrlsFromApi(data)
      if (urls.length > 0) setAuthHeroPhone1Urls(urls)
      setAuthHeroPhone2Urls(parseAuthHeroPhone2VideoUrlsFromApi(data))
      setAuthHeroPhone1Copy(parseAuthHeroPhoneCopyFromApi(data.authHeroPhone1Copy))
      setAuthHeroPhone2Copy(parseAuthHeroPhoneCopyFromApi(data.authHeroPhone2Copy))
    }
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' })
        if (res.ok) applySettings(await res.json())
      } catch {
        /* ignore */
      }
    }
    const onHeroUpdated = (ev: Event) => {
      const detail = (ev as CustomEvent<AuthHeroPhonesUpdatedDetail>).detail
      const fromEvent = parseAuthHeroVideoUrlsFromApi({
        authHeroVideoUrls: detail?.urls,
        authHeroVideoUrl: detail?.url,
      })
      if (fromEvent.length > 0) setAuthHeroPhone1Urls(fromEvent)
      if (detail?.phone2Urls) setAuthHeroPhone2Urls(detail.phone2Urls)
      if (detail?.phone1Copy) setAuthHeroPhone1Copy(parseAuthHeroPhoneCopyFromApi(detail.phone1Copy))
      if (detail?.phone2Copy) setAuthHeroPhone2Copy(parseAuthHeroPhoneCopyFromApi(detail.phone2Copy))
      if (!fromEvent.length && !detail?.phone2Urls) void fetchSettings()
    }
    void fetchSettings()
    window.addEventListener(WATTA_AUTH_HERO_VIDEO_UPDATED_EVENT, onHeroUpdated)
    return () => window.removeEventListener(WATTA_AUTH_HERO_VIDEO_UPDATED_EVENT, onHeroUpdated)
  }, [variant])

  useEffect(() => {
    setIsRegister(initialRegister)
  }, [initialRegister])

  useEffect(() => {
    if (variant !== 'modal') return
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [variant])

  /** Сторінки /login і /register: без «скролу в нікуди» — тільки внутрішня зона форми */
  useEffect(() => {
    if (variant !== 'page') return
    const prevHtml = document.documentElement.style.overflow
    const prevBody = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = prevHtml
      document.body.style.overflow = prevBody
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

  const backFab =
    variant === 'page' ? (
      <Link href="/" className="auth-watta-back-fab">
        <span className="auth-watta-back-fab__icon" aria-hidden>
          <ArrowLeft className="auth-watta-back-fab__arrow" strokeWidth={2.5} />
        </span>
        <span className="auth-watta-back-fab__text">{t.auth.back}</span>
      </Link>
    ) : (
      <button type="button" onClick={onBack} className="auth-watta-back-fab auth-watta-back-fab--modal">
        <span className="auth-watta-back-fab__icon" aria-hidden>
          <ArrowLeft className="auth-watta-back-fab__arrow" strokeWidth={2.5} />
        </span>
        <span className="auth-watta-back-fab__text">{t.auth.back}</span>
      </button>
    )

  if (isVerifying) {
    return (
      <div className="auth-watta-root auth-watta-page-shell auth-watta-page-lock flex flex-col relative overflow-hidden">
        <LogoBackground variant="auth" />
        {backFab}
        <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-3 py-2 sm:px-4 sm:py-4">
          <div className="auth-watta-verify-card w-full max-w-md shrink-0 rounded-2xl border border-white/60 bg-white/90 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
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
      ? 'auth-watta-root auth-watta-page-shell auth-watta-page-lock flex flex-col relative overflow-hidden'
      : 'auth-watta-root min-h-[100dvh] h-[100dvh] flex flex-col relative overflow-hidden'

  return (
    <div className={shellClass}>
      <LogoBackground variant="auth" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-white/22 via-white/5 to-[#145142]/[0.06]" aria-hidden />

      {backFab}

      <div
        className={
          variant === 'page'
            ? 'auth-watta-page-grid relative z-10 mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-3 px-2.5 pt-14 pb-6 sm:px-4 sm:pt-16 sm:pb-8 md:grid md:grid-cols-2 md:items-center md:gap-6 md:px-6 md:pt-[4.5rem] md:pb-10'
            : 'relative z-10 mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col justify-center px-2.5 pt-12 sm:px-4 sm:pt-14'
        }
      >
        {variant === 'page' && (
          <AuthCinemaPanel compact brandName={t.common.brandName} primary={cinemaPrimary} secondary={cinemaSecondary} />
        )}

        {variant === 'page' && (
          <AuthCinemaPanel brandName={t.common.brandName} primary={cinemaPrimary} secondary={cinemaSecondary} />
        )}

        <div className="auth-watta-form-panel flex min-h-0 flex-1 flex-col justify-stretch py-0 sm:justify-center sm:py-2 lg:py-6 lg:pl-1">
          <div
            className={
              variant === 'page'
                ? 'auth-watta-form-card auth-watta-form-card--page auth-watta-form-card--elevated mx-auto flex w-full max-w-md min-h-0 flex-1 flex-col overflow-hidden rounded-2xl sm:max-h-none sm:flex-none sm:rounded-[1.35rem] lg:min-h-0 lg:flex-none'
                : 'auth-watta-form-card auth-watta-form-card--elevated mx-auto flex w-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl sm:max-h-none sm:flex-none sm:rounded-[1.35rem] sm:p-5'
            }
          >
            <div className="shrink-0 p-3 pb-0 pt-2 sm:p-5 sm:pb-0 sm:pt-5">
            <div className="auth-watta-tabs relative mb-2 flex rounded-xl bg-[#e8f0ec]/90 p-0.5 sm:mb-4">
              {variant === 'page' && (
                <span
                  className="auth-watta-tabs__indicator"
                  style={{ transform: isRegister ? 'translateX(100%)' : 'translateX(0)' }}
                  aria-hidden
                />
              )}
              {variant === 'page' ? (
                <>
                  <Link
                    href={returnUrl !== '/' ? `/login?return=${encodeURIComponent(returnUrl)}` : '/login'}
                    className={`auth-watta-tabs__btn relative z-[1] flex-1 rounded-lg py-1.5 text-center text-xs font-bold transition-colors sm:rounded-xl sm:py-2.5 sm:text-sm ${
                      !isRegister ? 'text-[#0f3d32]' : 'text-gray-600 hover:text-[#145142]'
                    }`}
                  >
                    {t.auth.login}
                  </Link>
                  <Link
                    href={returnUrl !== '/' ? `/register?return=${encodeURIComponent(returnUrl)}` : '/register'}
                    className={`auth-watta-tabs__btn relative z-[1] flex-1 rounded-lg py-1.5 text-center text-xs font-bold transition-colors sm:rounded-xl sm:py-2.5 sm:text-sm ${
                      isRegister ? 'text-[#0f3d32]' : 'text-gray-600 hover:text-[#145142]'
                    }`}
                  >
                    {t.auth.register}
                  </Link>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(false)
                      setError(null)
                    }}
                    className={`flex-1 rounded-lg py-2 text-center text-xs font-bold transition-all sm:rounded-xl sm:py-2.5 sm:text-sm ${
                      !isRegister ? 'bg-white text-[#0f3d32] shadow-sm' : 'text-gray-600 hover:text-[#145142]'
                    }`}
                  >
                    {t.auth.login}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(true)
                      setError(null)
                    }}
                    className={`flex-1 rounded-lg py-2 text-center text-xs font-bold transition-all sm:rounded-xl sm:py-2.5 sm:text-sm ${
                      isRegister ? 'bg-white text-[#0f3d32] shadow-sm' : 'text-gray-600 hover:text-[#145142]'
                    }`}
                  >
                    {t.auth.register}
                  </button>
                </>
              )}
            </div>

            <h1 className="mb-0 text-lg font-bold leading-tight text-[#0f3d32] sm:mb-0.5 sm:text-2xl">
              {isRegister ? t.auth.registerTitle : t.auth.loginTitle}
            </h1>
            <p className="auth-watta-form-desc mt-1 line-clamp-2 text-[11px] leading-snug text-gray-600 sm:mt-0 sm:mb-4 sm:text-sm">
              {isRegister ? t.auth.registerDescription : t.auth.loginDescription}
            </p>

            {error && (
              <div
                role="alert"
                className="mt-2 max-h-[3.5rem] overflow-y-auto rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[11px] leading-snug text-red-800 sm:mb-2 sm:max-h-[4.25rem] sm:rounded-xl sm:px-3 sm:py-2 sm:text-[13px]"
              >
                {error}
              </div>
            )}
            </div>

            <div className="auth-watta-form-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3 pb-1 sm:px-5 sm:pb-2 lg:flex-none lg:overflow-visible">
            <form onSubmit={handleSubmit} className="flex flex-col gap-1.5 sm:gap-2">
              {isRegister && (
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2">
                  <label className="auth-watta-label min-w-0">
                    <span className="auth-watta-label-text">{t.auth.name}</span>
                    <span className="auth-watta-input-wrap">
                      <User className="auth-watta-input-icon" />
                      <input
                        type="text"
                        required
                        maxLength={50}
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
                        required
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
              )}

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

              {isRegister && (
                <label className="auth-watta-label">
                  <span className="auth-watta-label-text">
                    {language === 'uk' ? 'Підтвердження пароля' : language === 'en' ? 'Confirm password' : 'Подтверждение'}
                  </span>
                  <span className="auth-watta-input-wrap">
                    <Lock className="auth-watta-input-icon" />
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="auth-watta-input"
                      placeholder="••••••••"
                    />
                  </span>
                </label>
              )}

              <button type="submit" disabled={isLoading} className="auth-watta-btn-primary mt-0.5 sm:mt-1">
                {isLoading
                  ? '…'
                  : isRegister
                    ? t.auth.createAccount
                    : t.auth.submit}
              </button>
            </form>
            </div>

            {variant === 'page' && (
              <p className="shrink-0 border-t border-gray-100/90 bg-white/80 px-3 py-2 text-center text-[10px] leading-tight text-gray-600 backdrop-blur-sm sm:mt-4 sm:border-0 sm:bg-transparent sm:px-5 sm:py-3 sm:text-xs">
                {isRegister ? (
                  <>
                    {t.auth.haveAccount}{' '}
                    <Link href={returnUrl !== '/' ? `/login?return=${encodeURIComponent(returnUrl)}` : '/login'} className="font-semibold text-[#145142] hover:underline">
                      {t.auth.login}
                    </Link>
                  </>
                ) : (
                  <>
                    {t.auth.noAccount}{' '}
                    <Link
                      href={returnUrl !== '/' ? `/register?return=${encodeURIComponent(returnUrl)}` : '/register'}
                      className="font-semibold text-[#145142] hover:underline"
                    >
                      {t.auth.register}
                    </Link>
                  </>
                )}
              </p>
            )}

            {variant === 'modal' && (
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister)
                  setError(null)
                }}
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
