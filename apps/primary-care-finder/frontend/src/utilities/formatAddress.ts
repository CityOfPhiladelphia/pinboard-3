import type { PrimaryCareProperties } from '@/types'

export function formatFullAddress(properties: PrimaryCareProperties): string {
  // Trim each part: some records have trailing spaces (e.g. "5901 Market St. "),
  // which would otherwise render as "St. ," and let the comma wrap to a new line.
  const street = [properties.address, properties.address_2]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ')
  const zip = (properties.zip_code ?? '').trim()
  return `${street}, Philadelphia, PA ${zip}`.trimEnd()
}
