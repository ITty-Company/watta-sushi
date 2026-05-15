'use client'

import { useLanguage } from '../context/LanguageContext'

/**
 * Єдиний екран маршрутної завантаження: логотип + швидка індетермінована смуга.
 * Використовується в `app/loading.tsx` і в Suspense fallback — завжди той самий вигляд.
 */
export default function WattaAppRouteLoading() {
  const { t } = useLanguage()
  const label = t.siteAria.loading

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-[100dvh] min-h-[100svh] w-full flex-col items-center justify-center watta-page-bg px-4"
    >
      <div
        className="flex w-full max-w-[min(72vw,260px)] flex-col items-center gap-3 py-6"
        style={{ pointerEvents: 'none' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-splash-1x.webp"
          srcSet="/logo-splash-1x.webp 1x, /logo-splash.webp 2x"
          alt=""
          width={140}
          height={140}
          decoding="async"
          fetchPriority="high"
          className="h-auto w-[min(38vw,150px)] object-contain"
          style={{
            animation: 'wattaRouteLoadLogo 0.95s ease-in-out infinite',
          }}
        />

        <div
          aria-hidden
          className="text-center font-semibold text-[#004d2c]/90"
          style={{
            fontFamily:
              "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            fontSize: '11pt',
          }}
        >
          {label}
        </div>

        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
          className="relative h-1 w-[min(200px,78vw)] overflow-hidden rounded-full bg-[#dfe7e3]"
        >
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 w-[42%] rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, #1a7a5c 45%, #2a9d6f 55%, transparent 100%)',
              animation: 'wattaRouteLoadSweep 0.28s linear infinite',
              willChange: 'transform',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes wattaRouteLoadLogo {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.88; transform: scale(0.98); }
        }
        @keyframes wattaRouteLoadSweep {
          0% { transform: translateX(-105%); }
          100% { transform: translateX(320%); }
        }
      `}</style>
    </div>
  )
}
