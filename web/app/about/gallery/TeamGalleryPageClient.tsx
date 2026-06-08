'use client'

import Link from 'next/link'
import TeamMemberPhoto from '@/app/components/TeamMemberPhoto'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useLanguage } from '@/app/context/LanguageContext'
import { teamMembersWithPhotos, type PublicTeamMember } from '@/lib/teamMembers'
import { WattaInViewFadeDiv, WattaInViewFadeHeader } from '@/app/components/WattaInViewFade'

const ACCENT = '#FF5C00'

export default function TeamGalleryPageClient() {
  const { t, getLocalized } = useLanguage()
  const a = t.aboutPage
  const [teamMembers, setTeamMembers] = useState<PublicTeamMember[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/team')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setTeamMembers(Array.isArray(data) ? data : [])
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const withPhotos = useMemo(() => teamMembersWithPhotos(teamMembers), [teamMembers])

  return (
    <div id="team-gallery-page" className="about-page-web delivery-page-web w-full min-w-0 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/about"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#145142] transition hover:text-[#1a6b58]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {a.teamGalleryBack}
        </Link>

        <WattaInViewFadeHeader className="mb-8 text-center sm:mb-10">
          <h1 className="text-[clamp(1.75rem,6vw,2.75rem)] font-black tracking-tight text-gray-900">
            {a.teamGalleryPageTitle}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-600 sm:text-base">
            {a.teamGalleryPageLead}
          </p>
        </WattaInViewFadeHeader>

        {!ready ? (
          <p className="text-center text-sm text-gray-500" aria-live="polite">
            …
          </p>
        ) : withPhotos.length === 0 ? (
          <p className="rounded-2xl border border-[#145142]/12 bg-[#f6f9f7] px-6 py-10 text-center text-sm text-gray-600">
            {a.teamGalleryEmpty}
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 md:gap-5">
            {withPhotos.map((member, index) => {
              const name = getLocalized(member, 'name') || member.name_ru
              const position = getLocalized(member, 'position') || member.position_ru
              return (
                <WattaInViewFadeDiv
                  key={member.id}
                  role="listitem"
                  className="overflow-hidden rounded-[20px] border border-gray-200/80 bg-white shadow-[0_8px_28px_rgba(20,81,66,0.08)]"
                  transition={{ delay: Math.min(index * 0.04, 0.24) }}
                >
                  <div className="relative aspect-[4/5] bg-gradient-to-br from-[#f6f9f7] to-gray-100">
                    <TeamMemberPhoto src={member.imageUrl!} alt={name} sizes="(max-width: 640px) 50vw, 25vw" />
                  </div>
                  <div className="p-3 sm:p-3.5">
                    <p className="text-sm font-black text-gray-900 sm:text-base">{name}</p>
                    <p className="mt-0.5 text-xs font-semibold sm:text-sm" style={{ color: ACCENT }}>
                      {position}
                    </p>
                  </div>
                </WattaInViewFadeDiv>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
