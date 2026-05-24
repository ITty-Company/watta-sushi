'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Plus, Save, Trash2, Upload } from 'lucide-react'
import type { Translations } from '@/app/context/LanguageContext'
import AdminHeroVideoPreview from '@/app/components/admin/AdminHeroVideoPreview'

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
  phone1Slots: HeroVideoSlotState[]
  phone2Slots: HeroVideoSlotState[]
  phone1FileInputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>
  phone2FileInputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>
  onPhone1FileChange: (slotId: string, e: React.ChangeEvent<HTMLInputElement>) => void
  onPhone2FileChange: (slotId: string, e: React.ChangeEvent<HTMLInputElement>) => void
  onAddPhone1Slot: () => void
  onAddPhone2Slot: () => void
  onRemovePhone1Slot: (slotId: string) => void
  onRemovePhone2Slot: (slotId: string) => void
}

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
      <motion.div
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
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
              <motion.div className="mt-2 overflow-hidden rounded-[12px] border border-[#145142]/10 bg-[#0d2a22]/5">
                <AdminHeroVideoPreview
                  previewSrc={previewSrc}
                  savedUrl={slot.savedUrl}
                  reduceMotion={reduceMotion}
                  aspectClassName="aspect-[9/16] max-h-[280px] w-full"
                />
              </motion.div>
              {previewSrc && !slot.pendingFile ? (
                <p className="mt-1.5 truncate font-mono text-[10px] text-[#145142]/55" title={slot.savedUrl ?? ''}>
                  {slot.savedUrl}
                </p>
              ) : null}
              <motion.div className="mt-3 flex flex-wrap gap-2">
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
              </motion.div>
            </motion.div>
          )
        })}
      </motion.div>
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

export default function AuthHeroPhonesAdminSection({
  t,
  reduceMotion,
  saving,
  canSave,
  onSave,
  phone1Slots,
  phone2Slots,
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
      <VideoSlotGrid
        t={t}
        reduceMotion={reduceMotion}
        slots={phone1Slots}
        fileInputRefs={phone1FileInputRefs}
        onFileChange={onPhone1FileChange}
        onRemoveSlot={onRemovePhone1Slot}
        onAddSlot={onAddPhone1Slot}
      />

      <motion.div
        className="my-6 border-t border-[#145142]/10"
        aria-hidden
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      <VideoSlotGrid
        t={t}
        reduceMotion={reduceMotion}
        slots={phone2Slots}
        fileInputRefs={phone2FileInputRefs}
        onFileChange={onPhone2FileChange}
        onRemoveSlot={onRemovePhone2Slot}
        onAddSlot={onAddPhone2Slot}
      />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <button
          type="button"
          disabled={saving || !canSave}
          onClick={onSave}
          className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-[#155044] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#103d34] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-4 w-4 shrink-0" aria-hidden />
          {saving ? t.heroVideoSaving : t.heroVideoSave}
        </button>
      </div>
    </div>
  )
}
