'use client'

import React, { useEffect, useMemo, useState } from 'react'
import WattaLink from './WattaLink'
import Image from 'next/image'
import { Instagram, Mail, Send } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import {
  WATTA_EMAIL,
  WATTA_INSTAGRAM_URL,
  WATTA_PHONE_E164,
  WATTA_TELEGRAM_URL,
  WATTA_TIKTOK_URL,
} from '@/lib/wattaSiteDefaults'
import { usePublicBlogNav } from '@/hooks/usePublicBlogNav'
import { usePublicPromotionsNav } from '@/hooks/usePublicPromotionsNav'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import { openWattaNotifications } from '@/lib/openWattaNotifications'
import { useOptionalNotificationsDrawer } from '../context/NotificationsDrawerContext'

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

type FooterProps = {
  className?: string
}

export default function Footer({ className }: FooterProps) {
  const { t, language } = useLanguage()
  const sf = t.siteFooter
  const nav = t.navigation
  const year = new Date().getFullYear()
  const legal = nav.footerLegal.replace('{{year}}', String(year))
  const [locationLines, setLocationLines] = useState<string[]>([])
  const { showPromotionsNav } = usePublicPromotionsNav()
  const { showBlogNav } = usePublicBlogNav()
  const router = useInstantRouter()
  const notificationsDrawer = useOptionalNotificationsDrawer()

  const phones = [{ label: sf.phone1, href: `tel:${WATTA_PHONE_E164}` }]

  /** Колонка «Навігація» — основні сторінки, кошик, профіль, сповіщення, вхід. */
  const navLinks = useMemo(() => {
    const links = [
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
    return links.filter((l) => {
      if (l.href === '/promotions' && !showPromotionsNav) return false
      if (l.href === '/blog' && !showBlogNav) return false
      return true
    })
  }, [nav, sf, t, showPromotionsNav, showBlogNav])

  const navMid = Math.ceil(navLinks.length / 2)
  const navLinksCol1 = navLinks.slice(0, navMid)
  const navLinksCol2 = navLinks.slice(navMid)

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
      className={['site-footer-watta site-footer-watta--light shrink-0 w-full', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="site-footer-watta__inner">
        <div className="site-footer-watta__hero-row">
          <div className="site-footer-watta__brand-block">
            <WattaLink href="/" className="site-footer-watta__logo-link" aria-label={t.common.brandName}>
              <Image
                src="/logo.png"
                alt=""
                width={64}
                height={64}
                className="site-footer-watta__logo-img object-contain"
              />
            </WattaLink>
            <div className="site-footer-watta__brand-text">
              <WattaLink href="/" className="site-footer-watta__title-link">
                <h2 className="site-footer-watta__title">{t.common.brandName}</h2>
              </WattaLink>
              <p className="site-footer-watta__tagline">{nav.drawerBrandLine}</p>
            </div>
          </div>
        </div>

        <div
          className={`site-footer-watta__grid site-footer-watta__grid--cols-${locationLines.length > 0 ? 4 : 3}`}
        >
          <div className="site-footer-watta__order-loc-wrap">
            {/* Колонка «Оформити замовлення»: телефон + час роботи */}
            <div className="site-footer-watta__col site-footer-watta__col--order">
              <div className="site-footer-watta__contact-row">
                <div className="site-footer-watta__contact-cell site-footer-watta__contact-cell--hours">
                  <h3 className="site-footer-watta__col-title">{sf.colHours}</h3>
                  <p className="site-footer-watta__body-strong">{sf.hoursLine}</p>
                </div>
                <div className="site-footer-watta__contact-cell site-footer-watta__contact-cell--order">
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
              </div>
            </div>

            {locationLines.length > 0 ? (
              <div className="site-footer-watta__col site-footer-watta__col--locations">
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
          </div>

          <div className="site-footer-watta__col site-footer-watta__col--nav">
            <h3 className="site-footer-watta__col-title">{sf.colNav}</h3>
            <div className="site-footer-watta__nav-two-cols">
              <ul className="site-footer-watta__list">
                {navLinksCol1.map(({ href, label }) => (
                  <li key={`${href}:${label}`}>
                    {href === '/notifications' ? (
                      <button
                        type="button"
                        className="site-footer-watta__text-link cursor-pointer border-0 bg-transparent p-0 text-left"
                        onClick={() => openWattaNotifications(router, notificationsDrawer?.open ?? null)}
                      >
                        {label}
                      </button>
                    ) : (
                      <WattaLink href={href} className="site-footer-watta__text-link">
                        {label}
                      </WattaLink>
                    )}
                  </li>
                ))}
              </ul>
              <ul className="site-footer-watta__list">
                {navLinksCol2.map(({ href, label }) => (
                  <li key={`${href}:${label}`}>
                    {href === '/notifications' ? (
                      <button
                        type="button"
                        className="site-footer-watta__text-link cursor-pointer border-0 bg-transparent p-0 text-left"
                        onClick={() => openWattaNotifications(router, notificationsDrawer?.open ?? null)}
                      >
                        {label}
                      </button>
                    ) : (
                      <WattaLink href={href} className="site-footer-watta__text-link">
                        {label}
                      </WattaLink>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="site-footer-watta__col site-footer-watta__col--social">
            <h3 className="site-footer-watta__col-title">{sf.colSocial}</h3>
            <div className="site-footer-watta__social-row">
              <a
                href={WATTA_INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="site-footer-watta__icon-btn"
                aria-label={sf.instagramAria}
              >
                <Instagram className="h-4 w-4" strokeWidth={2} />
              </a>
              <a
                href={WATTA_TIKTOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="site-footer-watta__icon-btn"
                aria-label={sf.tiktokAria}
              >
                <TikTokIcon className="h-4 w-4" />
              </a>
              <a
                href={WATTA_TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="site-footer-watta__icon-btn"
                aria-label={sf.telegramAria}
              >
                <Send className="h-4 w-4" strokeWidth={2} aria-hidden />
              </a>
              <a
                href={`mailto:${WATTA_EMAIL}`}
                className="site-footer-watta__icon-btn"
                aria-label={sf.emailAria}
              >
                <Mail className="h-4 w-4" strokeWidth={2} aria-hidden />
              </a>
            </div>
            <div className="site-footer-watta__pay-row" role="group" aria-label={sf.paymentsAria}>
              <VisaMark />
              <MastercardMark />
              <IdealMark />
            </div>
            {sf.paymentsMethodsNote.trim() ? (
              <p className="site-footer-watta__payments-note">{sf.paymentsMethodsNote}</p>
            ) : null}
          </div>

          <div className="site-footer-watta__nav-colophon site-footer-watta__grid-colophon site-footer-watta__legal-bar">
            <span className="site-footer-watta__nav-colophon-copy" suppressHydrationWarning>
              {legal}
            </span>
            <span className="site-footer-watta__nav-colophon-sep" aria-hidden>
              ·
            </span>
            <WattaLink href="/privacy" className="site-footer-watta__nav-colophon-link">
              {sf.privacy}
            </WattaLink>
            <span className="site-footer-watta__nav-colophon-sep" aria-hidden>
              ·
            </span>
            <WattaLink href="/offer" className="site-footer-watta__nav-colophon-link">
              {sf.publicOffer}
            </WattaLink>
          </div>
        </div>
      </div>
    </footer>
  )
}
