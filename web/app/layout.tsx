import type { Metadata } from 'next';
import nextDynamic from 'next/dynamic';
import { Inter } from 'next/font/google';
import './globals.css';

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

const AppClient = nextDynamic(
  () => import('./AppClient'),
  {
    ssr: true,
    loading: () => (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
        gap: 12,
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid #145142',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'clientOnlySpin 0.8s linear infinite',
        }} />
        <span style={{ color: '#145142', fontSize: 16 }}>Загрузка...</span>
      </div>
    ),
  }
);

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
    <html lang="ru">
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AppClient>{children}</AppClient>
      </body>
    </html>
  );
}