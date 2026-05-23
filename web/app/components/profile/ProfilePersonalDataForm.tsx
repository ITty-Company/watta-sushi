'use client'

import { useEffect, useState } from 'react'
import { Mail, Phone, User } from 'lucide-react'
import { toast } from 'sonner'
import type { Translations } from '@/app/context/LanguageContext'
import { getBearerAuthHeaders } from '@/lib/authHeaders'
import {
  isValidCheckoutPhone,
  sanitizeCheckoutPhoneInput,
} from '@/lib/checkoutPhone'

export type ProfilePersonalDataFormProps = {
  initialName: string
  initialPhone: string
  email: string
  cp: Translations['clientProfile']
  invalidPhoneMessage: string
  onSaved: (payload: { name: string; phone: string }) => void
}

export default function ProfilePersonalDataForm({
  initialName,
  initialPhone,
  email,
  cp,
  invalidPhoneMessage,
  onSaved,
}: ProfilePersonalDataFormProps) {
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(initialName)
    setPhone(initialPhone)
  }, [initialName, initialPhone])

  const phoneInvalid = phone.trim() !== '' && !isValidCheckoutPhone(phone)
  const phoneDigits = (s: string) => s.replace(/\D/g, '')
  const canSave =
    name.trim().length > 0 &&
    isValidCheckoutPhone(phone) &&
    (name.trim() !== initialName.trim() ||
      phoneDigits(phone) !== phoneDigits(initialPhone))

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(cp.dataNameRequired)
      return
    }
    if (!isValidCheckoutPhone(phone)) {
      toast.error(invalidPhoneMessage)
      return
    }
    const auth = getBearerAuthHeaders()
    if (Object.keys(auth).length === 0) {
      toast.error(cp.redirectLogin)
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...auth },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data.message as string) || cp.dataSaveError)
        return
      }
      const savedName = String(data.user?.name ?? name.trim())
      const savedPhone = String(data.user?.phone ?? phone.trim())
      setName(savedName)
      setPhone(savedPhone)
      onSaved({ name: savedName, phone: savedPhone })
      toast.success(cp.dataSaved)
    } catch {
      toast.error(cp.dataSaveError)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="watta-profile-data-form mt-4">
      <div className="watta-profile-data-grid">
        <div className="watta-profile-data-field">
          <label className="watta-profile-data-field__label" htmlFor="profile-data-name">
            <User size={12} aria-hidden />
            {cp.labelName}
          </label>
          <input
            id="profile-data-name"
            type="text"
            className="watta-profile-data-field__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            maxLength={120}
          />
        </div>
        <div className="watta-profile-data-field">
          <label className="watta-profile-data-field__label" htmlFor="profile-data-phone">
            <Phone size={12} aria-hidden />
            {cp.labelPhone}
          </label>
          <input
            id="profile-data-phone"
            type="tel"
            className={`watta-profile-data-field__input${phoneInvalid ? ' watta-profile-data-field__input--invalid' : ''}`}
            value={phone}
            onChange={(e) => setPhone(sanitizeCheckoutPhoneInput(e.target.value))}
            autoComplete="tel"
            inputMode="tel"
            aria-invalid={phoneInvalid}
          />
          {phoneInvalid ? (
            <p className="watta-profile-data-field__error">{invalidPhoneMessage}</p>
          ) : null}
        </div>
        <div className="watta-profile-data-field sm:col-span-2">
          <p className="watta-profile-data-field__label">
            <Mail size={12} aria-hidden />
            {cp.labelEmail}
          </p>
          <p className="watta-profile-data-field__value watta-profile-data-field__value--readonly">{email || cp.notSpecified}</p>
          <p className="watta-profile-data-field__readonly-hint">{cp.emailReadonlyHint}</p>
        </div>
      </div>
      <button
        type="button"
        className="watta-profile-address-form__save mt-4"
        disabled={saving || !canSave}
        onClick={() => void handleSave()}
      >
        {saving ? cp.dataSaving : cp.dataSave}
      </button>
    </div>
  )
}
