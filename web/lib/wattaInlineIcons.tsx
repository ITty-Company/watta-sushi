'use client'

import { forwardRef } from 'react'
import type { SVGProps, ForwardRefExoticComponent, RefAttributes } from 'react'

// ---------------------------------------------------------------------------
// Лёгкая замена lucide-react Icon — рендерит SVG напрямую через JSX,
// без lucide-react обёртки и без createElement.
// Совместима с LucideProps (className, size, strokeWidth, color, absoluteStrokeWidth, …)
// ---------------------------------------------------------------------------

type WattaIconComponent = ForwardRefExoticComponent<
  Omit<SVGProps<SVGSVGElement>, 'ref'> & { size?: number | string; absoluteStrokeWidth?: boolean } & RefAttributes<SVGSVGElement>
>

// ---------------------------------------------------------------------------
// X
// ---------------------------------------------------------------------------

const IconX = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement> & { size?: number | string; absoluteStrokeWidth?: boolean }>(
  function IconX({ size = 24, color = 'currentColor', strokeWidth = 2, absoluteStrokeWidth, className, style, ...rest }, ref) {
    const numSize = Number(size)
    const sw = absoluteStrokeWidth ? (Number(strokeWidth) * 24) / numSize : strokeWidth
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className ? `lucide lucide-x ${className}` : 'lucide lucide-x'}
        style={{ pointerEvents: 'none', ...style }}
        aria-hidden="true"
        {...rest}
      >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    )
  },
)

// ---------------------------------------------------------------------------
// ShoppingBag
// ---------------------------------------------------------------------------

const IconShoppingBag = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement> & { size?: number | string; absoluteStrokeWidth?: boolean }>(
  function IconShoppingBag({ size = 24, color = 'currentColor', strokeWidth = 2, absoluteStrokeWidth, className, style, ...rest }, ref) {
    const numSize = Number(size)
    const sw = absoluteStrokeWidth ? (Number(strokeWidth) * 24) / numSize : strokeWidth
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className ? `lucide lucide-shopping-bag ${className}` : 'lucide lucide-shopping-bag'}
        style={{ pointerEvents: 'none', ...style }}
        aria-hidden="true"
        {...rest}
      >
        <path d="M16 10a4 4 0 0 1-8 0" />
        <path d="M3.103 6.034h17.794" />
        <path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z" />
      </svg>
    )
  },
)

// ---------------------------------------------------------------------------
// Phone
// ---------------------------------------------------------------------------

const IconPhone = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement> & { size?: number | string; absoluteStrokeWidth?: boolean }>(
  function IconPhone({ size = 24, color = 'currentColor', strokeWidth = 2, absoluteStrokeWidth, className, style, ...rest }, ref) {
    const numSize = Number(size)
    const sw = absoluteStrokeWidth ? (Number(strokeWidth) * 24) / numSize : strokeWidth
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className ? `lucide lucide-phone ${className}` : 'lucide lucide-phone'}
        style={{ pointerEvents: 'none', ...style }}
        aria-hidden="true"
        {...rest}
      >
        <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
      </svg>
    )
  },
)

// ---------------------------------------------------------------------------
// ArrowLeft
// ---------------------------------------------------------------------------

const IconArrowLeft = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement> & { size?: number | string; absoluteStrokeWidth?: boolean }>(
  function IconArrowLeft({ size = 24, color = 'currentColor', strokeWidth = 2, absoluteStrokeWidth, className, style, ...rest }, ref) {
    const numSize = Number(size)
    const sw = absoluteStrokeWidth ? (Number(strokeWidth) * 24) / numSize : strokeWidth
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className ? `lucide lucide-arrow-left ${className}` : 'lucide lucide-arrow-left'}
        style={{ pointerEvents: 'none', ...style }}
        aria-hidden="true"
        {...rest}
      >
        <path d="m12 19-7-7 7-7" />
        <path d="M19 12H5" />
      </svg>
    )
  },
)

// ---------------------------------------------------------------------------
// MapPin
// ---------------------------------------------------------------------------

const IconMapPin = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement> & { size?: number | string; absoluteStrokeWidth?: boolean }>(
  function IconMapPin({ size = 24, color = 'currentColor', strokeWidth = 2, absoluteStrokeWidth, className, style, ...rest }, ref) {
    const numSize = Number(size)
    const sw = absoluteStrokeWidth ? (Number(strokeWidth) * 24) / numSize : strokeWidth
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className ? `lucide lucide-map-pin ${className}` : 'lucide lucide-map-pin'}
        style={{ pointerEvents: 'none', ...style }}
        aria-hidden="true"
        {...rest}
      >
        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    )
  },
)

// ---------------------------------------------------------------------------
// Bell
// ---------------------------------------------------------------------------

const IconBell = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement> & { size?: number | string; absoluteStrokeWidth?: boolean }>(
  function IconBell({ size = 24, color = 'currentColor', strokeWidth = 2, absoluteStrokeWidth, className, style, ...rest }, ref) {
    const numSize = Number(size)
    const sw = absoluteStrokeWidth ? (Number(strokeWidth) * 24) / numSize : strokeWidth
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className ? `lucide lucide-bell ${className}` : 'lucide lucide-bell'}
        style={{ pointerEvents: 'none', ...style }}
        aria-hidden="true"
        {...rest}
      >
        <path d="M10.268 21a2 2 0 0 0 3.464 0" />
        <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
      </svg>
    )
  },
)

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

const IconUser = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement> & { size?: number | string; absoluteStrokeWidth?: boolean }>(
  function IconUser({ size = 24, color = 'currentColor', strokeWidth = 2, absoluteStrokeWidth, className, style, ...rest }, ref) {
    const numSize = Number(size)
    const sw = absoluteStrokeWidth ? (Number(strokeWidth) * 24) / numSize : strokeWidth
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className ? `lucide lucide-user ${className}` : 'lucide lucide-user'}
        style={{ pointerEvents: 'none', ...style }}
        aria-hidden="true"
        {...rest}
      >
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    )
  },
)

// ---------------------------------------------------------------------------
// Heart
// ---------------------------------------------------------------------------

const IconHeart = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement> & { size?: number | string; absoluteStrokeWidth?: boolean }>(
  function IconHeart({ size = 24, color = 'currentColor', strokeWidth = 2, absoluteStrokeWidth, className, style, ...rest }, ref) {
    const numSize = Number(size)
    const sw = absoluteStrokeWidth ? (Number(strokeWidth) * 24) / numSize : strokeWidth
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className ? `lucide lucide-heart ${className}` : 'lucide lucide-heart'}
        style={{ pointerEvents: 'none', ...style }}
        aria-hidden="true"
        {...rest}
      >
        <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
      </svg>
    )
  },
)

// ---------------------------------------------------------------------------
// Plus
// ---------------------------------------------------------------------------

const IconPlus = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement> & { size?: number | string; absoluteStrokeWidth?: boolean }>(
  function IconPlus({ size = 24, color = 'currentColor', strokeWidth = 2, absoluteStrokeWidth, className, style, ...rest }, ref) {
    const numSize = Number(size)
    const sw = absoluteStrokeWidth ? (Number(strokeWidth) * 24) / numSize : strokeWidth
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className ? `lucide lucide-plus ${className}` : 'lucide lucide-plus'}
        style={{ pointerEvents: 'none', ...style }}
        aria-hidden="true"
        {...rest}
      >
        <path d="M5 12h14" />
        <path d="M12 5v14" />
      </svg>
    )
  },
)

// ---------------------------------------------------------------------------
// Minus
// ---------------------------------------------------------------------------

const IconMinus = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement> & { size?: number | string; absoluteStrokeWidth?: boolean }>(
  function IconMinus({ size = 24, color = 'currentColor', strokeWidth = 2, absoluteStrokeWidth, className, style, ...rest }, ref) {
    const numSize = Number(size)
    const sw = absoluteStrokeWidth ? (Number(strokeWidth) * 24) / numSize : strokeWidth
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className ? `lucide lucide-minus ${className}` : 'lucide lucide-minus'}
        style={{ pointerEvents: 'none', ...style }}
        aria-hidden="true"
        {...rest}
      >
        <path d="M5 12h14" />
      </svg>
    )
  },
)

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

const IconMenu = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement> & { size?: number | string; absoluteStrokeWidth?: boolean }>(
  function IconMenu({ size = 24, color = 'currentColor', strokeWidth = 2, absoluteStrokeWidth, className, style, ...rest }, ref) {
    const numSize = Number(size)
    const sw = absoluteStrokeWidth ? (Number(strokeWidth) * 24) / numSize : strokeWidth
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className ? `lucide lucide-menu ${className}` : 'lucide lucide-menu'}
        style={{ pointerEvents: 'none', ...style }}
        aria-hidden="true"
        {...rest}
      >
        <path d="M4 5h16" />
        <path d="M4 12h16" />
        <path d="M4 19h16" />
      </svg>
    )
  },
)

// ---------------------------------------------------------------------------
// ChevronLeft
// ---------------------------------------------------------------------------

const IconChevronLeft = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement> & { size?: number | string; absoluteStrokeWidth?: boolean }>(
  function IconChevronLeft({ size = 24, color = 'currentColor', strokeWidth = 2, absoluteStrokeWidth, className, style, ...rest }, ref) {
    const numSize = Number(size)
    const sw = absoluteStrokeWidth ? (Number(strokeWidth) * 24) / numSize : strokeWidth
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className ? `lucide lucide-chevron-left ${className}` : 'lucide lucide-chevron-left'}
        style={{ pointerEvents: 'none', ...style }}
        aria-hidden="true"
        {...rest}
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
    )
  },
)

// ---------------------------------------------------------------------------
// ChevronRight
// ---------------------------------------------------------------------------

const IconChevronRight = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement> & { size?: number | string; absoluteStrokeWidth?: boolean }>(
  function IconChevronRight({ size = 24, color = 'currentColor', strokeWidth = 2, absoluteStrokeWidth, className, style, ...rest }, ref) {
    const numSize = Number(size)
    const sw = absoluteStrokeWidth ? (Number(strokeWidth) * 24) / numSize : strokeWidth
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className ? `lucide lucide-chevron-right ${className}` : 'lucide lucide-chevron-right'}
        style={{ pointerEvents: 'none', ...style }}
        aria-hidden="true"
        {...rest}
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    )
  },
)

// ---------------------------------------------------------------------------
// Clock
// ---------------------------------------------------------------------------

const IconClock = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement> & { size?: number | string; absoluteStrokeWidth?: boolean }>(
  function IconClock({ size = 24, color = 'currentColor', strokeWidth = 2, absoluteStrokeWidth, className, style, ...rest }, ref) {
    const numSize = Number(size)
    const sw = absoluteStrokeWidth ? (Number(strokeWidth) * 24) / numSize : strokeWidth
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className ? `lucide lucide-clock ${className}` : 'lucide lucide-clock'}
        style={{ pointerEvents: 'none', ...style }}
        aria-hidden="true"
        {...rest}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    )
  },
)

// ---------------------------------------------------------------------------
// Star
// ---------------------------------------------------------------------------

const IconStar = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement> & { size?: number | string; absoluteStrokeWidth?: boolean }>(
  function IconStar({ size = 24, color = 'currentColor', strokeWidth = 2, absoluteStrokeWidth, className, style, ...rest }, ref) {
    const numSize = Number(size)
    const sw = absoluteStrokeWidth ? (Number(strokeWidth) * 24) / numSize : strokeWidth
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className ? `lucide lucide-star ${className}` : 'lucide lucide-star'}
        style={{ pointerEvents: 'none', ...style }}
        aria-hidden="true"
        {...rest}
      >
        <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
      </svg>
    )
  },
)

// Re-exports with original lucide-react names for drop-in replacement
export { IconX as X }
export { IconShoppingBag as ShoppingBag }
export { IconPhone as Phone }
export { IconArrowLeft as ArrowLeft }
export { IconMapPin as MapPin }
export { IconBell as Bell }
export { IconUser as User }
export { IconHeart as Heart }
export { IconPlus as Plus }
export { IconMinus as Minus }
export { IconMenu as Menu }
export { IconChevronLeft as ChevronLeft }
export { IconChevronRight as ChevronRight }
export { IconClock as Clock }
export { IconStar as Star }
