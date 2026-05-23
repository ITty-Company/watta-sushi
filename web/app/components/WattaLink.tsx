'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { forwardRef, useCallback, type ComponentProps, type MouseEvent } from 'react'
import { navigateInstant, prefetchHref } from '@/lib/instantNav'

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

const WattaLink = forwardRef<HTMLAnchorElement, WattaLinkProps>(function WattaLink(
  { href, prefetch = true, scroll, onPointerEnter, onPointerDown, onFocus, onClick, ...rest },
  ref,
) {
  const router = useRouter()

  const warm = useCallback(() => {
    const target = hrefToPrefetchString(href)
    if (target) prefetchHref(router, target)
  }, [href, router])

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e)
      if (e.defaultPrevented || isModifiedClick(e)) return
      const target = hrefToPrefetchString(href)
      if (!target) return
      e.preventDefault()
      navigateInstant(router, target, { scroll: scroll !== false })
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
      onPointerDown={(e) => {
        warm()
        onPointerDown?.(e)
      }}
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
