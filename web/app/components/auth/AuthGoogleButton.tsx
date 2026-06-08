'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import toast from 'react-hot-toast'
import { useLanguage } from '../../context/LanguageContext'

type GoogleCredentialResponse = {
  credential?: string
}

type GoogleIdApi = {
  initialize: (config: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
    locale?: string
    context?: 'signin' | 'signup' | 'use'
  }) => void
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: 'standard' | 'icon'
      theme?: 'outline' | 'filled_blue' | 'filled_black'
      size?: 'large' | 'medium' | 'small'
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
      shape?: 'rectangular' | 'pill' | 'circle' | 'square'
      logo_alignment?: 'left' | 'center'
      width?: number
      locale?: string
    },
  ) => void
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleIdApi
      }
    }
  }
}

const GIS_SCRIPT = 'https://accounts.google.com/gsi/client'
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID?.trim() ?? ''

const GIS_LOCALE: Record<string, string> = {
  uk: 'uk',
  ru: 'ru',
  en: 'en',
  nl: 'nl',
}

function GoogleMarkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.223 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C33.64 6.053 28.991 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C33.64 6.053 28.991 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  )
}

type AuthGoogleButtonProps = {
  disabled?: boolean
  isRegister?: boolean
  onCredential: (idToken: string) => void | Promise<void>
}

export default function AuthGoogleButton({
  disabled = false,
  isRegister = false,
  onCredential,
}: AuthGoogleButtonProps) {
  const { t, language } = useLanguage()
  const a = t.auth
  const wrapRef = useRef<HTMLDivElement>(null)
  const gisHostRef = useRef<HTMLDivElement>(null)
  const [scriptReady, setScriptReady] = useState(false)
  const [gisReady, setGisReady] = useState(false)
  const onCredentialRef = useRef(onCredential)
  const isConfigured = Boolean(GOOGLE_CLIENT_ID)

  useEffect(() => {
    onCredentialRef.current = onCredential
  }, [onCredential])

  const label = a.ninjaGoogleContinue

  const renderGisButton = useCallback(() => {
    const wrap = wrapRef.current
    const host = gisHostRef.current
    const api = window.google?.accounts?.id
    if (!wrap || !host || !api || !GOOGLE_CLIENT_ID) return

    host.replaceChildren()
    api.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        const token = response.credential
        if (token) void onCredentialRef.current(token)
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      locale: GIS_LOCALE[language] ?? 'en',
      context: 'signin',
    })
    api.renderButton(host, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: wrap.clientWidth || 352,
      locale: GIS_LOCALE[language] ?? 'en',
    })
    setGisReady(true)
  }, [isRegister, language])

  useEffect(() => {
    if (!scriptReady || disabled || !isConfigured) return
    renderGisButton()
  }, [disabled, isConfigured, renderGisButton, scriptReady])

  const handleFallbackClick = () => {
    if (disabled || isConfigured) return
    toast.error(a.ninjaGoogleNotConfigured)
  }

  return (
    <div
      ref={wrapRef}
      className={`auth-ninja-google-wrap${disabled ? ' auth-ninja-google-wrap--disabled' : ''}${
        gisReady ? ' auth-ninja-google-wrap--gis-ready' : ''
      }`}
    >
      {isConfigured ? (
        <Script
          src={GIS_SCRIPT}
          strategy="afterInteractive"
          onLoad={() => setScriptReady(true)}
        />
      ) : null}

      <button
        type="button"
        className="auth-ninja-google-btn"
        disabled={disabled}
        onClick={handleFallbackClick}
        aria-hidden={gisReady}
        tabIndex={gisReady ? -1 : 0}
      >
        <span className="auth-ninja-google-btn__icon">
          <GoogleMarkIcon />
        </span>
        <span className="auth-ninja-google-btn__label">{label}</span>
      </button>

      {isConfigured ? (
        <div
          ref={gisHostRef}
          className="auth-ninja-google-gis"
          aria-label={label}
        />
      ) : null}
    </div>
  )
}
