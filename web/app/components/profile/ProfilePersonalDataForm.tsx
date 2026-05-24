'use client'

import { useEffect, useState } from 'react'
import { Mail, Phone, ShieldCheck, User } from 'lucide-react'
import { toast } from 'sonner'
import type { Translations } from '@/app/context/LanguageContext'
import { getBearerAuthHeaders } from '@/lib/authHeaders'
import {
  CHECKOUT_PHONE_INPUT_MAX_LEN,
  isValidCheckoutPhone,
  sanitizeCheckoutPhoneInput,
} from '@/lib/checkoutPhone'

export type ProfilePersonalDataFormProps = {
  initialName: string
  initialPhone: string
  email: string
  isPhoneVerified?: boolean
  cp: Translations['clientProfile']
  invalidPhoneMessage: string
  onSaved: (payload: { name: string; phone: string }) => void
  onPhoneVerified?: () => void
}

type PhoneVerifyStep = 'idle' | 'code'

export default function ProfilePersonalDataForm({
  initialName,
  initialPhone,
  email,
  isPhoneVerified = true,
  cp,
  invalidPhoneMessage,
  onSaved,
  onPhoneVerified,
}: ProfilePersonalDataFormProps) {
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone)
  const [saving, setSaving] = useState(false)
  const [phoneVerifyStep, setPhoneVerifyStep] = useState<PhoneVerifyStep>('idle')
  const [verificationCode, setVerificationCode] = useState('')
  const [pendingPhone, setPendingPhone] = useState('')

  useEffect(() => {
    setName(initialName)
    setPhone(initialPhone)
    setPhoneVerifyStep('idle')
    setVerificationCode('')
    setPendingPhone('')
  }, [initialName, initialPhone])

  const phoneDigits = (s: string) => s.replace(/\D/g, '')
  const phoneInvalid = phone.trim() !== '' && !isValidCheckoutPhone(phone)
  const nameChanged = name.trim() !== initialName.trim()
  const phoneChanged =
    phoneVerifyStep === 'code'
      ? true
      : isValidCheckoutPhone(phone) && phoneDigits(phone) !== phoneDigits(initialPhone)

  const canSave =
    name.trim().length > 0 &&
    !phoneInvalid &&
    (nameChanged || phoneChanged) &&
    phoneVerifyStep !== 'code'

  const canConfirmPhone =
    phoneVerifyStep === 'code' && verificationCode.length >= 4 && !saving

  const patchProfile = async (body: { name?: string }) => {
    const auth = getBearerAuthHeaders()
    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error((data.message as string) || cp.dataSaveError)
    }
    return data.user as { name?: string; phone?: string }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(cp.dataNameRequired)
      return
    }
    if (!isValidCheckoutPhone(phone) && phoneChanged) {
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
      let savedName = name.trim()

      if (nameChanged && !phoneChanged) {
        const user = await patchProfile({ name: savedName })
        savedName = String(user?.name ?? savedName)
        setName(savedName)
        onSaved({ name: savedName, phone: initialPhone })
        toast.success(cp.dataSaved)
        return
      }

      if (nameChanged && phoneChanged) {
        const user = await patchProfile({ name: savedName })
        savedName = String(user?.name ?? savedName)
        setName(savedName)
        onSaved({ name: savedName, phone: initialPhone })
      }

      if (phoneChanged) {
        const sent = await sendPhoneVerificationCode(phone.trim())
        if (!sent) return
        if (nameChanged) {
          toast.success(cp.dataSaved)
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : cp.dataSaveError)
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmPhone = async () => {
    if (verificationCode.length < 4) {
      toast.error(cp.phoneCodeWrong)
      return
    }
    const auth = getBearerAuthHeaders()
    if (Object.keys(auth).length === 0) {
      toast.error(cp.redirectLogin)
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/auth/profile/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth },
        body: JSON.stringify({ phone: pendingPhone || phone.trim(), code: verificationCode }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data.message as string) || cp.phoneCodeWrong)
        return
      }
      const savedName = String(data.user?.name ?? name.trim())
      const savedPhone = String(data.user?.phone ?? phone.trim())
      setName(savedName)
      setPhone(savedPhone)
      setPhoneVerifyStep('idle')
      setVerificationCode('')
      setPendingPhone('')
      onSaved({ name: savedName, phone: savedPhone })
      onPhoneVerified?.()
      toast.success(cp.phoneChangeSuccess)
    } catch {
      toast.error(cp.dataSaveError)
    } finally {
      setSaving(false)
    }
  }

  const handleResendCode = async () => {
    setSaving(true)
    try {
      const target = pendingPhone || phone.trim()
      await sendPhoneVerificationCode(target)
    } catch {
      toast.error(cp.dataSaveError)
    } finally {
      setSaving(false)
    }
  }

  const cancelPhoneVerify = () => {
    setPhone(initialPhone)
    setPhoneVerifyStep('idle')
    setVerificationCode('')
    setPendingPhone('')
  }

  const sendPhoneVerificationCode = async (targetPhone: string) => {
    const auth = getBearerAuthHeaders()
    if (Object.keys(auth).length === 0) {
      toast.error(cp.redirectLogin)
      return false
    }
    const res = await fetch('/api/auth/profile/phone/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ phone: targetPhone }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error((data.message as string) || cp.dataSaveError)
      return false
    }
    setPendingPhone(targetPhone)
    setPhoneVerifyStep('code')
    setVerificationCode('')
    toast.success(cp.phoneCodeSent)
    return true
  }

  const handleConfirmExistingPhone = async () => {
    if (!isValidCheckoutPhone(phone)) {
      toast.error(invalidPhoneMessage)
      return
    }
    setSaving(true)
    try {
      await sendPhoneVerificationCode(phone.trim())
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="watta-profile-data-form mt-4">
      {!isPhoneVerified && isValidCheckoutPhone(phone) && phoneVerifyStep === 'idle' ? (
        <div
          className="mb-4 rounded-xl border border-amber-200/90 bg-amber-50/95 px-3 py-3 text-sm text-amber-950 sm:px-4"
          role="status"
        >
          <p className="leading-snug">{cp.phoneUnverifiedNotice}</p>
          <p className="mt-2 flex items-center gap-1.5 font-semibold text-[#0f3d32]">
            <Phone size={14} aria-hidden />
            <span>{phone}</span>
          </p>
          <button
            type="button"
            onClick={handleConfirmExistingPhone}
            disabled={saving}
            className="mt-3 inline-flex items-center justify-center rounded-lg bg-[#145142] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#0f3d32] disabled:opacity-60 sm:text-sm"
          >
            {cp.phoneConfirmSendCode}
          </button>
        </div>
      ) : null}
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
            disabled={phoneVerifyStep === 'code'}
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
            maxLength={CHECKOUT_PHONE_INPUT_MAX_LEN}
            aria-invalid={phoneInvalid}
            disabled={phoneVerifyStep === 'code'}
          />
          {phoneInvalid ? (
            <p className="watta-profile-data-field__error">{invalidPhoneMessage}</p>
          ) : phoneVerifyStep === 'idle' && phoneChanged ? (
            <p className="watta-profile-data-field__hint">{cp.phoneChangeHint}</p>
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

      {phoneVerifyStep === 'code' ? (
        <div className="mt-4 rounded-xl border border-[#145142]/15 bg-[#f4faf7] p-4">
          <div className="mb-2 flex justify-center text-[#145142]">
            <ShieldCheck className="h-9 w-9" strokeWidth={1.25} aria-hidden />
          </div>
          <p className="mb-3 text-center text-sm text-gray-700">{cp.phoneCodeHint}</p>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="0000"
            value={verificationCode}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '')
              if (v.length <= 4) setVerificationCode(v)
            }}
            className="mb-3 w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-center text-2xl font-bold tracking-[0.35em] text-[#145142] outline-none focus:border-[#145142] focus:ring-2 focus:ring-[#145142]/15"
            maxLength={4}
            aria-label={cp.phoneCodeLabel}
          />
          <button
            type="button"
            className="watta-profile-address-form__save w-full"
            disabled={!canConfirmPhone}
            onClick={() => void handleConfirmPhone()}
          >
            {saving ? cp.dataSaving : cp.phoneCodeConfirm}
          </button>
          <button
            type="button"
            disabled={saving}
            className="mt-2 w-full text-center text-xs text-[#145142] hover:underline sm:text-sm"
            onClick={() => void handleResendCode()}
          >
            {cp.phoneCodeResend}
          </button>
          <button
            type="button"
            className="mt-2 w-full text-center text-xs text-gray-500 hover:text-[#145142] sm:text-sm"
            onClick={cancelPhoneVerify}
          >
            {cp.phoneVerifyCancel}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="watta-profile-address-form__save mt-4"
          disabled={saving || !canSave}
          onClick={() => void handleSave()}
        >
          {saving ? cp.dataSaving : cp.dataSave}
        </button>
      )}
    </div>
  )
}
