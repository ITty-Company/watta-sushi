'use client'

import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { useLanguage } from '@/app/context/LanguageContext'
import UserNotificationsPanel from '@/app/components/notifications/UserNotificationsPanel'

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
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="watta-notifications-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-label={t.locationPicker.ariaClose}
      />
      <div className="relative flex max-h-[min(90dvh,640px)] w-full max-w-[480px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
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
        <UserNotificationsPanel compact />
      </div>
    </div>
  )
}
