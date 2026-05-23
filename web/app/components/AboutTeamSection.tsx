'use client'

import Link from 'next/link'
import TeamMemberPhoto from './TeamMemberPhoto'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { teamMembersWithPhotos, type PublicTeamMember } from '@/lib/teamMembers'
import { cn } from '@/lib/utils'

const ACCENT = '#FF5C00'

type FadeProps =
  | { initial: false }
  | { initial: { opacity: number; y: number }; whileInView: { opacity: number; y: number } }

export default function AboutTeamSection({
  teamMembers,
  teamReady,
  fade,
}: {
  teamMembers: PublicTeamMember[]
  teamReady: boolean
  fade: FadeProps
}) {
  const { t, getLocalized } = useLanguage()
  const a = t.aboutPage
  const withPhotos = useMemo(() => teamMembersWithPhotos(teamMembers), [teamMembers])

  if (!teamReady || withPhotos.length === 0) {
    return null
  }

  return (
    <section className="about-page-team-web px-4 pb-6 sm:px-6 sm:pb-8" aria-labelledby="about-team-heading">
      <div className="mx-auto max-w-6xl">
        <motion.h3
          id="about-team-heading"
          className="about-page-team-heading mb-5 text-center text-[clamp(1.35rem,5vw,2rem)] font-black tracking-tight text-gray-900 sm:mb-7"
          {...fade}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {a.team}
        </motion.h3>

        <motion.div
          className="about-page-team-carousel-wrap"
          {...fade}
          viewport={{ once: true, margin: '-24px' }}
          transition={{ duration: 0.5, delay: 0.06 }}
        >
          <p className="about-page-team-carousel-hint mb-3 text-center text-xs font-semibold text-[#145142]/65 sm:text-sm">
            {a.teamCarouselHint}
          </p>
          <div
            className="about-page-team-carousel -mx-1 px-1"
            role="region"
            aria-roledescription="carousel"
            aria-label={a.teamCarouselAria}
          >
            <ul className="about-page-team-carousel__track">
              {withPhotos.map((member) => {
                const name = getLocalized(member, 'name') || member.name_ru
                const position = getLocalized(member, 'position') || member.position_ru
                return (
                  <li key={member.id} className="about-page-team-carousel__slide">
                    <article className="about-page-team-card group h-full overflow-hidden rounded-[22px] border border-gray-200/80 bg-white shadow-[0_10px_36px_rgba(0,0,0,0.07)]">
                      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-[#f6f9f7] to-gray-100">
                        <TeamMemberPhoto
                          src={member.imageUrl!}
                          alt={name}
                          className="transition duration-500 group-hover:scale-[1.03]"
                          sizes="(max-width: 640px) 72vw, 280px"
                        />
                      </div>
                      <div className="p-3.5 sm:p-4">
                        <h4 className="text-base font-black text-gray-900 sm:text-lg">{name}</h4>
                        <p className="mt-0.5 text-sm font-semibold" style={{ color: ACCENT }}>
                          {position}
                        </p>
                      </div>
                    </article>
                  </li>
                )
              })}
            </ul>
          </div>
        </motion.div>

        <motion.div
          className="mt-6 flex justify-center sm:mt-8"
          {...fade}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.12 }}
        >
          <Link
            href="/about/gallery"
            className={cn(
              'about-page-team-gallery-cta inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold text-white shadow-lg transition',
              'bg-[#145142] hover:bg-[#1a6b58] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#145142]',
            )}
          >
            {a.teamGalleryCta}
            <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
