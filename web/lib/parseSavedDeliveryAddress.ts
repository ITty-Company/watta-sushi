const NL_POSTCODE = /\b(\d{4}\s?[A-Z]{2})\b/i

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export type ParsedSavedDeliveryAddress = {
  fullAddress: string
  city: string | null
  street: string
  postalCode: string
}

/** Розбирає збережений рядок адреси для полів checkout (місто, вулиця, індекс). */
export function parseSavedDeliveryAddress(
  raw: string,
  cityNames: string[] = [],
): ParsedSavedDeliveryAddress {
  const fullAddress = raw.trim().replace(/\s+/g, ' ')
  if (!fullAddress) {
    return { fullAddress: '', city: null, street: '', postalCode: '' }
  }

  const postalMatch = fullAddress.match(NL_POSTCODE)
  const postalCode = postalMatch
    ? postalMatch[1].replace(/\s/g, '').toUpperCase()
    : ''

  let city: string | null = null
  let remainder = fullAddress

  const sortedCities = [...cityNames].sort((a, b) => b.length - a.length)
  for (const name of sortedCities) {
    const trimmedName = name.trim()
    if (!trimmedName) continue
    const prefix = new RegExp(`^${escapeRegExp(trimmedName)}\\s*,\\s*`, 'i')
    if (prefix.test(remainder)) {
      city = trimmedName
      remainder = remainder.replace(prefix, '').trim()
      break
    }
  }

  let street = remainder
  if (postalCode) {
    const spaced = `${postalCode.slice(0, 4)} ${postalCode.slice(4)}`
    street = street
      .replace(new RegExp(`\\s*,?\\s*${escapeRegExp(spaced)}`, 'i'), '')
      .replace(new RegExp(`\\s*,?\\s*${escapeRegExp(postalCode)}`, 'i'), '')
      .trim()
  }

  if (!street) street = fullAddress

  return { fullAddress, city, street, postalCode }
}
