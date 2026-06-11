'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Trash2, Pencil, Sparkles } from 'lucide-react'
import { Plus } from '@/lib/wattaInlineIcons'
import toast from 'react-hot-toast'
import { formatTierRangeLabel, type CartUpsellTierDto } from '@/lib/cartUpsell'
import { broadcastWattaCatalogUpdate } from '@/lib/wattaCatalogSync'
import { useLanguage } from '../../context/LanguageContext'

type ProductRow = {
  id: number
  name_ru: string
  price: number
}

type TierForm = {
  minOrderTotal: string
  maxOrderTotal: string
  discountEur: string
  sortOrder: string
  isActive: boolean
  productIds: number[]
}

const emptyForm = (): TierForm => ({
  minOrderTotal: '50',
  maxOrderTotal: '',
  discountEur: '3',
  sortOrder: '0',
  isActive: true,
  productIds: [],
})

function adminAuthHeaders(): { Authorization: string } | null {
  if (typeof window === 'undefined') return null
  const token = localStorage.getItem('token')
  if (!token) return null
  return { Authorization: `Bearer ${token}` }
}

type Props = {
  products: ProductRow[]
}

export default function AdminCartUpsellPanel({ products }: Props) {
  const { t } = useLanguage()
  const u = t.adminPanel.cartUpsell
  const [tiers, setTiers] = useState<CartUpsellTierDto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<TierForm>(emptyForm)

  const loadTiers = useCallback(async () => {
    const headers = adminAuthHeaders()
    if (!headers) return
    setLoading(true)
    try {
      const res = await fetch('/api/cart-upsell/all', { headers })
      if (!res.ok) throw new Error('load_failed')
      const data = await res.json()
      setTiers(Array.isArray(data) ? data : [])
    } catch {
      toast.error(u.loadError)
      setTiers([])
    } finally {
      setLoading(false)
    }
  }, [u.loadError])

  useEffect(() => {
    void loadTiers()
  }, [loadTiers])

  const productOptions = useMemo(
    () =>
      [...products].sort((a, b) =>
        String(a.name_ru).localeCompare(String(b.name_ru), 'uk'),
      ),
    [products],
  )

  const startCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
  }

  const startEdit = (tier: CartUpsellTierDto) => {
    setEditingId(tier.id)
    setForm({
      minOrderTotal: String(tier.minOrderTotal),
      maxOrderTotal:
        tier.maxOrderTotal != null && Number.isFinite(Number(tier.maxOrderTotal))
          ? String(tier.maxOrderTotal)
          : '',
      discountEur: String(tier.discountEur),
      sortOrder: String(tier.sortOrder ?? 0),
      isActive: tier.isActive !== false,
      productIds: (tier.products ?? [])
        .map((p) => Number((p as { id?: number }).id))
        .filter((id) => Number.isFinite(id) && id > 0),
    })
  }

  const toggleProduct = (productId: number) => {
    setForm((prev) => {
      const has = prev.productIds.includes(productId)
      return {
        ...prev,
        productIds: has
          ? prev.productIds.filter((id) => id !== productId)
          : [...prev.productIds, productId],
      }
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const headers = adminAuthHeaders()
    if (!headers) {
      toast.error(u.authRequired)
      return
    }
    setSaving(true)
    try {
      const body = {
        minOrderTotal: parseFloat(form.minOrderTotal),
        maxOrderTotal: form.maxOrderTotal.trim() === '' ? null : parseFloat(form.maxOrderTotal),
        discountEur: parseFloat(form.discountEur),
        sortOrder: parseInt(form.sortOrder, 10) || 0,
        isActive: form.isActive,
        productIds: form.productIds,
      }
      const url = editingId ? `/api/cart-upsell/${editingId}` : '/api/cart-upsell'
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(err?.error || 'save_failed')
      }
      toast.success(editingId ? u.tierUpdated : u.tierCreated)
      broadcastWattaCatalogUpdate('cartUpsell')
      setEditingId(null)
      setForm(emptyForm())
      await loadTiers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : u.saveError)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm(u.deleteConfirm)) return
    const headers = adminAuthHeaders()
    if (!headers) return
    try {
      const res = await fetch(`/api/cart-upsell/${id}`, { method: 'DELETE', headers })
      if (!res.ok) throw new Error('delete_failed')
      toast.success(u.deleted)
      broadcastWattaCatalogUpdate('cartUpsell')
      if (editingId === id) {
        setEditingId(null)
        setForm(emptyForm())
      }
      await loadTiers()
    } catch {
      toast.error(u.deleteError)
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-watta-action/15 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="admin-watta-section-title flex items-center gap-2 text-lg sm:text-xl">
              <Sparkles className="h-5 w-5 text-[#ff6b35]" />
              {u.title}
            </h2>
            <p className="admin-watta-section-lead mt-1 max-w-2xl text-sm">{u.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-watta-action px-4 py-2 text-sm font-semibold text-white hover:bg-watta-action-hover"
          >
            <Plus className="h-4 w-4" />
            {u.newTierBtn}
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-watta-action/55">{u.loading}</p>
        ) : tiers.length === 0 ? (
          <p className="rounded-xl border border-dashed border-watta-action/20 bg-[#f8fbf9] px-4 py-8 text-center text-sm text-watta-action/55">
            {u.empty}
          </p>
        ) : (
          <ul className="space-y-3">
            {tiers.map((tier) => (
              <li
                key={tier.id}
                className="admin-watta-hover-lift flex flex-wrap items-center justify-between gap-3 rounded-xl border border-watta-action/12 bg-[#f8fbf9]/80 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-[#0f241e]">
                    {formatTierRangeLabel(tier)} · −{Number(tier.discountEur).toFixed(2)} €
                    {u.perItemSuffix}
                  </p>
                  <p className="text-xs text-watta-action/55">
                    {u.productCount.replace('{{count}}', String(tier.products?.length ?? 0))}
                    {!tier.isActive ? u.disabledSuffix : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(tier)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-watta-action/12 bg-white text-watta-action hover:bg-watta-action/5"
                    aria-label={u.editAria}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(tier.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-red-600 hover:bg-red-50"
                    aria-label={u.deleteAria}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <form
        onSubmit={(e) => void handleSave(e)}
        className="rounded-2xl border border-watta-action/15 bg-white p-4 shadow-sm sm:p-6"
      >
        <h3 className="mb-4 text-base font-bold text-watta-action">
          {editingId
            ? u.editTierTitle.replace('{{id}}', String(editingId))
            : u.newTierTitle}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-watta-action/80">{u.fromAmount}</span>
            <input
              type="number"
              min={0}
              step={0.01}
              required
              value={form.minOrderTotal}
              onChange={(e) => setForm((f) => ({ ...f, minOrderTotal: e.target.value }))}
              className="w-full rounded-lg border border-watta-action/15 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-watta-action/80">{u.toAmount}</span>
            <input
              type="number"
              min={0}
              step={0.01}
              placeholder={u.noLimitPlaceholder}
              value={form.maxOrderTotal}
              onChange={(e) => setForm((f) => ({ ...f, maxOrderTotal: e.target.value }))}
              className="w-full rounded-lg border border-watta-action/15 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-watta-action/80">{u.discount}</span>
            <input
              type="number"
              min={0.01}
              step={0.01}
              required
              value={form.discountEur}
              onChange={(e) => setForm((f) => ({ ...f, discountEur: e.target.value }))}
              className="w-full rounded-lg border border-watta-action/15 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-watta-action/80">{u.sortOrder}</span>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              className="w-full rounded-lg border border-watta-action/15 px-3 py-2"
            />
          </label>
        </div>
        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-medium text-watta-action/80">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            className="h-4 w-4 accent-[var(--watta-brand-action)]"
          />
          {u.activeTier}
        </label>
        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold text-[#0f241e]">
            {u.discountedProducts.replace('{{count}}', String(form.productIds.length))}
          </p>
          <div className="max-h-64 overflow-y-auto rounded-xl border border-watta-action/12 p-2">
            {productOptions.length === 0 ? (
              <p className="px-2 py-4 text-sm text-watta-action/55">{u.addProductsFirst}</p>
            ) : (
              <ul className="space-y-1">
                {productOptions.map((p) => (
                  <li key={p.id}>
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-watta-action/5">
                      <input
                        type="checkbox"
                        checked={form.productIds.includes(p.id)}
                        onChange={() => toggleProduct(p.id)}
                        className="h-4 w-4 accent-[var(--watta-brand-action)]"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm text-[#0f241e]">{p.name_ru}</span>
                      <span className="shrink-0 text-xs text-watta-action/55">{p.price} €</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-watta-action px-5 py-2.5 text-sm font-semibold text-white hover:bg-watta-action-hover disabled:opacity-50"
          >
            {saving ? u.saving : editingId ? u.saveChanges : u.createTier}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={() => {
                setEditingId(null)
                setForm(emptyForm())
              }}
              className="rounded-xl border border-watta-action/15 px-5 py-2.5 text-sm font-semibold text-watta-action hover:bg-watta-action/5"
            >
              {u.cancel}
            </button>
          ) : null}
        </div>
      </form>
    </section>
  )
}
