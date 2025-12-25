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
      <body>{children}</body>
    </html>
  )
}

