'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Clock, X } from '@/lib/wattaInlineIcons'
import { useLanguage } from '../context/LanguageContext'
import { formatKitchenHoursRange } from '@/lib/deliverySlotsAmsterdam'
import { dismissKitchenClosedModal } from '@/lib/kitchenClosedModal'
import { wattaToHtmlLang } from '@/lib/i18n/language'

type Props = {
  open: boolean
  onClose: () => void
  onPreorder: () => void
}

export default function KitchenClosedModal({ open, onClose, onPreorder }: Props) {
  const { t, language } = useLanguage()
  const k = t.cartSection.kitchenClosed
  const htmlLang = wattaToHtmlLang(language)
  const [portalReady, setPortalReady] = useState(false)

  const body = useMemo(() => {
    const hours = formatKitchenHoursRange()
    return k.body.replace('{{hours}}', hours)
  }, [k.body])

  useEffect(() => {
    setPortalReady(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open || !portalReady || typeof document === 'undefined') return null

  const handleDismiss = () => {
    dismissKitchenClosedModal()
    onClose()
  }

  return createPortal(
    <div className="watta-kitchen-closed-overlay" role="presentation">
      <button
        type="button"
        className="watta-kitchen-closed-overlay__backdrop"
        aria-label={k.closeAria}
        onClick={handleDismiss}
      />
      <div
        key={language}
        lang={htmlLang}
        className="watta-kitchen-closed-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="watta-kitchen-closed-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="watta-kitchen-closed-modal__close"
          onClick={handleDismiss}
          aria-label={k.closeAria}
        >
          <X size={20} strokeWidth={2} aria-hidden />
        </button>
        <div className="watta-kitchen-closed-modal__icon" aria-hidden>
          <Clock size={26} strokeWidth={2} />
        </div>
        <h2 id="watta-kitchen-closed-title" className="watta-kitchen-closed-modal__title">
          {k.title}
        </h2>
        <p className="watta-kitchen-closed-modal__text">{body}</p>
        <button
          type="button"
          className="watta-kitchen-closed-modal__cta"
          onClick={() => {
            dismissKitchenClosedModal()
            onPreorder()
            onClose()
          }}
        >
          {k.preorderCta}
        </button>
      </div>
    </div>,
    document.body,
  )
}
