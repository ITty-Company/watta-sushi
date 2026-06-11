'use client'

import { useState } from 'react'
import { Languages } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

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
  const { t } = useLanguage()
  const b = t.adminPanel.blog
  const [tab, setTab] = useState<LangTab>('ua')

  const setField = (field: keyof BlogI18nFormFields, text: string) => {
    onChange({ ...value, [field]: text })
  }

  const titleKey = `title_${tab}` as keyof BlogI18nFormFields
  const contentKey = `content_${tab}` as keyof BlogI18nFormFields
  const langLabel = tab.toUpperCase()

  return (
    <div className="md:col-span-2 rounded-xl border border-watta-action/15 bg-[#f6fbf8]/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-watta-action">{b.i18nTitle}</p>
          <p className="mt-0.5 text-xs text-watta-action/65">{b.i18nHint}</p>
        </div>
        <button
          type="button"
          disabled={translating || (!value.title_ua.trim() && !value.content_ua.trim())}
          onClick={() => void onAutoTranslate()}
          className="inline-flex items-center gap-2 rounded-xl border border-watta-action/25 bg-white px-4 py-2 text-sm font-bold text-watta-action transition hover:bg-watta-action/5 disabled:opacity-50"
        >
          <Languages className="h-4 w-4" aria-hidden />
          {translating ? b.translating : b.autoTranslateBtn}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.id}
            type="button"
            onClick={() => setTab(tabItem.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              tab === tabItem.id
                ? 'bg-watta-action text-white'
                : 'bg-white text-watta-action/80 border border-watta-action/15 hover:bg-watta-action/8'
            }`}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder={b.titlePlaceholder.replace('{{lang}}', langLabel)}
        value={value[titleKey]}
        onChange={(e) => setField(titleKey, e.target.value)}
        className="mt-3 w-full p-4 rounded-xl border-2 border-watta-action/20 outline-none focus:border-watta-action"
      />
      <textarea
        placeholder={b.contentPlaceholder.replace('{{lang}}', langLabel)}
        value={value[contentKey]}
        onChange={(e) => setField(contentKey, e.target.value)}
        className="mt-3 w-full p-4 rounded-xl border-2 border-watta-action/20 outline-none focus:border-watta-action min-h-[200px]"
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
