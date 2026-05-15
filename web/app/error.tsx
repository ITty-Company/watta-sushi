'use client'

import Link from 'next/link'
import { useEffect } from 'react'

/**
 * Сегментний error boundary (поруч із `layout.tsx`).
 * Без цього файлу Next 14 у dev інколи показує «missing required error components, refreshing».
 * Тексти мінімальні — без важкого `LanguageProvider`, щоб boundary лишався надійним під час збою.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[app/error]', error)
    }
  }, [error])

  return (
    <div
      className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 px-6 py-16 text-center"
      role="alert"
    >
      <h1 className="font-semibold text-[#145142] text-xl sm:text-2xl">Щось пішло не так</h1>
      <p className="text-neutral-600 text-sm sm:text-base leading-relaxed">
        Спробуйте ще раз. Якщо помилка повторюється — оновіть сторінку або поверніться на головну.
      </p>
      {error.digest ? (
        <p className="text-neutral-400 text-xs font-mono" suppressHydrationWarning>
          {error.digest}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-[#145142] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f3d32] active:scale-[0.98]"
        >
          Спробувати знову
        </button>
        <Link
          href="/"
          className="rounded-xl border border-[#145142]/30 bg-white px-5 py-2.5 text-sm font-semibold text-[#145142] transition hover:bg-[#145142]/5"
        >
          На головну
        </Link>
      </div>
    </div>
  )
}
