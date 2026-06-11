'use client'

import { MapPin } from '@/lib/wattaInlineIcons'
import { WattaInViewFadeDiv } from '@/app/components/WattaInViewFade'
import { ProfileSectionIntro } from '../ProfileSectionPanel'

type Props = {
  title: string
  subtitle: string
}

export default function ProfileAddressEmptyScene({ title, subtitle }: Props) {
  return (
    <WattaInViewFadeDiv>
      <ProfileSectionIntro
        icon={<MapPin strokeWidth={1.35} />}
        title={title}
        subtitle={subtitle}
        status
        tone="orange"
      />
    </WattaInViewFadeDiv>
  )
}
