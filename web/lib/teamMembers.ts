export type PublicTeamMember = {
  id: number
  name_ru: string
  name_ua?: string
  name_en?: string
  name_nl?: string
  position_ru: string
  position_ua?: string
  position_en?: string
  position_nl?: string
  imageUrl?: string | null
  bio_ru?: string
  bio_ua?: string
  bio_en?: string
  bio_nl?: string
  order?: number
  isActive?: boolean
}

export function teamMembersWithPhotos(members: PublicTeamMember[]): PublicTeamMember[] {
  return members.filter((m) => typeof m.imageUrl === 'string' && m.imageUrl.trim().length > 0)
}
