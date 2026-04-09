'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Star, Sparkles } from 'lucide-react'
import { useLanguage } from '@/app/context/LanguageContext'

interface PublicReview {
  id: number
  rating: number
  text: string
  images: string[]
  createdAt: string
  authorName: string
}

export default function ReviewsPageClient() {
  const { t } = useLanguage()
  const [list, setList] = useState<PublicReview[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/reviews')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!cancelled) setList(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setList([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="watta-public-page-shell flex min-h-screen flex-1 flex-col py-12 sm:py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 sm:mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#145142]/10 text-[#145142] text-sm font-bold mb-4">
            <Sparkles className="w-4 h-4" />
            Watta Sushi
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#145142] tracking-tight">
            {t.reviewsPublic.title}
          </h1>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto text-lg leading-relaxed">
            {t.reviewsPublic.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#145142] text-white font-bold shadow-lg shadow-[#145142]/25 hover:bg-[#0f3d32] transition"
            >
              {t.reviewsPublic.openProfile}
            </Link>
            <Link
              href="/login?return=%2F"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-[#145142]/25 text-[#145142] font-bold hover:bg-[#145142]/5 transition"
            >
              {t.reviewsPublic.loginCta}
            </Link>
          </div>
        </motion.div>

        {list === null ? (
          <div className="flex justify-center py-24">
            <div className="h-12 w-12 rounded-2xl border-2 border-[#145142]/30 border-t-[#145142] animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-[2rem] border border-[#145142]/12 bg-white/80 backdrop-blur-sm p-12 text-center text-gray-600 shadow-xl shadow-[#145142]/5">
            {t.reviewsPublic.empty}
          </div>
        ) : (
          <div className="grid gap-6 sm:gap-8">
            {list.map((rev, i) => (
              <motion.article
                key={rev.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{ perspective: '1000px' }}
                className="group relative rounded-[1.75rem] border border-[#145142]/10 bg-gradient-to-br from-white via-white to-[#f4faf7] p-6 sm:p-8 shadow-lg shadow-[#145142]/6 hover:shadow-2xl hover:shadow-[#145142]/12 transition-all duration-500 hover:-translate-y-0.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-extrabold text-[#145142] text-lg">{rev.authorName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star
                        key={si}
                        className={`w-5 h-5 ${
                          si < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{rev.text}</p>
                {rev.images?.length ? (
                  <div className="flex flex-wrap gap-2 mt-5">
                    {rev.images.map((src, ii) => (
                      <div
                        key={ii}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-[#145142]/10 shadow-md"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : null}
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
