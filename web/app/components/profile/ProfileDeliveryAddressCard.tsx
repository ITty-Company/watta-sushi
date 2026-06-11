'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { AlertCircle, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { MapPin } from '@/lib/wattaInlineIcons'
import toast from 'react-hot-toast'
import type { Translations } from '@/app/context/LanguageContext'
import { getBearerAuthHeaders } from '@/lib/authHeaders'
import {
  fetchDeliveryCheck,
  isDeliveryCityUnavailable,
  isDeliveryFeeAvailable,
  isDeliveryOutsideArea,
  type DeliveryCheckResult,
} from '@/lib/deliveryCheckClient'
import DeliveryUnavailableCityNotice from '../delivery/DeliveryUnavailableCityNotice'
import { readCityIdForProductApi } from '@/lib/wattaSiteLocalePrefs'
import { cityIdPreferAmsterdam } from '@/lib/wattaPreferredDefaultCity'
import type { SavedUserAddress } from './ProfileAddressesFlow'

type CityRow = { id: number; name?: string | null; name_en?: string | null }

type ProfileDeliveryAddressCardBaseProps = {
  cp: Translations['clientProfile']
  d: Translations['deliveryPage']
  enterAddressHint: string
}

export type ProfileDeliveryAddressCardProps = ProfileDeliveryAddressCardBaseProps &
  (
    | {
        mode: 'add'
        onAdded: (entry: SavedUserAddress | null, primaryAddress: string) => void
      }
    | {
        mode?: 'legacy'
        initialAddress: string
        onSaved: (address: string) => void
      }
  )

const CHECK_DEBOUNCE_MS = 650

export default function ProfileDeliveryAddressCard(props: ProfileDeliveryAddressCardProps) {
  const { cp, d, enterAddressHint } = props
  const isAddMode = props.mode === 'add'
  const initialAddress = isAddMode ? '' : props.initialAddress
  const inputId = useId()
  const [draft, setDraft] = useState(initialAddress)
  const [cityId, setCityId] = useState<number | null>(null)
  const [checking, setChecking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<DeliveryCheckResult | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (!isAddMode) {
      setDraft(initialAddress)
    }
  }, [initialAddress, isAddMode])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const saved = readCityIdForProductApi()
      if (saved != null) {
        if (!cancelled) setCityId(saved)
        return
      }
      try {
        const res = await fetch('/api/cities')
        if (!res.ok) return
        const list = (await res.json()) as CityRow[]
        const id = cityIdPreferAmsterdam(list)
        if (!cancelled && id != null) setCityId(id)
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const runCheck = useCallback(
    async (query: string) => {
      const trimmed = query.trim()
      if (trimmed.length < 3) {
        setResult(null)
        setChecking(false)
        return
      }
      if (!cityId) {
        setResult({ status: 'server_error' })
        setChecking(false)
        return
      }
      const reqId = ++requestIdRef.current
      setChecking(true)
      try {
        const data = await fetchDeliveryCheck(cityId, trimmed)
        if (reqId !== requestIdRef.current) return
        setResult(data)
      } catch {
        if (reqId === requestIdRef.current) setResult({ status: 'server_error' })
      } finally {
        if (reqId === requestIdRef.current) setChecking(false)
      }
    },
    [cityId],
  )

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = draft.trim()
    if (trimmed.length < 3) {
      setResult(null)
      setChecking(false)
      return
    }
    setChecking(true)
    debounceRef.current = setTimeout(() => {
      void runCheck(trimmed)
    }, CHECK_DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [draft, runCheck])

  const handleSave = async () => {
    const trimmed = draft.trim()
    if (trimmed.length < 3) {
      toast.error(d.postalBadRequest)
      return
    }
    const auth = getBearerAuthHeaders()
    if (Object.keys(auth).length === 0) {
      toast.error(cp.redirectLogin)
      return
    }
    setSaving(true)
    try {
      if (isAddMode) {
        const res = await fetch('/api/auth/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...auth },
          body: JSON.stringify({ address: trimmed }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          toast.error((data.message as string) || cp.addrSaveError)
          return
        }
        const entry = data.address as SavedUserAddress | undefined
        const primary = String(data.primaryAddress ?? trimmed)
        props.onAdded(entry ?? null, primary)
        setDraft('')
        setResult(null)
        toast.success(cp.addrSaved)
        return
      }

      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...auth },
        body: JSON.stringify({ address: trimmed }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data.message as string) || cp.addrSaveError)
        return
      }
      const saved = String(data.user?.address ?? trimmed)
      setDraft(saved)
      props.onSaved(saved)
      toast.success(cp.addrSaved)
      void runCheck(saved)
    } catch {
      toast.error(cp.addrSaveError)
    } finally {
      setSaving(false)
    }
  }

  const feeReady =
    result &&
    isDeliveryFeeAvailable(result.status) &&
    result.estimatedDeliveryFee != null &&
    !Number.isNaN(result.estimatedDeliveryFee)

  const statusError =
    result &&
    (isDeliveryOutsideArea(result.status) ||
      result.status === 'geocode_failed' ||
      result.status === 'postcode_format_invalid' ||
      result.status === 'city_not_found' ||
      result.status === 'server_error')

  const cityUnavailable = result != null && isDeliveryCityUnavailable(result.status)

  const trimmedDraft = draft.trim()
  const showDraftPreview = trimmedDraft.length > 0

  let statusMessage: string | null = null
  if (cityUnavailable) {
    statusMessage = null
  } else if (result?.status === 'outside') {
    statusMessage = d.postalOutside
  } else if (result?.status === 'geocode_failed' || result?.status === 'postcode_format_invalid') {
    statusMessage = d.postalGeocodeFail
  } else if (result?.status === 'server_error') {
    statusMessage = d.postalGeocodeFail
  }

  return (
    <div className="watta-profile-address-form">
      <label className="watta-profile-address-form__label" htmlFor={inputId}>
        <MapPin size={14} aria-hidden />
        {cp.addrInputLabel}
      </label>
      <textarea
        id={inputId}
        className="watta-profile-address-form__input"
        rows={3}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={cp.addrInputPlaceholder}
        autoComplete="street-address"
      />
      <p className="watta-profile-address-form__hint">{cp.addrCheckHint}</p>

      {showDraftPreview ? (
        <div className="watta-profile-address-form__draft" aria-live="polite">
          <span className="watta-profile-address-form__draft-label">{cp.addrDraftPreview}</span>
          <p className="watta-profile-address-form__draft-text">{trimmedDraft}</p>
          {!checking && result?.placeLabel && result.placeLabel !== trimmedDraft ? (
            <p className="watta-profile-address-form__draft-geocode">
              {d.postalAddressFound}: {result.placeLabel}
            </p>
          ) : null}
        </div>
      ) : null}

      {(checking || result) && (
        <div
          className={`watta-profile-address-form__result ${
            statusError ? 'watta-profile-address-form__result--error' : ''
          } ${feeReady ? 'watta-profile-address-form__result--ok' : ''}`}
          aria-live="polite"
        >
          {checking ? (
            <p className="flex items-center gap-2 text-sm text-[#64748b]">
              <Loader2 size={16} className="animate-spin shrink-0" aria-hidden />
              {d.postalChecking}
            </p>
          ) : null}
          {!checking && feeReady ? (
            <div className="flex flex-wrap items-baseline justify-center gap-2 sm:justify-start">
              <CheckCircle2 size={18} className="shrink-0 text-watta-action" aria-hidden />
              <span className="text-sm font-semibold text-watta-action">{d.postalDeliveryFeeTitle}:</span>
              <span className="text-2xl font-bold tabular-nums text-[#ff5c00]">
                {result!.estimatedDeliveryFee} €
              </span>
              {result!.placeLabel ? (
                <p className="w-full text-xs text-[#64748b]">
                  {d.postalAddressFound}: {result!.placeLabel}
                </p>
              ) : null}
              {result!.distanceKm != null ? (
                <p className="w-full text-xs text-[#64748b]">
                  {d.distanceFromKitchen.replace('{{km}}', String(result!.distanceKm))}
                </p>
              ) : null}
            </div>
          ) : null}
          {!checking && cityUnavailable ? (
            <DeliveryUnavailableCityNotice title={d.deliveryUnavailableTitle} compact />
          ) : null}
          {!checking && statusMessage ? (
            <p className="flex items-start gap-2 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden />
              {statusMessage}
            </p>
          ) : null}
          {!checking &&
          result &&
          isDeliveryFeeAvailable(result.status) &&
          result.estimatedDeliveryFee == null ? (
            <p className="text-sm text-[#64748b]">{enterAddressHint}</p>
          ) : null}
        </div>
      )}

      <button
        type="button"
        className="watta-profile-address-form__save watta-profile-address-form__save--brand"
        disabled={saving || draft.trim().length < 3}
        onClick={() => void handleSave()}
      >
        <span>{saving ? cp.addrSaving : cp.addrSave}</span>
        {!saving ? <ArrowRight size={18} strokeWidth={2.2} aria-hidden /> : null}
      </button>
    </div>
  )
}
