'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  forwardRef,
  useCallback,
  useRef,
  type ComponentProps,
  type MouseEvent,
  type PointerEvent,
} from 'react'
import {
  isInstantNavPath,
  isProductNavPath,
  navigateInstant,
  normalizeInternalHref,
  prefetchHref,
  wasRecentPointerNav,
} from '@/lib/instantNav'
import { primeProductPageChrome } from '@/lib/wattaProductChrome'
import { consumePointerScrollGesture, shouldSuppressTapNavigation } from '@/lib/wattaScrollTapGuard'

type WattaLinkProps = ComponentProps<typeof Link>

function hrefToPrefetchString(href: WattaLinkProps['href']): string | null {
  if (typeof href === 'string') return href
  if (!href || typeof href !== 'object') return null
  const pathname = 'pathname' in href && href.pathname ? String(href.pathname) : ''
  if (!pathname.startsWith('/')) return null
  const query =
    'query' in href && href.query && typeof href.query === 'object'
      ? new URLSearchParams(href.query as Record<string, string>).toString()
      : ''
  return query ? `${pathname}?${query}` : pathname
}

function isModifiedClick(e: MouseEvent<HTMLAnchorElement>): boolean {
  return e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey
}

function currentPathWithSearch(): string {
  if (typeof window === 'undefined') return '/'
  return `${window.location.pathname}${window.location.search}`
}

const WattaLink = forwardRef<HTMLAnchorElement, WattaLinkProps>(function WattaLink(
  { href, prefetch = true, scroll, onPointerEnter, onPointerDown, onPointerUp, onFocus, onClick, ...rest },
  ref,
) {
  const router = useRouter()
  const pressedNavRef = useRef<string | null>(null)
  const pointerTapRef = useRef<{ id: number; href: string; moved: boolean; x: number; y: number } | null>(
    null,
  )

  const warm = useCallback(() => {
    const target = hrefToPrefetchString(href)
    if (target) prefetchHref(router, target)
  }, [href, router])

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLAnchorElement>) => {
      onPointerDown?.(e)
      if (e.defaultPrevented || e.button !== 0) return
      const target = hrefToPrefetchString(href)
      if (!target) {
        warm()
        return
      }
      warm()
      if (isProductNavPath(target)) {
        primeProductPageChrome()
      }
      const normalized = normalizeInternalHref(target)
      if (normalized && normalized !== currentPathWithSearch()) {
        pointerTapRef.current = {
          id: e.pointerId,
          href: normalized,
          moved: false,
          x: e.clientX,
          y: e.clientY,
        }
      } else {
        pointerTapRef.current = null
      }
    },
    [href, onPointerDown, warm],
  )

  const handlePointerMove = useCallback((e: PointerEvent<HTMLAnchorElement>) => {
    const tap = pointerTapRef.current
    if (!tap || tap.id !== e.pointerId) return
    const dx = e.clientX - tap.x
    const dy = e.clientY - tap.y
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) tap.moved = true
  }, [])

  const handlePointerUp = useCallback(
    (e: PointerEvent<HTMLAnchorElement>) => {
      onPointerUp?.(e)
      if (e.defaultPrevented || e.button !== 0) {
        pointerTapRef.current = null
        return
      }
      const tap = pointerTapRef.current
      pointerTapRef.current = null
      if (!tap || tap.id !== e.pointerId || tap.moved || shouldSuppressTapNavigation()) return
      if (tap.href === currentPathWithSearch()) return
      navigateInstant(router, tap.href, {
        scroll: scroll !== false,
        immediate: isInstantNavPath(tap.href),
      })
    },
    [onPointerUp, router, scroll],
  )

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e)
      if (e.defaultPrevented || isModifiedClick(e)) return
      if (consumePointerScrollGesture()) {
        e.preventDefault()
        pressedNavRef.current = null
        return
      }
      const target = hrefToPrefetchString(href)
      if (!target) return
      const normalized = normalizeInternalHref(target)
      if (
        (normalized && wasRecentPointerNav(normalized)) ||
        pressedNavRef.current === target
      ) {
        e.preventDefault()
        pressedNavRef.current = null
        return
      }
      e.preventDefault()
      const dest = normalized ?? target
      navigateInstant(router, dest, {
        scroll: scroll !== false,
        immediate: isInstantNavPath(dest),
      })
    },
    [href, onClick, router, scroll],
  )

  return (
    <Link
      ref={ref}
      href={href}
      prefetch={prefetch}
      data-watta-link="1"
      onPointerEnter={(e) => {
        warm()
        onPointerEnter?.(e)
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onFocus={(e) => {
        warm()
        onFocus?.(e)
      }}
      onClick={handleClick}
      {...rest}
    />
  )
})

export default WattaLink
