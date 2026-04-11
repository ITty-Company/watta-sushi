import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import AppClient from './AppClient';
import DevNoiseCleanup from './components/DevNoiseCleanup';
import './fonts.local';
import './globals.css';

export const dynamic = 'force-dynamic';

// 1. SEO CONFIGURATION
export const metadata: Metadata = {
  metadataBase: new URL('https://wattasushi.com.ua'), // Замените на ваш реальный домен
  title: {
    default: 'Watta Sushi | Доставка суши и роллов',
    template: '%s | Watta Sushi',
  },
  description: 'Самые вкусные суши и роллы в вашем городе. Быстрая доставка, свежие ингредиенты и лучшие рецепты.',
  keywords: ['суши', 'роллы', 'доставка еды', 'Watta Sushi', 'японская кухня'],
  authors: [{ name: 'Watta Sushi Team' }],
  openGraph: {
    title: 'Watta Sushi — Вкусно и быстро',
    description: 'Заказывайте любимые суши с доставкой на дом.',
    url: 'https://wattasushi.com.ua',
    siteName: 'Watta Sushi',
    images: [
      {
        url: '/watta-sushi.jpg', // Убедитесь, что эта картинка есть в public
        width: 1200,
        height: 630,
      },
    ],
    locale: 'ru_RU',
    type: 'website',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png', // Иконка для iPhone
  },
  manifest: '/site.webmanifest', // Нужно создать этот файл в public
};

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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 2. JSON-LD (Структурированные данные для Google)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: 'Watta Sushi',
    image: 'https://wattasushi.com.ua/watta-sushi.jpg',
    description: 'Лучшая доставка суши в городе',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Улица Центральная 1', // Заменить на реальный адрес
      addressLocality: 'Чернигов',
      addressCountry: 'UA',
    },
    priceRange: '$$',
    telephone: '+380000000000',
  };

  return (
    <html lang="ru" className="watta-light-chrome" suppressHydrationWarning>
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
        <AppClient>{children}</AppClient>
      </body>
    </html>
  );
}
