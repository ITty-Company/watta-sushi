'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'

export default function PrivacyPolicyView() {
  const { t } = useLanguage()
  const router = useRouter()
  const reduce = useReducedMotion()
  const p = t.privacyPage

  const fade =
    reduce === true
      ? { initial: false }
      : {
          initial: { opacity: 0, y: 14 },
          whileInView: { opacity: 1, y: 0 },
        }

  return (
    <main className="relative min-h-0 flex-1 overflow-x-hidden watta-page-bg text-gray-900">
      <div className="relative z-[1] mx-auto max-w-3xl px-4 py-8 pb-28 sm:px-6 sm:py-12 sm:pb-32">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-800 transition hover:border-gray-300 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a6b58]/40"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.2} aria-hidden />
            {p.back}
          </button>
          <Link
            href="/"
            className="text-sm font-medium text-gray-500 underline-offset-4 transition hover:text-gray-800 hover:underline"
          >
            Watta Sushi
          </Link>
        </div>

        <motion.header
          className="mb-10"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#145142]">
            Watta Sushi
          </p>
          <h1 className="text-3xl font-black leading-tight tracking-tight text-gray-900 sm:text-4xl">
            {p.title}
          </h1>
          <p className="mt-3 text-sm text-gray-500">{p.updated}</p>
          <p className="mt-6 text-[15px] leading-relaxed text-gray-600 sm:text-base">{p.intro}</p>
        </motion.header>

        <div className="flex flex-col gap-4">
          {p.blocks.map((block, i) => (
            <motion.article
              key={block.title}
              className="rounded-2xl border border-gray-200/90 bg-gray-50/80 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] sm:p-6"
              {...fade}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.4, delay: reduce ? 0 : i * 0.04 }}
            >
              <h2 className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">{block.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-[15px]">{block.body}</p>
            </motion.article>
          ))}
        </div>

        <p className="mt-12 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Watta Sushi
        </p>
      </div>
    </main>
  )
}
