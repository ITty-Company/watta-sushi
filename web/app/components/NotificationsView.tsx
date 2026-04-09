'use client'

import React, { useEffect } from 'react'
import { X, Bell } from 'lucide-react'
import { useLanguage } from '@/app/context/LanguageContext'

const ACCENT = '#FF5C00'

export const NotificationsView = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) => {
  const { t } = useLanguage()
  const n = t.notifications

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="watta-notifications-title">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-label={t.locationPicker.ariaClose}
      />
      <div className="relative w-full max-w-[420px] overflow-hidden rounded-[24px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <h2 id="watta-notifications-title" className="text-xl font-black tracking-tight text-gray-900 sm:text-2xl">
            {n.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100"
            aria-label={t.locationPicker.ariaClose}
          >
            <X size={22} strokeWidth={2.25} />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center px-6 py-14 text-center sm:py-16">
          <div className="relative mb-8">
            <div
              className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-gray-100"
              aria-hidden
            >
              <Bell size={44} className="text-gray-500" strokeWidth={1.5} />
            </div>
            <div
              className="absolute -left-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-md"
              style={{ backgroundColor: ACCENT }}
              aria-hidden
            >
              <X size={16} className="text-white" strokeWidth={3} />
            </div>
          </div>

          <h3 className="mb-2 text-lg font-black text-gray-900 sm:text-xl">{n.empty}</h3>
          <p className="max-w-[280px] text-sm leading-relaxed text-gray-500 sm:text-[15px]">{n.emptySubtext}</p>
        </div>
      </div>
    </div>
  )
}
