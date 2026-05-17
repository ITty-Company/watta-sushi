'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Plus, Save, Trash2, Upload } from 'lucide-react'
import type { Translations } from '@/app/context/LanguageContext'
import type { Language } from '@/app/context/LanguageContext'
import type { AuthHeroPhoneCopyForm } from '@/lib/authHeroPhoneSettings'

export type HeroVideoSlotState = {
  id: string
  savedUrl: string | null
  pendingFile: File | null
  pendingPreviewUrl: string | null
}

type BannersT = Translations['adminPanel']['banners']

type Props = {
  t: BannersT
  reduceMotion: boolean
  saving: boolean
  canSave: boolean
  onSave: () => void
  phone1Title: string
  phone2Title: string
  phone1Slots: HeroVideoSlotState[]
  phone2Slots: HeroVideoSlotState[]
  phone1CopyForm: AuthHeroPhoneCopyForm
  phone2CopyForm: AuthHeroPhoneCopyForm
  onPhone1CopyChange: (lang: Language, field: keyof AuthHeroPhoneCopyForm['uk'], value: string) => void
  onPhone2CopyChange: (lang: Language, field: keyof AuthHeroPhoneCopyForm['uk'], value: string) => void
  phone1FileInputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>
  phone2FileInputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>
  onPhone1FileChange: (slotId: string, e: React.ChangeEvent<HTMLInputElement>) => void
  onPhone2FileChange: (slotId: string, e: React.ChangeEvent<HTMLInputElement>) => void
  onAddPhone1Slot: () => void
  onAddPhone2Slot: () => void
  onRemovePhone1Slot: (slotId: string) => void
  onRemovePhone2Slot: (slotId: string) => void
}

const COPY_LANGS: { id: Language; label: (t: BannersT) => string }[] = [
  { id: 'uk', label: (t) => t.authHeroCopyLangUk },
  { id: 'ru', label: (t) => t.authHeroCopyLangRu },
  { id: 'en', label: (t) => t.authHeroCopyLangEn },
  { id: 'nl', label: (t) => t.authHeroCopyLangNl },
]

function VideoSlotGrid({
  t,
  reduceMotion,
  slots,
  fileInputRefs,
  onFileChange,
  onRemoveSlot,
  onAddSlot,
}: {
  t: BannersT
  reduceMotion: boolean
  slots: HeroVideoSlotState[]
  fileInputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>
  onFileChange: (slotId: string, e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveSlot: (slotId: string) => void
  onAddSlot: () => void
}) {
  return (
    <>
      <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {slots.map((slot, slotIndex) => {
          const previewSrc = slot.pendingPreviewUrl ?? slot.savedUrl
          const slotLabel = t.heroVideoSlotLabel.replace('{{n}}', String(slotIndex + 1))
          return (
            <motion.div
              key={slot.id}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: slotIndex * 0.05 }}
              className="flex flex-col rounded-[14px] border border-[#145142]/12 bg-[#f6fbf8]/80 p-3"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-[#145142]/70">{slotLabel}</p>
              <div className="mt-2 overflow-hidden rounded-[12px] border border-[#145142]/10 bg-[#0d2a22]/5">
                {previewSrc ? (
                  <video
                    key={previewSrc}
                    src={previewSrc}
                    className="aspect-[9/16] max-h-[280px] w-full bg-black object-cover"
                    controls
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <div className="flex aspect-[9/16] max-h-[280px] w-full items-center justify-center bg-[#145142]/5 text-xs text-[#145142]/45">
                    —
                  </div>
                )}
              </div>
              {previewSrc && !slot.pendingFile ? (
                <p className="mt-1.5 truncate font-mono text-[10px] text-[#145142]/55" title={slot.savedUrl ?? ''}>
                  {slot.savedUrl}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  ref={(el) => {
                    fileInputRefs.current[slot.id] = el
                  }}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={(e) => onFileChange(slot.id, e)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRefs.current[slot.id]?.click()}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border-2 border-[#145142]/25 bg-white px-3 py-2 text-xs font-bold text-[#145142] transition hover:border-[#145142]/45 hover:bg-[#145142]/5"
                >
                  <Upload className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {t.heroVideoUpload}
                </button>
                {previewSrc || slots.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => onRemoveSlot(slot.id)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-[#145142]/20 bg-white px-3 py-2 text-xs font-semibold text-[#145142]/80 transition hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {t.heroVideoRemove}
                  </button>
                ) : null}
              </div>
            </motion.div>
          )
        })}
      </div>
      <button
        type="button"
        onClick={onAddSlot}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[12px] border-2 border-dashed border-[#145142]/30 bg-[#145142]/[0.04] px-4 py-3 text-sm font-bold text-[#145142] transition hover:border-[#145142]/50 hover:bg-[#145142]/10 sm:w-auto"
      >
        <Plus className="h-4 w-4 shrink-0" aria-hidden />
        {t.heroVideoAddBtn}
      </button>
    </>
  )
}

function CopyFields({
  t,
  form,
  onChange,
}: {
  t: BannersT
  form: AuthHeroPhoneCopyForm
  onChange: (lang: Language, field: keyof AuthHeroPhoneCopyForm['uk'], value: string) => void
}) {
  const inputClass =
    'mt-1 w-full rounded-[10px] border border-[#145142]/20 bg-white px-3 py-2 text-sm text-[#155044] placeholder:text-[#145142]/40 focus:border-[#145142]/45 focus:outline-none focus:ring-2 focus:ring-[#145142]/10'

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
      {COPY_LANGS.map(({ id, label }) => (
        <div key={id} className="rounded-[14px] border border-[#145142]/12 bg-[#f6fbf8]/60 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#145142]/70">{label(t)}</p>
          <p className="mt-1.5 text-[10px] leading-snug text-[#145142]/60">{t.authHeroCopyCityHint}</p>
          <label className="mt-3 block text-xs font-semibold text-[#145142]/80">
            {t.authHeroCopyTitle}
            <input
              className={inputClass}
              value={form[id].title}
              onChange={(e) => onChange(id, 'title', e.target.value)}
            />
          </label>
          <label className="mt-2 block text-xs font-semibold text-[#145142]/80">
            {t.authHeroCopySubtitle}
            <input
              className={inputClass}
              value={form[id].subtitle}
              onChange={(e) => onChange(id, 'subtitle', e.target.value)}
            />
          </label>
          <p className="mt-2 text-xs font-semibold text-[#145142]/80">{t.authHeroCopyBenefits}</p>
          {(['benefit1', 'benefit2', 'benefit3'] as const).map((field) => (
            <input
              key={field}
              className={`${inputClass} mt-1`}
              value={form[id][field]}
              onChange={(e) => onChange(id, field, e.target.value)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export default function AuthHeroPhonesAdminSection({
  t,
  reduceMotion,
  saving,
  canSave,
  onSave,
  phone1Title,
  phone2Title,
  phone1Slots,
  phone2Slots,
  phone1CopyForm,
  phone2CopyForm,
  onPhone1CopyChange,
  onPhone2CopyChange,
  phone1FileInputRefs,
  phone2FileInputRefs,
  onPhone1FileChange,
  onPhone2FileChange,
  onAddPhone1Slot,
  onAddPhone2Slot,
  onRemovePhone1Slot,
  onRemovePhone2Slot,
}: Props) {
  return (
    <div className="rounded-[20px] border border-[#145142]/14 bg-white p-5 shadow-lg shadow-[#145142]/10 sm:rounded-[24px] sm:p-7">
      <h3 className="text-lg font-bold text-[#155044] sm:text-xl">{t.authHeroVideoTitle}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-[#145142]/75">{t.authHeroVideoSubtitle}</p>

      <h4 className="mt-6 text-base font-bold text-[#155044]">{phone1Title}</h4>
      <VideoSlotGrid
        t={t}
        reduceMotion={reduceMotion}
        slots={phone1Slots}
        fileInputRefs={phone1FileInputRefs}
        onFileChange={onPhone1FileChange}
        onRemoveSlot={onRemovePhone1Slot}
        onAddSlot={onAddPhone1Slot}
      />
      <CopyFields t={t} form={phone1CopyForm} onChange={onPhone1CopyChange} />

      <h4 className="mt-8 text-base font-bold text-[#155044]">{phone2Title}</h4>
      <VideoSlotGrid
        t={t}
        reduceMotion={reduceMotion}
        slots={phone2Slots}
        fileInputRefs={phone2FileInputRefs}
        onFileChange={onPhone2FileChange}
        onRemoveSlot={onRemovePhone2Slot}
        onAddSlot={onAddPhone2Slot}
      />
      <CopyFields t={t} form={phone2CopyForm} onChange={onPhone2CopyChange} />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <button
          type="button"
          disabled={saving || !canSave}
          onClick={onSave}
          className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-[#155044] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#103d34] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-4 w-4 shrink-0" aria-hidden />
          {saving ? t.heroVideoSaving : t.authHeroSavePhones}
        </button>
      </div>
    </div>
  )
}
