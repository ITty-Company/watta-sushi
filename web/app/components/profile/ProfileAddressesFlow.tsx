'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { MapPin, Plus } from '@/lib/wattaInlineIcons'
import toast from 'react-hot-toast'
import type { Translations } from '@/app/context/LanguageContext'
import { getBearerAuthHeaders } from '@/lib/authHeaders'
import ProfileAddressEmptyScene from './empty/ProfileAddressEmptyScene'
import ProfileDeliveryAddressCard from './ProfileDeliveryAddressCard'
import { ProfileSectionBody, ProfileSectionPanel } from './ProfileSectionPanel'

export type SavedUserAddress = {
  id: number
  address: string
  createdAt: string
}

export type ProfileAddressesFlowProps = {
  cp: Translations['clientProfile']
  d: Translations['deliveryPage']
  enterAddressHint: string
  onPrimaryAddressChange: (address: string) => void
}

export default function ProfileAddressesFlow({
  cp,
  d,
  enterAddressHint,
  onPrimaryAddressChange,
}: ProfileAddressesFlowProps) {
  const [addresses, setAddresses] = useState<SavedUserAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [addFormKey, setAddFormKey] = useState(0)
  const [addOpen, setAddOpen] = useState(true)

  const loadAddresses = useCallback(async () => {
    const auth = getBearerAuthHeaders()
    if (Object.keys(auth).length === 0) {
      setAddresses([])
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/auth/addresses', { headers: auth })
      if (!res.ok) {
        setAddresses([])
        return
      }
      const data = (await res.json()) as { addresses?: SavedUserAddress[] }
      setAddresses(Array.isArray(data.addresses) ? data.addresses : [])
    } catch {
      setAddresses([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAddresses()
  }, [loadAddresses])

  const handleAdded = useCallback(
    (entry: SavedUserAddress | null, primaryAddress: string) => {
      onPrimaryAddressChange(primaryAddress)
      setAddFormKey((k) => k + 1)
      setAddOpen(false)
      if (entry?.id) {
        setAddresses((prev) => {
          if (prev.some((row) => row.id === entry.id)) return prev
          return [...prev, entry]
        })
      } else {
        void loadAddresses()
      }
    },
    [loadAddresses, onPrimaryAddressChange],
  )

  const handleDelete = async (id: number) => {
    const auth = getBearerAuthHeaders()
    if (Object.keys(auth).length === 0) {
      toast.error(cp.redirectLogin)
      return
    }
    setDeletingId(id)
    try {
      const res = await fetch(`/api/auth/addresses/${id}`, {
        method: 'DELETE',
        headers: auth,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data.message as string) || cp.addrDeleteError)
        return
      }
      setAddresses((prev) => prev.filter((row) => row.id !== id))
      onPrimaryAddressChange(String(data.primaryAddress ?? ''))
      toast.success(cp.addrDeleted)
    } catch {
      toast.error(cp.addrDeleteError)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="watta-profile-address-flow">
        <ProfileSectionPanel className="watta-profile-section--loading">
          <div className="watta-profile-section__loading" role="status">
            <Loader2 size={22} className="animate-spin shrink-0" aria-hidden />
            <span className="sr-only">{cp.loading}</span>
          </div>
        </ProfileSectionPanel>
      </div>
    )
  }

  const isEmpty = addresses.length === 0

  return (
    <div className="watta-profile-address-flow">
      <ProfileSectionPanel>
        {isEmpty ? (
          <ProfileAddressEmptyScene title={cp.addrEmptyTitle} subtitle={cp.addrEmptySub} />
        ) : (
          <ProfileSectionBody className="watta-profile-section__block--saved">
            <section aria-label={cp.addrSavedList}>
              <div className="watta-profile-section__head">
                <h3 className="watta-profile-section__kicker">{cp.addrSavedList}</h3>
                <span className="watta-profile-section__badge">{addresses.length}</span>
              </div>
              <ul className="watta-profile-address-list">
                {addresses.map((row) => (
                  <li key={row.id} className="watta-profile-address-card">
                    <div className="watta-profile-address-card__icon" aria-hidden>
                      <MapPin size={18} strokeWidth={2.2} />
                    </div>
                    <p className="watta-profile-address-card__text">{row.address}</p>
                    <button
                      type="button"
                      className="watta-profile-address-card__delete"
                      onClick={() => void handleDelete(row.id)}
                      disabled={deletingId === row.id}
                      aria-label={cp.addrDelete}
                    >
                      {deletingId === row.id ? (
                        <Loader2 size={16} className="animate-spin" aria-hidden />
                      ) : (
                        <Trash2 size={16} strokeWidth={2.2} aria-hidden />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </ProfileSectionBody>
        )}

        <ProfileSectionBody className="watta-profile-section__block--form">
          {!isEmpty && !addOpen ? (
            <button
              type="button"
              className="watta-profile-address-flow__add-toggle"
              onClick={() => setAddOpen(true)}
            >
              <Plus size={18} strokeWidth={2.2} aria-hidden />
              <span>{cp.addrAddNew}</span>
            </button>
          ) : null}

          {!isEmpty && addOpen ? (
            <p className="watta-profile-address-flow__add-label">{cp.addrAddNew}</p>
          ) : null}

          {isEmpty || addOpen ? (
            <ProfileDeliveryAddressCard
              key={addFormKey}
              mode="add"
              onAdded={handleAdded}
              cp={cp}
              d={d}
              enterAddressHint={enterAddressHint}
            />
          ) : null}
        </ProfileSectionBody>
      </ProfileSectionPanel>
    </div>
  )
}
