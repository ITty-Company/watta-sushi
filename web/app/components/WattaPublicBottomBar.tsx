'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Home, ShoppingBag, User, UtensilsCrossed } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

function useCartCount() {
  const [n, setN] = useState(0)
  useEffect(() => {
    const u = () => {
      try {
        const cart = JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('cart') || '[]' : '[]')
        setN(Array.isArray(cart) ? cart.length : 0)
      } catch {
        setN(0)
      }
    }
    u()
    window.addEventListener('cartUpdated', u)
    return () => window.removeEventListener('cartUpdated', u)
  }, [])
  return n
}

/**
 * Фіксована нижня навігація (головна / меню / кошик / профіль) на всіх сторінках крім адмінки.
 * Фон і safe-area на зовнішньому `nav` — без просвіту під «чолкою» (globals.css).
 * На lg прихована — там футер і повна навігація.
 */
export default function WattaPublicBottomBar() {
  const pathname = usePathname() || '/'
  const { t } = useLanguage()
  const cartCount = useCartCount()

  const items: {
    href: string
    label: string
    Icon: typeof Home
    active: boolean
    badge?: number
  }[] = [
    { href: '/', label: t.navigation.home, Icon: Home, active: pathname === '/' },
    {
      href: '/menu',
      label: t.navigation.menu,
      Icon: UtensilsCrossed,
      active: pathname === '/menu' || pathname.startsWith('/menu/'),
    },
    {
      href: '/cart',
      label: t.cart,
      Icon: ShoppingBag,
      active: pathname === '/cart',
      badge: cartCount,
    },
    {
      href: '/profile',
      label: t.profile,
      Icon: User,
      active: pathname.startsWith('/profile'),
    },
  ]

  return (
    <nav
      className="watta-public-bottom-bar"
      aria-label={t.navigation.bottomNavAria}
    >
      <div className="watta-public-bottom-bar__inner">
        {items.map(({ href, label, Icon, active, badge }) => (
          <Link
            key={href}
            href={href}
            className={`watta-public-bottom-bar__item${active ? ' watta-public-bottom-bar__item--active' : ''}`}
          >
            <span className="watta-public-bottom-bar__ico-wrap">
              <Icon className="watta-public-bottom-bar__ico" strokeWidth={2.2} aria-hidden />
              {typeof badge === 'number' && badge > 0 ? (
                <span className="watta-public-bottom-bar__badge">{badge > 99 ? '99+' : badge}</span>
              ) : null}
            </span>
            <span className="watta-public-bottom-bar__label">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
