import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer
      className="site-footer-watta mt-auto"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="site-footer-watta__ambient" aria-hidden />
      <div className="site-footer-watta__grain" aria-hidden />
      <div className="site-footer-watta__shine" aria-hidden />

      <div className="site-footer-watta__inner">
        <div className="site-footer-watta__row">
          <div className="site-footer-watta__brand">
            <div className="site-footer-watta__logo-ring">
              <Image
                src="/logo.png"
                alt=""
                width={40}
                height={40}
                className="site-footer-watta__logo-img object-contain"
              />
            </div>
            <div className="site-footer-watta__brand-text">
              <h2 className="site-footer-watta__title">Watta Sushi</h2>
              <p className="site-footer-watta__tagline">Доставка найсмачніших суші</p>
            </div>
          </div>

          <nav className="site-footer-watta__nav" aria-label="Навігація в підвалі">
            <Link href="/menu" className="site-footer-watta__link">
              Меню
            </Link>
            <Link href="/delivery" className="site-footer-watta__link">
              Доставка
            </Link>
            <Link href="/blog" className="site-footer-watta__link">
              Блог
            </Link>
            <Link href="/about" className="site-footer-watta__link">
              Про нас
            </Link>
          </nav>

          <p className="site-footer-watta__legal" suppressHydrationWarning>
            © {new Date().getFullYear()} Watta Sushi. Всі права захищені.
          </p>
        </div>
      </div>
    </footer>
  )
}
