const STORAGE_KEY = 'watta_broken_upload_urls_v1'
const MAX_ENTRIES = 120

function readSet(): Set<string> {
  if (typeof sessionStorage === 'undefined') return new Set()
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((u): u is string => typeof u === 'string' && u.length > 0))
  } catch {
    return new Set()
  }
}

function writeSet(set: Set<string>): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    const arr = Array.from(set).slice(-MAX_ENTRIES)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
  } catch {
    /* quota */
  }
}

export function isBrokenUploadUrl(url: string | null | undefined): boolean {
  const u = url?.trim()
  if (!u || !u.includes('/uploads/')) return false
  return readSet().has(u)
}

export function markBrokenUploadUrl(url: string | null | undefined): void {
  const u = url?.trim()
  if (!u || !u.includes('/uploads/')) return
  const set = readSet()
  if (set.has(u)) return
  set.add(u)
  writeSet(set)
}
