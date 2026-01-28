import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WATTA SUSHI - Доставка суші у Києві',
  description: 'Доставка суші, ролів та азіатської кухні у Києві',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uk">
      <head>
        <link rel="preconnect" href="http://localhost:3001" />
        <link rel="dns-prefetch" href="http://localhost:3001" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#145142" />
      </head>
      <body>{children}</body>
    </html>
  )
}

