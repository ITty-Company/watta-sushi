'use client'

import type { IngredientLocaleSuffix } from '@/lib/i18n/ingredientLocale'
import { INGREDIENT_LOCALE_SUFFIXES, ingredientNameForSuffix } from '@/lib/i18n/ingredientLocale'

export type IngredientLocaleDraft = {
  name_ru: string
  name_ua: string
  name_en: string
  name_nl: string
}

type LangMeta = { suffix: IngredientLocaleSuffix; label: string; required?: boolean }

type Props = {
  value: IngredientLocaleDraft
  onChange: (next: IngredientLocaleDraft) => void
  labels: {
    sectionTitle: string
    hint: string
    placeholder: string
    previewTitle: string
  }
  langMeta: LangMeta[]
}

export function IngredientLocaleFields({ value, onChange, labels, langMeta }: Props) {
  const setField = (suffix: IngredientLocaleSuffix, text: string) => {
    onChange({ ...value, [`name_${suffix}`]: text })
  }

  const previewName =
    langMeta
      .map((m) => ingredientNameForSuffix(value, m.suffix))
      .find((s) => s.length > 0) ?? ''

  return (
    <div className="admin-ing-locale space-y-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[#145142]/80">{labels.sectionTitle}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-[#145142]/60">{labels.hint}</p>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {langMeta.map((meta) => {
          const filled = ingredientNameForSuffix(value, meta.suffix).length > 0
          return (
            <label key={meta.suffix} className="admin-ing-locale__field block">
              <span className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-[#145142]/75">
                <span
                  className={`inline-flex min-w-[1.75rem] justify-center rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                    filled
                      ? 'bg-watta-action/12 text-[#145142]'
                      : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/80'
                  }`}
                >
                  {meta.suffix}
                </span>
                {meta.label}
                {meta.required ? <span className="text-red-500">*</span> : null}
              </span>
              <input
                type="text"
                value={value[`name_${meta.suffix}`] || ''}
                onChange={(e) => setField(meta.suffix, e.target.value)}
                className="admin-ing-locale__input w-full rounded-xl border border-[#145142]/15 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#145142] focus:ring-2 focus:ring-[#145142]/15"
                placeholder={labels.placeholder}
                autoComplete="off"
              />
            </label>
          )
        })}
      </div>

      {previewName ? (
        <div className="admin-ing-locale__preview rounded-xl border border-[#145142]/12 bg-gradient-to-br from-[#f6faf8] to-white px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#145142]/55">{labels.previewTitle}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {INGREDIENT_LOCALE_SUFFIXES.map((suffix) => {
              const name = ingredientNameForSuffix(value, suffix)
              if (!name) return null
              return (
                <span
                  key={suffix}
                  className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#145142]/12 bg-white px-2 py-0.5 text-[10px] font-semibold text-[#0f241e] shadow-sm"
                >
                  <span className="text-[9px] font-extrabold uppercase text-[#145142]/50">{suffix}</span>
                  <span className="truncate">{name}</span>
                </span>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
