'use client'

import { useId } from 'react'
import { cn } from '@/lib/utils'

/**
 * Векторний маскот для модалки локації: м’які градієнти, без плоского JPG/PNG-clipart.
 */
export function LocationPickerMascot({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '')

  const body = `${id}-body`
  const hood = `${id}-hood`
  const face = `${id}-face`
  const blushL = `${id}-blushL`
  const blushR = `${id}-blushR`
  const eye = `${id}-eye`
  const plate = `${id}-plate`
  const fish = `${id}-fish`
  const rice = `${id}-rice`
  const wood = `${id}-wood`
  const stick = `${id}-stick`

  return (
    <div className={cn('location-picker-mascot', className)} aria-hidden>
      <svg
        className="location-picker-mascot__svg"
        viewBox="0 0 110 132"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={body} x1="32" y1="72" x2="88" y2="128" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1a6b58" />
            <stop offset="0.45" stopColor="#145142" />
            <stop offset="1" stopColor="#0c3028" />
          </linearGradient>
          <linearGradient id={hood} x1="55" y1="18" x2="55" y2="62" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1f7a63" />
            <stop offset="0.5" stopColor="#145142" />
            <stop offset="1" stopColor="#0a2820" />
          </linearGradient>
          <radialGradient id={face} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(55 58) rotate(90) scale(32)">
            <stop stopColor="#fffdf8" />
            <stop offset="0.65" stopColor="#f4f0e8" />
            <stop offset="1" stopColor="#e8e2d6" />
          </radialGradient>
          <radialGradient id={blushL} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(40 66) scale(10)">
            <stop stopColor="#ffb4b8" stopOpacity="0.5" />
            <stop offset="1" stopColor="#ffb4b8" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={blushR} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(70 66) scale(10)">
            <stop stopColor="#ffb4b8" stopOpacity="0.5" />
            <stop offset="1" stopColor="#ffb4b8" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={eye} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(55 56) scale(6)">
            <stop stopColor="#0f3d32" />
            <stop offset="1" stopColor="#145142" />
          </radialGradient>
          <linearGradient id={plate} x1="20" y1="118" x2="92" y2="124" gradientUnits="userSpaceOnUse">
            <stop stopColor="#efe6dc" />
            <stop offset="0.5" stopColor="#ddd2c4" />
            <stop offset="1" stopColor="#c9b8a8" />
          </linearGradient>
          <linearGradient id={fish} x1="48" y1="96" x2="62" y2="104" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ff9a6b" />
            <stop offset="0.5" stopColor="#ff7b4a" />
            <stop offset="1" stopColor="#e85d3a" />
          </linearGradient>
          <linearGradient id={rice} x1="52" y1="100" x2="58" y2="108" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fffef9" />
            <stop offset="1" stopColor="#ebe4d8" />
          </linearGradient>
          <linearGradient id={wood} x1="24" y1="112" x2="88" y2="118" gradientUnits="userSpaceOnUse">
            <stop stopColor="#c4a574" />
            <stop offset="0.5" stopColor="#a67c52" />
            <stop offset="1" stopColor="#8b5e3c" />
          </linearGradient>
          <linearGradient id={stick} x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
            <stop stopColor="#f5e6d3" />
            <stop offset="0.5" stopColor="#deb887" />
            <stop offset="1" stopColor="#8b5a3c" />
          </linearGradient>
        </defs>

        {/* Дошка під тарілкою */}
        <ellipse cx="55" cy="118" rx="40" ry="7" fill={`url(#${wood})`} opacity="0.92" />
        <ellipse cx="55" cy="116" rx="36" ry="5" fill="#000" opacity="0.12" />

        {/* Тіло / хаорі */}
        <path
          d="M22 128c2-28 12-48 33-56 21 8 31 28 33 56H22z"
          fill={`url(#${body})`}
        />
        <path d="M38 118c8-6 18-9 28-9s20 3 28 9" stroke="#fff" strokeOpacity="0.08" strokeWidth="1.2" strokeLinecap="round" />

        {/* Тарілка */}
        <ellipse cx="55" cy="108" rx="34" ry="9" fill={`url(#${plate})`} />
        <ellipse cx="55" cy="106" rx="30" ry="6" fill="#faf6f0" opacity="0.9" />

        {/* Нігірі */}
        <ellipse cx="48" cy="102" rx="9" ry="5" fill={`url(#${rice})`} />
        <path d="M41 99c3-4 14-4 17 0v3c-4 3-13 3-17 0v-3z" fill={`url(#${fish})`} />
        <ellipse cx="62" cy="100" rx="7" ry="4" fill={`url(#${rice})`} />
        <path d="M56 97.5c2.5-3 11-3 13.5 0v2.5c-3 2.5-10.5 2.5-13.5 0V97.5z" fill={`url(#${fish})`} opacity="0.92" />

        {/* Палички */}
        <g>
          <rect x="72" y="82" width="3" height="36" rx="1.2" fill={`url(#${stick})`} transform="rotate(28 73.5 100)" />
          <rect x="78" y="84" width="2.8" height="34" rx="1" fill={`url(#${stick})`} transform="rotate(22 79.4 101)" opacity="0.9" />
        </g>

        {/* Голова */}
        <ellipse cx="55" cy="58" rx="30" ry="28" fill={`url(#${hood})`} />
        <ellipse cx="55" cy="62" rx="24" ry="22" fill={`url(#${face})`} />

        {/* Вушка / капюшон */}
        <path d="M32 48c-4-12 4-22 14-26 2 8 1 18-2 24-4-1-9 0-12 2z" fill={`url(#${hood})`} opacity="0.95" />
        <path d="M78 48c4-12-4-22-14-26-2 8-1 18 2 24 4-1 9 0 12 2z" fill={`url(#${hood})`} opacity="0.95" />

        {/* Рум’янець */}
        <ellipse cx="40" cy="66" rx="8" ry="5" fill={`url(#${blushL})`} />
        <ellipse cx="70" cy="66" rx="8" ry="5" fill={`url(#${blushR})`} />

        {/* Очі */}
        <ellipse cx="46" cy="56" rx="5" ry="6.5" fill={`url(#${eye})`} />
        <ellipse cx="64" cy="56" rx="5" ry="6.5" fill={`url(#${eye})`} />
        <circle cx="47.5" cy="54" r="1.8" fill="#fff" opacity="0.95" />
        <circle cx="65.5" cy="54" r="1.8" fill="#fff" opacity="0.95" />

        {/* Посмішка */}
        <path
          d="M48 68c3 4 11 4 14 0"
          stroke="#145142"
          strokeOpacity="0.35"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Блік на капюшоні */}
        <ellipse cx="48" cy="42" rx="10" ry="6" fill="#fff" opacity="0.12" transform="rotate(-25 48 42)" />
      </svg>
    </div>
  )
}
