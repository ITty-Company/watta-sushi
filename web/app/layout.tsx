import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'
import AppClient from './AppClient'
import DevNoiseCleanup from './components/DevNoiseCleanup'
import './fonts.local'
import './globals.css'
import { getRequestLocale } from '@/lib/i18n/serverLocale'
import { buildRootMetadata, getJsonLdDescription } from '@/lib/i18n/seo'
import { wattaToHtmlLang } from '@/lib/i18n/language'

export const dynamic = 'force-dynamic'

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
    <html lang={htmlLang} className="watta-light-chrome" suppressHydrationWarning>
      <body suppressHydrationWarning>
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
