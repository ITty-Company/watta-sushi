'use client'

import { useLanguage } from '../context/LanguageContext'
import '@/app/watta-checkout-success.css'

type CheckoutSuccessSmsIntroProps = {
  exiting?: boolean
}

/** Короткий SMS-екран «замовлення прийнято» перед основною сторінкою успіху. */
export default function CheckoutSuccessSmsIntro({ exiting = false }: CheckoutSuccessSmsIntroProps) {
  const { t } = useLanguage()
  const cs = t.cartSection

  return (
    <div
      className={`watta-checkout-success-sms${exiting ? ' watta-checkout-success-sms--out' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={cs.checkoutSuccessSmsAccepted}
    >
      <div className="watta-checkout-success-sms__phone">
        <p className="watta-checkout-success-sms__sender">Watta Sushi</p>
        <div className="watta-checkout-success-sms__bubble">
          <span className="watta-checkout-success-sms__tail" aria-hidden />
          <p className="watta-checkout-success-sms__text">{cs.checkoutSuccessSmsAccepted}</p>
        </div>
      </div>
    </div>
  )
}
