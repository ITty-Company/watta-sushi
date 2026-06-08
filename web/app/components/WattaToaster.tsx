'use client'

import toast, { Toaster, ToastBar, type Toast } from 'react-hot-toast'
import { X } from 'lucide-react'
import { useLanguage } from '@/app/context/LanguageContext'

export default function WattaToaster() {
  const { t } = useLanguage()

  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      containerClassName="watta-toast-host"
      containerStyle={{ zIndex: 99999 }}
      toastOptions={{
        className: 'watta-toast',
        duration: 3600,
        style: {
          background: '#ffffff',
          color: 'var(--watta-toast-ink, #1a2e28)',
          boxShadow: '0 10px 28px rgba(26, 46, 40, 0.1), 0 2px 8px rgba(26, 46, 40, 0.06)',
          borderRadius: '9999px',
          padding: '0.55rem 1rem 0.55rem 0.65rem',
          fontSize: '0.8125rem',
          fontWeight: 600,
        },
        success: {
          className: 'watta-toast watta-toast--success',
          iconTheme: { primary: '#5c9010', secondary: '#ffffff' },
        },
        error: {
          className: 'watta-toast watta-toast--error',
          iconTheme: { primary: '#dc4c4c', secondary: '#ffffff' },
        },
        loading: {
          className: 'watta-toast watta-toast--loading',
        },
      }}
    >
      {(toastItem: Toast) => (
        <ToastBar toast={toastItem}>
          {({ icon, message }) => (
            <>
              {icon}
              {message}
              <button
                type="button"
                className="watta-toast-dismiss"
                aria-label={t.common.ariaClose}
                onClick={(event) => {
                  event.stopPropagation()
                  toast.dismiss(toastItem.id)
                }}
              >
                <X size={14} strokeWidth={2.4} aria-hidden />
              </button>
            </>
          )}
        </ToastBar>
      )}
    </Toaster>
  )
}
