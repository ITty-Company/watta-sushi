'use client'

import { useCallback, useId } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  CHECKOUT_PHONE_INPUT_MAX_LEN,
  sanitizeCheckoutPhoneInput,
} from '@/lib/checkoutPhone'

type Props = {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
  disabled?: boolean
  'aria-describedby'?: string
}

/** Поле телефону у стилі модалки: префікс +380 і введення решти номера. */
export default function AuthPhoneField({
  id: idProp,
  value,
  onChange,
  placeholder = 'XX XXX XX XX',
  autoFocus,
  disabled,
  'aria-describedby': ariaDescribedBy,
}: Props) {
  const autoId = useId()
  const id = idProp ?? autoId

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(sanitizeCheckoutPhoneInput(e.target.value))
    },
    [onChange],
  )

  return (
    <div className="auth-ninja-phone">
      <span className="auth-ninja-phone__prefix" aria-hidden>
        <span className="auth-ninja-phone__flag">🇺🇦</span>
        <ChevronDown className="auth-ninja-phone__chevron" size={16} strokeWidth={2.25} aria-hidden />
        <span className="auth-ninja-phone__code">+380</span>
        <span className="auth-ninja-phone__sep" aria-hidden>
          |
        </span>
      </span>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        maxLength={CHECKOUT_PHONE_INPUT_MAX_LEN}
        value={value}
        onChange={handleChange}
        className="auth-ninja-phone__input"
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        aria-describedby={ariaDescribedBy}
      />
    </div>
  )
}

/** Повний міжнародний номер для API (+380…). */
export function buildAuthPhoneE164(localDigits: string): string {
  const digits = localDigits.replace(/\D/g, '').replace(/^0+/, '')
  if (!digits) return ''
  if (localDigits.trim().startsWith('+')) {
    return sanitizeCheckoutPhoneInput(localDigits)
  }
  return `+380${digits}`
}
