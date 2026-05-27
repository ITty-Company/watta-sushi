// /** Локальні збережені email+пароль лише для екранів входу/реєстрації (до 10 акаунтів). */

// export const AUTH_SAVED_ACCOUNTS_KEY = 'watta_auth_saved_accounts_v1'
// export const MAX_SAVED_AUTH_ACCOUNTS = 10

// export type SavedAuthAccount = {
//   email: string
//   password: string
//   updatedAt: number
// }

// function normalizeEmail(email: string): string {
//   return email.trim().toLowerCase()
// }

// function readRaw(): SavedAuthAccount[] {
//   if (typeof window === 'undefined') return []
//   try {
//     const raw = localStorage.getItem(AUTH_SAVED_ACCOUNTS_KEY)
//     if (!raw) return []
//     const parsed = JSON.parse(raw) as unknown
//     if (!Array.isArray(parsed)) return []
//     return parsed
//       .filter(
//         (item): item is SavedAuthAccount =>
//           item != null &&
//           typeof item === 'object' &&
//           typeof (item as SavedAuthAccount).email === 'string' &&
//           typeof (item as SavedAuthAccount).password === 'string',
//       )
//       .map((item) => ({
//         email: normalizeEmail(item.email),
//         password: item.password,
//         updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : 0,
//       }))
//       .slice(0, MAX_SAVED_AUTH_ACCOUNTS)
//   } catch {
//     return []
//   }
// }

// function writeRaw(accounts: SavedAuthAccount[]): void {
//   if (typeof window === 'undefined') return
//   const trimmed = accounts
//     .sort((a, b) => b.updatedAt - a.updatedAt)
//     .slice(0, MAX_SAVED_AUTH_ACCOUNTS)
//   localStorage.setItem(AUTH_SAVED_ACCOUNTS_KEY, JSON.stringify(trimmed))
// }

// export function loadSavedAuthAccounts(): SavedAuthAccount[] {
//   return readRaw().sort((a, b) => b.updatedAt - a.updatedAt)
// }

// export function getLastUsedAuthCredentials(): Pick<SavedAuthAccount, 'email' | 'password'> | null {
//   const list = loadSavedAuthAccounts()
//   const first = list[0]
//   if (!first?.email) return null
//   return { email: first.email, password: first.password }
// }

// export function saveAuthCredentials(email: string, password: string): void {
//   const normalized = normalizeEmail(email)
//   if (!normalized || !password) return
//   const now = Date.now()
//   const rest = readRaw().filter((a) => a.email !== normalized)
//   writeRaw([{ email: normalized, password, updatedAt: now }, ...rest])
// }

// export function removeSavedAuthAccount(email: string): void {
//   const normalized = normalizeEmail(email)
//   writeRaw(readRaw().filter((a) => a.email !== normalized))
// }
// web/lib/authCredentialsStorage.ts

const STORAGE_KEY = 'watta_saved_auth'

export type SavedAuthAccount = {
  email: string
  // Пароль убран из типа в целях безопасности
  updatedAt: number
}

function normalizeEmail(e: string) {
  return e.trim().toLowerCase()
}

function readRaw(): SavedAuthAccount[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((a) => a && typeof a.email === 'string')
  } catch {
    return []
  }
}

function writeRaw(data: SavedAuthAccount[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

// Теперь функция принимает и сохраняет ТОЛЬКО email
export function saveAuthEmail(email: string): void {
  const normalized = normalizeEmail(email)
  if (!normalized) return

  const now = Date.now()
  const rest = readRaw().filter((a) => a.email !== normalized)
  
  // Сохраняем email и ставим его на первое место (как последний использованный)
  writeRaw([{ email: normalized, updatedAt: now }, ...rest])
}

export function loadSavedAuthAccounts(): SavedAuthAccount[] {
  return readRaw().sort((a, b) => b.updatedAt - a.updatedAt)
}

export function getLastUsedEmail(): string | null {
  const accounts = loadSavedAuthAccounts()
  return accounts.length > 0 ? accounts[0].email : null
}

export function clearSavedAuthAccount(email: string) {
  const normalized = normalizeEmail(email)
  const rest = readRaw().filter((a) => a.email !== normalized)
  writeRaw(rest)
}