import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'
import AppClient from './AppClient'
import DevNoiseCleanup from './components/DevNoiseCleanup'
import './fonts.local'
import './globals.css'
/* Після globals — fixed chrome: лише шапка + капсула чіпів (перебиває правила в globals) */
import './watta-chrome-stable-layout.css'
import './watta-chrome-categories-transparent.css'
import './watta-home-chrome-lock.css'
import './home-after-hero-intro-tablet-desktop.css'
import { getRequestLocale } from '@/lib/i18n/serverLocale'
import { buildRootMetadata, getJsonLdDescription } from '@/lib/i18n/seo'
import { wattaToHtmlLang } from '@/lib/i18n/language'
import {
  WATTA_HOME_HERO_CRITICAL_CSS,
  WATTA_HTML_ROUTE_BOOT_SCRIPT,
} from '@/lib/wattaHtmlRouteClass'
import { LOCATION_PICKER_MASCOT_SRC } from '@/lib/locationPickerMascot'

const BASE_HTML_CLASS = 'watta-light-chrome'

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
  /** Клас hero-маршруту — синхронний boot script + WattaHtmlRouteClass на клієнті (без headers на кожен RSC). */
  const htmlClassName = BASE_HTML_CLASS
  const bodyClassName = undefined

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
    <html lang={htmlLang} className={htmlClassName} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: WATTA_HTML_ROUTE_BOOT_SCRIPT }} />
        <style dangerouslySetInnerHTML={{ __html: WATTA_HOME_HERO_CRITICAL_CSS }} />
        <link rel="preload" href={LOCATION_PICKER_MASCOT_SRC} as="image" type="image/png" fetchPriority="high" />
      </head>
      <body className={bodyClassName} suppressHydrationWarning>
        <DevNoiseCleanup />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Toaster
          position="top-center"
          reverseOrder={false}
          containerStyle={{ zIndex: 99999 }}
          toastOptions={{
            style: { borderRadius: '0.75rem' },
            success: { iconTheme: { primary: '#145142', secondary: '#ffffff' } },
          }}
        />
        <AppClient initialLocale={lang}>{children}</AppClient>
      </body>
    </html>
  )
}
