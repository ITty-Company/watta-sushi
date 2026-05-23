'use client'

import { useMemo, useState } from 'react'
import { useLanguage } from '@/app/context/LanguageContext'
import { parseBlogIdList } from '@/lib/blogLinks'

type NamedRow = {
  id: number
  name_ru: string
  name_ua?: string | null
  name_en?: string | null
  name_nl?: string | null
  emoji?: string | null
  slug?: string
}

type Props = {
  products: NamedRow[]
  categories: NamedRow[]
  ingredients: NamedRow[]
  linkedProductIds: number[]
  linkedCategoryIds: number[]
  linkedIngredientIds: number[]
  onToggleProduct: (id: number) => void
  onToggleCategory: (id: number) => void
  onToggleIngredient: (id: number) => void
}

function LinkSection({
  title,
  hint,
  rows,
  selectedIds,
  onToggle,
  getLabel,
}: {
  title: string
  hint: string
  rows: NamedRow[]
  selectedIds: number[]
  onToggle: (id: number) => void
  getLabel: (row: NamedRow) => string
}) {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((r) => getLabel(r).toLowerCase().includes(needle))
  }, [q, rows, getLabel])

  return (
    <div className="rounded-xl border border-[#145142]/15 bg-white/90 p-3">
      <p className="text-sm font-bold text-[#145142]">{title}</p>
      <p className="mt-0.5 text-xs text-[#145142]/65">{hint}</p>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Пошук…"
        className="mt-2 w-full rounded-lg border border-[#145142]/20 px-3 py-2 text-sm outline-none focus:border-[#145142]"
      />
      <div className="mt-2 max-h-40 overflow-y-auto space-y-1 admin-watta-scroll-y">
        {filtered.length === 0 ? (
          <p className="py-2 text-xs text-gray-400">Нічого не знайдено</p>
        ) : (
          filtered.map((row) => {
            const checked = selectedIds.includes(row.id)
            return (
              <label
                key={row.id}
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition ${
                  checked ? 'bg-[#145142]/12 text-[#145142]' : 'hover:bg-[#145142]/5 text-gray-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(row.id)}
                  className="h-4 w-4 accent-[#145142]"
                />
                {row.emoji ? <span aria-hidden>{row.emoji}</span> : null}
                <span className="min-w-0 flex-1 truncate">{getLabel(row)}</span>
              </label>
            )
          })
        )}
      </div>
      {selectedIds.length > 0 ? (
        <p className="mt-2 text-xs font-semibold text-[#145142]/80">Обрано: {selectedIds.length}</p>
      ) : null}
    </div>
  )
}

export default function BlogLinksPicker({
  products,
  categories,
  ingredients,
  linkedProductIds,
  linkedCategoryIds,
  linkedIngredientIds,
  onToggleProduct,
  onToggleCategory,
  onToggleIngredient,
}: Props) {
  const { getLocalized } = useLanguage()

  const label = (row: NamedRow) =>
    getLocalized(row, 'name') || row.name_ru || `#${row.id}`

  const safeProducts = useMemo(
    () => products.filter((p) => Number.isInteger(p.id)),
    [products],
  )
  const safeCategories = useMemo(
    () => categories.filter((c) => Number.isInteger(c.id)),
    [categories],
  )
  const safeIngredients = useMemo(
    () => ingredients.filter((i) => Number.isInteger(i.id)),
    [ingredients],
  )

  const total =
    parseBlogIdList(linkedProductIds).length +
    parseBlogIdList(linkedCategoryIds).length +
    parseBlogIdList(linkedIngredientIds).length

  return (
    <div className="md:col-span-2 space-y-3">
      <div>
        <p className="text-sm font-bold text-[#145142]">Звʼязки з меню</p>
        <p className="mt-1 text-xs text-[#145142]/65">
          Відмітьте страви, категорії або інгредієнти — на сторінці статті зʼявиться блок «У статті
          згадуємо» з посиланнями в меню.
          {total > 0 ? ` Зараз обрано: ${total}.` : ''}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <LinkSection
          title="Страви"
          hint="Товари з меню — посилання на сторінку страви"
          rows={safeProducts}
          selectedIds={linkedProductIds}
          onToggle={onToggleProduct}
          getLabel={label}
        />
        <LinkSection
          title="Категорії"
          hint="Розділи меню — посилання на категорію"
          rows={safeCategories}
          selectedIds={linkedCategoryIds}
          onToggle={onToggleCategory}
          getLabel={label}
        />
        <LinkSection
          title="Інгредієнти"
          hint="Лосось, рис, норі — для довіри та прозорості"
          rows={safeIngredients}
          selectedIds={linkedIngredientIds}
          onToggle={onToggleIngredient}
          getLabel={label}
        />
      </div>
    </div>
  )
}
