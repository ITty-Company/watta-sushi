'use client'

import { useState } from 'react'
import { Languages } from 'lucide-react'

export type BlogI18nFormFields = {
  title_ua: string
  title_ru: string
  title_en: string
  title_nl: string
  content_ua: string
  content_ru: string
  content_en: string
  content_nl: string
}

type LangTab = 'ua' | 'ru' | 'en' | 'nl'

const TABS: { id: LangTab; label: string }[] = [
  { id: 'ua', label: 'UA' },
  { id: 'ru', label: 'RU' },
  { id: 'en', label: 'EN' },
  { id: 'nl', label: 'NL' },
]

type Props = {
  value: BlogI18nFormFields
  onChange: (next: BlogI18nFormFields) => void
  onAutoTranslate: () => Promise<void>
  translating: boolean
}

export default function BlogI18nEditor({ value, onChange, onAutoTranslate, translating }: Props) {
  const [tab, setTab] = useState<LangTab>('ua')

  const setField = (field: keyof BlogI18nFormFields, text: string) => {
    onChange({ ...value, [field]: text })
  }

  const titleKey = `title_${tab}` as keyof BlogI18nFormFields
  const contentKey = `content_${tab}` as keyof BlogI18nFormFields

  return (
    <div className="md:col-span-2 rounded-xl border border-[#145142]/15 bg-[#f6fbf8]/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#145142]">Текст статті (4 мови)</p>
          <p className="mt-0.5 text-xs text-[#145142]/65">
            Заповніть вручну або спочатку українською, потім натисніть автопереклад.
          </p>
        </div>
        <button
          type="button"
          disabled={translating || (!value.title_ua.trim() && !value.content_ua.trim())}
          onClick={() => void onAutoTranslate()}
          className="inline-flex items-center gap-2 rounded-xl border border-[#145142]/25 bg-white px-4 py-2 text-sm font-bold text-[#145142] transition hover:bg-[#145142]/5 disabled:opacity-50"
        >
          <Languages className="h-4 w-4" aria-hidden />
          {translating ? 'Переклад…' : 'Автопереклад з UA'}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              tab === t.id
                ? 'bg-[#145142] text-white'
                : 'bg-white text-[#145142]/80 border border-[#145142]/15 hover:bg-[#145142]/8'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder={`Заголовок (${tab.toUpperCase()})`}
        value={value[titleKey]}
        onChange={(e) => setField(titleKey, e.target.value)}
        className="mt-3 w-full p-4 rounded-xl border-2 border-[#145142]/20 outline-none focus:border-[#145142]"
      />
      <textarea
        placeholder={`Текст статті (${tab.toUpperCase()})`}
        value={value[contentKey]}
        onChange={(e) => setField(contentKey, e.target.value)}
        className="mt-3 w-full p-4 rounded-xl border-2 border-[#145142]/20 outline-none focus:border-[#145142] min-h-[200px]"
      />
    </div>
  )
}

export const emptyBlogI18nFields = (): BlogI18nFormFields => ({
  title_ua: '',
  title_ru: '',
  title_en: '',
  title_nl: '',
  content_ua: '',
  content_ru: '',
  content_en: '',
  content_nl: '',
})

export function blogI18nFromPost(post: Record<string, unknown>): BlogI18nFormFields {
  const str = (k: string) => (typeof post[k] === 'string' ? String(post[k]) : '')
  return {
    title_ua: str('title_ua') || str('title'),
    title_ru: str('title_ru'),
    title_en: str('title_en'),
    title_nl: str('title_nl'),
    content_ua: str('content_ua') || str('content'),
    content_ru: str('content_ru'),
    content_en: str('content_en'),
    content_nl: str('content_nl'),
  }
}
