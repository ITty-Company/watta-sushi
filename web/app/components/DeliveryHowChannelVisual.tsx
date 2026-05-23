'use client'

import { memo } from 'react'
import { Globe2, Phone } from 'lucide-react'

export type DeliveryHowChannelId = 'web' | 'instagram' | 'phone'

function formatPhoneDisplay(e164: string) {
  const digits = e164.replace(/\D/g, '')
  if (digits.startsWith('31') && digits.length >= 10) {
    const rest = digits.slice(2)
    if (rest.length === 9 && rest.startsWith('6')) {
      return `+31 ${rest[0]} ${rest.slice(1, 5)} ${rest.slice(5)}`
    }
    return `+31 ${rest}`
  }
  return e164.startsWith('+') ? e164 : `+${digits}`
}

function InstagramGradientIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden>
      <defs>
        <linearGradient id="delivery-ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#feda75" />
          <stop offset="25%" stopColor="#fa7e1e" />
          <stop offset="50%" stopColor="#d62976" />
          <stop offset="75%" stopColor="#962fbf" />
          <stop offset="100%" stopColor="#4f5bd5" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#delivery-ig-grad)" />
      <path
        fill="#fff"
        d="M24 17.2a6.8 6.8 0 1 0 0 13.6 6.8 6.8 0 0 0 0-13.6zm0 11.1a4.3 4.3 0 1 1 0-8.6 4.3 4.3 0 0 1 0 8.6zm7.4-12a1.6 1.6 0 1 1-3.2 0 1.6 1.6 0 0 1 3.2 0zM24 14.8c2.5 0 2.8.01 3.8.06 1 .05 1.7.22 2.3.47.6.24 1.1.56 1.6 1.1.5.5.8 1 1.1 1.6.2.6.4 1.3.5 2.3.05 1 .06 1.3.06 3.8s-.01 2.8-.06 3.8c-.05 1-.22 1.7-.47 2.3-.24.6-.56 1.1-1.1 1.6-.5.5-1 .8-1.6 1.1-.6.2-1.3.4-2.3.5-1 .05-1.3.06-3.8.06s-2.8-.01-3.8-.06c-1-.05-1.7-.22-2.3-.47-.6-.24-1.1-.56-1.6-1.1-.5-.5-.8-1-1.1-1.6-.2-.6-.4-1.3-.5-2.3-.05-1-.06-1.3-.06-3.8s.01-2.8.06-3.8c.05-1 .22-1.7.47-2.3.24-.6.56-1.1 1.1-1.6.5-.5 1-.8 1.6-1.1.6-.2 1.3-.4 2.3-.5 1-.05 1.3-.06 3.8-.06zm0-2.6c-2.7 0-3 .01-4 .06-1.1.05-1.9.23-2.6.5-.7.27-1.3.63-1.9 1.2-.6.6-.96 1.2-1.2 1.9-.26.7-.44 1.5-.5 2.6-.06 1.1-.07 1.4-.07 4s.01 3 .07 4c.06 1.1.24 1.9.5 2.6.27.7.63 1.3 1.2 1.9.6.6 1.2.96 1.9 1.2.7.26 1.5.44 2.6.5 1.1.06 1.4.07 4 .07s3-.01 4-.07c1.1-.06 1.9-.24 2.6-.5.7-.27 1.3-.63 1.9-1.2.6-.6.96-1.2 1.2-1.9.26-.7.44-1.5.5-2.6.06-1.1.07-1.4.07-4s-.01-3-.07-4c-.06-1.1-.24-1.9-.5-2.6-.27-.7-.63-1.3-1.2-1.9-.6-.6-1.2-.96-1.9-1.2-.7-.26-1.5-.44-2.6-.5-1.1-.06-1.4-.07-4-.07z"
      />
    </svg>
  )
}

function DeliveryHowChannelVisual({
  channelId,
  instagramHandle,
  phoneE164,
}: {
  channelId: DeliveryHowChannelId
  instagramHandle?: string
  phoneE164?: string
}) {
  if (channelId === 'instagram') {
    return (
      <span className="delivery-how-channel-visual delivery-how-channel-visual--instagram">
        <span className="delivery-how-channel-visual__brand-tile">
          <InstagramGradientIcon className="delivery-how-channel-visual__ig-svg" />
        </span>
        {instagramHandle ? (
          <span className="delivery-how-channel-visual__badge">@{instagramHandle}</span>
        ) : null}
      </span>
    )
  }

  if (channelId === 'phone') {
    const display = phoneE164 ? formatPhoneDisplay(phoneE164) : ''
    return (
      <span className="delivery-how-channel-visual delivery-how-channel-visual--phone">
        <span className="delivery-how-channel-visual__phone-shell">
          <span className="delivery-how-channel-visual__phone-notch" aria-hidden />
          <span className="delivery-how-channel-visual__phone-screen">
            <span className="delivery-how-channel-visual__phone-ico-wrap">
              <Phone className="delivery-how-channel-visual__phone-ico" strokeWidth={2} aria-hidden />
            </span>
            {display ? (
              <span className="delivery-how-channel-visual__phone-num">{display}</span>
            ) : null}
          </span>
        </span>
      </span>
    )
  }

  return (
    <span className="delivery-how-channel-visual delivery-how-channel-visual--web">
      <span className="delivery-how-channel-visual__web-tile">
        <Globe2 className="delivery-how-channel-visual__web-ico" strokeWidth={1.75} aria-hidden />
        <span className="delivery-how-channel-visual__web-wordmark">watta sushi</span>
      </span>
    </span>
  )
}

export default memo(DeliveryHowChannelVisual)

function instagramHandleFromUrl(url: string) {
  try {
    const u = new URL(url)
    const parts = u.pathname.replace(/^\/+|\/+$/g, '').split('/')
    const handle = parts[0] || ''
    return handle.replace(/^@/, '')
  } catch {
    return ''
  }
}

export { instagramHandleFromUrl, formatPhoneDisplay }
