'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'

const PAGE_BG =
  'linear-gradient(165deg, #020807 0%, #0c3028 42%, #0a2520 55%, #050c0b 100%)'

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
    <main
      className="relative min-h-0 flex-1 overflow-x-hidden text-white"
      style={{ background: PAGE_BG }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage: `radial-gradient(circle at 20% 0%, rgba(26, 107, 88, 0.35) 0%, transparent 42%),
            radial-gradient(circle at 88% 18%, rgba(255, 92, 0, 0.08) 0%, transparent 38%),
            repeating-linear-gradient(-14deg, transparent, transparent 3px, rgba(255,255,255,0.02) 3px, rgba(255,255,255,0.02) 4px)`,
        }}
      />

      <div className="relative z-[1] mx-auto max-w-3xl px-4 py-8 pb-28 sm:px-6 sm:py-12 sm:pb-32">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm transition hover:border-white/25 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a6b58]/60"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.2} aria-hidden />
            {p.back}
          </button>
          <Link
            href="/"
            className="text-sm font-medium text-white/55 underline-offset-4 transition hover:text-white/85 hover:underline"
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
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#5eead4]/80">
            Watta Sushi
          </p>
          <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
            {p.title}
          </h1>
          <p className="mt-3 text-sm text-white/45">{p.updated}</p>
          <p className="mt-6 text-[15px] leading-relaxed text-white/75 sm:text-base">{p.intro}</p>
        </motion.header>

        <div className="flex flex-col gap-4">
          {p.blocks.map((block, i) => (
            <motion.article
              key={block.title}
              className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-6"
              {...fade}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.4, delay: reduce ? 0 : i * 0.04 }}
            >
              <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">{block.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/68 sm:text-[15px]">{block.body}</p>
            </motion.article>
          ))}
        </div>

        <p className="mt-12 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Watta Sushi
        </p>
      </div>
    </main>
  )
}
