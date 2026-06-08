'use client'

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import {
  CHECKOUT_PHONE_INPUT_MAX_LEN,
  sanitizeCheckoutPhoneInput,
} from '@/lib/checkoutPhone'
import {
  DEFAULT_PHONE_COUNTRY_ISO,
  findPhoneCountryByIso,
  isoToFlag,
  matchPhoneCountryFromE164,
  PHONE_COUNTRIES,
  type PhoneCountry,
} from '@/lib/phoneCountries'

type Props = {
  id?: string
  value: string
  onChange: (value: string) => void
  countryIso: string
  onCountryIsoChange: (iso: string) => void
  placeholder?: string
  autoFocus?: boolean
  disabled?: boolean
  'aria-describedby'?: string
}

function sanitizeAuthPhoneLocal(value: string): string {
  let result = ''
  for (let i = 0; i < value.length && result.length < CHECKOUT_PHONE_INPUT_MAX_LEN; i++) {
    const ch = value[i]
    if (ch >= '0' && ch <= '9') {
      result += ch
      continue
    }
    if ((ch === ' ' || ch === '-' || ch === '(' || ch === ')' || ch === '.') && result.length > 0) {
      result += ch
    }
  }
  return result
}

/** Поле телефону: вибір країни + локальна частина номера. */
export default function AuthPhoneField({
  id: idProp,
  value,
  onChange,
  countryIso,
  onCountryIsoChange,
  placeholder = 'XX XXX XX XX',
  autoFocus,
  disabled,
  'aria-describedby': ariaDescribedBy,
}: Props) {
  const autoId = useId()
  const id = idProp ?? autoId
  const rootRef = useRef<HTMLDivElement>(null)
  const prefixRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const [mounted, setMounted] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})

  const selectedCountry =
    findPhoneCountryByIso(countryIso) ?? findPhoneCountryByIso(DEFAULT_PHONE_COUNTRY_ISO)!

  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return PHONE_COUNTRIES
    return PHONE_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q.replace(/\D/g, '')) ||
        c.iso.toLowerCase().includes(q),
    )
  }, [search])

  useEffect(() => {
    setMounted(true)
  }, [])

  const updateDropdownPosition = useCallback(() => {
    const btn = prefixRef.current
    if (!btn) return

    const rect = btn.getBoundingClientRect()
    const width = Math.min(296, window.innerWidth - 40)
    const gap = 6
    const estimatedHeight = 248
    const spaceBelow = window.innerHeight - rect.bottom - gap
    const spaceAbove = rect.top - gap
    const openUp = spaceBelow < estimatedHeight && spaceAbove > spaceBelow

    setDropdownStyle({
      position: 'fixed',
      left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
      width,
      top: openUp ? undefined : rect.bottom + gap,
      bottom: openUp ? window.innerHeight - rect.top + gap : undefined,
      zIndex: 9999,
    })
  }, [])

  useLayoutEffect(() => {
    if (!dropdownOpen) return
    updateDropdownPosition()
    window.addEventListener('resize', updateDropdownPosition)
    window.addEventListener('scroll', updateDropdownPosition, true)
    return () => {
      window.removeEventListener('resize', updateDropdownPosition)
      window.removeEventListener('scroll', updateDropdownPosition, true)
    }
  }, [dropdownOpen, updateDropdownPosition])

  useEffect(() => {
    if (!dropdownOpen) return
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (rootRef.current?.contains(target) || dropdownRef.current?.contains(target)) return
      setDropdownOpen(false)
      setSearch('')
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [dropdownOpen])

  useEffect(() => {
    if (dropdownOpen) {
      requestAnimationFrame(() => searchRef.current?.focus())
    }
  }, [dropdownOpen])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      if (raw.trim().startsWith('+')) {
        const parsed = matchPhoneCountryFromE164(sanitizeCheckoutPhoneInput(raw))
        if (parsed) {
          onCountryIsoChange(parsed.country.iso)
          onChange(sanitizeAuthPhoneLocal(parsed.local))
          return
        }
      }
      onChange(sanitizeAuthPhoneLocal(raw))
    },
    [onChange, onCountryIsoChange],
  )

  const selectCountry = useCallback(
    (country: PhoneCountry) => {
      onCountryIsoChange(country.iso)
      setDropdownOpen(false)
      setSearch('')
    },
    [onCountryIsoChange],
  )

  return (
    <div ref={rootRef} className="auth-ninja-phone">
      <div className="auth-ninja-phone__prefix-wrap">
        <button
          ref={prefixRef}
          type="button"
          className="auth-ninja-phone__prefix"
          aria-haspopup="listbox"
          aria-expanded={dropdownOpen}
          aria-label={`+${selectedCountry.dial}`}
          disabled={disabled}
          onClick={() => {
            setDropdownOpen((open) => {
              const next = !open
              if (next) requestAnimationFrame(updateDropdownPosition)
              return next
            })
          }}
        >
          <span className="auth-ninja-phone__flag" aria-hidden>
            {isoToFlag(selectedCountry.iso)}
          </span>
          <ChevronDown className="auth-ninja-phone__chevron" size={16} strokeWidth={2.25} aria-hidden />
          <span className="auth-ninja-phone__code">+{selectedCountry.dial}</span>
          <span className="auth-ninja-phone__sep" aria-hidden>
            |
          </span>
        </button>

        {dropdownOpen && mounted
          ? createPortal(
              <div
                ref={dropdownRef}
                className="auth-ninja-phone__dropdown auth-ninja-phone__dropdown--portal"
                style={dropdownStyle}
                role="listbox"
                aria-label="Country code"
              >
                <input
                  ref={searchRef}
                  type="search"
                  className="auth-ninja-phone__search"
                  placeholder="Search country"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search country"
                />
                <ul className="auth-ninja-phone__list">
                  {filteredCountries.map((country) => (
                    <li key={country.iso}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={country.iso === selectedCountry.iso}
                        className={`auth-ninja-phone__option${
                          country.iso === selectedCountry.iso ? ' auth-ninja-phone__option--active' : ''
                        }`}
                        onClick={() => selectCountry(country)}
                      >
                        <span className="auth-ninja-phone__option-flag" aria-hidden>
                          {isoToFlag(country.iso)}
                        </span>
                        <span className="auth-ninja-phone__option-name">{country.name}</span>
                        <span className="auth-ninja-phone__option-dial">+{country.dial}</span>
                      </button>
                    </li>
                  ))}
                  {filteredCountries.length === 0 ? (
                    <li className="auth-ninja-phone__empty">No matches</li>
                  ) : null}
                </ul>
              </div>,
              document.body,
            )
          : null}
      </div>

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

/** Повний міжнародний номер для API (+…). */
export function buildAuthPhoneE164(localDigits: string, countryDial: string): string {
  const trimmed = localDigits.trim()
  if (trimmed.startsWith('+')) {
    return sanitizeCheckoutPhoneInput(trimmed)
  }
  const local = localDigits.replace(/\D/g, '').replace(/^0+/, '')
  const dial = countryDial.replace(/\D/g, '')
  if (!local) return ''
  return `+${dial}${local}`
}
