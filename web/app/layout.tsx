import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'
import AppClient from './AppClient'
import DevNoiseCleanup from './components/DevNoiseCleanup'
import './fonts.local'
import './globals.css'
/* Після globals — fixed chrome: лише шапка + капсула чіпів (перебиває правила в globals) */
import './watta-chrome-stable-layout.css'
import './watta-chrome-categories-transparent.css'
import './watta-mobile-viewport-lock.css'
import './watta-tablet-viewport-lock.css'
import './watta-mobile-touch-scroll.css'
import './home-after-hero-intro-tablet-desktop.css'
import './watta-no-backdrop-blur.css'
import './watta-category-strip-bare-chips.css'
import './watta-chrome-scroll-compact.css'
import './watta-cart-add-feedback.css'
import './watta-toast-theme.css'
import './watta-nav-drawer-mobile.css'
import './watta-cart-drawer.css'
import './watta-favorites-add-feedback.css'
import './auth-ninja-modal.css'
import './watta-kitchen-closed-modal.css'
import './review-compose-modal.css'
import './watta-cart-checkout-page.css'
import './watta-cart-mobile.css'
import './watta-boot-splash.css'
import './watta-site-performance.css'
import './watta-scroll-reveal.css'
import './watta-full-menu-section-transition.css'
import './menu-stellar-hero-background.css'
import './watta-instant-tap-feedback.css'
import './watta-product-page-theme.css'
import './watta-product-composition.css'
import './watta-category-pill.css'
/* Останній шар chrome головної — після всіх override категорій */
import './watta-home-chrome-lock.css'
import { getRequestLocale } from '@/lib/i18n/serverLocale'
import { buildRootMetadata, getJsonLdDescription } from '@/lib/i18n/seo'
import { wattaToHtmlLang } from '@/lib/i18n/language'
import { headers } from 'next/headers'
import {
  isWattaAuthPathname,
  isWattaHomeHeroPathname,
  isWattaHomeHeroVideoPathname,
  WATTA_HOME_HERO_CRITICAL_CSS,
  WATTA_HTML_ROUTE_BOOT_SCRIPT,
  wattaHtmlRouteClassNames,
} from '@/lib/wattaHtmlRouteClass'
import { WATTA_HERO_PRIMARY_MP4 } from '@/lib/wattaHeroVideo'
import {
  WATTA_HERO_ROLL_HEAD_PRELOAD_COUNT,
  WATTA_HERO_ROLL_IMAGE_URLS,
} from '@/lib/wattaHeroRollPreload'
import { WATTA_MOBILE_VH_LOCK_BOOT_SCRIPT } from '@/lib/lockMobileViewportHeight'
import { bootSplashLoadingLabel } from '@/lib/wattaBootSplashLabel'

const WATTA_BOOT_SPLASH_CRITICAL_CSS = `
/* Critical: prevent unstyled boot-splash flash (FOUC) from shifting layout. */
.watta-boot-splash-viewport{position:fixed;inset:0;z-index:10049;display:none;box-sizing:border-box;margin:0;padding:calc(20px + env(safe-area-inset-top, 0px)) 16px calc(20px + env(safe-area-inset-bottom, 0px));background:linear-gradient(180deg,#f4f8f5 0%,#e9f1ec 100%);overflow:hidden;place-items:center;grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr);justify-items:center;align-items:center}
.watta-boot-splash-viewport--react{z-index:10050}
html[data-watta-boot-splash-pending='1'] .watta-boot-splash-viewport--static,
html[data-watta-boot-splash='1'] .watta-boot-splash-viewport--react{display:grid!important}
html:not([data-watta-boot-splash-pending='1']) .watta-boot-splash-viewport--static,
html:not([data-watta-boot-splash='1']) .watta-boot-splash-viewport--react{display:none!important;visibility:hidden!important;pointer-events:none!important}
html[data-watta-boot-splash-pending='1'] body{overflow:hidden!important}
`

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getRequestLocale()
  return buildRootMetadata(lang)
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  /** Світлий chrome зверху/знизу (Safari, Android), навіть при системній темній темі */
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#ffffff' },
  ],
  colorScheme: 'only light',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const lang = await getRequestLocale()
  const htmlLang = wattaToHtmlLang(lang)
  const jsonLdDescription = getJsonLdDescription(lang)
  /** Клас hero-маршруту на SSR — boot script + WattaHtmlRouteClass дублюють на клієнті. */
  const pathname = headers().get('x-watta-pathname') || '/'
  const htmlClassName = wattaHtmlRouteClassNames(pathname)
  const isHeroVideoRoute = isWattaHomeHeroVideoPathname(pathname)
  const isHomeRoute = isWattaHomeHeroPathname(pathname)
  const isHomeRollHeroRoute = isHomeRoute
  const bodyClassName = [
    isWattaHomeHeroPathname(pathname) ? 'watta-route-home' : '',
    isWattaAuthPathname(pathname) ? 'watta-auth-route' : '',
  ]
    .filter(Boolean)
    .join(' ') || undefined

  const bootSplashLabel = bootSplashLoadingLabel(htmlLang)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: 'Watta Sushi',
    image: 'https://wattasushi.com.ua/watta-sushi.jpg',
    description: jsonLdDescription,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Улица Центральная 1', // Заменить на реальный адрес
      addressLocality: 'Чернигов',
      addressCountry: 'UA',
    },
    priceRange: '$$',
    telephone: '+31649326549',
  }

  return (
    <html
      lang={htmlLang}
      className={htmlClassName}
      {...(isHeroVideoRoute ? { 'data-watta-client-hero': '1' } : {})}
      {...(isHeroVideoRoute ? { 'data-watta-preroll-retired': '1' } : {})}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: WATTA_MOBILE_VH_LOCK_BOOT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: WATTA_HTML_ROUTE_BOOT_SCRIPT }} />
        <style dangerouslySetInnerHTML={{ __html: WATTA_BOOT_SPLASH_CRITICAL_CSS }} />
        <style dangerouslySetInnerHTML={{ __html: WATTA_HOME_HERO_CRITICAL_CSS }} />
        {!isHeroVideoRoute ? (
          <link rel="preload" href="/logo-splash-1x.webp" as="image" type="image/webp" fetchPriority="high" />
        ) : null}
        {isHomeRollHeroRoute
          ? WATTA_HERO_ROLL_IMAGE_URLS.slice(0, WATTA_HERO_ROLL_HEAD_PRELOAD_COUNT).map((url, index) => (
              <link
                key={url}
                rel="preload"
                href={url}
                as="image"
                type="image/webp"
                {...(index < 4 ? { fetchPriority: 'high' as const } : {})}
              />
            ))
          : null}
        {isHeroVideoRoute && !isHomeRollHeroRoute ? (
          <>
            <link rel="preload" href={WATTA_HERO_PRIMARY_MP4} as="video" type="video/mp4" fetchPriority="high" />
          </>
        ) : null}
      </head>
      <body className={bodyClassName} suppressHydrationWarning>
        <div className="watta-boot-splash-viewport watta-boot-splash-viewport--static" aria-hidden suppressHydrationWarning>
          <div className="watta-load-screen-root watta-load-screen-root--boot-splash" role="status" aria-live="polite">
            <div className="watta-load-screen-stack">
              <div className="watta-load-screen-logo-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-splash-1x.webp"
                  srcSet="/logo-splash-1x.webp 1x, /logo-splash.webp 2x"
                  alt=""
                  width={240}
                  height={220}
                  className="watta-load-screen-logo"
                  decoding="async"
                  loading="eager"
                  fetchPriority="high"
                  draggable={false}
                />
              </div>
              <div className="watta-uiverse-loader">
                <div className="watta-loading-text">{bootSplashLabel}</div>
                <div className="watta-loading-bar-background" aria-hidden>
                  <div className="watta-loading-bar watta-loading-bar--determinate watta-loading-bar--boot-splash-css" />
                </div>
              </div>
            </div>
          </div>
        </div>
        {process.env.NODE_ENV === 'development' ? <DevNoiseCleanup /> : null}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Toaster
          position="top-center"
          reverseOrder={false}
          containerClassName="watta-toast-host"
          containerStyle={{ zIndex: 99999 }}
          toastOptions={{
            className: 'watta-toast',
            duration: 3600,
            style: {
              background: '#ffffff',
              color: 'var(--watta-toast-ink, #1a2e28)',
              boxShadow: '0 10px 28px rgba(26, 46, 40, 0.1), 0 2px 8px rgba(26, 46, 40, 0.06)',
              borderRadius: '9999px',
              padding: '0.55rem 1rem 0.55rem 0.65rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
            },
            success: {
              className: 'watta-toast watta-toast--success',
              iconTheme: { primary: '#5c9010', secondary: '#ffffff' },
            },
            error: {
              className: 'watta-toast watta-toast--error',
              iconTheme: { primary: '#dc4c4c', secondary: '#ffffff' },
            },
            loading: {
              className: 'watta-toast watta-toast--loading',
            },
          }}
        />
        <AppClient initialLocale={lang}>{children}</AppClient>
      </body>
    </html>
  )
}
