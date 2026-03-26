import type { Metadata } from 'next';
import nextDynamic from 'next/dynamic';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

// Не рендерить AppClient на сервере — иначе подтягивается LanguageContext и падает useContext при SSR
const AppClient = nextDynamic(() => import('./AppClient'), {
  ssr: false,
  // loading: () => (
  //   <div
  //     style={{
  //       minHeight: '100vh',
  //       display: 'flex',
  //       alignItems: 'center',
  //       justifyContent: 'center',
  //       background: '#f5f5f5',
  //     }}
  //   >
  //     <div style={{ textAlign: 'center', color: '#145142' }}>
  //       <div
  //         style={{
  //           width: 48,
  //           height: 48,
  //           margin: '0 auto 12px',
  //           border: '3px solid #145142',
  //           borderTopColor: 'transparent',
  //           borderRadius: '50%',
  //           animation: 'clientOnlySpin 0.8s linear infinite',
  //         }}
  //       />
  //       <span style={{ fontSize: 16 }}>Загрузка...</span>
  //     </div>
  //   </div>
  // ),
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
      <div className="text-center">
        {/* Заменяем сложный инлайновый стиль на простой Tailwind */}
        <div className="w-12 h-12 border-4 border-[#145142] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <span className="text-lg text-[#145142]">Загрузка...</span>
      </div>
    </div>
  ),
});

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
        <Toaster
          position="top-center"
          reverseOrder={false}
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

