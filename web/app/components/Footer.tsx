'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Instagram, Send } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { WATTA_INSTAGRAM_URL } from '@/lib/wattaSiteDefaults'

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64v-3.4a6.33 6.33 0 0 0-1.07-.09A6.34 6.34 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43V9.07a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.5z" />
    </svg>
  )
}

function VisaMark() {
  return (
    <span className="site-footer-watta__pay-mark site-footer-watta__pay-mark--visa" aria-hidden>
      VISA
    </span>
  )
}

function MastercardMark() {
  return (
    <span className="site-footer-watta__pay-mark site-footer-watta__pay-mark--mc" aria-hidden>
      Mastercard
    </span>
  )
}

function IdealMark() {
  return (
    <span className="site-footer-watta__pay-mark site-footer-watta__pay-mark--ideal" aria-hidden>
      iDEAL
    </span>
  )
}

function localizedName(
  language: string,
  obj: Record<string, unknown>,
  field: string,
): string {
  const suffix = language === 'uk' ? 'ua' : language
  return String(
    obj[`${field}_${suffix}`] ??
      obj[`${field}_${language}`] ??
      obj[`${field}_ru`] ??
      obj[field] ??
      '',
  ).trim()
}

export default function Footer() {
  const { t, language } = useLanguage()
  const sf = t.siteFooter
  const nav = t.navigation
  const year = new Date().getFullYear()
  const legal = nav.footerLegal.replace('{{year}}', String(year))
  const [locationLines, setLocationLines] = useState<string[]>([])

  const phones = [
    { label: sf.phone1, href: 'tel:+380670000001' },
    { label: sf.phone2, href: 'tel:+380660000002' },
    { label: sf.phone3, href: 'tel:+380930000003' },
  ]

  const pillLinks = [
    { href: '/menu', label: nav.menu },
    { href: '/promotions', label: nav.promotions },
    { href: '/delivery', label: nav.deliveryPage },
    { href: '/blog', label: sf.blog },
    { href: '/reviews', label: sf.reviews },
    { href: '/about', label: nav.about },
    { href: '/contacts', label: nav.contacts },
  ]

  /** Колонка «Навігація» — ті самі основні сторінки, що й у drawer / pills, плюс кошик, профіль, сповіщення, вхід. */
  const navLinks = [
    { href: '/', label: nav.home },
    { href: '/menu', label: nav.menu },
    { href: '/promotions', label: nav.promotions },
    { href: '/delivery', label: nav.delivery },
    { href: '/blog', label: sf.blog },
    { href: '/reviews', label: sf.reviews },
    { href: '/about', label: nav.about },
    { href: '/contacts', label: nav.contacts },
    { href: '/favorites', label: nav.favorites },
    { href: '/cart', label: t.cart },
    { href: '/profile', label: t.profile },
    { href: '/notifications', label: t.notifications.title },
    { href: '/login', label: t.auth.login },
    { href: '/register', label: t.auth.register },
  ]

  useEffect(() => {
    let dead = false
    fetch('/api/countries')
      .then((r) => r.json())
      .then((data: unknown) => {
        if (dead || !Array.isArray(data)) return
        const lines: string[] = []
        for (const row of data as Record<string, unknown>[]) {
          if (row.isActive === false) continue
          const countryName = localizedName(language, row, 'name')
          const citiesRaw = Array.isArray(row.cities) ? row.cities : []
          for (const c of citiesRaw as Record<string, unknown>[]) {
            if (c.isActive === false) continue
            const cityName = localizedName(language, c, 'name')
            if (!cityName) continue
            lines.push(countryName ? `${cityName}, ${countryName}` : cityName)
          }
        }
        lines.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
        setLocationLines(lines)
      })
      .catch(() => {
        if (!dead) setLocationLines([])
      })
    return () => {
      dead = true
    }
  }, [language])

  return (
    <footer
      className="site-footer-watta site-footer-watta--light shrink-0 w-full"
      style={{
        /* Нижня навігація прихована в CSS — великий запас більше не потрібен; лишаємо safe-area + невеликий відступ */
        paddingBottom:
          'max(1rem, calc(0.5rem + env(safe-area-inset-bottom, 0px)))',
      }}
    >
      <div className="site-footer-watta__inner">
        <div className="site-footer-watta__hero-row">
          <div className="site-footer-watta__brand-block">
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
              <p className="site-footer-watta__tagline">{nav.drawerBrandLine}</p>
            </div>
          </div>

          <nav className="site-footer-watta__pills" aria-label={sf.navAria}>
            {pillLinks.map(({ href, label }) => (
              <Link key={href + label} href={href} className="site-footer-watta__pill">
                {label}
              </Link>
            ))}
          </nav>

          <p className="site-footer-watta__legal-pill" suppressHydrationWarning>
            {legal}
          </p>
        </div>

        <div className="site-footer-watta__divider" aria-hidden />

        <div className="site-footer-watta__grid">
          {/* Колонка «Оформити замовлення» + телефони — перша (найширша на десктопі). */}
          <div className="site-footer-watta__col">
            <h3 className="site-footer-watta__col-title">{sf.colOrder}</h3>
            <ul className="site-footer-watta__list">
              {phones.map((p) => (
                <li key={p.href}>
                  <a href={p.href} className="site-footer-watta__text-link site-footer-watta__text-link--phone">
                    {p.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="site-footer-watta__col">
            <h3 className="site-footer-watta__col-title">{sf.colNav}</h3>
            <ul className="site-footer-watta__list">
              {navLinks.map(({ href, label }) => (
                <li key={`${href}:${label}`}>
                  <Link href={href} className="site-footer-watta__text-link">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="site-footer-watta__col site-footer-watta__col--brand">
            <Link href="/privacy" className="site-footer-watta__privacy">
              {sf.privacy}
            </Link>
          </div>

          <div className="site-footer-watta__col">
            <h3 className="site-footer-watta__col-title">{sf.colHours}</h3>
            <p className="site-footer-watta__body-strong">{sf.hoursLine}</p>
          </div>

          {locationLines.length > 0 ? (
            <div className="site-footer-watta__col">
              <h3 className="site-footer-watta__col-title">{sf.colLocations}</h3>
              <ul className="site-footer-watta__list">
                {locationLines.map((line) => (
                  <li key={line}>
                    <span className="site-footer-watta__text-link site-footer-watta__text-link--static">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="site-footer-watta__col">
            <h3 className="site-footer-watta__col-title">{sf.colSocial}</h3>
            <div className="site-footer-watta__social-row">
              <a
                href={WATTA_INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="site-footer-watta__icon-btn"
                aria-label={sf.instagramAria}
              >
                <Instagram className="h-5 w-5" strokeWidth={2} />
              </a>
              <a
                href="https://facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="site-footer-watta__icon-btn"
                aria-label={sf.facebookAria}
              >
                <Facebook className="h-5 w-5" strokeWidth={2} />
              </a>
              <a
                href="https://tiktok.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="site-footer-watta__icon-btn"
                aria-label={sf.tiktokAria}
              >
                <TikTokIcon className="h-5 w-5" />
              </a>
            </div>
            <a
              href="https://t.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="site-footer-watta__support-btn"
            >
              <Send className="h-4 w-4 shrink-0 text-[#229ED9]" strokeWidth={2.2} aria-hidden />
              {sf.support}
            </a>
            <div className="site-footer-watta__pay-row" role="group" aria-label={sf.paymentsAria}>
              <VisaMark />
              <MastercardMark />
              <IdealMark />
            </div>
            <p className="site-footer-watta__payments-note">{sf.paymentsMethodsNote}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
