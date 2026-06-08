import { getBearerAuthHeaders } from '@/lib/authHeaders'

export type SavedUserAddress = {
  id: number
  address: string
  createdAt: string
}

export async function fetchUserSavedAddresses(): Promise<SavedUserAddress[]> {
  const auth = getBearerAuthHeaders()
  if (Object.keys(auth).length === 0) return []

  try {
    const res = await fetch('/api/auth/addresses', { headers: auth })
    if (!res.ok) return []
    const data = (await res.json()) as { addresses?: SavedUserAddress[] }
    return Array.isArray(data.addresses) ? data.addresses : []
  } catch {
    return []
  }
}
