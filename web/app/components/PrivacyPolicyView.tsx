'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { m } from 'framer-motion'
import AnimatedHeroIntroBlock from './AnimatedHeroIntroBlock'
import {
  WattaInViewFadeSection,
  useWattaDisableScrollReveal,
  wattaInViewFadeViewport,
} from './WattaInViewFade'
import { WattaStaggerSectionTitle } from './WattaStaggerSectionTitle'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import {
  Baby,
  Cookie,
  Database,
  FileText,
  Globe,
  Link2,
  Lock,
  Mail,
  Scale,
  Share2,
  Shield,
  ShoppingBag,
  Sparkles,
  UserCheck,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { privacyPageByLang, type PrivacyPolicyBlock } from '@/lib/i18n/privacyPageContent'

const ACCENT = '#FF5C00'

function PrivacyFlowSection({
  children,
  className,
  ariaLabel,
}: {
  children: ReactNode
  className?: string
  ariaLabel?: string
}) {
  return (
    <WattaInViewFadeSection
      className={cn('delivery-flow-section bg-white py-14 sm:py-18', className)}
      aria-label={ariaLabel}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">{children}</div>
    </WattaInViewFadeSection>
  )
}

const BLOCK_ICONS: Record<string, LucideIcon> = {
  controller: Shield,
  scope: FileText,
  data: Database,
  sources: Sparkles,
  purposes: Scale,
  orders: ShoppingBag,
  cookies: Cookie,
  marketing: Mail,
  sharing: Share2,
  transfers: Globe,
  retention: Database,
  security: Lock,
  'rights-detail': UserCheck,
  children: Baby,
  automated: Sparkles,
  links: Link2,
  changes: FileText,
  authority: Scale,
}

function PrivacyBlockCard({
  block,
  index,
  fade,
}: {
  block: PrivacyPolicyBlock
  index: number
  fade:
    | { initial: false; animate: { opacity: number; y: number } }
    | { initial: { opacity: number; y: number }; whileInView: { opacity: number; y: number } }
}) {
  const Icon = BLOCK_ICONS[block.id] ?? Shield
  const blobTints = [
    'rgba(255,92,0,0.32)',
    'rgba(20,81,66,0.28)',
    'rgba(255,140,60,0.3)',
    'rgba(26,107,88,0.25)',
  ]
  const blobTint = blobTints[index % blobTints.length]

  return (
    <m.article
      id={block.id}
      className="privacy-page-block-web group flex flex-col rounded-[22px] border border-gray-200/70 bg-white p-4 shadow-[0_8px_36px_rgba(20,81,66,0.07)] transition hover:-translate-y-0.5 hover:border-[#145142]/15 hover:shadow-[0_14px_44px_rgba(20,81,66,0.12)] sm:p-6"
      {...fade}
      viewport={wattaInViewFadeViewport('-40px')}
      transition={{ duration: 0.45, delay: (index % 6) * 0.03 }}
    >
      <div className="relative mb-4 flex h-[4rem] w-[4rem] shrink-0 items-center justify-center sm:mb-5 sm:h-[4.5rem] sm:w-[4.5rem]">
        <div
          className="absolute h-14 w-[4.25rem] -rotate-12 rounded-[45%_55%_50%_50%] opacity-95 transition group-hover:scale-105"
          style={{
            background: `linear-gradient(135deg, rgba(255,200,170,0.95) 0%, ${blobTint} 55%, rgba(246,249,247,0.5) 100%)`,
          }}
          aria-hidden
        />
        <Icon className="relative z-[1] h-8 w-8 text-gray-900 sm:h-9 sm:w-9" strokeWidth={1.35} />
      </div>
      <WattaStaggerSectionTitle
        className="contact-watta-section-title text-lg sm:text-xl"
        text={block.title}
      />
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-[#6b7280] sm:mt-4 sm:text-[15px]">
        {block.paragraphs.map((para) => (
          <p key={para.slice(0, 48)}>{para}</p>
        ))}
        {block.bullets?.length ? (
          <ul className="list-disc space-y-2 pl-5 marker:text-[#145142]/70">
            {block.bullets.map((item) => (
              <li key={item.slice(0, 48)}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </m.article>
  )
}

export default function PrivacyPolicyView() {
  const { language, t } = useLanguage()
  const p = privacyPageByLang[language]
  const a = t.aboutPage
  const reduce = useWattaDisableScrollReveal()
  const [activeId, setActiveId] = useState<string>(p.blocks[0]?.id ?? 'controller')

  const fade = reduce
    ? ({ initial: false as const, animate: { opacity: 1, y: 0 } })
    : ({
        initial: { opacity: 0, y: 26 },
        whileInView: { opacity: 1, y: 0 },
      } as const)

  const observeSections = useCallback(() => {
    const nodes = p.blocks
      .map((b) => document.getElementById(b.id))
      .filter((el): el is HTMLElement => el != null)
    if (!nodes.length) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((x, y) => y.intersectionRatio - x.intersectionRatio)
        if (visible[0]?.target.id) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.15, 0.4] },
    )
    nodes.forEach((n) => observer.observe(n))
    return () => observer.disconnect()
  }, [p.blocks])

  useEffect(() => {
    return observeSections()
  }, [observeSections])

  const tocItems = useMemo(() => p.blocks.map((b) => ({ id: b.id, label: b.title })), [p.blocks])
  const heroTitleLines = useMemo(() => [p.title], [p.title])

  const privacyLeadIntro = (
    <AnimatedHeroIntroBlock
      sectionId="privacy-page-lead-intro"
      ariaLabel={p.title}
      titleId="privacy-hero-title"
      titleLines={heroTitleLines}
      body={p.heroSubtitle}
      accentLineIndex={0}
      headingLevel="h1"
      reserveTopSpace
      innerClassName="home-after-hero-intro-inner-web home-after-hero-intro-inner-web--home-menu delivery-page-intro-inner-web--standalone relative z-[1] mx-auto w-full max-w-6xl px-4 pb-3 text-center sm:px-6 sm:pb-4 md:pb-5"
    >
      <p className="privacy-page-hero-web__badge mx-auto mt-4">{p.heroBadge}</p>
      <p className="privacy-page-hero-web__updated">{p.updated}</p>
    </AnimatedHeroIntroBlock>
  )

  return (
    <div
      id="privacy-page-container"
      className="privacy-page-web menu-page-web delivery-page-web relative flex w-full min-h-0 flex-1 flex-col overflow-x-hidden bg-white pb-24"
    >
      <div className="delivery-page-home-flow w-full">
        <div className="delivery-page-intro-web w-full shrink-0 bg-white">{privacyLeadIntro}</div>

        <div className="delivery-page-tools-flow">
          <div className="delivery-showcase-flow delivery-page-flow delivery-page-web relative">
            <PrivacyFlowSection ariaLabel={p.title}>
              <nav
                className="privacy-page-toc-web -mx-1 mb-6 flex gap-2 overflow-x-auto pb-2 lg:hidden"
                aria-label={p.tocTitle}
              >
                {tocItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={cn(
                      'privacy-page-toc-link shrink-0 whitespace-nowrap text-xs',
                      activeId === item.id && 'privacy-page-toc-link--active',
                    )}
                    onClick={() => setActiveId(item.id)}
                  >
                    {item.label.replace(/^\d+\.\s*/, '')}
                  </a>
                ))}
              </nav>

              <div className="privacy-page-layout">
                <nav className="privacy-page-toc-web hidden lg:block" aria-label={p.tocTitle}>
                  <p className="delivery-flow-kicker mb-3">{p.tocTitle}</p>
                  <ul className="flex flex-col gap-0.5">
                    {tocItems.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className={cn(
                            'privacy-page-toc-link',
                            activeId === item.id && 'privacy-page-toc-link--active',
                          )}
                          onClick={() => setActiveId(item.id)}
                        >
                          {item.label.replace(/^\d+\.\s*/, '')}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>

                <div className="min-w-0 space-y-4 sm:space-y-5">
                  {p.blocks.map((block, i) => (
                    <PrivacyBlockCard key={block.id} block={block} index={i} fade={fade} />
                  ))}
                </div>
              </div>
            </PrivacyFlowSection>

            <PrivacyFlowSection>
              <div className="privacy-page-rights-web rounded-[24px] border border-[#145142]/10 bg-white p-5 shadow-[0_10px_40px_rgba(20,81,66,0.08)] sm:rounded-[28px] sm:p-8 md:p-10">
                <WattaStaggerSectionTitle
                  className="contact-watta-section-title flex items-center gap-2"
                  text={p.rightsTitle}
                  before={
                    <span
                      className="inline-block h-8 w-1.5 shrink-0 rounded-full sm:h-9"
                      style={{ background: ACCENT }}
                      aria-hidden
                    />
                  }
                />
                <p className="delivery-page-section-lead mt-4 max-w-3xl">{p.rightsIntro}</p>
                <ul className="mt-5 grid gap-2 sm:grid-cols-2 sm:gap-3">
                  {p.rightsItems.map((item, i) => (
                    <li
                      key={item.slice(0, 40)}
                      className={cn(
                        'flex gap-2 rounded-xl border px-3 py-2.5 text-sm leading-snug',
                        i % 2 === 0
                          ? 'border-orange-100/80 bg-orange-50/30 text-gray-700'
                          : 'border-[#145142]/10 bg-[#f6f9f7]/80 text-gray-700',
                      )}
                    >
                      <UserCheck
                        className="mt-0.5 h-4 w-4 shrink-0"
                        strokeWidth={2}
                        style={{ color: i % 2 === 0 ? ACCENT : '#145142' }}
                        aria-hidden
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </PrivacyFlowSection>

            <PrivacyFlowSection className="pb-8">
              <div className="privacy-page-contact-web rounded-[22px] bg-gradient-to-br from-[#f6f9f7] to-white p-6 text-center shadow-[0_8px_32px_rgba(20,81,66,0.06)] sm:p-10">
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white"
                  style={{ background: 'linear-gradient(135deg, #145142 0%, #1a6b58 100%)' }}
                >
                  <Mail className="h-7 w-7" strokeWidth={2} aria-hidden />
                </div>
                <WattaStaggerSectionTitle
                  className="contact-watta-section-title text-center"
                  text={p.contactTitle}
                />
                <p className="delivery-page-section-lead mx-auto mt-3 max-w-2xl text-center">{p.contactBody}</p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/contacts"
                    className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#92e07a] to-[#5ebf55] px-6 py-3 text-sm font-bold text-[#0f241e] shadow-lg shadow-[#5ebf55]/25 transition hover:brightness-105"
                  >
                    {a.ctaContacts}
                  </Link>
                  <Link
                    href="/offer"
                    className="inline-flex items-center justify-center rounded-2xl border border-[#145142]/15 bg-white px-6 py-3 text-sm font-semibold text-[#145142] transition hover:border-[#145142]/30"
                  >
                    {t.siteFooter.publicOffer}
                  </Link>
                </div>
              </div>
            </PrivacyFlowSection>
          </div>
        </div>
      </div>
    </div>
  )
}
