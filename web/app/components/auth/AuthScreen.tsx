'use client'

import React, { useState, useEffect, Suspense } from 'react'
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
  Sparkles,
  ShieldCheck,
} from 'lucide-react'
import LogoBackground from '../LogoBackground'
import { useLanguage } from '../../context/LanguageContext'
import toast from 'react-hot-toast'

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
    <Suspense fallback={<div className="min-h-[100dvh] bg-[#f6f8f7]" aria-hidden />}>
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
      toast.error(
        language === 'uk'
          ? 'Паролі не збігаються'
          : language === 'en'
            ? 'Passwords do not match'
            : 'Пароли не совпадают'
      )
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
      toast.error('Помилка: телефон втрачено. Спробуйте ще раз.')
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
        }
        window.dispatchEvent(new Event('userChanged'))
        toast.success(language === 'uk' ? 'Вітаємо!' : language === 'en' ? 'Welcome!' : 'Добро пожаловать!')
        goAfterAuth()
      } else {
        toast.error((data.message as string) || 'Невірний код')
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
      }
      window.dispatchEvent(new Event('userChanged'))
      toast.success(language === 'uk' ? 'Ви увійшли' : language === 'en' ? 'Signed in' : 'Вы вошли')
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

  if (isVerifying) {
    return (
      <div className="auth-watta-root min-h-[100dvh] flex flex-col relative overflow-hidden bg-[#f6f8f7]">
        <LogoBackground />
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md rounded-3xl bg-white/95 shadow-2xl border border-[#145142]/10 p-8 backdrop-blur-md">
            <div className="flex justify-center mb-4 text-[#145142]">
              <ShieldCheck className="w-14 h-14" strokeWidth={1.25} />
            </div>
            <h2 className="text-2xl font-bold text-center text-[#0f3d32] mb-2">{verifyCopy.title}</h2>
            <p className="text-center text-gray-600 text-sm mb-8 leading-relaxed">{verifyCopy.hint}</p>
            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <input
                type="text"
                inputMode="numeric"
                placeholder="0000"
                value={verificationCode}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '')
                  if (v.length <= 4) setVerificationCode(v)
                }}
                className="text-center text-3xl tracking-[0.4em] font-bold border-2 border-gray-200 rounded-2xl py-4 px-3 focus:border-[#145142] focus:ring-4 focus:ring-[#145142]/15 outline-none transition-all text-[#145142]"
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
                className="text-sm text-gray-500 hover:text-[#145142] transition-colors"
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
      ? 'auth-watta-root min-h-[100dvh] flex flex-col relative overflow-hidden bg-[#f6f8f7]'
      : 'auth-watta-root min-h-[100dvh] h-[100dvh] flex flex-col relative overflow-hidden'

  return (
    <div className={shellClass}>
      <LogoBackground />

      {variant === 'page' ? (
        <header className="relative z-20 flex items-center justify-between px-4 sm:px-8 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#0f3d32] font-semibold hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="w-5 h-5" />
            {t.auth.back}
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Watta Sushi" className="h-10 w-auto object-contain" width={120} height={40} />
          </Link>
          <div className="w-20" aria-hidden />
        </header>
      ) : (
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-40">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0f3d32] px-4 py-2 text-sm font-bold text-white shadow-lg hover:bg-[#145142] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.auth.back}
          </button>
        </div>
      )}

      <div className="relative z-10 flex-1 grid lg:grid-cols-2 gap-0 lg:gap-0 max-w-6xl mx-auto w-full px-4 sm:px-6 pb-10 lg:pb-14 lg:items-stretch">
        {/* Ліва колонка — бренд (десктоп) */}
        <div className="hidden lg:flex flex-col justify-between rounded-3xl m-2 p-10 xl:p-12 bg-gradient-to-br from-[#062a22] via-[#145142] to-[#1a7a63] text-white shadow-2xl border border-white/10 overflow-hidden relative">
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute -left-16 bottom-10 w-48 h-48 rounded-full bg-emerald-300/10 blur-2xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-100 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Watta Sushi
            </div>
            <h2 className="text-3xl xl:text-4xl font-bold leading-tight mb-4">
              {language === 'uk'
                ? 'Улюблені роли — у кілька кліків'
                : language === 'en'
                  ? 'Your favourite rolls in a few taps'
                  : 'Любимые роллы — в пару кликов'}
            </h2>
            <p className="text-white/85 text-base leading-relaxed max-w-md">
              {language === 'uk'
                ? 'Збережіть акаунт — історія замовлень, бонуси та швидке оформлення доставки.'
                : language === 'en'
                  ? 'Keep an account — order history, bonuses and faster checkout.'
                  : 'Аккаунт — история заказов, бонусы и быстрее оформление.'}
            </p>
          </div>
          <p className="relative text-sm text-white/60">
            © {new Date().getFullYear()} Watta Sushi
          </p>
        </div>

        {/* Форма */}
        <div className="flex flex-col justify-center py-6 lg:py-10 lg:pl-4">
          <div className="lg:hidden flex justify-center mb-6">
            <img src="/logo.png" alt="" className="h-16 w-auto object-contain" width={160} height={64} />
          </div>

          <div className="rounded-3xl bg-white shadow-xl border border-gray-100 p-6 sm:p-8 max-w-md mx-auto w-full">
            <div className="flex rounded-2xl bg-[#f0f4f2] p-1 mb-8">
              {variant === 'page' ? (
                <>
                  <Link
                    href={returnUrl !== '/' ? `/login?return=${encodeURIComponent(returnUrl)}` : '/login'}
                    className={`flex-1 text-center py-2.5 rounded-xl text-sm font-bold transition-all ${
                      !isRegister ? 'bg-white text-[#0f3d32] shadow-sm' : 'text-gray-600 hover:text-[#145142]'
                    }`}
                  >
                    {t.auth.login}
                  </Link>
                  <Link
                    href={returnUrl !== '/' ? `/register?return=${encodeURIComponent(returnUrl)}` : '/register'}
                    className={`flex-1 text-center py-2.5 rounded-xl text-sm font-bold transition-all ${
                      isRegister ? 'bg-white text-[#0f3d32] shadow-sm' : 'text-gray-600 hover:text-[#145142]'
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
                    className={`flex-1 text-center py-2.5 rounded-xl text-sm font-bold transition-all ${
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
                    className={`flex-1 text-center py-2.5 rounded-xl text-sm font-bold transition-all ${
                      isRegister ? 'bg-white text-[#0f3d32] shadow-sm' : 'text-gray-600 hover:text-[#145142]'
                    }`}
                  >
                    {t.auth.register}
                  </button>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#0f3d32] mb-1">
              {isRegister ? t.auth.registerTitle : t.auth.loginTitle}
            </h1>
            <p className="text-gray-600 text-sm mb-6">{isRegister ? t.auth.registerDescription : t.auth.loginDescription}</p>

            {error && (
              <div
                role="alert"
                className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {isRegister && (
                <>
                  <label className="auth-watta-label">
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
                  <label className="auth-watta-label">
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
                </>
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
                    className="auth-watta-input pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#145142] p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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

              <button type="submit" disabled={isLoading} className="auth-watta-btn-primary mt-2">
                {isLoading
                  ? '…'
                  : isRegister
                    ? t.auth.createAccount
                    : t.auth.submit}
              </button>
            </form>

            {variant === 'page' && (
              <p className="mt-6 text-center text-sm text-gray-600">
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
                className="mt-6 w-full text-center text-sm font-medium text-[#145142] hover:underline"
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
