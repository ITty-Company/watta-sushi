import type { Metadata, Viewport } from 'next'
import AppClient from './AppClient'
import DevNoiseCleanup from './components/DevNoiseCleanup'
import './fonts.local'
import './globals.css'
/* Агреговані CSS-файли — 28 окремих файлів об'єднано у 2 для зменшення числа запитів.
   Порядок імпортів збережено: спочатку база (chrome + layout), потім компоненти (UI + модалки).
   Продуктові стилі → product/[id]/layout.tsx (watta-product-page-theme.css + watta-product-composition.css). */
import './watta-base.css'
import './watta-components.css'
import { getRequestLocale } from '@/lib/i18n/serverLocale'
import { buildRootMetadata, getJsonLdDescription } from '@/lib/i18n/seo'
import { wattaToHtmlLang } from '@/lib/i18n/language'
import { headers } from 'next/headers'
import {
  isWattaAuthPathname,
  isWattaHomeHeroPathname,
  isWattaHomeHeroVideoPathname,
  isWattaNotificationsPathname,
  WATTA_HOME_HERO_CRITICAL_CSS,
  WATTA_HTML_ROUTE_BOOT_SCRIPT,
  WATTA_ROUTE_NOTIFICATIONS_CLASS,
  wattaHtmlRouteClassNames,
} from '@/lib/wattaHtmlRouteClass'
import {
  WATTA_HERO_PRIMARY_MP4,
  WATTA_HOME_HERO_POSTER,
} from '@/lib/wattaHeroVideo'
import { WATTA_MOBILE_VH_LOCK_BOOT_SCRIPT } from '@/lib/lockMobileViewportHeight'
import { bootSplashLoadingLabel } from '@/lib/wattaBootSplashLabel'
import { getPublicSiteOrigin, getPublicSiteUrl } from '@/lib/siteUrl'

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
  const htmlClassName = [
    wattaHtmlRouteClassNames(pathname),
    isWattaNotificationsPathname(pathname) ? WATTA_ROUTE_NOTIFICATIONS_CLASS : '',
  ]
    .filter(Boolean)
    .join(' ')
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
  const publicSiteOrigin = getPublicSiteOrigin()
  const publicSiteUrl = getPublicSiteUrl()
  const apiOrigin = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5050'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: 'Watta Sushi',
    image: publicSiteUrl ? `${publicSiteUrl}/watta-sushi.jpg` : '/watta-sushi.jpg',
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
        {/* Preconnect к API бэкенду — экономит ~150-300ms на первом API-запросе */}
        <link rel="dns-prefetch" href={apiOrigin} />
        <link rel="preconnect" href={apiOrigin} crossOrigin="anonymous" />
        {publicSiteOrigin && publicSiteOrigin !== apiOrigin ? (
          <>
            <link rel="dns-prefetch" href={publicSiteOrigin} />
            <link rel="preconnect" href={publicSiteOrigin} crossOrigin="anonymous" />
          </>
        ) : null}
        {/* Preload Open Graph изображения — используется на всех страницах как соц-превью */}
        <link rel="preload" href="/watta-sushi.jpg" as="image" fetchPriority="high" />
        {isHeroVideoRoute ? (
          <link rel="preload" href={WATTA_HOME_HERO_POSTER} as="image" fetchPriority="high" />
        ) : null}

        <script dangerouslySetInnerHTML={{ __html: WATTA_MOBILE_VH_LOCK_BOOT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: WATTA_HTML_ROUTE_BOOT_SCRIPT }} />
        <style dangerouslySetInnerHTML={{ __html: WATTA_BOOT_SPLASH_CRITICAL_CSS }} />
        <style dangerouslySetInnerHTML={{ __html: WATTA_HOME_HERO_CRITICAL_CSS }} />

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
        <AppClient initialLocale={lang}>{children}</AppClient>
      </body>
    </html>
  )
}
